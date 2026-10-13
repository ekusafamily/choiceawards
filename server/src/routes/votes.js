const express = require('express');
const supabase = require('../config/supabase');
const paynexus = require('../services/paynexus');
const payhero = require('../services/payhero');

const router = express.Router();

function getGateway() {
  return (process.env.PAYMENT_GATEWAY || 'payhero').toLowerCase();
}

// In-memory tracker for ongoing transactions
const PENDING_VOTES = new Map();
const FULFILLED_VOTES = new Set();
const STATUS_CACHE = new Map(); // reference -> { timestamp, data }

function calculatePoints(amount) {
  if (amount >= 100) {
    return Math.floor(amount * 1.1);
  }
  return amount;
}

/**
 * Fulfill a verified vote: insert into database and increment nominee points
 */
async function fulfillVote(reference, statusResult) {
  if (FULFILLED_VOTES.has(reference)) {
    const pending = PENDING_VOTES.get(reference);
    return { points: pending ? pending.points : 0 };
  }

  const pending = PENDING_VOTES.get(reference);
  if (!pending) {
    console.warn(`No pending vote metadata found for reference: ${reference}`);
    return null;
  }

  const { nominee_id, category_id, amount, points, phone } = pending;
  const transactionId = statusResult?.refNo || statusResult?.data?.provider_transaction_id || statusResult?.data?.MpesaReceiptNumber || reference;
  const voterPhone = phone || statusResult?.data?.phone || statusResult?.data?.Phone || null;

  try {
    if (!supabase) {
      console.error('Supabase client not initialized, cannot record vote');
      return { points, transactionId };
    }

    // 1. Insert vote row into Supabase
    const { data: vote, error: voteError } = await supabase
      .from('votes')
      .insert({
        nominee_id,
        category_id,
        amount,
        points,
        transaction_id: transactionId,
        voter_phone: voterPhone,
      })
      .select()
      .single();

    if (voteError) {
      console.error('Supabase vote insert error:', voteError.message);
    }

    // 2. Increment points on nominee
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

    FULFILLED_VOTES.add(reference);
    console.log(`✅ Vote fulfilled successfully: ${points} points credited to nominee ${nominee_id} (Ref: ${transactionId})`);
    return { points, transactionId };
  } catch (err) {
    console.error('Error fulfilling vote:', err);
    return { points };
  }
}

// POST /api/votes/initiate - Initiate an M-Pesa STK Push via PayHero (or PayNexus fallback)
router.post('/initiate', async (req, res, next) => {
  try {
    const { nominee_id, category_id, amount, phone, votes_count, nominee_name } = req.body;

    if (!nominee_id || !amount || !phone) {
      return res.status(400).json({
        error: { message: 'Nominee, voting amount, and M-Pesa phone number are required.' },
      });
    }

    const numericAmount = Math.round(Number(amount));
    if (isNaN(numericAmount) || numericAmount < 1) {
      return res.status(400).json({
        error: { message: 'Minimum voting amount is KSh 1 (1 vote).' },
      });
    }
    const points = calculatePoints(numericAmount);
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
      amount: numericAmount,
      points,
      phone: initResult.phone || phone,
      votes_count: votes_count || 1,
      gateway,
      created_at: Date.now(),
    };

    // Save pending vote metadata by reference and external reference
    if (initResult.reference) PENDING_VOTES.set(initResult.reference, voteMeta);
    if (initResult.externalReference) PENDING_VOTES.set(initResult.externalReference, voteMeta);

    return res.json({
      success: true,
      reference: initResult.reference || initResult.externalReference,
      checkout_request_id: initResult.checkoutRequestId,
      amount: numericAmount,
      points,
      phone: initResult.phone || phone,
      status: 'initiated',
      message: 'M-Pesa STK push prompted. Please enter your PIN on your phone.',
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
