const express = require('express');
const router = express.Router();
const fs = require('fs');
const path = require('path');
const dotenv = require('dotenv');

/**
 * Dynamically resolves the admin password from .env first,
 * allowing instant updates without requiring server restart.
 */
function getAdminPassword() {
  try {
    const envPath = path.resolve(__dirname, '../../.env');
    if (fs.existsSync(envPath)) {
      const parsed = dotenv.parse(fs.readFileSync(envPath));
      if (parsed.ADMIN_PASSWORD) return parsed.ADMIN_PASSWORD;
      if (parsed.ADMIN_PASSCODE) return parsed.ADMIN_PASSCODE;
    }
  } catch (err) {
    console.warn('Error reading .env directly in admin route:', err.message);
  }
  return process.env.ADMIN_PASSWORD || process.env.ADMIN_PASSCODE || 'dekut2026';
}

// POST /api/admin/login
router.post('/login', (req, res) => {
  const { passcode, password } = req.body || {};
  const input = (passcode || password || '').toString().trim();
  const actualPassword = getAdminPassword().toString().trim();

  if (input && input === actualPassword) {
    return res.json({
      success: true,
      message: 'Authentication successful',
      token: 'cca_session_authenticated',
    });
  }

  return res.status(401).json({
    success: false,
    error: { message: 'Invalid administrator passcode. Please check and try again.' },
  });
});

// POST /api/admin/verify
router.post('/verify', (req, res) => {
  const { passcode, password } = req.body || {};
  const input = (passcode || password || '').toString().trim();
  const actualPassword = getAdminPassword().toString().trim();

  if (input && input === actualPassword) {
    return res.json({ success: true, valid: true });
  }

  return res.status(401).json({
    success: false,
    valid: false,
    error: { message: 'Invalid administrator passcode' },
  });
});

module.exports = router;
