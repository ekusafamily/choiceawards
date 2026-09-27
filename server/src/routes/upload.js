const express = require('express');
const multer = require('multer');
const path = require('path');
const supabase = require('../config/supabase');

const router = express.Router();

// 500KB limit
const MAX_FILE_SIZE = 500 * 1024; // 500 KB in bytes
const ALLOWED_MIME_TYPES = ['image/jpeg', 'image/png', 'image/webp', 'image/gif'];
const BUCKET_NAME = 'nominee-images';

const upload = multer({
  storage: multer.memoryStorage(),
  limits: {
    fileSize: MAX_FILE_SIZE,
  },
  fileFilter: (req, file, cb) => {
    if (!ALLOWED_MIME_TYPES.includes(file.mimetype)) {
      const err = new Error('Invalid file type. Only JPEG, PNG, WebP, and GIF images are allowed.');
      err.code = 'INVALID_FILE_TYPE';
      return cb(err, false);
    }
    cb(null, true);
  },
});

// Ensure bucket exists on startup
async function ensureBucket() {
  if (!supabase) return;
  try {
    const { data: buckets } = await supabase.storage.listBuckets();
    if (!buckets?.some((b) => b.name === BUCKET_NAME)) {
      await supabase.storage.createBucket(BUCKET_NAME, {
        public: true,
        fileSizeLimit: MAX_FILE_SIZE,
        allowedMimeTypes: ALLOWED_MIME_TYPES,
      });
      console.log(`Supabase storage bucket '${BUCKET_NAME}' created successfully.`);
    }
  } catch (err) {
    console.warn('Notice: Could not automatically verify Supabase storage bucket:', err.message);
  }
}
ensureBucket();

// POST /api/upload - Upload an image to Supabase Storage (max 500KB)
router.post('/', (req, res, next) => {
  upload.single('image')(req, res, async (err) => {
    if (err) {
      if (err.code === 'LIMIT_FILE_SIZE') {
        return res.status(400).json({
          error: {
            message: `File size exceeds the 500KB limit. Please choose an image smaller than 500KB.`,
          },
        });
      }
      if (err.code === 'INVALID_FILE_TYPE') {
        return res.status(400).json({
          error: {
            message: err.message,
          },
        });
      }
      return res.status(400).json({
        error: {
          message: err.message || 'Error processing uploaded file',
        },
      });
    }

    if (!req.file) {
      return res.status(400).json({
        error: { message: 'No image file provided. Please attach an image file.' },
      });
    }

    try {
      const ext = path.extname(req.file.originalname) || '.jpg';
      const cleanName = path.basename(req.file.originalname, ext).replace(/[^a-zA-Z0-9_-]/g, '_');
      const uniqueFilename = `nominee_${Date.now()}_${cleanName}${ext}`;

      if (supabase) {
        // Upload directly to Supabase storage bucket
        const { data, error: uploadError } = await supabase.storage
          .from(BUCKET_NAME)
          .upload(uniqueFilename, req.file.buffer, {
            contentType: req.file.mimetype,
            upsert: true,
          });

        if (uploadError) {
          console.error('Supabase storage upload error:', uploadError);
          throw uploadError;
        }

        const { data: urlData } = supabase.storage
          .from(BUCKET_NAME)
          .getPublicUrl(uniqueFilename);

        return res.status(201).json({
          success: true,
          url: urlData.publicUrl,
          path: data.path,
          filename: uniqueFilename,
          size: req.file.size,
          mimetype: req.file.mimetype,
        });
      }

      // Fallback if Supabase is offline / not yet configured: base64 data URI
      const base64 = `data:${req.file.mimetype};base64,${req.file.buffer.toString('base64')}`;
      return res.status(201).json({
        success: true,
        url: base64,
        filename: uniqueFilename,
        size: req.file.size,
        mimetype: req.file.mimetype,
        note: 'Saved as data-url fallback',
      });
    } catch (uploadErr) {
      console.error('Upload handling error:', uploadErr);
      // Fallback to data URI so user flow is not broken
      const base64 = `data:${req.file.mimetype};base64,${req.file.buffer.toString('base64')}`;
      return res.status(201).json({
        success: true,
        url: base64,
        size: req.file.size,
        mimetype: req.file.mimetype,
        fallback: true,
      });
    }
  });
});

module.exports = router;
