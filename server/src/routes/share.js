const path = require('path');
const fs = require('fs');
const express = require('express');
const supabase = require('../config/supabase');

const router = express.Router();

function getClientDistIndex() {
  const candidates = [
    path.resolve(__dirname, '../../../client/dist/index.html'),
    path.resolve(process.cwd(), '../client/dist/index.html'),
    path.resolve(process.cwd(), 'client/dist/index.html'),
    path.resolve(process.cwd(), 'dist/index.html'),
    '/var/www/choiceawards/client/dist/index.html',
    '/home/azureuser23/dekutso/choiceawards/client/dist/index.html',
  ];
  return candidates.find(p => fs.existsSync(p)) || null;
}

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

    // Check if an external client domain is configured (e.g. Render)
    const currentHost = (req.get('x-forwarded-host') || req.get('host') || '').toLowerCase();
    const isExternalClient = process.env.CLIENT_URL && !process.env.CLIENT_URL.toLowerCase().includes(currentHost);

    const isBot = isSocialCrawler(req);

    // Human visitor handling:
    if (!isBot && req.query.preview !== '1') {
      // 1. If external client domain configured, redirect there
      if (isExternalClient) {
        return res.redirect(302, `${process.env.CLIENT_URL.replace(/\/$/, '')}/nominees/${id}`);
      }

      // 2. If client/dist/index.html exists locally, serve the full React app!
      const clientIndex = getClientDistIndex();
      if (clientIndex) {
        return res.sendFile(clientIndex);
      }

      // 3. Fallback: If neither, DO NOT redirect to targetUrl (which would cause an infinite 302 loop!).
      // Instead, fall through and render the rich standalone nominee card HTML below!
    }

    if (!supabase) {
      const clientIndex = getClientDistIndex();
      if (clientIndex) return res.sendFile(clientIndex);
      return res.status(500).send('Database connection unavailable');
    }

    // Fetch nominee and their category from Supabase
    const { data: nominee, error } = await supabase
      .from('nominees')
      .select('id, category_id, name, course, year_of_study, photo_url, total_points, bio, achievements, categories(name, slug)')
      .eq('id', id)
      .single();

    if (error || !nominee) {
      console.warn(`Nominee share lookup not found for ID: ${id}`);
      const clientIndex = getClientDistIndex();
      if (clientIndex) return res.sendFile(clientIndex);
      return res.status(404).send('Nominee not found');
    }

    const nomineeName = nominee.name || 'Nominee';
    const nomineeFirstName = nomineeName.split(' ')[0] || 'Nominee';
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

    // Return rich HTML with full OpenGraph / Twitter Cards for crawlers and standalone visitors
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
    * { box-sizing: border-box; margin: 0; padding: 0; }
    body {
      padding: 24px 16px;
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
      padding: 32px 22px;
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
      margin: 0 auto 16px;
      display: block;
      background: #06240d;
    }
    .badge {
      display: inline-block;
      padding: 4px 14px;
      border-radius: 9999px;
      background: rgba(212, 160, 23, 0.2);
      border: 1px solid rgba(212, 160, 23, 0.5);
      color: #d4a017;
      font-size: 0.8rem;
      font-weight: 700;
      text-transform: uppercase;
      letter-spacing: 0.5px;
      margin-bottom: 12px;
    }
    h1 {
      margin: 0 0 6px;
      font-size: 1.55rem;
      color: #ffffff;
      font-weight: 800;
    }
    .subtitle {
      margin: 0 0 16px;
      color: rgba(255, 255, 255, 0.75);
      font-size: 0.9rem;
    }
    .points-badge {
      display: inline-flex;
      align-items: center;
      gap: 6px;
      background: rgba(255, 255, 255, 0.06);
      border: 1px solid rgba(255, 255, 255, 0.12);
      padding: 6px 14px;
      border-radius: 12px;
      margin-bottom: 20px;
      font-size: 0.9rem;
      font-weight: 700;
      color: #d4a017;
    }
    .vote-box {
      background: rgba(0, 0, 0, 0.25);
      border: 1px solid rgba(255, 255, 255, 0.1);
      border-radius: 14px;
      padding: 16px;
      margin-top: 10px;
      text-align: left;
    }
    .pkg-label {
      font-size: 0.75rem;
      text-transform: uppercase;
      letter-spacing: 0.5px;
      color: rgba(255, 255, 255, 0.6);
      margin-bottom: 8px;
      display: block;
      font-weight: 700;
    }
    .pkg-grid {
      display: grid;
      grid-template-columns: repeat(3, 1fr);
      gap: 8px;
      margin-bottom: 14px;
    }
    .pkg-btn {
      padding: 8px 4px;
      border-radius: 8px;
      border: 1.5px solid rgba(255, 255, 255, 0.15);
      background: rgba(255, 255, 255, 0.05);
      color: #ffffff;
      font-size: 0.82rem;
      font-weight: 700;
      cursor: pointer;
      text-align: center;
      transition: all 0.15s ease;
    }
    .pkg-btn.active {
      border-color: #d4a017;
      background: rgba(212, 160, 23, 0.2);
      color: #d4a017;
    }
    .phone-input {
      width: 100%;
      padding: 10px 12px;
      border-radius: 8px;
      border: 1.5px solid rgba(255, 255, 255, 0.15);
      background: rgba(0, 0, 0, 0.3);
      color: #ffffff;
      font-size: 0.9rem;
      outline: none;
      margin-bottom: 12px;
      transition: border-color 0.15s ease;
    }
    .phone-input:focus {
      border-color: #22c55e;
    }
    .vote-submit-btn {
      width: 100%;
      background: linear-gradient(135deg, #d4a017 0%, #b8860b 100%);
      color: #06240d;
      font-weight: 800;
      border: none;
      padding: 12px 18px;
      border-radius: 10px;
      font-size: 0.95rem;
      cursor: pointer;
      box-shadow: 0 4px 14px rgba(212, 160, 23, 0.4);
      transition: transform 0.15s ease;
    }
    .vote-submit-btn:disabled {
      opacity: 0.6;
      cursor: not-allowed;
    }
    .status-msg {
      margin-top: 10px;
      padding: 8px 12px;
      border-radius: 8px;
      font-size: 0.8rem;
      line-height: 1.4;
      text-align: center;
    }
    .status-info { background: rgba(59, 130, 246, 0.2); color: #93c5fd; border: 1px solid rgba(59, 130, 246, 0.4); }
    .status-success { background: rgba(34, 197, 94, 0.2); color: #86efac; border: 1px solid rgba(34, 197, 94, 0.4); }
    .status-error { background: rgba(239, 68, 68, 0.2); color: #fca5a5; border: 1px solid rgba(239, 68, 68, 0.4); }
    .share-section {
      margin-top: 18px;
      padding-top: 14px;
      border-top: 1px solid rgba(255, 255, 255, 0.12);
      text-align: left;
    }
    .share-label {
      font-size: 0.75rem;
      text-transform: uppercase;
      letter-spacing: 0.5px;
      color: rgba(255, 255, 255, 0.6);
      margin-bottom: 8px;
      display: block;
      font-weight: 700;
    }
    .share-row {
      display: flex;
      gap: 8px;
      align-items: center;
    }
    .standalone-share-btn {
      display: inline-flex;
      align-items: center;
      justify-content: center;
      gap: 7px;
      padding: 10px 14px;
      border-radius: 9px;
      font-size: 0.85rem;
      font-weight: 700;
      cursor: pointer;
      text-decoration: none;
      transition: all 0.15s ease;
      border: none;
      line-height: 1;
      font-family: inherit;
    }
    .standalone-share-btn.btn-whatsapp {
      flex: 2;
      background: linear-gradient(135deg, #25D366 0%, #128C7E 100%);
      color: #ffffff !important;
      box-shadow: 0 4px 16px rgba(37, 211, 102, 0.45);
      border: 1px solid #1EBE5D;
    }
    .standalone-share-btn.btn-whatsapp:hover {
      background: linear-gradient(135deg, #2ae06d 0%, #17a998 100%);
      box-shadow: 0 6px 22px rgba(37, 211, 102, 0.65);
      transform: translateY(-2px);
    }
    .standalone-share-btn.btn-twitter {
      background: #000000;
      color: #ffffff !important;
      border: 1px solid rgba(255, 255, 255, 0.2);
      padding: 10px 14px;
    }
    .standalone-share-btn.btn-twitter:hover {
      background: #18181B;
      transform: translateY(-2px);
      box-shadow: 0 4px 12px rgba(0, 0, 0, 0.4);
    }
    .standalone-share-btn.btn-copy {
      flex: 1.2;
      background: #ffffff;
      color: #1f2937 !important;
      border: 1px solid rgba(255, 255, 255, 0.2);
    }
    .standalone-share-btn.btn-copy:hover {
      background: #f3f4f6;
      transform: translateY(-2px);
      box-shadow: 0 4px 12px rgba(0, 0, 0, 0.15);
    }
    .explore-link {
      display: inline-block;
      margin-top: 20px;
      color: rgba(255, 255, 255, 0.6);
      text-decoration: none;
      font-size: 0.82rem;
      transition: color 0.15s ease;
    }
    .explore-link:hover {
      color: #d4a017;
    }
  </style>
</head>
<body>
  <div class="card">
    <img src="${escapeHtml(proxyImageUrl)}" alt="${escapeHtml(nomineeName)}" class="avatar" />
    <span class="badge">${escapeHtml(categoryName)}</span>
    <h1>${escapeHtml(nomineeName)}</h1>
    <p class="subtitle">${escapeHtml(nominee.course || 'DeKUT Student')}${nominee.year_of_study ? ` • ${escapeHtml(nominee.year_of_study)}` : ''}</p>
    
    <div class="points-badge">
      🏆 <span id="pts-count">${points}</span> Points
    </div>

    <!-- Direct M-Pesa Voting Form -->
    <div class="vote-box">
      <span class="pkg-label">Select Votes</span>
      <div class="pkg-grid">
        <button type="button" class="pkg-btn active" data-amount="10" data-votes="10">10 Votes<br><span style="font-size: 0.72rem; opacity: 0.7;">KES 10</span></button>
        <button type="button" class="pkg-btn" data-amount="20" data-votes="20">20 Votes<br><span style="font-size: 0.72rem; opacity: 0.7;">KES 20</span></button>
        <button type="button" class="pkg-btn" data-amount="50" data-votes="50">50 Votes<br><span style="font-size: 0.72rem; opacity: 0.7;">KES 50</span></button>
      </div>

      <span class="pkg-label">M-Pesa Phone Number</span>
      <input type="tel" id="voter-phone" class="phone-input" placeholder="07XXXXXXXX or 01XXXXXXXX" />

      <button type="button" id="vote-btn" class="vote-submit-btn">
        Pay KES 10 & Vote for ${escapeHtml(nomineeFirstName)}
      </button>

      <div id="vote-status" class="status-msg status-info" style="display: none;"></div>
    </div>

    <!-- Social Sharing Row -->
    <div class="share-section">
      <span class="share-label">Share with Comrades</span>
      <div class="share-row">
        <a href="https://wa.me/?text=${encodeURIComponent(`${shareTitle}\n${targetUrl}`)}" target="_blank" rel="noopener noreferrer" class="standalone-share-btn btn-whatsapp" id="share-whatsapp-btn">
          <svg width="18" height="18" viewBox="0 0 24 24" fill="currentColor" aria-hidden="true"><path d="M12.04 2C6.58 2 2.13 6.45 2.13 11.91C2.13 13.66 2.59 15.36 3.45 16.86L2.05 22L7.3 20.63C8.75 21.41 10.38 21.83 12.04 21.83C17.5 21.83 21.95 17.38 21.95 11.92C21.95 9.27 20.92 6.78 19.05 4.91C17.18 3.03 14.69 2 12.04 2ZM12.04 20.15C10.56 20.15 9.11 19.76 7.85 19.01L7.55 18.83L4.44 19.65L5.27 16.61L5.07 16.29C4.24 14.97 3.81 13.46 3.81 11.91C3.81 7.37 7.5 3.68 12.05 3.68C14.25 3.68 16.31 4.54 17.87 6.1C19.42 7.66 20.28 9.72 20.27 11.92C20.28 16.46 16.58 20.15 12.04 20.15ZM16.57 14.33C16.32 14.21 15.1 13.61 14.88 13.52C14.65 13.44 14.49 13.4 14.32 13.65C14.16 13.89 13.69 14.45 13.55 14.61C13.41 14.77 13.26 14.79 13.02 14.67C12.77 14.55 11.98 14.29 11.04 13.45C10.31 12.8 9.81 11.99 9.67 11.75C9.53 11.51 9.65 11.37 9.77 11.25C9.88 11.14 10.02 10.96 10.14 10.82C10.26 10.68 10.3 10.57 10.38 10.41C10.46 10.25 10.42 10.11 10.36 9.99C10.3 9.86 9.81 8.67 9.61 8.18C9.41 7.7 9.21 7.77 9.06 7.76L8.59 7.75C8.42 7.75 8.16 7.81 7.93 8.06C7.71 8.3 7.07 8.9 7.07 10.12C7.07 11.34 7.96 12.52 8.08 12.68C8.21 12.84 9.82 15.33 12.29 16.39C12.88 16.64 13.34 16.8 13.69 16.91C14.28 17.1 14.82 17.07 15.25 17.01C15.73 16.94 16.72 16.41 16.92 15.84C17.13 15.27 17.13 14.79 17.07 14.68C17.01 14.58 16.82 14.46 16.57 14.33Z"/></svg>
          Share on WhatsApp
        </a>
        <a href="https://twitter.com/intent/tweet?text=${encodeURIComponent(shareTitle)}&url=${encodeURIComponent(targetUrl)}" target="_blank" rel="noopener noreferrer" class="standalone-share-btn btn-twitter" title="Share on X">
          <svg width="14" height="14" viewBox="0 0 24 24" fill="currentColor"><path d="M18.244 2.25h3.308l-7.227 8.26 8.502 11.24H16.17l-5.214-6.817L4.99 21.75H1.68l7.73-8.835L1.254 2.25H8.08l4.713 6.231zm-1.161 17.52h1.833L7.084 4.126H5.117z"/></svg>
        </a>
        <button type="button" class="standalone-share-btn btn-copy" id="share-copy-btn" onclick="navigator.clipboard.writeText('${escapeHtml(targetUrl)}'); this.textContent = 'Copied!'; setTimeout(() => this.textContent = 'Copy Link', 2500);">
          Copy Link
        </button>
      </div>
    </div>

    <a href="/" class="explore-link">
      &larr; Explore All Categories & Leaderboards
    </a>
  </div>

  <script>
    (function() {
      let selectedAmount = 10;
      let selectedVotes = 10;
      const nomineeId = "${escapeHtml(nominee.id)}";
      const categoryId = "${escapeHtml(nominee.category_id || '')}";
      const nomineeName = "${escapeHtml(nomineeName)}";
      const nomineeFirstName = "${escapeHtml(nomineeFirstName)}";

      const pkgBtns = document.querySelectorAll('.pkg-btn');
      const phoneInput = document.getElementById('voter-phone');
      const voteBtn = document.getElementById('vote-btn');
      const statusDiv = document.getElementById('vote-status');
      const ptsCount = document.getElementById('pts-count');

      // Autofill saved phone
      try {
        const saved = localStorage.getItem('cca_voter_phone');
        if (saved) phoneInput.value = saved;
      } catch (e) {}

      pkgBtns.forEach(function(btn) {
        btn.addEventListener('click', function() {
          pkgBtns.forEach(b => b.classList.remove('active'));
          btn.classList.add('active');
          selectedAmount = parseInt(btn.getAttribute('data-amount'), 10) || 10;
          selectedVotes = parseInt(btn.getAttribute('data-votes'), 10) || 10;
          voteBtn.textContent = 'Pay KES ' + selectedAmount + ' & Vote for ' + nomineeFirstName;
        });
      });

      voteBtn.addEventListener('click', async function() {
        const phone = phoneInput.value.trim();
        if (!phone) {
          showStatus('Please enter your M-Pesa phone number.', 'error');
          return;
        }

        try { localStorage.setItem('cca_voter_phone', phone); } catch (e) {}

        voteBtn.disabled = true;
        voteBtn.textContent = 'Connecting to M-Pesa...';
        showStatus('Sending prompt of KES ' + selectedAmount + ' to ' + phone + '...', 'info');

        try {
          const res = await fetch('/api/votes/initiate', {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({
              nominee_id: nomineeId,
              category_id: categoryId,
              amount: selectedAmount,
              phone: phone,
              votes_count: selectedVotes,
              nominee_name: nomineeName
            })
          });

          const data = await res.json();
          if (!data.success || !data.reference) {
            throw new Error(data?.error?.message || 'Failed to initiate M-Pesa push.');
          }

          showStatus('📲 M-Pesa prompt sent! Enter your PIN on ' + phone + ' to confirm.', 'info');
          pollStatus(data.reference, selectedVotes);
        } catch (err) {
          showStatus(err.message || 'Payment initiation failed. Please check network.', 'error');
          voteBtn.disabled = false;
          voteBtn.textContent = 'Pay KES ' + selectedAmount + ' & Vote for ' + nomineeFirstName;
        }
      });

      function pollStatus(reference, votes) {
        let attempts = 0;
        const maxAttempts = 25;
        const interval = setInterval(async function() {
          attempts++;
          try {
            const res = await fetch('/api/votes/status/' + encodeURIComponent(reference));
            const data = await res.json();
            if (data.status === 'completed' || data.isComplete) {
              clearInterval(interval);
              showStatus('🎉 Vote confirmed! ' + (data.points || votes) + ' points credited to ' + nomineeName + '!', 'success');
              voteBtn.disabled = false;
              voteBtn.textContent = 'Vote Again for ' + nomineeFirstName;
              if (ptsCount) {
                const current = parseInt(ptsCount.textContent.replace(/,/g, ''), 10) || 0;
                ptsCount.textContent = (current + (data.points || votes)).toLocaleString();
              }
              return;
            }
            if (['failed', 'cancelled', 'expired'].includes(data.status)) {
              clearInterval(interval);
              showStatus('Payment was ' + data.status + '. Please try again.', 'error');
              voteBtn.disabled = false;
              voteBtn.textContent = 'Pay KES ' + selectedAmount + ' & Vote for ' + nomineeFirstName;
              return;
            }
          } catch (e) {}

          if (attempts >= maxAttempts) {
            clearInterval(interval);
            showStatus('PIN confirmation timeout. If you entered PIN, points will be credited automatically.', 'info');
            voteBtn.disabled = false;
            voteBtn.textContent = 'Pay KES ' + selectedAmount + ' & Vote for ' + nomineeFirstName;
          }
        }, 3000);
      }

      function showStatus(msg, type) {
        statusDiv.style.display = 'block';
        statusDiv.className = 'status-msg status-' + type;
        statusDiv.textContent = msg;
      }
    })();
  </script>
</body>
</html>`;

    res.setHeader('Content-Type', 'text/html; charset=utf-8');
    return res.status(200).send(html);
  } catch (err) {
    console.error('Error serving nominee share preview:', err);
    const clientIndex = getClientDistIndex();
    if (clientIndex) return res.sendFile(clientIndex);
    return res.status(500).send('Error loading nominee profile');
  }
}

// Routes
router.get('/nominee/:id', renderNomineeSharePage);
router.get('/:id', renderNomineeSharePage);

module.exports = router;

