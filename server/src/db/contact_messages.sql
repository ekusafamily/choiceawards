-- Comrade Choice Awards 2026 - Contact Messages Table
-- Run this in the Supabase SQL Editor to enable database storage for messages

CREATE TABLE IF NOT EXISTS contact_messages (
  id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
  name TEXT NOT NULL,
  email TEXT,
  phone TEXT,
  subject TEXT DEFAULT 'General Inquiry',
  message TEXT NOT NULL,
  status TEXT NOT NULL DEFAULT 'unread' CHECK (status IN ('unread', 'read', 'archived')),
  created_at TIMESTAMPTZ DEFAULT now()
);

-- Index for performance
CREATE INDEX IF NOT EXISTS idx_contact_messages_created_at ON contact_messages(created_at DESC);
CREATE INDEX IF NOT EXISTS idx_contact_messages_status ON contact_messages(status);

-- Enable Row Level Security
ALTER TABLE contact_messages ENABLE ROW LEVEL SECURITY;

-- Public can submit messages
CREATE POLICY "Anyone can submit contact messages" 
  ON contact_messages FOR INSERT 
  WITH CHECK (true);

-- Authenticated / Service role can view and manage messages
CREATE POLICY "Admins can view and manage contact messages" 
  ON contact_messages FOR ALL 
  USING (true);
