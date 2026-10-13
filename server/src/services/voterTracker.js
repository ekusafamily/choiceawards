const fs = require('fs');
const path = require('path');
const supabase = require('../config/supabase');

const STORAGE_FILE = path.resolve(__dirname, '../db/category_votes.json');

// In-memory set of `${email}:${category_id}` for O(1) checks
const VOTED_SET = new Set();
// Map of email -> Array of category_ids
const VOTER_CATEGORIES = new Map();

/**
 * Validate DeKUT Student Institutional Email format:
 * Format: xxxxxxx.xxxxxxRR@students.ac.ke where RR is admission year (20 to 26)
 * Examples: john.doe22@students.ac.ke, abigael.uhuru24@students.ac.ke, grace.wanjiku20@students.ac.ke
 */
function validateStudentEmail(email) {
  if (!email || typeof email !== 'string') {
    return { valid: false, message: 'DeKUT student email is required.' };
  }

  const cleaned = email.trim().toLowerCase();

  // Domain check: must be @students.ac.ke or @students.dekut.ac.ke
  const validDomain = cleaned.endsWith('@students.ac.ke') || cleaned.endsWith('@students.dekut.ac.ke');
  if (!validDomain) {
    return {
      valid: false,
      message: 'Email must be your official student email ending in @students.ac.ke',
    };
  }

  const username = cleaned.split('@')[0];

  // Regex matching username ending with admission year 20 through 26 (e.g. 20, 21, 22, 23, 24, 25, 26)
  // Allows formats like firstname.lastname22, first.middle.last23, or firstname24
  const regex = /^[a-z0-9]+(?:\.[a-z0-9]+)*\.?(2[0-6])$/i;

  if (!regex.test(username)) {
    return {
      valid: false,
      message: 'Email must end with your admission year between 20 and 26 (e.g. firstname.lastname22@students.ac.ke).',
    };
  }

  return { valid: true, email: cleaned };
}

/**
 * Load persisted votes from disk into memory
 */
function loadPersistedVotes() {
  try {
    if (fs.existsSync(STORAGE_FILE)) {
      const raw = fs.readFileSync(STORAGE_FILE, 'utf8');
      const records = JSON.parse(raw);
      if (Array.isArray(records)) {
        records.forEach((rec) => {
          if (rec.email && rec.category_id) {
            const key = `${rec.email.toLowerCase()}:${rec.category_id}`;
            VOTED_SET.add(key);

            const email = rec.email.toLowerCase();
            const existing = VOTER_CATEGORIES.get(email) || [];
            if (!existing.includes(rec.category_id)) {
              existing.push(rec.category_id);
              VOTER_CATEGORIES.set(email, existing);
            }
          }
        });
      }
      console.log(`Loaded ${VOTED_SET.size} student category votes from disk.`);
    }
  } catch (err) {
    console.error('Error loading category_votes.json:', err.message);
  }
}

// Load on initialization
loadPersistedVotes();

/**
 * Check if a student has already voted in a specific category
 * @param {string} email
 * @param {string} categoryId
 * @returns {Promise<boolean>}
 */
async function hasVotedInCategory(email, categoryId) {
  if (!email || !categoryId) return false;
  const cleaned = email.trim().toLowerCase();
  const key = `${cleaned}:${categoryId}`;

  // 1. Fast in-memory check
  if (VOTED_SET.has(key)) {
    return true;
  }

  // 2. Disk check (ensures sync across server restarts or concurrent processes)
  try {
    if (fs.existsSync(STORAGE_FILE)) {
      const records = JSON.parse(fs.readFileSync(STORAGE_FILE, 'utf8') || '[]');
      if (Array.isArray(records)) {
        const found = records.some(
          (r) => r.email && r.email.toLowerCase() === cleaned && r.category_id === categoryId
        );
        if (found) {
          VOTED_SET.add(key);
          return true;
        }
      }
    }
  } catch (err) {
    // ignore json read err
  }

  // 3. Database check (if Supabase has voter_email column)
  try {
    if (supabase) {
      const { data, error } = await supabase
        .from('votes')
        .select('id')
        .eq('category_id', categoryId)
        .eq('voter_email', cleaned)
        .maybeSingle();

      if (!error && data) {
        VOTED_SET.add(key);
        return true;
      }
    }
  } catch (err) {
    // Column might not exist yet in Supabase schema, safe fallback
  }

  return false;
}

/**
 * Record a student's vote for a category to prevent duplicate votes
 */
async function recordCategoryVote({ email, category_id, nominee_id, amount = 10, points = 10, transaction_id }) {
  if (!email || !category_id) return;

  const cleaned = email.trim().toLowerCase();
  const key = `${cleaned}:${category_id}`;

  VOTED_SET.add(key);

  const existingCats = VOTER_CATEGORIES.get(cleaned) || [];
  if (!existingCats.includes(category_id)) {
    existingCats.push(category_id);
    VOTER_CATEGORIES.set(cleaned, existingCats);
  }

  // Persist to disk
  try {
    let records = [];
    if (fs.existsSync(STORAGE_FILE)) {
      records = JSON.parse(fs.readFileSync(STORAGE_FILE, 'utf8') || '[]');
    }

    const newRecord = {
      email: cleaned,
      category_id,
      nominee_id,
      amount,
      points,
      transaction_id,
      timestamp: new Date().toISOString(),
    };

    records.push(newRecord);

    const dir = path.dirname(STORAGE_FILE);
    if (!fs.existsSync(dir)) fs.mkdirSync(dir, { recursive: true });
    fs.writeFileSync(STORAGE_FILE, JSON.stringify(records, null, 2), 'utf8');
    console.log(`🔒 Recorded vote: ${cleaned} locked for category ${category_id}`);
  } catch (err) {
    console.error('Error saving category_votes.json:', err.message);
  }
}

/**
 * Get all category IDs a student has already voted in
 */
function getVotedCategoriesForEmail(email) {
  if (!email) return [];
  const cleaned = email.trim().toLowerCase();
  return VOTER_CATEGORIES.get(cleaned) || [];
}

module.exports = {
  validateStudentEmail,
  hasVotedInCategory,
  recordCategoryVote,
  getVotedCategoriesForEmail,
};
