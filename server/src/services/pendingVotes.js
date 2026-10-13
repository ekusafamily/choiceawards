const fs = require('fs');
const path = require('path');

const PENDING_FILE = path.resolve(__dirname, '../db/pending_votes.json');
const PENDING_MAP = new Map();

/**
 * Load persisted pending votes from disk into memory
 */
function loadPendingVotes() {
  try {
    if (fs.existsSync(PENDING_FILE)) {
      const raw = fs.readFileSync(PENDING_FILE, 'utf8');
      const data = JSON.parse(raw);
      if (typeof data === 'object' && data !== null) {
        Object.entries(data).forEach(([ref, meta]) => {
          PENDING_MAP.set(ref, meta);
        });
        console.log(`Loaded ${PENDING_MAP.size} pending votes from disk.`);
      }
    }
  } catch (err) {
    console.error('Error loading pending_votes.json:', err.message);
  }
}

// Load on initialization
loadPendingVotes();

/**
 * Persist pending map to disk
 */
function persistPendingVotes() {
  try {
    const obj = {};
    for (const [ref, meta] of PENDING_MAP.entries()) {
      obj[ref] = meta;
    }
    fs.writeFileSync(PENDING_FILE, JSON.stringify(obj, null, 2), 'utf8');
  } catch (err) {
    console.error('Error persisting pending_votes.json:', err.message);
  }
}

function savePendingVote(reference, metadata) {
  if (!reference) return;
  PENDING_MAP.set(reference, metadata);
  persistPendingVotes();
}

function getPendingVote(reference) {
  if (!reference) return null;
  if (PENDING_MAP.has(reference)) {
    return PENDING_MAP.get(reference);
  }
  // Fallback to disk read
  try {
    if (fs.existsSync(PENDING_FILE)) {
      const raw = fs.readFileSync(PENDING_FILE, 'utf8');
      const data = JSON.parse(raw);
      if (data && data[reference]) {
        PENDING_MAP.set(reference, data[reference]);
        return data[reference];
      }
    }
  } catch (err) {
    // Ignore
  }
  return null;
}

function removePendingVote(reference) {
  if (!reference) return;
  PENDING_MAP.delete(reference);
  persistPendingVotes();
}

module.exports = {
  savePendingVote,
  getPendingVote,
  removePendingVote,
};
