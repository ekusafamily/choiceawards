const express = require('express');
const supabase = require('../config/supabase');
const mockData = require('../db/mockData');

const router = express.Router();

// GET /api/stats - High-level statistics
router.get('/', async (req, res, next) => {
  try {
    if (!supabase) {
      return res.json(mockData.getStats());
    }

    try {
      const [{ count: catCount }, { count: nomCount }, { count: voteCount }] = await Promise.all([
        supabase.from('categories').select('*', { count: 'exact', head: true }),
        supabase.from('nominees').select('*', { count: 'exact', head: true }).eq('status', 'approved'),
        supabase.from('votes').select('*', { count: 'exact', head: true }),
      ]);

      if (catCount === null || catCount === undefined || catCount === 0) {
        return res.json(mockData.getStats());
      }

      res.json({
        categoriesCount: catCount || 0,
        nomineesCount: nomCount || 0,
        votesCount: voteCount || 0,
      });
    } catch (e) {
      res.json(mockData.getStats());
    }
  } catch (err) {
    res.json(mockData.getStats());
  }
});

module.exports = router;
