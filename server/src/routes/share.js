const express = require('express');
const supabase = require('../config/supabase');

const router = express.Router();

function escapeHtml(str) {
  if (!str) return '';
  return String(str)
    .replace(/&/g, '&amp;')
    .replace(/"/g, '&quot;')
    .replace(/'/g, '&#39;')
    .replace(/</g, '&lt;')
    .replace(/>/g, '&gt;');
}

function getImageType(url) {
  if (!url) return 'image/png';
  const clean = url.split('?')[0].toLowerCase();
  if (clean.endsWith('.jpg') || clean.endsWith('.jpeg')) return 'image/jpeg';
  if (clean.endsWith('.webp')) return 'image/webp';
  if (clean.endsWith('.gif')) return 'image/gif';
  return 'image/png';
}

function getClientBaseUrl(req) {
  // 1. Explicit env var if set
  if (process.env.CLIENT_URL) {
    return process.env.CLIENT_URL.replace(/\/$/, '');
  }
  // 2. Check referer / origin header
  const origin = req.get('origin');
  if (origin && origin.startsWith('http')) {
    return origin.replace(/\/$/, '');
  }
  // 3. Fallback based on host or localhost
  const host = req.get('host') || '';
  if (host.includes('localhost') || host.includes('127.0.0.1')) {
    return 'http://localhost:3000';
  }
  return `https://${host}`;
}

async function renderNomineeSharePage(req, res) {
  try {
    const { id } = req.params;

    if (!id) {
      return res.status(400).send('Nominee ID is required.');
    }

    const clientBase = getClientBaseUrl(req);
    const fallbackImage = `${clientBase}/dekutso-logo.png`;

    if (!supabase) {
      return res.redirect(`${clientBase}/nominees/${id}`);
    }

    // Fetch nominee and their category from Supabase
    const { data: nominee, error } = await supabase
      .from('nominees')
      .select('id, name, course, year_of_study, photo_url, total_points, bio, categories(name, slug)')
      .eq('id', id)
      .single();

    if (error || !nominee) {
      console.warn(`Nominee share lookup not found for ID: ${id}`);
      return res.redirect(`${clientBase}/nominees`);
    }

    const nomineeName = nominee.name || 'Nominee';
    const categoryName = nominee.categories?.name || 'Award Category';
    const course = nominee.course ? ` (${nominee.course})` : '';
    const points = (nominee.total_points || 0).toLocaleString();

    // Priority: Bucket image url from nominee, or fallback to DeKUTSO logo
    const photoUrl = nominee.photo_url || fallbackImage;
    const imageType = getImageType(photoUrl);

    const pageTitle = `Vote for ${nomineeName} • ${categoryName} | DeKUTSO Comrade Choice Award`;
    const shareTitle = `Vote for ${nomineeName} • ${categoryName}`;
    const shareDescription = `Support ${nomineeName}${course} with ${points} points in the DeKUTSO Comrade Choice Award 2026. Tap to view profile & cast your M-Pesa vote!`;
    const targetUrl = `${clientBase}/nominees/${nominee.id}`;

    // Return rich HTML with full OpenGraph / Twitter Cards for WhatsApp, X, Facebook, LinkedIn, Discord, etc.
    const html = `<!DOCTYPE html>
<html lang="en">
<head>
  <meta charset="UTF-8">
  <meta name="viewport" content="width=device-width, initial-scale=1.0">

  <title>${escapeHtml(pageTitle)}</title>
  <meta name="description" content="${escapeHtml(shareDescription)}">

  <!-- OpenGraph Metadata (WhatsApp, Facebook, LinkedIn, Discord, Telegram, iMessage) -->
  <meta property="og:site_name" content="DeKUTSO Comrade Choice Award 2026">
  <meta property="og:type" content="profile">
  <meta property="og:url" content="${escapeHtml(targetUrl)}">
  <meta property="og:title" content="${escapeHtml(shareTitle)}">
  <meta property="og:description" content="${escapeHtml(shareDescription)}">
  <meta property="og:image" content="${escapeHtml(photoUrl)}">
  <meta property="og:image:secure_url" content="${escapeHtml(photoUrl)}">
  <meta property="og:image:type" content="${escapeHtml(imageType)}">
  <meta property="og:image:width" content="1200">
  <meta property="og:image:height" content="630">
  <meta property="og:image:alt" content="Photo of ${escapeHtml(nomineeName)}">

  <!-- Twitter / X Cards -->
  <meta name="twitter:card" content="summary_large_image">
  <meta name="twitter:site" content="@DeKUTSO">
  <meta name="twitter:url" content="${escapeHtml(targetUrl)}">
  <meta name="twitter:title" content="${escapeHtml(shareTitle)}">
  <meta name="twitter:description" content="${escapeHtml(shareDescription)}">
  <meta name="twitter:image" content="${escapeHtml(photoUrl)}">
  <meta name="twitter:image:alt" content="Photo of ${escapeHtml(nomineeName)}">

  <!-- Immediate Client Redirection for Humans -->
  <script>
    window.location.replace(${JSON.stringify(targetUrl)});
  </script>
  <meta http-equiv="refresh" content="0;url=${escapeHtml(targetUrl)}">

  <style>
    * { box-sizing: border-box; }
    body {
      margin: 0;
      padding: 24px;
      font-family: -apple-system, BlinkMacSystemFont, "Segoe UI", Roboto, Helvetica, Arial, sans-serif;
      background: radial-gradient(circle at top, #14532d 0%, #06240d 100%);
      color: #ffffff;
      display: flex;
      flex-direction: column;
      align-items: center;
      justify-content: center;
      min-height: 100vh;
      text-align: center;
    }
    .card {
      max-width: 440px;
      width: 100%;
      background: rgba(255, 255, 255, 0.08);
      border: 1px solid rgba(212, 160, 23, 0.4);
      border-radius: 20px;
      padding: 36px 24px;
      box-shadow: 0 16px 40px rgba(0, 0, 0, 0.6);
      backdrop-filter: blur(12px);
    }
    .avatar {
      width: 150px;
      height: 150px;
      object-fit: cover;
      border-radius: 50%;
      border: 3.5px solid #d4a017;
      box-shadow: 0 6px 20px rgba(0, 0, 0, 0.5);
      margin: 0 auto 20px;
      display: block;
    }
    .badge {
      display: inline-block;
      padding: 4px 12px;
      border-radius: 9999px;
      background: rgba(212, 160, 23, 0.2);
      border: 1px solid rgba(212, 160, 23, 0.5);
      color: #d4a017;
      font-size: 0.82rem;
      font-weight: 700;
      text-transform: uppercase;
      letter-spacing: 0.5px;
      margin-bottom: 12px;
    }
    h1 {
      margin: 0 0 8px;
      font-size: 1.45rem;
      color: #ffffff;
    }
    .subtitle {
      margin: 0 0 16px;
      color: rgba(255, 255, 255, 0.75);
      font-size: 0.92rem;
    }
    .vote-btn {
      display: inline-block;
      width: 100%;
      background: linear-gradient(135deg, #d4a017 0%, #b8860b 100%);
      color: #06240d;
      font-weight: 800;
      text-decoration: none;
      padding: 14px 24px;
      border-radius: 10px;
      font-size: 1rem;
      margin-top: 16px;
      box-shadow: 0 4px 14px rgba(212, 160, 23, 0.4);
      transition: transform 0.15s ease;
    }
    .vote-btn:hover {
      transform: translateY(-2px);
    }
  </style>
</head>
<body>
  <div class="card">
    <img src="${escapeHtml(photoUrl)}" alt="${escapeHtml(nomineeName)}" class="avatar" />
    <span class="badge">${escapeHtml(categoryName)}</span>
    <h1>${escapeHtml(nomineeName)}</h1>
    <p class="subtitle">${escapeHtml(nominee.course || 'DeKUT Student')}</p>
    <a href="${escapeHtml(targetUrl)}" class="vote-btn">
      Vote for ${escapeHtml(nomineeName.split(' ')[0])} Now
    </a>
  </div>
</body>
</html>`;

    res.setHeader('Content-Type', 'text/html; charset=utf-8');
    return res.status(200).send(html);
  } catch (err) {
    console.error('Error serving nominee share preview:', err);
    const clientBase = getClientBaseUrl(req);
    return res.redirect(`${clientBase}/nominees`);
  }
}

// Routes
router.get('/nominee/:id', renderNomineeSharePage);
router.get('/:id', renderNomineeSharePage);

module.exports = router;
