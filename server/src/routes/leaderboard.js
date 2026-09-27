const express = require('express');
const supabase = require('../config/supabase');
const mockData = require('../db/mockData');

const router = express.Router();

// GET /api/leaderboard/:slug - Ranked nominees for a category
router.get('/:slug', async (req, res, next) => {
  try {
    const { slug } = req.params;

    if (!supabase) {
      const mockResult = mockData.getLeaderboard(slug);
      if (!mockResult) {
        return res.status(404).json({ error: { message: 'Category not found' } });
      }
      return res.json(mockResult);
    }

    // Get category by slug
    const { data: category, error: catError } = await supabase
      .from('categories')
      .select('*')
      .eq('slug', slug)
      .single();

    if (catError || !category) {
      const mockResult = mockData.getLeaderboard(slug);
      if (mockResult) return res.json(mockResult);
      return res.status(404).json({ error: { message: 'Category not found' } });
    }

    // Get ranked nominees
    const { data: nominees, error: nomError } = await supabase
      .from('nominees')
      .select('id, name, photo_url, course, total_points')
      .eq('category_id', category.id)
      .eq('status', 'approved')
      .order('total_points', { ascending: false });

    if (nomError || !nominees || nominees.length === 0) {
      const mockResult = mockData.getLeaderboard(slug);
      if (mockResult && mockResult.nominees.length > 0) return res.json(mockResult);
      return res.json({ category, nominees: [] });
    }

    // Add position numbers
    const ranked = nominees.map((nominee, index) => ({
      position: index + 1,
      ...nominee,
    }));

    res.json({ category, nominees: ranked });
  } catch (err) {
    const mockResult = mockData.getLeaderboard(req.params.slug);
    if (mockResult) return res.json(mockResult);
    next(err);
  }
});

module.exports = router;
