const express = require('express');
const supabase = require('../config/supabase');

const router = express.Router();

function getBaseUrl(req) {
  if (process.env.CLIENT_URL) {
    return process.env.CLIENT_URL.replace(/\/$/, '');
  }
  const host = (req.get('x-forwarded-host') || req.get('host') || '').toLowerCase();
  if (host.includes('localhost') || host.includes('127.0.0.1')) {
    return `http://${host}`;
  }
  return 'https://dekutsochoiceawards.site';
}

// Fallback category slugs in case database connection is unreachable
const STATIC_CATEGORY_SLUGS = [
  'social-media-personality',
  'male-student-leader',
  'female-student-leader',
  'male-class-rep',
  'female-class-rep',
  'male-sports-person',
  'female-sports-person',
  'content-creator',
  'graphic-designer',
  'photographer',
  'dj-of-the-year',
  'male-model',
  'female-model',
  'innovator-tech-creator',
  'entrepreneur',
  'fashion-icon',
  'mc-host',
  'hype-man',
  'bassist',
  'keyboardist',
  'guitarist',
  'drummer',
  'ambassador-of-the-year',
  'dance-crew-of-the-year',
  'rapper-of-the-year',
  'poet-of-the-year'
];

function escapeXml(unsafe) {
  if (!unsafe) return '';
  return String(unsafe).replace(/[<>&'"]/g, (c) => {
    switch (c) {
      case '<': return '&lt;';
      case '>': return '&gt;';
      case '&': return '&amp;';
      case '\'': return '&apos;';
      case '"': return '&quot;';
      default: return c;
    }
  });
}

function formatDate(date) {
  try {
    return new Date(date).toISOString().split('T')[0];
  } catch (e) {
    return new Date().toISOString().split('T')[0];
  }
}

// Handler for dynamic XML sitemap
router.get('/sitemap.xml', async (req, res, next) => {
  try {
    const baseUrl = getBaseUrl(req);
    const today = new Date().toISOString().split('T')[0];

    // 1. Core pages
    const corePages = [
      { loc: `${baseUrl}/`, priority: '1.0', changefreq: 'daily', lastmod: today },
      { loc: `${baseUrl}/nominate`, priority: '0.9', changefreq: 'daily', lastmod: today },
      { loc: `${baseUrl}/successful-nominations`, priority: '0.85', changefreq: 'daily', lastmod: today },
      { loc: `${baseUrl}/categories`, priority: '0.85', changefreq: 'daily', lastmod: today },
      { loc: `${baseUrl}/nominees`, priority: '0.85', changefreq: 'daily', lastmod: today },
      { loc: `${baseUrl}/results`, priority: '0.80', changefreq: 'daily', lastmod: today },
    ];

    let categoryUrls = [];
    let nomineeUrls = [];

    if (supabase) {
      // 2. Fetch all categories
      const { data: categories, error: catError } = await supabase
        .from('categories')
        .select('slug, updated_at, created_at');

      if (!catError && Array.isArray(categories) && categories.length > 0) {
        categoryUrls = categories.map((cat) => ({
          loc: `${baseUrl}/categories/${encodeURIComponent(cat.slug)}`,
          priority: '0.75',
          changefreq: 'weekly',
          lastmod: formatDate(cat.updated_at || cat.created_at || today),
        }));
      }

      // 3. Fetch approved nominees
      const { data: nominees, error: nomError } = await supabase
        .from('nominees')
        .select('id, updated_at, created_at')
        .eq('status', 'approved');

      if (!nomError && Array.isArray(nominees)) {
        nomineeUrls = nominees.map((nom) => ({
          loc: `${baseUrl}/nominees/${encodeURIComponent(nom.id)}`,
          priority: '0.70',
          changefreq: 'weekly',
          lastmod: formatDate(nom.updated_at || nom.created_at || today),
        }));
      }
    }

    // Fallback if categories could not be fetched
    if (categoryUrls.length === 0) {
      categoryUrls = STATIC_CATEGORY_SLUGS.map((slug) => ({
        loc: `${baseUrl}/categories/${slug}`,
        priority: '0.75',
        changefreq: 'weekly',
        lastmod: today,
      }));
    }

    const allUrls = [...corePages, ...categoryUrls, ...nomineeUrls];

    let xml = `<?xml version="1.0" encoding="UTF-8"?>\n`;
    xml += `<urlset xmlns="http://www.sitemaps.org/schemas/sitemap/0.9"\n`;
    xml += `        xmlns:xsi="http://www.w3.org/2001/XMLSchema-instance"\n`;
    xml += `        xsi:schemaLocation="http://www.sitemaps.org/schemas/sitemap/0.9\n`;
    xml += `        http://www.sitemaps.org/schemas/sitemap/0.9/sitemap.xsd">\n`;

    for (const item of allUrls) {
      xml += `  <url>\n`;
      xml += `    <loc>${escapeXml(item.loc)}</loc>\n`;
      if (item.lastmod) xml += `    <lastmod>${item.lastmod}</lastmod>\n`;
      if (item.changefreq) xml += `    <changefreq>${item.changefreq}</changefreq>\n`;
      if (item.priority) xml += `    <priority>${item.priority}</priority>\n`;
      xml += `  </url>\n`;
    }

    xml += `</urlset>\n`;

    res.setHeader('Content-Type', 'application/xml; charset=utf-8');
    res.setHeader('Cache-Control', 'public, max-age=1800, s-maxage=3600');
    return res.status(200).send(xml);
  } catch (err) {
    console.error('Error generating dynamic sitemap:', err);
    next(err);
  }
});

// Handler for robots.txt
router.get('/robots.txt', (req, res) => {
  const baseUrl = getBaseUrl(req);
  const robots = `# robots.txt for DeKUTSO Comrade Choice Awards 2026
# ${baseUrl}

User-agent: *
Allow: /
Allow: /nominate
Allow: /successful-nominations
Allow: /categories/
Allow: /nominees/
Allow: /categories
Allow: /nominees
Allow: /results

# Protect administrative endpoints and internal APIs
Disallow: /admin
Disallow: /api/

Crawl-delay: 1

Sitemap: ${baseUrl}/sitemap.xml
`;
  res.setHeader('Content-Type', 'text/plain; charset=utf-8');
  res.setHeader('Cache-Control', 'public, max-age=86400');
  return res.status(200).send(robots);
});

module.exports = router;
