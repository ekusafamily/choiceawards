-- Comrade Choice Awards 2026 - Supabase Schema
-- Run this in the Supabase SQL Editor

-- Categories table
CREATE TABLE IF NOT EXISTS categories (
  id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
  name TEXT NOT NULL,
  slug TEXT NOT NULL UNIQUE,
  type TEXT NOT NULL CHECK (type IN ('individual', 'organization')),
  display_order INT NOT NULL DEFAULT 0,
  created_at TIMESTAMPTZ DEFAULT now()
);

-- Nominees table
CREATE TABLE IF NOT EXISTS nominees (
  id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
  name TEXT NOT NULL,
  course TEXT,
  year_of_study TEXT,
  category_id UUID REFERENCES categories(id) ON DELETE CASCADE,
  photo_url TEXT,
  bio TEXT,
  achievements TEXT,
  status TEXT NOT NULL DEFAULT 'pending' CHECK (status IN ('pending', 'approved', 'rejected')),
  total_points INT NOT NULL DEFAULT 0,
  created_at TIMESTAMPTZ DEFAULT now()
);

-- Nominations table (student submissions)
CREATE TABLE IF NOT EXISTS nominations (
  id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
  nominee_name TEXT NOT NULL,
  course TEXT,
  year_of_study TEXT,
  category_id UUID REFERENCES categories(id) ON DELETE CASCADE,
  photo_url TEXT,
  short_profile TEXT,
  achievements TEXT,
  reason TEXT,
  submitted_by TEXT,
  status TEXT NOT NULL DEFAULT 'pending' CHECK (status IN ('pending', 'approved', 'rejected')),
  created_at TIMESTAMPTZ DEFAULT now()
);

-- Votes table
CREATE TABLE IF NOT EXISTS votes (
  id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
  nominee_id UUID REFERENCES nominees(id) ON DELETE CASCADE,
  category_id UUID REFERENCES categories(id) ON DELETE CASCADE,
  amount INT NOT NULL CHECK (amount >= 10),
  points INT NOT NULL,
  transaction_id TEXT,
  voter_phone TEXT,
  created_at TIMESTAMPTZ DEFAULT now()
);

-- Indexes for performance
CREATE INDEX IF NOT EXISTS idx_nominees_category ON nominees(category_id);
CREATE INDEX IF NOT EXISTS idx_nominees_status ON nominees(status);
CREATE INDEX IF NOT EXISTS idx_votes_nominee ON votes(nominee_id);
CREATE INDEX IF NOT EXISTS idx_votes_category ON votes(category_id);
CREATE INDEX IF NOT EXISTS idx_nominations_status ON nominations(status);

-- Seed categories
INSERT INTO categories (name, slug, type, display_order) VALUES
  ('Social Media Personality of the Year', 'social-media-personality', 'individual', 1),
  ('Male Student Leader of the Year', 'male-student-leader', 'individual', 2),
  ('Female Student Leader of the Year', 'female-student-leader', 'individual', 3),
  ('Male Class Representative of the Year', 'male-class-rep', 'individual', 4),
  ('Female Class Representative of the Year', 'female-class-rep', 'individual', 5),
  ('Male Sports Person of the Year', 'male-sports-person', 'individual', 6),
  ('Female Sports Person of the Year', 'female-sports-person', 'individual', 7),
  ('Best Sports Captain', 'best-sports-captain', 'individual', 8),
  ('Male Influencer of the Year', 'male-influencer', 'individual', 9),
  ('Female Influencer of the Year', 'female-influencer', 'individual', 10),
  ('Male Model of the Year', 'male-model', 'individual', 11),
  ('Female Model of the Year', 'female-model', 'individual', 12),
  ('Student Artist of the Year', 'student-artist', 'individual', 13),
  ('Association/Club Leader of the Year', 'association-club-leader', 'individual', 14),
  ('Marketer of the Year', 'marketer', 'individual', 15),
  ('Content Creator of the Year', 'content-creator', 'individual', 16),
  ('Photographer/Videographer of the Year', 'photographer-videographer', 'individual', 17),
  ('Campus Personality of the Year', 'campus-personality', 'individual', 18),
  ('Tech Developer of the Year', 'tech-developer', 'individual', 19),
  ('Music Artist of the Year', 'music-artist-of-the-year', 'individual', 20),
  ('Ambassador of the Year', 'ambassador-of-the-year', 'individual', 21),
  ('Association of the Year', 'association-of-year', 'organization', 22),
  ('Club of the Year', 'club-of-year', 'organization', 23),
  ('Dance Crew of the Year', 'dance-crew-of-the-year', 'organization', 24),
  ('Rapper of the Year', 'rapper-of-the-year', 'individual', 25),
  ('Poet of the Year', 'poet-of-the-year', 'individual', 26)
ON CONFLICT (slug) DO NOTHING;

-- Enable Row Level Security
ALTER TABLE categories ENABLE ROW LEVEL SECURITY;
ALTER TABLE nominees ENABLE ROW LEVEL SECURITY;
ALTER TABLE nominations ENABLE ROW LEVEL SECURITY;
ALTER TABLE votes ENABLE ROW LEVEL SECURITY;

-- Public read policies
CREATE POLICY "Categories are viewable by everyone" ON categories FOR SELECT USING (true);
CREATE POLICY "Approved nominees are viewable by everyone" ON nominees FOR SELECT USING (status = 'approved');
CREATE POLICY "Anyone can submit nominations" ON nominations FOR INSERT WITH CHECK (true);
CREATE POLICY "Anyone can submit votes" ON votes FOR INSERT WITH CHECK (true);
CREATE POLICY "Votes are viewable by everyone" ON votes FOR SELECT USING (true);

-- ============================================================
-- Supabase Storage: nominee-images bucket (500KB size limit)
-- ============================================================
INSERT INTO storage.buckets (id, name, public, file_size_limit, allowed_mime_types)
VALUES (
  'nominee-images',
  'nominee-images',
  true,
  524288, -- 500KB limit (512 * 1024 bytes)
  ARRAY['image/jpeg', 'image/png', 'image/webp', 'image/gif']
)
ON CONFLICT (id) DO UPDATE SET
  public = true,
  file_size_limit = 524288,
  allowed_mime_types = ARRAY['image/jpeg', 'image/png', 'image/webp', 'image/gif'];

-- Storage Policies for nominee-images
CREATE POLICY "Public Access for Nominee Images"
  ON storage.objects FOR SELECT
  USING (bucket_id = 'nominee-images');

CREATE POLICY "Allow public uploads for nominee images"
  ON storage.objects FOR INSERT
  WITH CHECK (bucket_id = 'nominee-images');

-- ============================================================
-- Contact Messages Table
-- ============================================================
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

CREATE INDEX IF NOT EXISTS idx_contact_messages_created_at ON contact_messages(created_at DESC);
CREATE INDEX IF NOT EXISTS idx_contact_messages_status ON contact_messages(status);

ALTER TABLE contact_messages ENABLE ROW LEVEL SECURITY;
CREATE POLICY "Anyone can submit contact messages" ON contact_messages FOR INSERT WITH CHECK (true);
CREATE POLICY "Admins can view and manage contact messages" ON contact_messages FOR ALL USING (true);


