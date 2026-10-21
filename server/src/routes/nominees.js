const express = require('express');
const supabase = require('../config/supabase');

const router = express.Router();

// GET /api/nominees - List approved nominees, optionally filtered by category
router.get('/', async (req, res) => {
  try {
    const { category_id } = req.query;

    if (!supabase) {
      return res.json([]);
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
    if (error) {
      console.warn('Supabase nominees query error (returning empty fallback):', error.message);
      return res.json([]);
    }
    res.json(data || []);
  } catch (err) {
    console.warn('Nominees route caught error, returning empty list:', err.message);
    res.json([]);
  }
});

// GET /api/nominees/:id - Single nominee profile
router.get('/:id', async (req, res, next) => {
  try {
    const { id } = req.params;

    if (!supabase) {
      return res.status(500).json({ error: { message: 'Database client not initialized' } });
    }

    const { data, error } = await supabase
      .from('nominees')
      .select('*, categories(name, slug)')
      .eq('id', id)
      .eq('status', 'approved')
      .single();

    if (error || !data) {
      return res.status(404).json({ error: { message: 'Nominee not found' } });
    }

    res.json(data);
  } catch (err) {
    next(err);
  }
});

// POST /api/nominees - Admin directly add nominee
router.post('/', async (req, res, next) => {
  try {
    const { name, category_id, course, year_of_study, photo_url, bio, achievements } = req.body;

    if (!name || !category_id) {
      return res.status(400).json({ error: { message: 'Nominee name and category are required' } });
    }

    if (!supabase) {
      return res.status(500).json({ error: { message: 'Database client not initialized' } });
    }

    const { data, error } = await supabase
      .from('nominees')
      .insert({
        name,
        category_id,
        course,
        year_of_study,
        photo_url,
        bio,
        achievements,
        status: 'approved',
        total_points: 0,
      })
      .select()
      .single();

    if (error) throw error;
    res.status(201).json(data);
  } catch (err) {
    next(err);
  }
});

// DELETE /api/nominees/:id - Admin remove nominee
router.delete('/:id', async (req, res, next) => {
  try {
    const { id } = req.params;

    if (!supabase) {
      return res.status(500).json({ error: { message: 'Database client not initialized' } });
    }

    const { error } = await supabase.from('nominees').delete().eq('id', id);
    if (error) throw error;
    res.json({ success: true, id });
  } catch (err) {
    next(err);
  }
});

module.exports = router;
