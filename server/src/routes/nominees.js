const express = require('express');
const supabase = require('../config/supabase');
const mockData = require('../db/mockData');

const router = express.Router();

// GET /api/nominees - List approved nominees, optionally filtered by category
router.get('/', async (req, res, next) => {
  try {
    const { category_id } = req.query;

    if (!supabase) {
      return res.json(mockData.getNominees(category_id));
    }

    let query = supabase
      .from('nominees')
      .select('*, categories(name, slug)')
      .eq('status', 'approved')
      .order('total_points', { ascending: false });

    if (category_id) {
      query = query.eq('category_id', category_id);
    }

    const { data, error } = await query;
    if (error || !data || data.length === 0) {
      return res.json(mockData.getNominees(category_id));
    }
    res.json(data);
  } catch (err) {
    console.warn('Nominees route exception, using mock data:', err.message);
    res.json(mockData.getNominees(req.query.category_id));
  }
});

// GET /api/nominees/:id - Single nominee profile
router.get('/:id', async (req, res, next) => {
  try {
    const { id } = req.params;

    if (!supabase) {
      const nominee = mockData.getNomineeById(id);
      if (!nominee) {
        return res.status(404).json({ error: { message: 'Nominee not found' } });
      }
      return res.json(nominee);
    }

    const { data, error } = await supabase
      .from('nominees')
      .select('*, categories(name, slug)')
      .eq('id', id)
      .eq('status', 'approved')
      .single();

    if (error || !data) {
      const mockNominee = mockData.getNomineeById(id);
      if (mockNominee) return res.json(mockNominee);
      return res.status(404).json({ error: { message: 'Nominee not found' } });
    }

    res.json(data);
  } catch (err) {
    const mockNominee = mockData.getNomineeById(req.params.id);
    if (mockNominee) return res.json(mockNominee);
    next(err);
  }
});

module.exports = router;
