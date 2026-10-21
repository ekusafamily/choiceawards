const express = require('express');
const supabase = require('../config/supabase');

const router = express.Router();

// GET /api/stats - High-level statistics
router.get('/', async (req, res) => {
  try {
    if (!supabase) {
      return res.json({
        categoriesCount: 26,
        nomineesCount: 0,
        votesCount: 0,
        pendingNominations: 0,
        verificationOngoing: true,
        ceremonyVenue: 'Freedom Hall',
        ceremonyDate: 'Dates yet to be communicated',
      });
    }

    const [{ count: catCount }, { count: nomCount }, { count: voteCount }, { count: pendingCount }] = await Promise.all([
      supabase.from('categories').select('*', { count: 'exact', head: true }),
      supabase.from('nominees').select('*', { count: 'exact', head: true }).eq('status', 'approved'),
      supabase.from('votes').select('*', { count: 'exact', head: true }),
      supabase.from('nominations').select('*', { count: 'exact', head: true }).eq('status', 'pending'),
    ]);

    res.json({
      categoriesCount: catCount || 26,
      nomineesCount: nomCount || 0,
      votesCount: voteCount || 0,
      pendingNominations: pendingCount || 0,
      verificationOngoing: true,
      ceremonyVenue: 'Freedom Hall',
      ceremonyDate: 'Dates yet to be communicated',
    });
  } catch (err) {
    console.warn('Stats route caught error, returning resilient fallback stats:', err.message);
    res.json({
      categoriesCount: 26,
      nomineesCount: 0,
      votesCount: 0,
      pendingNominations: 0,
      verificationOngoing: true,
      ceremonyVenue: 'Freedom Hall',
      ceremonyDate: 'Dates yet to be communicated',
    });
  }
});

module.exports = router;
