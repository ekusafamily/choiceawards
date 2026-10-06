const express = require('express');
const fs = require('fs');
const path = require('path');
const supabase = require('../config/supabase');

const router = express.Router();

// Fallback file storage if Supabase table is not yet created
const DATA_DIR = path.resolve(__dirname, '../../data');
const FALLBACK_FILE = path.join(DATA_DIR, 'contact_messages.json');

function ensureDataDir() {
  if (!fs.existsSync(DATA_DIR)) {
    fs.mkdirSync(DATA_DIR, { recursive: true });
  }
  if (!fs.existsSync(FALLBACK_FILE)) {
    fs.writeFileSync(FALLBACK_FILE, JSON.stringify([], null, 2), 'utf8');
  }
}

function getLocalMessages() {
  try {
    ensureDataDir();
    const content = fs.readFileSync(FALLBACK_FILE, 'utf8');
    return JSON.parse(content) || [];
  } catch (err) {
    console.error('Error reading fallback contact messages:', err);
    return [];
  }
}

function saveLocalMessages(messages) {
  try {
    ensureDataDir();
    fs.writeFileSync(FALLBACK_FILE, JSON.stringify(messages, null, 2), 'utf8');
  } catch (err) {
    console.error('Error saving fallback contact messages:', err);
  }
}

// POST /api/contact - Submit a contact message (Public)
router.post('/', async (req, res, next) => {
  try {
    const { name, email, phone, contact, subject, message } = req.body || {};

    const senderName = (name || '').trim();
    const senderContact = (contact || email || phone || '').trim();
    const senderEmail = (email || '').trim() || (senderContact.includes('@') ? senderContact : null);
    const senderPhone = (phone || '').trim() || (!senderContact.includes('@') ? senderContact : null);
    const messageSubject = (subject || 'General Inquiry').trim();
    const messageBody = (message || '').trim();

    if (!senderName) {
      return res.status(400).json({ error: { message: 'Your name is required.' } });
    }
    if (!messageBody) {
      return res.status(400).json({ error: { message: 'Message content is required.' } });
    }
    if (!senderContact) {
      return res.status(400).json({ error: { message: 'Please provide an email address or phone number so we can reach you.' } });
    }

    const newMsgRecord = {
      name: senderName,
      email: senderEmail,
      phone: senderPhone,
      subject: messageSubject,
      message: messageBody,
      status: 'unread',
      created_at: new Date().toISOString(),
    };

    let savedMessage = null;
    let savedToSupabase = false;

    // Try Supabase first
    if (supabase) {
      try {
        const { data, error } = await supabase
          .from('contact_messages')
          .insert({
            name: senderName,
            email: senderEmail,
            phone: senderPhone,
            subject: messageSubject,
            message: messageBody,
            status: 'unread',
          })
          .select()
          .single();

        if (!error && data) {
          savedMessage = data;
          savedToSupabase = true;
        } else {
          console.warn('Supabase contact_messages write bypassed (table may need creation):', error?.message);
        }
      } catch (sbErr) {
        console.warn('Supabase contact_messages error:', sbErr.message);
      }
    }

    // If not saved to Supabase (or table missing), save to local JSON storage
    if (!savedToSupabase) {
      const localList = getLocalMessages();
      savedMessage = {
        id: `local-${Date.now()}-${Math.random().toString(36).substring(2, 7)}`,
        ...newMsgRecord,
      };
      localList.unshift(savedMessage);
      saveLocalMessages(localList);
    }

    return res.status(201).json({
      success: true,
      message: 'Your message has been sent successfully! The DeKUTSO Awards Committee will review it.',
      data: savedMessage,
    });
  } catch (err) {
    next(err);
  }
});

// GET /api/contact - List all messages (for admin review)
router.get('/', async (req, res, next) => {
  try {
    let messages = [];
    let fetchedFromSupabase = false;

    if (supabase) {
      try {
        const { data, error } = await supabase
          .from('contact_messages')
          .select('*')
          .order('created_at', { ascending: false });

        if (!error && Array.isArray(data)) {
          messages = data;
          fetchedFromSupabase = true;
        }
      } catch (sbErr) {
        console.warn('Supabase fetch contact_messages failed:', sbErr.message);
      }
    }

    // Merge with any local offline fallback messages
    const localMessages = getLocalMessages();
    if (!fetchedFromSupabase) {
      messages = localMessages;
    } else if (localMessages.length > 0) {
      const existingIds = new Set(messages.map((m) => m.id));
      for (const lm of localMessages) {
        if (!existingIds.has(lm.id)) {
          messages.push(lm);
        }
      }
      messages.sort((a, b) => new Date(b.created_at) - new Date(a.created_at));
    }

    return res.json(messages);
  } catch (err) {
    next(err);
  }
});

// PATCH /api/contact/:id - Update message status (read / unread / archived)
router.patch('/:id', async (req, res, next) => {
  try {
    const { id } = req.params;
    const { status } = req.body || {};

    if (!status || !['read', 'unread', 'archived'].includes(status)) {
      return res.status(400).json({ error: { message: 'Invalid status value.' } });
    }

    let updated = null;

    if (supabase && !id.startsWith('local-')) {
      try {
        const { data, error } = await supabase
          .from('contact_messages')
          .update({ status })
          .eq('id', id)
          .select()
          .single();

        if (!error && data) {
          updated = data;
        }
      } catch (sbErr) {
        console.warn('Supabase update contact_messages failed:', sbErr.message);
      }
    }

    // Also update local list if present
    const localList = getLocalMessages();
    const idx = localList.findIndex((m) => m.id === id);
    if (idx !== -1) {
      localList[idx].status = status;
      saveLocalMessages(localList);
      if (!updated) updated = localList[idx];
    }

    if (!updated) {
      updated = { id, status };
    }

    return res.json({ success: true, data: updated });
  } catch (err) {
    next(err);
  }
});

// DELETE /api/contact/:id - Delete a message
router.delete('/:id', async (req, res, next) => {
  try {
    const { id } = req.params;

    if (supabase && !id.startsWith('local-')) {
      try {
        await supabase.from('contact_messages').delete().eq('id', id);
      } catch (sbErr) {
        console.warn('Supabase delete contact_messages failed:', sbErr.message);
      }
    }

    // Also remove from local list
    const localList = getLocalMessages();
    const filtered = localList.filter((m) => m.id !== id);
    saveLocalMessages(filtered);

    return res.json({ success: true, message: 'Message deleted successfully.' });
  } catch (err) {
    next(err);
  }
});

module.exports = router;
