const express = require('express');
const supabase = require('../config/supabase');
const paynexus = require('../services/paynexus');
const payhero = require('../services/payhero');
const voterTracker = require('../services/voterTracker');
const pendingVotes = require('../services/pendingVotes');

const router = express.Router();

// Simulation Deadline: Tuesday, October 20, 2026 at 23:20:00 EAT (11:20 PM)
const VOTING_DEADLINE_ISO = process.env.VOTING_DEADLINE || '2026-10-20T23:20:00+03:00';

function isVotingClosed() {
  const deadline = new Date(VOTING_DEADLINE_ISO).getTime();
  if (isNaN(deadline)) return false;
  return Date.now() >= deadline;
}

function getGateway() {
  return (process.env.PAYMENT_GATEWAY || 'payhero').toLowerCase();
}

// In-memory tracker for ongoing transactions (backed by disk persistence in pendingVotes)
const PENDING_VOTES = new Map();
const FULFILLED_VOTES = new Set();
const STATUS_CACHE = new Map(); // reference -> { timestamp, data }

function calculatePoints(amount) {
  return amount; // 1 bob = 1 point, fixed 10 KSh = 10 pts per category vote
}

/**
 * Fulfill a verified vote: insert into database and increment nominee points
 */
async function fulfillVote(reference, statusResult) {
  if (FULFILLED_VOTES.has(reference)) {
    const pending = PENDING_VOTES.get(reference) || pendingVotes.getPendingVote(reference);
    return { points: pending ? pending.points : 0 };
  }

  const pending = PENDING_VOTES.get(reference) || pendingVotes.getPendingVote(reference);
  if (!pending) {
    console.warn(`No pending vote metadata found for reference: ${reference}`);
    return null;
  }

  const { nominee_id, category_id, amount = 10, points = 10, phone, email } = pending;
  const transactionId = statusResult?.refNo || statusResult?.data?.provider_transaction_id || statusResult?.data?.MpesaReceiptNumber || statusResult?.data?.third_party_reference || reference;
  const voterPhone = phone || statusResult?.data?.phone || statusResult?.data?.Phone || null;
  const voterEmail = email || null;

  try {
    // 1. Record in persistent voter tracker to prevent duplicate category voting
    if (voterEmail) {
      await voterTracker.recordCategoryVote({
        email: voterEmail,
        category_id,
        nominee_id,
        amount,
        points,
        transaction_id: transactionId,
      });
    }

    if (!supabase) {
      console.error('Supabase client not initialized, cannot record vote');
      return { points, transactionId };
    }

    // 2. Insert vote row into Supabase (recording full message & transaction details)
    let insertPayload = {
      nominee_id,
      category_id,
      amount,
      points,
      transaction_id: transactionId,
      voter_phone: voterEmail ? `${voterPhone || ''} (${voterEmail})`.trim() : (voterPhone || null),
    };
    if (voterEmail) {
      insertPayload.voter_email = voterEmail;
    }
    const messageDetail = statusResult?.data?.ResultDesc || statusResult?.data?.message || `M-Pesa payment confirmed for KSh ${amount} (Ref: ${transactionId})`;
    insertPayload.message = messageDetail;

    let { data: vote, error: voteError } = await supabase
      .from('votes')
      .insert(insertPayload)
      .select()
      .single();

    // If Supabase schema does not have voter_email or message columns (PGRST204, 42703, or column missing error)
    if (voteError && (voteError.code === 'PGRST204' || voteError.code === '42703' || voteError.message?.toLowerCase().includes('column'))) {
      console.warn('Supabase schema missing optional columns, retrying with core columns:', voteError.message);
      delete insertPayload.voter_email;
      delete insertPayload.message;
      const retry = await supabase.from('votes').insert(insertPayload).select().single();
      voteError = retry.error;
      vote = retry.data;
    }

    // If DB has legacy CHECK (amount >= 10) constraint
    if (voteError && voteError.code === '23514') {
      console.warn('votes_amount_check constraint triggered, recording with compliant fallback amount...');
      insertPayload.amount = Math.max(10, amount);
      const fallbackResult = await supabase.from('votes').insert(insertPayload).select().single();
      voteError = fallbackResult.error;
      vote = fallbackResult.data;
    }

    if (voteError) {
      console.error('Supabase vote insert error:', voteError.message);
    } else {
      console.log(`✅ Supabase vote row recorded in database: ID ${vote?.id || 'OK'}, Ref: ${transactionId}`);
    }

    // 3. Increment points on nominee
    const { error: rpcError } = await supabase.rpc('increment_nominee_points', {
      p_nominee_id: nominee_id,
      p_points: points,
    });

    if (rpcError) {
      const { data: nominee } = await supabase
        .from('nominees')
        .select('total_points')
        .eq('id', nominee_id)
        .single();

      if (nominee) {
        await supabase
          .from('nominees')
          .update({ total_points: (nominee.total_points || 0) + points })
          .eq('id', nominee_id);
      }
    }

    pendingVotes.removePendingVote(reference);
    FULFILLED_VOTES.add(reference);
    console.log(`✅ Vote fulfilled successfully: ${points} points credited to nominee ${nominee_id} (Voter: ${voterEmail || voterPhone}, Ref: ${transactionId})`);
    return { points, transactionId };
  } catch (err) {
    console.error('Error fulfilling vote:', err);
    return { points };
  }
}

// GET /api/votes/check-eligibility - Verify DeKUT student email and ensure 1 vote per category
router.get('/check-eligibility', async (req, res) => {
  try {
    if (isVotingClosed()) {
      return res.json({
        eligible: false,
        hasVoted: false,
        votingClosed: true,
        message: 'Voting has officially concluded as of Tuesday midnight (23:59:59 EAT). Polls are now closed.',
      });
    }

    const { email, category_id } = req.query;

    if (!email) {
      return res.status(400).json({
        eligible: false,
        hasVoted: false,
        message: 'Student email is required.',
      });
    }

    const validation = voterTracker.validateStudentEmail(email);
    if (!validation.valid) {
      return res.status(400).json({
        eligible: false,
        hasVoted: false,
        message: validation.message,
      });
    }

    if (!category_id) {
      return res.json({
        eligible: true,
        hasVoted: false,
        email: validation.email,
        message: 'Email is valid.',
      });
    }

    const hasVoted = await voterTracker.hasVotedInCategory(validation.email, category_id);
    if (hasVoted) {
      return res.json({
        eligible: false,
        hasVoted: true,
        email: validation.email,
        category_id,
        message: 'You have already voted in this category! Each student can only vote once per category, but you can vote in other categories.',
      });
    }

    return res.json({
      eligible: true,
      hasVoted: false,
      email: validation.email,
      category_id,
      message: 'Eligible to vote in this category.',
    });
  } catch (err) {
    console.error('Error checking vote eligibility:', err.message);
    return res.status(500).json({ eligible: false, message: 'Server error checking eligibility.' });
  }
});

// GET /api/votes/voted-categories - Retrieve all category IDs a student has voted in
router.get('/voted-categories', (req, res) => {
  const { email } = req.query;
  if (!email) return res.json({ votedCategories: [] });
  const validation = voterTracker.validateStudentEmail(email);
  if (!validation.valid) return res.json({ votedCategories: [] });
  const votedCategories = voterTracker.getVotedCategoriesForEmail(validation.email);
  return res.json({ email: validation.email, votedCategories });
});

// POST /api/votes/initiate - Initiate an M-Pesa STK Push for 10 KES (1 vote per category per student)
router.post('/initiate', async (req, res, next) => {
  try {
    if (isVotingClosed()) {
      return res.status(403).json({
        error: {
          message: 'Voting has officially concluded as of Tuesday midnight, October 20th (23:59:59 EAT). No further votes can be accepted.',
          votingClosed: true,
        },
      });
    }

    const { nominee_id, category_id, email, phone, nominee_name } = req.body;

    if (!nominee_id || !category_id || !phone || !email) {
      return res.status(400).json({
        error: { message: 'Nominee, category, student email, and M-Pesa phone number are required.' },
      });
    }

    // 1. Strictly validate DeKUT student email format: xxxx.xxxRR@students.dkut.ac.ke (RR in 20-26)
    const emailValidation = voterTracker.validateStudentEmail(email);
    if (!emailValidation.valid) {
      return res.status(400).json({
        error: { message: emailValidation.message },
      });
    }

    const studentEmail = emailValidation.email;

    // 2. Prevent multiple votes per category
    const alreadyVoted = await voterTracker.hasVotedInCategory(studentEmail, category_id);
    if (alreadyVoted) {
      return res.status(400).json({
        error: {
          message: 'You have already cast your vote in this category! Each student is allowed 1 vote per category. You can vote in other categories.',
        },
      });
    }

    // 3. Fixed fair-play fee: 10 KES (10 points) per category vote
    const numericAmount = 10;
    const points = 10;
    const description = nominee_name ? `Vote for ${nominee_name.slice(0, 15)}` : 'DeKUTSO CCA';

    const gateway = getGateway();
    let initResult;

    if (gateway === 'payhero') {
      const externalRef = `CCA-${Date.now()}-${Math.random().toString(36).substring(2, 6).toUpperCase()}`;
      try {
        initResult = await payhero.initiatePayment({
          amount: numericAmount,
          phone,
          reference: externalRef,
          customerName: description,
        });
      } catch (heroErr) {
        // Fallback to PayNexus if configured and PayHero encounters error
        if (process.env.PAYNEXUS_SECRET_KEY && !process.env.PAYHERO_CHANNEL_ID) {
          console.warn('PayHero initiation failed, falling back to PayNexus:', heroErr.message);
          initResult = await paynexus.initiatePayment({
            amount: numericAmount,
            phone,
            description,
          });
        } else {
          throw heroErr;
        }
      }
    } else {
      initResult = await paynexus.initiatePayment({
        amount: numericAmount,
        phone,
        description,
      });
    }

    const voteMeta = {
      nominee_id,
      category_id,
      email: studentEmail,
      amount: numericAmount,
      points,
      phone: initResult.phone || phone,
      votes_count: 1,
      gateway,
      created_at: Date.now(),
    };

    // Save pending vote metadata by reference and external reference (both memory and disk)
    if (initResult.reference) {
      PENDING_VOTES.set(initResult.reference, voteMeta);
      pendingVotes.savePendingVote(initResult.reference, voteMeta);
    }
    if (initResult.externalReference) {
      PENDING_VOTES.set(initResult.externalReference, voteMeta);
      pendingVotes.savePendingVote(initResult.externalReference, voteMeta);
    }

    return res.json({
      success: true,
      reference: initResult.reference || initResult.externalReference,
      checkout_request_id: initResult.checkoutRequestId,
      amount: numericAmount,
      points,
      phone: initResult.phone || phone,
      email: studentEmail,
      status: 'initiated',
      message: 'M-Pesa STK push prompted for KSh 10. Please enter your PIN on your phone.',
    });
  } catch (err) {
    console.error('Failed to initiate M-Pesa STK push:', err.message);
    return res.status(400).json({
      success: false,
      error: { message: err.message || 'Failed to initiate M-Pesa payment.' },
    });
  }
});

// GET /api/votes/status/:reference - Check payment status and credit vote on completion
router.get('/status/:reference', async (req, res, next) => {
  try {
    const { reference } = req.params;

    if (!reference) {
      return res.status(400).json({ error: { message: 'Transaction reference is required.' } });
    }

    // Fast-path 1: already verified and fulfilled
    if (FULFILLED_VOTES.has(reference)) {
      const pending = PENDING_VOTES.get(reference);
      return res.json({
        success: true,
        status: 'completed',
        isComplete: true,
        points: pending ? pending.points : 0,
      });
    }

    // Fast-path 2: recent status cached within 3 seconds
    const cached = STATUS_CACHE.get(reference);
    if (cached && Date.now() - cached.timestamp < 3000) {
      return res.json(cached.data);
    }

    const pending = PENDING_VOTES.get(reference);
    const gateway = pending?.gateway || getGateway();

    let statusResult;
    try {
      if (gateway === 'payhero') {
        statusResult = await payhero.checkPaymentStatus(reference);
      } else {
        statusResult = await paynexus.checkPaymentStatus(reference);
      }
    } catch (checkErr) {
      console.warn(`Payment status check pending for ${reference}:`, checkErr.message);
      const pendingData = {
        success: true,
        status: 'processing',
        isComplete: false,
        message: 'Awaiting M-Pesa authorization...',
      };
      STATUS_CACHE.set(reference, { timestamp: Date.now(), data: pendingData });
      return res.json(pendingData);
    }

    const currentStatus = statusResult.status;

    if (currentStatus === 'completed' || statusResult.isComplete) {
      const fulfilled = await fulfillVote(reference, statusResult);
      const successData = {
        success: true,
        status: 'completed',
        isComplete: true,
        points: fulfilled ? fulfilled.points : 0,
        refNo: statusResult.refNo,
      };
      STATUS_CACHE.set(reference, { timestamp: Date.now(), data: successData });
      return res.json(successData);
    }

    if (['failed', 'cancelled', 'expired'].includes(currentStatus)) {
      const reason = statusResult.data?.failure_reason || `Payment was ${currentStatus}.`;
      const failureData = {
        success: false,
        status: currentStatus,
        isComplete: false,
        message: reason,
      };
      STATUS_CACHE.set(reference, { timestamp: Date.now(), data: failureData });
      return res.json(failureData);
    }

    // Status is 'initiated' or 'processing'
    const inProgressData = {
      success: true,
      status: currentStatus || 'processing',
      isComplete: false,
    };
    STATUS_CACHE.set(reference, { timestamp: Date.now(), data: inProgressData });
    return res.json(inProgressData);
  } catch (err) {
    console.error('Error checking vote payment status:', err.message);
    return res.status(500).json({
      success: false,
      error: { message: 'Failed to check payment status.' },
    });
  }
});

// POST /api/votes/webhook - PayHero & PayNexus IPN webhook listener
router.post('/webhook', async (req, res) => {
  try {
    const body = req.body || {};
    console.log('Payment webhook received:', JSON.stringify(body));

    // Handle PayHero callback schema: { response: { ExternalReference, Status, ResultCode, MpesaReceiptNumber, Phone, ... } }
    if (body.response) {
      const resp = body.response;
      const ref = resp.ExternalReference || resp.CheckoutRequestID;
      const isSuccess = (resp.Status || '').toLowerCase() === 'success' || resp.ResultCode === 0;

      if (ref && isSuccess) {
        await fulfillVote(ref, {
          refNo: resp.MpesaReceiptNumber,
          data: resp,
        });
      }
      return res.status(200).json({ status: true, message: 'Callback processed' });
    }

    // Handle PayNexus callback schema: { data: { reference, status, provider_transaction_id, ... } }
    const payload = body.data || body;
    const { reference, status } = payload;

    if (reference && status === 'completed') {
      await fulfillVote(reference, { data: payload });
    }

    return res.status(200).json({ received: true });
  } catch (err) {
    console.error('Webhook error:', err);
    return res.status(200).json({ received: true });
  }
});

// GET /api/votes - Retrieve recorded votes from database for audit & verification
router.get('/', async (req, res, next) => {
  try {
    if (!supabase) {
      return res.status(500).json({ error: { message: 'Database client not initialized' } });
    }

    const { limit = 100 } = req.query;
    const { data: votes, error } = await supabase
      .from('votes')
      .select(`
        *,
        nominees (id, name),
        categories (id, name)
      `)
      .order('created_at', { ascending: false })
      .limit(Number(limit));

    if (error) {
      // Fallback query without joins
      const fallback = await supabase
        .from('votes')
        .select('*')
        .order('created_at', { ascending: false })
        .limit(Number(limit));
      return res.json(fallback.data || []);
    }

    return res.json(votes || []);
  } catch (err) {
    next(err);
  }
});

// POST /api/votes - Direct vote submission (fallback or manual admin)
router.post('/', async (req, res, next) => {
  try {
    const { nominee_id, category_id, amount, transaction_id, voter_phone } = req.body;

    if (!nominee_id || !category_id || !amount) {
      return res.status(400).json({
        error: { message: 'nominee_id, category_id, and amount are required' },
      });
    }

    if (amount < 1) {
      return res.status(400).json({
        error: { message: 'Minimum voting amount is KSh 1 (1 vote)' },
      });
    }

    const points = calculatePoints(amount);

    if (!supabase) {
      return res.status(500).json({ error: { message: 'Database client not initialized' } });
    }

    const { data: vote, error: voteError } = await supabase
      .from('votes')
      .insert({
        nominee_id,
        category_id,
        amount,
        points,
        transaction_id: transaction_id || null,
        voter_phone: voter_phone || null,
      })
      .select()
      .single();

    if (voteError) throw voteError;

    // Update nominee total points
    const { error: updateError } = await supabase.rpc('increment_nominee_points', {
      p_nominee_id: nominee_id,
      p_points: points,
    });

    if (updateError) {
      const { data: nominee } = await supabase
        .from('nominees')
        .select('total_points')
        .eq('id', nominee_id)
        .single();

      if (nominee) {
        await supabase
          .from('nominees')
          .update({ total_points: (nominee.total_points || 0) + points })
          .eq('id', nominee_id);
      }
    }

    return res.status(201).json({ ...vote, points });
  } catch (err) {
    next(err);
  }
});

module.exports = router;
