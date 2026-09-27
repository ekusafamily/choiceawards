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
    const { status } = req.query;

    if (!supabase) {
      return res.json(mockData.getNominations(status));
    }

    let query = supabase
      .from('nominations')
      .select('*, categories(name, slug)')
      .order('created_at', { ascending: false });

    if (status) {
      query = query.eq('status', status);
    }

    const { data, error } = await query;
    if (error || !data || data.length === 0) {
      return res.json(mockData.getNominations(status));
    }
    res.json(data);
  } catch (err) {
    res.json(mockData.getNominations(req.query.status));
  }
});

// PATCH /api/nominations/:id/approve - Approve nomination & publish to nominees table
router.patch('/:id/approve', async (req, res, next) => {
  try {
    const { id } = req.params;

    if (!supabase) {
      const result = mockData.approveNomination(id);
      if (!result) return res.status(404).json({ error: { message: 'Nomination not found' } });
      return res.json({ success: true, ...result });
    }

    try {
      // 1. Fetch nomination
      const { data: nomination, error: fetchErr } = await supabase
        .from('nominations')
        .select('*')
        .eq('id', id)
        .single();

      if (fetchErr || !nomination) {
        const result = mockData.approveNomination(id);
        if (result) return res.json({ success: true, ...result });
        return res.status(404).json({ error: { message: 'Nomination not found' } });
      }

      // 2. Mark nomination approved
      await supabase
        .from('nominations')
        .update({ status: 'approved' })
        .eq('id', id);

      // 3. Insert into nominees table
      const { data: newNominee, error: nomErr } = await supabase
        .from('nominees')
        .insert({
          name: nomination.nominee_name,
          course: nomination.course,
          year_of_study: nomination.year_of_study,
          category_id: nomination.category_id,
          photo_url: nomination.photo_url,
          bio: nomination.short_profile || nomination.reason,
          achievements: nomination.achievements,
          status: 'approved',
          total_points: 0,
        })
        .select()
        .single();

      if (nomErr) throw nomErr;

      res.json({ success: true, nomination, nominee: newNominee });
    } catch (dbErr) {
      const result = mockData.approveNomination(id);
      if (result) return res.json({ success: true, ...result });
      next(dbErr);
    }
  } catch (err) {
    next(err);
  }
});

// PATCH /api/nominations/:id/reject - Reject nomination
router.patch('/:id/reject', async (req, res, next) => {
  try {
    const { id } = req.params;

    if (!supabase) {
      const rejected = mockData.rejectNomination(id);
      if (!rejected) return res.status(404).json({ error: { message: 'Nomination not found' } });
      return res.json({ success: true, nomination: rejected });
    }

    try {
      const { data, error } = await supabase
        .from('nominations')
        .update({ status: 'rejected' })
        .eq('id', id)
        .select()
        .single();

      if (error) {
        const rejected = mockData.rejectNomination(id);
        if (rejected) return res.json({ success: true, nomination: rejected });
        return res.status(404).json({ error: { message: 'Nomination not found' } });
      }

      res.json({ success: true, nomination: data });
    } catch (dbErr) {
      const rejected = mockData.rejectNomination(id);
      if (rejected) return res.json({ success: true, nomination: rejected });
      next(dbErr);
    }
  } catch (err) {
    next(err);
  }
});

// DELETE /api/nominations/:id - Delete nomination
router.delete('/:id', async (req, res, next) => {
  try {
    const { id } = req.params;

    if (!supabase) {
      const deleted = mockData.deleteNomination(id);
      return res.json({ success: true, deleted });
    }

    try {
      await supabase.from('nominations').delete().eq('id', id);
      res.json({ success: true, id });
    } catch (e) {
      mockData.deleteNomination(id);
      res.json({ success: true, id });
    }
  } catch (err) {
    next(err);
  }
});

module.exports = router;
