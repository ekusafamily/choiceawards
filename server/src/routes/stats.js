const express = require('express');
const supabase = require('../config/supabase');

const router = express.Router();

// GET /api/stats - High-level statistics
router.get('/', async (req, res, next) => {
  try {
    if (!supabase) {
      return res.status(500).json({ error: { message: 'Database client not initialized' } });
    }

    const [{ count: catCount }, { count: nomCount }, { count: voteCount }, { count: pendingCount }] = await Promise.all([
      supabase.from('categories').select('*', { count: 'exact', head: true }),
      supabase.from('nominees').select('*', { count: 'exact', head: true }).eq('status', 'approved'),
      supabase.from('votes').select('*', { count: 'exact', head: true }),
      supabase.from('nominations').select('*', { count: 'exact', head: true }).eq('status', 'pending'),
    ]);

    res.json({
      categoriesCount: catCount || 0,
      nomineesCount: nomCount || 0,
      votesCount: voteCount || 0,
      pendingNominations: pendingCount || 0,
    });
  } catch (err) {
    next(err);
  }
});

module.exports = router;
