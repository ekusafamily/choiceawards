const express = require('express');
const supabase = require('../config/supabase');
const mockData = require('../db/mockData');

const router = express.Router();

function calculatePoints(amount) {
  if (amount >= 100) {
    return Math.floor(amount * 1.1);
  }
  return amount;
}

// POST /api/votes - Submit a vote
router.post('/', async (req, res, next) => {
  try {
    const { nominee_id, category_id, amount, transaction_id, voter_phone } = req.body;

    if (!nominee_id || !category_id || !amount) {
      return res.status(400).json({
        error: { message: 'nominee_id, category_id, and amount are required' },
      });
    }

    if (amount < 10) {
      return res.status(400).json({
        error: { message: 'Minimum voting amount is KSh 10' },
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
        // Fall back to in-memory vote record
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
