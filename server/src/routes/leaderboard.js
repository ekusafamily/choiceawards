const express = require('express');
const supabase = require('../config/supabase');

const router = express.Router();

// GET /api/leaderboard/:slug - Ranked nominees for a category
router.get('/:slug', async (req, res, next) => {
  try {
    const { slug } = req.params;

    if (!supabase) {
      return res.status(500).json({ error: { message: 'Database client not initialized' } });
    }

    // Get category by slug
    const { data: category, error: catError } = await supabase
      .from('categories')
      .select('*')
      .eq('slug', slug)
      .single();

    if (catError || !category) {
      return res.status(404).json({ error: { message: 'Category not found' } });
    }

    // Get ranked nominees
    const { data: nominees, error: nomError } = await supabase
      .from('nominees')
      .select('id, name, photo_url, course, total_points')
      .eq('category_id', category.id)
      .eq('status', 'approved')
      .order('total_points', { ascending: false });

    if (nomError) {
      return res.json({ category, nominees: [] });
    }

    // Add position numbers
    const ranked = (nominees || []).map((nominee, index) => ({
      position: index + 1,
      ...nominee,
    }));

    res.json({ category, nominees: ranked });
  } catch (err) {
    next(err);
  }
});

module.exports = router;
