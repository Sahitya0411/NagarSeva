-- NagarSeva Database Schema
-- Run this in your Supabase SQL Editor

-- ==========================================
-- TABLE: profiles
-- ==========================================
CREATE TABLE IF NOT EXISTS profiles (
  id UUID REFERENCES auth.users ON DELETE CASCADE PRIMARY KEY,
  full_name TEXT NOT NULL,
  email TEXT NOT NULL,
  phone TEXT NOT NULL,
  city TEXT NOT NULL,
  full_address TEXT NOT NULL,
  state TEXT NOT NULL,
  pincode TEXT NOT NULL,
  aadhaar_hash TEXT,
  profile_photo_url TEXT,
  city_coins INTEGER DEFAULT 0,
  account_status TEXT DEFAULT 'active' CHECK (account_status IN ('active', 'warned', 'disabled')),
  language_preference TEXT DEFAULT 'en',
  created_at TIMESTAMPTZ DEFAULT NOW(),
  updated_at TIMESTAMPTZ DEFAULT NOW()
);

-- ==========================================
-- TABLE: complaints
-- ==========================================
CREATE TABLE IF NOT EXISTS complaints (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  complaint_number TEXT UNIQUE NOT NULL,
  citizen_id UUID REFERENCES profiles(id) ON DELETE CASCADE,
  issue_type TEXT,
  severity TEXT CHECK (severity IN ('Low', 'Medium', 'High', 'Critical')),
  description TEXT,
  voice_note_url TEXT,
  photo_urls TEXT[] DEFAULT '{}',
  location_lat DOUBLE PRECISION,
  location_lng DOUBLE PRECISION,
  location_address TEXT,
  city TEXT,
  ward TEXT,
  zone TEXT,
  dept_name TEXT,
  dept_email TEXT,
  dept_phone TEXT,
  ai_draft_email_subject TEXT,
  ai_draft_email_body TEXT,
  ai_confidence FLOAT,
  gemini_analysis JSONB,
  status TEXT DEFAULT 'submitted' CHECK (status IN (
    'submitted', 'ai_verified', 'routed', 'under_review', 'resolved', 'fraud', 'disputed'
  )),
  email_sent_at TIMESTAMPTZ,
  resolved_at TIMESTAMPTZ,
  coins_awarded BOOLEAN DEFAULT FALSE,
  fraud_flag BOOLEAN DEFAULT FALSE,
  fraud_reason TEXT,
  created_at TIMESTAMPTZ DEFAULT NOW(),
  updated_at TIMESTAMPTZ DEFAULT NOW()
);

-- ==========================================
-- TABLE: complaint_timeline
-- ==========================================
CREATE TABLE IF NOT EXISTS complaint_timeline (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  complaint_id UUID REFERENCES complaints(id) ON DELETE CASCADE,
  status TEXT NOT NULL,
  note TEXT,
  updated_by TEXT DEFAULT 'system' CHECK (updated_by IN ('citizen', 'admin', 'system')),
  created_at TIMESTAMPTZ DEFAULT NOW()
);

-- ==========================================
-- TABLE: coin_transactions
-- ==========================================
CREATE TABLE IF NOT EXISTS coin_transactions (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  citizen_id UUID REFERENCES profiles(id) ON DELETE CASCADE,
  complaint_id UUID REFERENCES complaints(id) ON DELETE SET NULL,
  type TEXT NOT NULL CHECK (type IN ('earned', 'redeemed', 'deducted')),
  amount INTEGER NOT NULL,
  description TEXT,
  created_at TIMESTAMPTZ DEFAULT NOW()
);

-- ==========================================
-- TABLE: admin_users
-- ==========================================
CREATE TABLE IF NOT EXISTS admin_users (
  id UUID REFERENCES auth.users ON DELETE CASCADE PRIMARY KEY,
  name TEXT,
  role TEXT DEFAULT 'super_admin',
  created_at TIMESTAMPTZ DEFAULT NOW()
);

-- ==========================================
-- INDEXES
-- ==========================================
CREATE INDEX IF NOT EXISTS idx_complaints_citizen ON complaints(citizen_id);
CREATE INDEX IF NOT EXISTS idx_complaints_status ON complaints(status);
CREATE INDEX IF NOT EXISTS idx_complaints_city ON complaints(city);
CREATE INDEX IF NOT EXISTS idx_complaints_created ON complaints(created_at DESC);
CREATE INDEX IF NOT EXISTS idx_complaints_location ON complaints(location_lat, location_lng);
CREATE INDEX IF NOT EXISTS idx_timeline_complaint ON complaint_timeline(complaint_id);
CREATE INDEX IF NOT EXISTS idx_coins_citizen ON coin_transactions(citizen_id);

-- ==========================================
-- ROW LEVEL SECURITY
-- ==========================================

-- Enable RLS
ALTER TABLE profiles ENABLE ROW LEVEL SECURITY;
ALTER TABLE complaints ENABLE ROW LEVEL SECURITY;
ALTER TABLE complaint_timeline ENABLE ROW LEVEL SECURITY;
ALTER TABLE coin_transactions ENABLE ROW LEVEL SECURITY;
ALTER TABLE admin_users ENABLE ROW LEVEL SECURITY;

-- Profiles: Users can only see/edit their own profile
CREATE POLICY "profiles_own_read" ON profiles
  FOR SELECT USING (auth.uid() = id);

CREATE POLICY "profiles_own_insert" ON profiles
  FOR INSERT WITH CHECK (auth.uid() = id);

CREATE POLICY "profiles_own_update" ON profiles
  FOR UPDATE USING (auth.uid() = id);

-- Admins can read all profiles
CREATE POLICY "profiles_admin_read" ON profiles
  FOR SELECT USING (
    EXISTS (SELECT 1 FROM admin_users WHERE id = auth.uid())
  );

CREATE POLICY "profiles_admin_update" ON profiles
  FOR UPDATE USING (
    EXISTS (SELECT 1 FROM admin_users WHERE id = auth.uid())
  );

-- Complaints: Citizens can read/write their own
CREATE POLICY "complaints_citizen_read" ON complaints
  FOR SELECT USING (citizen_id = auth.uid());

CREATE POLICY "complaints_citizen_insert" ON complaints
  FOR INSERT WITH CHECK (citizen_id = auth.uid());

CREATE POLICY "complaints_citizen_update" ON complaints
  FOR UPDATE USING (citizen_id = auth.uid());

-- Admins can read/update all complaints
CREATE POLICY "complaints_admin_all" ON complaints
  FOR ALL USING (
    EXISTS (SELECT 1 FROM admin_users WHERE id = auth.uid())
  );

-- Allow service role to insert/update complaints
CREATE POLICY "complaints_service_role" ON complaints
  FOR ALL USING (auth.role() = 'service_role');

-- Timeline: Citizens can read their complaint timelines
CREATE POLICY "timeline_citizen_read" ON complaint_timeline
  FOR SELECT USING (
    EXISTS (
      SELECT 1 FROM complaints
      WHERE complaints.id = complaint_id AND complaints.citizen_id = auth.uid()
    )
  );

CREATE POLICY "timeline_admin_all" ON complaint_timeline
  FOR ALL USING (
    EXISTS (SELECT 1 FROM admin_users WHERE id = auth.uid())
  );

CREATE POLICY "timeline_service_role" ON complaint_timeline
  FOR ALL USING (auth.role() = 'service_role');

-- Coin transactions: Citizens see their own
CREATE POLICY "coins_citizen_read" ON coin_transactions
  FOR SELECT USING (citizen_id = auth.uid());

CREATE POLICY "coins_admin_all" ON coin_transactions
  FOR ALL USING (
    EXISTS (SELECT 1 FROM admin_users WHERE id = auth.uid())
  );

CREATE POLICY "coins_service_role" ON coin_transactions
  FOR ALL USING (auth.role() = 'service_role');

-- Admin users: only admins can see the admin table
CREATE POLICY "admin_read_self" ON admin_users
  FOR SELECT USING (id = auth.uid());

-- ==========================================
-- FUNCTIONS
-- ==========================================

-- Auto-update updated_at on complaints
CREATE OR REPLACE FUNCTION update_updated_at()
RETURNS TRIGGER AS $$
BEGIN
  NEW.updated_at = NOW();
  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

CREATE TRIGGER complaints_updated_at
  BEFORE UPDATE ON complaints
  FOR EACH ROW EXECUTE FUNCTION update_updated_at();

CREATE TRIGGER profiles_updated_at
  BEFORE UPDATE ON profiles
  FOR EACH ROW EXECUTE FUNCTION update_updated_at();

-- ==========================================
-- SEED: Add yourself as admin
-- ==========================================
-- After creating your account via the app, run this in SQL Editor:
-- INSERT INTO admin_users (id, name, role)
-- VALUES ('<your-user-uuid>', 'Admin Name', 'super_admin');
