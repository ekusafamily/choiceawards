const express = require('express');
const supabase = require('../config/supabase');

const router = express.Router();

// GET /api/categories - List all categories
router.get('/', async (req, res, next) => {
  try {
    if (!supabase) {
      return res.status(500).json({ error: { message: 'Database client not initialized' } });
    }

    const { data, error } = await supabase
      .from('categories')
      .select('*')
      .order('display_order', { ascending: true });

    if (error) {
      return res.status(500).json({ error: { message: error.message } });
    }
    res.json(data || []);
  } catch (err) {
    next(err);
  }
});

// GET /api/categories/:slug - Single category with approved nominees
router.get('/:slug', async (req, res, next) => {
  try {
    let { slug } = req.params;
    const slugAliases = {
      'male-council-member': 'male-student-leader',
      'female-council-member': 'female-student-leader',
      'student-leader': 'male-student-leader',
      'association-leader': 'association-club-leader',
      'music-artist': 'music-artist-of-the-year',
      'ambassador': 'ambassador-of-the-year',
    };
    if (slugAliases[slug]) {
      slug = slugAliases[slug];
    }

    if (!supabase) {
      return res.status(500).json({ error: { message: 'Database client not initialized' } });
    }

    const { data: category, error: catError } = await supabase
      .from('categories')
      .select('*')
      .eq('slug', slug)
      .single();

    if (catError || !category) {
      return res.status(404).json({ error: { message: 'Category not found' } });
    }

    const { data: nominees, error: nomError } = await supabase
      .from('nominees')
      .select('*')
      .eq('category_id', category.id)
      .eq('status', 'approved')
      .order('total_points', { ascending: false });

    if (nomError) {
      return res.json({ ...category, nominees: [] });
    }

    res.json({ ...category, nominees: nominees || [] });
  } catch (err) {
    next(err);
  }
});

module.exports = router;
