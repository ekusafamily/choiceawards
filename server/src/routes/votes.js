const express = require('express');
const supabase = require('../config/supabase');
const mockData = require('../db/mockData');
const paynexus = require('../services/paynexus');

const router = express.Router();

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
  const transactionId = statusResult?.refNo || statusResult?.data?.provider_transaction_id || reference;
  const voterPhone = phone || statusResult?.data?.phone || null;

  try {
    if (supabase) {
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
        console.warn('Supabase vote insert error, recording in mockData:', voteError.message);
        mockData.recordVote({
          nominee_id,
          category_id,
          amount,
          transaction_id: transactionId,
          voter_phone: voterPhone,
        });
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
    } else {
      mockData.recordVote({
        nominee_id,
        category_id,
        amount,
        transaction_id: transactionId,
        voter_phone: voterPhone,
      });
    }

    FULFILLED_VOTES.add(reference);
    console.log(`✅ Vote fulfilled successfully: ${points} points credited to nominee ${nominee_id} (Ref: ${transactionId})`);
    return { points, transactionId };
  } catch (err) {
    console.error('Error fulfilling vote:', err);
    return { points };
  }
}

// POST /api/votes/initiate - Initiate an M-Pesa STK Push via PayNexus
router.post('/initiate', async (req, res, next) => {
  try {
    const { nominee_id, category_id, amount, phone, votes_count, nominee_name } = req.body;

    if (!nominee_id || !amount || !phone) {
      return res.status(400).json({
        error: { message: 'Nominee, voting amount, and M-Pesa phone number are required.' },
      });
    }

    const numericAmount = Math.max(1, Math.round(Number(amount)));
    const points = calculatePoints(numericAmount);
    const description = nominee_name ? `Vote for ${nominee_name.slice(0, 18)}` : 'CCA Vote';

    // Call PayNexus STK Push API
    const initResult = await paynexus.initiatePayment({
      amount: numericAmount,
      phone,
      description,
    });

    // Save pending vote metadata
    PENDING_VOTES.set(initResult.reference, {
      nominee_id,
      category_id,
      amount: numericAmount,
      points,
      phone: initResult.phone || phone,
      votes_count: votes_count || 1,
      created_at: Date.now(),
    });

    return res.json({
      success: true,
      reference: initResult.reference,
      checkout_request_id: initResult.checkoutRequestId,
      amount: numericAmount,
      points,
      phone: initResult.phone || phone,
      status: 'initiated',
      message: 'M-Pesa STK push prompted. Please enter your PIN on your phone.',
    });
  } catch (err) {
    console.error('Failed to initiate PayNexus STK push:', err.message);
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

    // Check with PayNexus API
    let statusResult;
    try {
      statusResult = await paynexus.checkPaymentStatus(reference);
    } catch (checkErr) {
      // Payment might still be propagating or transient network delay
      console.warn(`PayNexus status check pending for ${reference}:`, checkErr.message);
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

    if (currentStatus === 'completed') {
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

// POST /api/votes/webhook - PayNexus IPN webhook listener
router.post('/webhook', async (req, res) => {
  try {
    const payload = req.body?.data || req.body || {};
    const { reference, status } = payload;

    if (reference && status === 'completed') {
      await fulfillVote(reference, { data: payload });
    }

    res.status(200).json({ received: true });
  } catch (err) {
    console.error('Webhook error:', err);
    res.status(200).json({ received: true });
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
        error: { message: 'Minimum voting amount is 1 KES' },
      });
    }

    const points = calculatePoints(amount);

    if (!supabase) {
      const vote = mockData.recordVote({
        nominee_id,
        category_id,
        amount,
        transaction_id,
        voter_phone,
      });
      return res.status(201).json(vote);
    }

    // Try Supabase insert
    try {
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

      if (voteError) {
        const mockVote = mockData.recordVote({
          nominee_id,
          category_id,
          amount,
          transaction_id,
          voter_phone,
        });
        return res.status(201).json(mockVote);
      }

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
    } catch (dbErr) {
      const mockVote = mockData.recordVote({
        nominee_id,
        category_id,
        amount,
        transaction_id,
        voter_phone,
      });
      return res.status(201).json(mockVote);
    }
  } catch (err) {
    next(err);
  }
});

module.exports = router;
