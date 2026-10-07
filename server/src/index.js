require('dotenv').config();
const path = require('path');
const fs = require('fs');
const express = require('express');
const cors = require('cors');
const errorHandler = require('./middleware/errorHandler');

const categoriesRouter = require('./routes/categories');
const nomineesRouter = require('./routes/nominees');
const nominationsRouter = require('./routes/nominations');
const votesRouter = require('./routes/votes');
const leaderboardRouter = require('./routes/leaderboard');
const statsRouter = require('./routes/stats');
const uploadRouter = require('./routes/upload');
const adminRouter = require('./routes/admin');
const shareRouter = require('./routes/share');
const contactRouter = require('./routes/contact');
const sitemapRouter = require('./routes/sitemap');

const app = express();
const PORT = process.env.PORT || 5000;

// Path to client dist build
function getClientDistDir() {
  const candidates = [
    path.resolve(__dirname, '../../client/dist'),
    path.resolve(process.cwd(), '../client/dist'),
    path.resolve(process.cwd(), 'client/dist'),
    path.resolve(process.cwd(), 'dist'),
    '/var/www/choiceawards/client/dist',
    '/home/azureuser23/dekutso/choiceawards/client/dist',
  ];
  return candidates.find(d => fs.existsSync(path.join(d, 'index.html'))) || null;
}

const clientDistDir = getClientDistDir();

// Middleware
app.use(cors());
app.use(express.json());

// Google Search indexing routes (/sitemap.xml and /robots.txt)
app.use('/', sitemapRouter);
app.use('/api', sitemapRouter);

// Serve static frontend assets if built
if (clientDistDir) {
  console.log(`Serving static client files from: ${clientDistDir}`);
  app.use(express.static(clientDistDir));
}

// Dynamic Social Media Share Previews (OpenGraph / Twitter card previews with bucket photos)
app.use('/share', shareRouter);
app.use('/api/share', shareRouter);
app.use('/nominees', shareRouter);

// API Routes
app.use('/api/categories', categoriesRouter);
app.use('/api/nominees', nomineesRouter);
app.use('/api/nominations', nominationsRouter);
app.use('/api/votes', votesRouter);
app.use('/api/leaderboard', leaderboardRouter);
app.use('/api/stats', statsRouter);
app.use('/api/upload', uploadRouter);
app.use('/api/admin', adminRouter);
app.use('/api/contact', contactRouter);
app.use('/api/messages', contactRouter);

function escapeHtml(str) {
  if (!str) return '';
  return String(str)
    .replace(/&/g, '&amp;')
    .replace(/"/g, '&quot;')
    .replace(/'/g, '&#39;')
    .replace(/</g, '&lt;')
    .replace(/>/g, '&gt;');
}

// Visual status landing page or React app for root route
app.get('/', (req, res, next) => {
  if (clientDistDir && req.query.status !== '1') {
    return res.sendFile(path.join(clientDistDir, 'index.html'));
  }
  const clientUrl = process.env.CLIENT_URL || '';
  const html = `<!DOCTYPE html>
<html lang="en">
<head>
  <meta charset="UTF-8">
  <meta name="viewport" content="width=device-width, initial-scale=1.0">
  <title>DeKUTSO Comrade Choice Awards • API Live</title>
  <style>
    * { box-sizing: border-box; margin: 0; padding: 0; }
    body {
      font-family: -apple-system, BlinkMacSystemFont, "Segoe UI", Roboto, Helvetica, Arial, sans-serif;
      background: radial-gradient(circle at top, #0f3d17 0%, #051c0a 100%);
      color: #ffffff;
      min-height: 100vh;
      display: flex;
      flex-direction: column;
      align-items: center;
      justify-content: center;
      padding: 24px;
    }
    .card {
      max-width: 480px;
      width: 100%;
      background: rgba(255, 255, 255, 0.05);
      border: 1px solid rgba(212, 160, 23, 0.35);
      border-radius: 20px;
      padding: 40px 32px;
      box-shadow: 0 20px 50px rgba(0, 0, 0, 0.6);
      backdrop-filter: blur(16px);
      text-align: center;
    }
    .status-badge {
      display: inline-flex;
      align-items: center;
      gap: 8px;
      padding: 6px 16px;
      background: rgba(34, 197, 94, 0.15);
      border: 1px solid rgba(34, 197, 94, 0.4);
      border-radius: 9999px;
      color: #4ade80;
      font-size: 0.82rem;
      font-weight: 700;
      text-transform: uppercase;
      letter-spacing: 0.5px;
      margin-bottom: 20px;
    }
    .pulse-dot {
      width: 10px;
      height: 10px;
      background: #22c55e;
      border-radius: 50%;
      box-shadow: 0 0 0 0 rgba(34, 197, 94, 0.7);
      animation: pulse 1.8s infinite;
    }
    @keyframes pulse {
      0% { transform: scale(0.95); box-shadow: 0 0 0 0 rgba(34, 197, 94, 0.7); }
      70% { transform: scale(1); box-shadow: 0 0 0 8px rgba(34, 197, 94, 0); }
      100% { transform: scale(0.95); box-shadow: 0 0 0 0 rgba(34, 197, 94, 0); }
    }
    h1 {
      font-size: 1.55rem;
      color: #ffffff;
      margin-bottom: 8px;
      font-weight: 800;
    }
    .subtitle {
      color: #d4a017;
      font-size: 0.92rem;
      font-weight: 600;
      margin-bottom: 24px;
    }
    .grid {
      display: grid;
      grid-template-columns: 1fr 1fr;
      gap: 12px;
      margin-bottom: 26px;
      text-align: left;
    }
    .item {
      background: rgba(255, 255, 255, 0.04);
      border: 1px solid rgba(255, 255, 255, 0.08);
      border-radius: 10px;
      padding: 12px 14px;
    }
    .item-label {
      font-size: 0.72rem;
      color: rgba(255, 255, 255, 0.5);
      text-transform: uppercase;
      margin-bottom: 4px;
    }
    .item-val {
      font-size: 0.92rem;
      font-weight: 700;
      color: #ffffff;
    }
    .btn {
      display: block;
      width: 100%;
      padding: 14px 20px;
      background: linear-gradient(135deg, #d4a017 0%, #b8860b 100%);
      color: #051c0a;
      font-weight: 800;
      text-decoration: none;
      border-radius: 10px;
      font-size: 0.98rem;
      box-shadow: 0 4px 14px rgba(212, 160, 23, 0.4);
      transition: transform 0.15s ease;
    }
    .btn:hover {
      transform: translateY(-2px);
    }
    .footer {
      margin-top: 24px;
      font-size: 0.76rem;
      color: rgba(255, 255, 255, 0.45);
      line-height: 1.5;
    }
  </style>
</head>
<body>
  <div class="card">
    <div class="status-badge">
      <div class="pulse-dot"></div>
      Backend Operational
    </div>
    <h1>DeKUTSO Comrade Choice Awards</h1>
    <div class="subtitle">API & Payment Processing Engine 2026</div>

    <div class="grid">
      <div class="item">
        <div class="item-label">Server Status</div>
        <div class="item-val" style="color: #4ade80;">Active (200 OK)</div>
      </div>
      <div class="item">
        <div class="item-label">Internal Port</div>
        <div class="item-val">${process.env.PORT || 5000}</div>
      </div>
      <div class="item">
        <div class="item-label">Payment Gateway</div>
        <div class="item-val" style="color: #d4a017;">PayNexus STK Push</div>
      </div>
      <div class="item">
        <div class="item-label">Health Endpoint</div>
        <div class="item-val"><a href="/api/health" style="color: #60a5fa; text-decoration: none;">/api/health</a></div>
      </div>
    </div>

    ${clientUrl ? `
    <a href="${escapeHtml(clientUrl)}" class="btn" target="_blank" rel="noopener">
      Open Live Voting Platform &rarr;
    </a>
    ` : `
    <a href="/api/health" class="btn">
      View Health Check JSON &rarr;
    </a>
    `}

    <div class="footer">
      Dedan Kimathi University of Technology Student Organization<br>
      Node.js Express Backend Service
    </div>
  </div>
</body>
</html>`;
  res.setHeader('Content-Type', 'text/html; charset=utf-8');
  res.status(200).send(html);
});

// Health check JSON endpoint
app.get('/api/health', (req, res) => {
  res.json({ status: 'ok', service: 'choiceawards-api', timestamp: new Date().toISOString() });
});

// Catch-all: SPA fallback for React Router routes (/admin, /nominees, /categories, etc.)
app.use((req, res, next) => {
  if (req.method !== 'GET') {
    return next();
  }

  if (req.path.startsWith('/api') || req.path.startsWith('/share')) {
    return next();
  }

  const currentHost = (req.get('x-forwarded-host') || req.get('host') || '').toLowerCase();
  const isExternalClient = process.env.CLIENT_URL && !process.env.CLIENT_URL.toLowerCase().includes(currentHost);

  if (isExternalClient) {
    const target = `${process.env.CLIENT_URL.replace(/\/$/, '')}${req.originalUrl}`;
    return res.redirect(302, target);
  }

  if (clientDistDir) {
    return res.sendFile(path.join(clientDistDir, 'index.html'));
  }

  next();
});

// Error handling
app.use(errorHandler);

app.listen(PORT, () => {
  console.log(`Comrade Choice Awards API running on port ${PORT}`);
});
