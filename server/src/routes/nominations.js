const express = require('express');
const supabase = require('../config/supabase');
const mockData = require('../db/mockData');

const router = express.Router();

// POST /api/nominations - Submit a nomination
router.post('/', async (req, res, next) => {
  try {
    const {
      nominee_name,
      course,
      year_of_study,
      category_id,
      photo_url,
      short_profile,
      achievements,
      reason,
      submitted_by,
    } = req.body;

    // Validate required fields
    if (!nominee_name || !category_id) {
      return res.status(400).json({
        error: { message: 'nominee_name and category_id are required' },
      });
    }

    if (!supabase) {
      const nomination = mockData.recordNomination({
        nominee_name,
        course,
        year_of_study,
        category_id,
        photo_url,
        short_profile,
        achievements,
        reason,
        submitted_by,
      });
      return res.status(201).json(nomination);
    }

    try {
      const { data, error } = await supabase
        .from('nominations')
        .insert({
          nominee_name,
          course,
          year_of_study,
          category_id,
          photo_url,
          short_profile,
          achievements,
          reason,
          submitted_by,
        })
        .select()
        .single();

      if (error) {
        const nomination = mockData.recordNomination({
          nominee_name,
          course,
          year_of_study,
          category_id,
          photo_url,
          short_profile,
          achievements,
          reason,
          submitted_by,
        });
        return res.status(201).json(nomination);
      }

      res.status(201).json(data);
    } catch (dbErr) {
      const nomination = mockData.recordNomination({
        nominee_name,
        course,
        year_of_study,
        category_id,
        photo_url,
        short_profile,
        achievements,
        reason,
        submitted_by,
      });
      res.status(201).json(nomination);
    }
  } catch (err) {
    next(err);
  }
});

// GET /api/nominations - List nominations (for admin review)
router.get('/', async (req, res, next) => {
  try {
    if (!supabase) {
      return res.json(mockData.MOCK_NOMINATIONS);
    }

    const { status } = req.query;

    let query = supabase
      .from('nominations')
      .select('*, categories(name)')
      .order('created_at', { ascending: false });

    if (status) {
      query = query.eq('status', status);
    }

    const { data, error } = await query;
    if (error || !data) {
      return res.json(mockData.MOCK_NOMINATIONS);
    }
    res.json(data);
  } catch (err) {
    res.json(mockData.MOCK_NOMINATIONS);
  }
});

module.exports = router;
