-- ============================================================
-- Homizgo Database Migration
-- Run this in your Supabase SQL Editor (Settings → SQL Editor)
-- Safe to run multiple times (uses IF NOT EXISTS / DO-SAFE guards)
-- ============================================================

-- 1. Add gender column to users table (if not already present)
ALTER TABLE public.users
  ADD COLUMN IF NOT EXISTS gender text DEFAULT 'male';

-- 2. Add property_for column to properties table (if not already present)
--    Values: 'male' (boys only), 'female' (girls only), 'both'
ALTER TABLE public.properties
  ADD COLUMN IF NOT EXISTS property_for text DEFAULT 'both';

-- 3. Add available column to properties table (if not already present)
ALTER TABLE public.properties
  ADD COLUMN IF NOT EXISTS available boolean DEFAULT true;

-- 4. Add interested_users column to properties (legacy array — kept for backwards compat)
ALTER TABLE public.properties
  ADD COLUMN IF NOT EXISTS interested_users uuid[] DEFAULT '{}';

-- ============================================================
-- 5. Create the proper interests table
-- ============================================================
CREATE TABLE IF NOT EXISTS public.interests (
  id          uuid DEFAULT gen_random_uuid() PRIMARY KEY,
  user_id     uuid REFERENCES public.users(id) ON DELETE CASCADE NOT NULL,
  property_id uuid REFERENCES public.properties(id) ON DELETE CASCADE NOT NULL,
  created_at  timestamp with time zone DEFAULT timezone('utc'::text, now()) NOT NULL,
  UNIQUE(user_id, property_id)
);

-- 6. Enable RLS on interests
ALTER TABLE public.interests ENABLE ROW LEVEL SECURITY;

-- Students can view their own interests
DROP POLICY IF EXISTS "Users can view own interests" ON public.interests;
CREATE POLICY "Users can view own interests"
  ON public.interests FOR SELECT
  USING (auth.uid() = user_id);

-- Property owners can view interests on their properties
DROP POLICY IF EXISTS "Owners can view interests on their properties" ON public.interests;
CREATE POLICY "Owners can view interests on their properties"
  ON public.interests FOR SELECT
  USING (
    EXISTS (
      SELECT 1 FROM public.properties
      WHERE id = public.interests.property_id
        AND owner_id = auth.uid()
    )
  );

-- Authenticated users can insert their own interests
DROP POLICY IF EXISTS "Users can add interests" ON public.interests;
CREATE POLICY "Users can add interests"
  ON public.interests FOR INSERT
  WITH CHECK (auth.uid() = user_id);

-- Users can remove their own interests
DROP POLICY IF EXISTS "Users can delete own interests" ON public.interests;
CREATE POLICY "Users can delete own interests"
  ON public.interests FOR DELETE
  USING (auth.uid() = user_id);

-- 7. Enable Realtime on interests table
ALTER PUBLICATION supabase_realtime ADD TABLE public.interests;

-- ============================================================
-- 8. Create index for fast property-based interest lookups
-- ============================================================
CREATE INDEX IF NOT EXISTS idx_interests_property_id ON public.interests(property_id);
CREATE INDEX IF NOT EXISTS idx_interests_user_id ON public.interests(user_id);
CREATE INDEX IF NOT EXISTS idx_properties_property_for ON public.properties(property_for);

-- ============================================================
-- DONE! Verify by running:
-- SELECT column_name FROM information_schema.columns WHERE table_name = 'interests';
-- SELECT column_name FROM information_schema.columns WHERE table_name = 'users' AND column_name = 'gender';
-- SELECT column_name FROM information_schema.columns WHERE table_name = 'properties' AND column_name = 'property_for';
-- ============================================================
