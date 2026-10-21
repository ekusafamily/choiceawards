const express = require('express');
const supabase = require('../config/supabase');
const FALLBACK_CATEGORIES = require('../config/fallbackCategories');

const router = express.Router();

const slugAliases = {
  'male-council-member': 'male-student-leader',
  'female-council-member': 'female-student-leader',
  'student-leader': 'male-student-leader',
  'association-leader': 'association-club-leader',
  'music-artist': 'music-artist-of-the-year',
  'ambassador': 'ambassador-of-the-year',
  'dance-crew': 'dance-crew-of-the-year',
  'rapper': 'rapper-of-the-year',
  'poet': 'poet-of-the-year',
};

// GET /api/categories - List all categories
router.get('/', async (req, res) => {
  try {
    if (!supabase) {
      return res.json(FALLBACK_CATEGORIES);
    }

    const { data, error } = await supabase
      .from('categories')
      .select('*')
      .order('display_order', { ascending: true });

    if (error || !data || data.length === 0) {
      console.warn('Supabase categories error or quota exceeded, serving fallback categories:', error?.message);
      return res.json(FALLBACK_CATEGORIES);
    }
    res.json(data);
  } catch (err) {
    console.warn('Categories route error, serving fallback categories:', err.message);
    res.json(FALLBACK_CATEGORIES);
  }
});

// GET /api/categories/:slug - Single category with approved nominees
router.get('/:slug', async (req, res) => {
  try {
    let { slug } = req.params;
    if (slugAliases[slug]) {
      slug = slugAliases[slug];
    }

    const fallbackCat = FALLBACK_CATEGORIES.find((c) => c.slug === slug);

    if (!supabase) {
      if (fallbackCat) {
        return res.json({
          ...fallbackCat,
          nominees: [],
          verificationOngoing: true,
          ceremonyVenue: 'Freedom Hall',
          ceremonyDate: 'Dates yet to be communicated',
        });
      }
      return res.status(404).json({ error: { message: 'Category not found' } });
    }

    const { data: category, error: catError } = await supabase
      .from('categories')
      .select('*')
      .eq('slug', slug)
      .single();

    if (catError || !category) {
      if (fallbackCat) {
        return res.json({
          ...fallbackCat,
          nominees: [],
          verificationOngoing: true,
          ceremonyVenue: 'Freedom Hall',
          ceremonyDate: 'Dates yet to be communicated',
        });
      }
      return res.status(404).json({ error: { message: 'Category not found' } });
    }

    const { data: nominees, error: nomError } = await supabase
      .from('nominees')
      .select('*')
      .eq('category_id', category.id)
      .eq('status', 'approved')
      .order('total_points', { ascending: false });

    if (nomError) {
      return res.json({
        ...category,
        nominees: [],
        verificationOngoing: true,
        ceremonyVenue: 'Freedom Hall',
        ceremonyDate: 'Dates yet to be communicated',
      });
    }

    res.json({
      ...category,
      nominees: nominees || [],
      verificationOngoing: true,
      ceremonyVenue: 'Freedom Hall',
      ceremonyDate: 'Dates yet to be communicated',
    });
  } catch (err) {
    let { slug } = req.params;
    if (slugAliases[slug]) slug = slugAliases[slug];
    const fallbackCat = FALLBACK_CATEGORIES.find((c) => c.slug === slug);
    if (fallbackCat) {
      return res.json({
        ...fallbackCat,
        nominees: [],
        verificationOngoing: true,
        ceremonyVenue: 'Freedom Hall',
        ceremonyDate: 'Dates yet to be communicated',
      });
    }
    res.status(500).json({ error: { message: err.message } });
  }
});

module.exports = router;
