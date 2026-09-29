const express = require('express');
const supabase = require('../config/supabase');

const router = express.Router();

const BOT_USER_AGENTS = [
  'facebookexternalhit',
  'facebot',
  'whatsapp',
  'twitterbot',
  'linkedinbot',
  'telegrambot',
  'discordbot',
  'slackbot',
  'skypeuripreview',
  'applebot',
  'googlebot',
  'bingbot',
  'yandexbot',
  'duckduckbot',
  'vkshare',
  'w3c_validator',
  'redditbot',
  'embedly',
  'quora link preview',
  'showyoubot',
  'outbrain',
  'pinterest',
  'crawler',
  'spider',
  'bot'
];

function isSocialCrawler(req) {
  if (req.query.crawler === '1' || req.query.bot === '1') return true;
  const ua = (req.get('user-agent') || '').toLowerCase();
  return BOT_USER_AGENTS.some(bot => ua.includes(bot));
}

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

function getServerBaseUrl(req) {
  if (process.env.SERVER_URL) {
    return process.env.SERVER_URL.replace(/\/$/, '');
  }
  const proto = req.get('x-forwarded-proto') || req.protocol || 'http';
  const host = req.get('x-forwarded-host') || req.get('host') || 'localhost:5000';
  return `${proto}://${host}`;
}

function getClientBaseUrl(req) {
  if (process.env.CLIENT_URL) {
    return process.env.CLIENT_URL.replace(/\/$/, '');
  }
  const origin = req.get('origin');
  if (origin && origin.startsWith('http')) {
    return origin.replace(/\/$/, '');
  }
  const host = req.get('host') || '';
  if (host.includes('localhost') || host.includes('127.0.0.1')) {
    return 'http://localhost:3000';
  }
  // If hosted on render, frontend is typically -client when backend is -server
  if (host.includes('-server.onrender.com')) {
    return `https://${host.replace('-server.onrender.com', '-client.onrender.com')}`;
  }
  return `https://${host}`;
}

// Proxied image endpoint that strips Supabase's blocking 'x-robots-tag: none' header
router.get('/image/:id', async (req, res) => {
  try {
    const { id } = req.params;
    if (!id || !supabase) {
      return res.status(404).send('Not found');
    }

    const { data: nominee, error } = await supabase
      .from('nominees')
      .select('photo_url')
      .eq('id', id)
      .single();

    if (error || !nominee || !nominee.photo_url) {
      return res.status(404).send('Image not found');
    }

    // Handle base64 fallback
    if (nominee.photo_url.startsWith('data:')) {
      const matches = nominee.photo_url.match(/^data:([A-Za-z-+\/]+);base64,(.+)$/);
      if (matches && matches.length === 3) {
        const mime = matches[1];
        const buffer = Buffer.from(matches[2], 'base64');
        res.setHeader('Content-Type', mime);
        res.setHeader('Cache-Control', 'public, max-age=86400, s-maxage=86400');
        res.setHeader('Access-Control-Allow-Origin', '*');
        res.setHeader('X-Robots-Tag', 'all');
        return res.send(buffer);
      }
    }

    // Fetch the bucket image from Supabase
    const upstreamRes = await fetch(nominee.photo_url);
    if (!upstreamRes.ok) {
      return res.redirect(nominee.photo_url);
    }

    const contentType = upstreamRes.headers.get('content-type') || getImageType(nominee.photo_url);
    const arrayBuffer = await upstreamRes.arrayBuffer();
    const buffer = Buffer.from(arrayBuffer);

    res.setHeader('Content-Type', contentType);
    res.setHeader('Cache-Control', 'public, max-age=86400, s-maxage=86400');
    res.setHeader('Access-Control-Allow-Origin', '*');
    // Crucial: Supabase storage returns 'x-robots-tag: none', which makes WhatsApp / Twitter reject the image!
    // We override it with 'all' so preview crawlers always render it:
    res.setHeader('X-Robots-Tag', 'all');
    return res.send(buffer);
  } catch (err) {
    console.error('Error serving nominee proxy image:', err);
    return res.status(500).send('Error loading image');
  }
});

async function renderNomineeSharePage(req, res) {
  try {
    const { id } = req.params;

    if (!id) {
      return res.status(400).send('Nominee ID is required.');
    }

    const clientBase = getClientBaseUrl(req);
    const serverBase = getServerBaseUrl(req);
    const targetUrl = `${clientBase}/nominees/${id}`;

    if (!supabase) {
      return res.redirect(302, targetUrl);
    }

    // Fetch nominee and their category from Supabase
    const { data: nominee, error } = await supabase
      .from('nominees')
      .select('id, name, course, year_of_study, photo_url, total_points, bio, categories(name, slug)')
      .eq('id', id)
      .single();

    if (error || !nominee) {
      console.warn(`Nominee share lookup not found for ID: ${id}`);
      return res.redirect(302, `${clientBase}/nominees`);
    }

    // Human visitor (regular browser): redirect immediately to frontend profile page
    const isBot = isSocialCrawler(req);
    if (!isBot && req.query.preview !== '1') {
      return res.redirect(302, targetUrl);
    }

    const nomineeName = nominee.name || 'Nominee';
    const categoryName = nominee.categories?.name || 'Award Category';
    const course = nominee.course ? ` (${nominee.course})` : '';
    const points = (nominee.total_points || 0).toLocaleString();

    // Use our server proxy URL which cleanses the x-robots-tag header
    const proxyImageUrl = `${serverBase}/share/image/${nominee.id}`;
    const directPhotoUrl = (nominee.photo_url && !nominee.photo_url.startsWith('data:'))
      ? nominee.photo_url
      : proxyImageUrl;

    const imageType = getImageType(nominee.photo_url || proxyImageUrl);

    const pageTitle = `Vote for ${nomineeName} • ${categoryName} | DeKUTSO Comrade Choice Award`;
    const shareTitle = `Vote for ${nomineeName} • ${categoryName}`;
    const shareDescription = `Support ${nomineeName}${course} with ${points} points in the DeKUTSO Comrade Choice Award 2026. Cast your M-Pesa vote!`;

    // Return rich HTML with full OpenGraph / Twitter Cards for crawlers
    // NOTE: NO meta refresh or JS redirect here so crawlers will NOT abandon the page!
    const html = `<!DOCTYPE html>
<html lang="en" prefix="og: https://ogp.me/ns#">
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
  <meta property="og:image" content="${escapeHtml(proxyImageUrl)}">
  <meta property="og:image:secure_url" content="${escapeHtml(proxyImageUrl)}">
  <meta property="og:image:type" content="${escapeHtml(imageType)}">
  <meta property="og:image:width" content="1200">
  <meta property="og:image:height" content="630">
  <meta property="og:image:alt" content="Photo of ${escapeHtml(nomineeName)}">

  <!-- Fallback direct storage image -->
  <meta property="og:image" content="${escapeHtml(directPhotoUrl)}">

  <!-- Legacy & WhatsApp crawler fallback link tag -->
  <link rel="image_src" href="${escapeHtml(proxyImageUrl)}">

  <!-- Twitter / X Cards -->
  <meta name="twitter:card" content="summary_large_image">
  <meta name="twitter:site" content="@DeKUTSO">
  <meta name="twitter:url" content="${escapeHtml(targetUrl)}">
  <meta name="twitter:title" content="${escapeHtml(shareTitle)}">
  <meta name="twitter:description" content="${escapeHtml(shareDescription)}">
  <meta name="twitter:image" content="${escapeHtml(proxyImageUrl)}">
  <meta name="twitter:image:alt" content="Photo of ${escapeHtml(nomineeName)}">

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
      width: 160px;
      height: 160px;
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
    }
  </style>
</head>
<body>
  <div class="card">
    <img src="${escapeHtml(proxyImageUrl)}" alt="${escapeHtml(nomineeName)}" class="avatar" />
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
    return res.redirect(302, `${clientBase}/nominees`);
  }
}

// Routes
router.get('/nominee/:id', renderNomineeSharePage);
router.get('/:id', renderNomineeSharePage);

module.exports = router;
