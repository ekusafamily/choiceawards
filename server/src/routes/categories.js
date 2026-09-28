const express = require('express');
const supabase = require('../config/supabase');
const mockData = require('../db/mockData');

const router = express.Router();

// GET /api/categories - List all categories
router.get('/', async (req, res, next) => {
  try {
    if (!supabase) {
      return res.json(mockData.getCategories());
    }

    const { data, error } = await supabase
      .from('categories')
      .select('*')
      .order('display_order', { ascending: true });

    if (error || !data || data.length === 0) {
      if (error) console.warn('Supabase categories error, using mock data:', error.message);
      return res.json(mockData.getCategories());
    }
    res.json(data);
  } catch (err) {
    console.warn('Categories route exception, falling back to mock data:', err.message);
    res.json(mockData.getCategories());
  }
});

// GET /api/categories/:slug - Single category with approved nominees
router.get('/:slug', async (req, res, next) => {
  try {
    let { slug } = req.params;
    const slugAliases = {
      'male-council-member': 'student-leader',
      'female-council-member': 'student-leader',
      'association-leader': 'association-club-leader',
    };
    if (slugAliases[slug]) {
      slug = slugAliases[slug];
    }

    if (!supabase) {
      const category = mockData.getCategoryBySlug(slug);
      if (!category) {
        return res.status(404).json({ error: { message: 'Category not found' } });
      }
      return res.json(category);
    }

    const { data: category, error: catError } = await supabase
      .from('categories')
      .select('*')
      .eq('slug', slug)
      .single();

    if (catError || !category) {
      const mockCategory = mockData.getCategoryBySlug(slug);
      if (mockCategory) return res.json(mockCategory);
      return res.status(404).json({ error: { message: 'Category not found' } });
    }

    const { data: nominees, error: nomError } = await supabase
      .from('nominees')
      .select('*')
      .eq('category_id', category.id)
      .eq('status', 'approved')
      .order('total_points', { ascending: false });

    if (nomError) {
      const mockCategory = mockData.getCategoryBySlug(slug);
      return res.json(mockCategory || { ...category, nominees: [] });
    }

    res.json({ ...category, nominees: nominees || [] });
  } catch (err) {
    const mockCategory = mockData.getCategoryBySlug(req.params.slug);
    if (mockCategory) return res.json(mockCategory);
    next(err);
  }
});

module.exports = router;
