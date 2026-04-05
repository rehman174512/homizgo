-- ============================================================
-- 0. EXTENSIONS ──────────────────────────────────────────────
CREATE EXTENSION IF NOT EXISTS "uuid-ossp";
CREATE EXTENSION IF NOT EXISTS "pgcrypto";

-- ─── 0. CLEANUP (Optional - use if resetting) ───────────────
-- DROP TABLE IF EXISTS public.interests CASCADE;
-- DROP TABLE IF EXISTS public.reviews CASCADE;
-- DROP TABLE IF EXISTS public.chat_messages CASCADE;
-- DROP TABLE IF EXISTS public.thread_participants CASCADE;
-- DROP TABLE IF EXISTS public.chat_threads CASCADE;
-- DROP TABLE IF EXISTS public.properties CASCADE;
-- DROP TABLE IF EXISTS public.users CASCADE;

-- ─── 1. HELPER FUNCTIONS ─────────────────────────────────────

-- Avoids recursive RLS by using SECURITY DEFINER
DO $$
DECLARE
    r RECORD;
BEGIN
    -- Drop all overloads of is_thread_participant
    FOR r IN (SELECT oid::regprocedure as sig FROM pg_proc WHERE proname = 'is_thread_participant' AND pronamespace = 'public'::regnamespace) LOOP
        EXECUTE 'DROP FUNCTION ' || r.sig || ' CASCADE';
    END LOOP;
    -- Drop all overloads of delete_user
    FOR r IN (SELECT oid::regprocedure as sig FROM pg_proc WHERE proname = 'delete_user' AND pronamespace = 'public'::regnamespace) LOOP
        EXECUTE 'DROP FUNCTION ' || r.sig || ' CASCADE';
    END LOOP;
    -- Drop all overloads of delete_user_data
    FOR r IN (SELECT oid::regprocedure as sig FROM pg_proc WHERE proname = 'delete_user_data' AND pronamespace = 'public'::regnamespace) LOOP
        EXECUTE 'DROP FUNCTION ' || r.sig || ' CASCADE';
    END LOOP;
END $$;

-- ─── 1. HELPER FUNCTIONS ─────────────────────────────────────

CREATE OR REPLACE FUNCTION public.is_thread_participant(p_thread_id uuid)
RETURNS boolean LANGUAGE sql STABLE SECURITY DEFINER AS $$
  SELECT EXISTS (
    SELECT 1 FROM public.thread_participants
    WHERE thread_id = p_thread_id AND user_id = auth.uid()
  );
$$;

-- RPC function to delete account (called from Frontend)
CREATE OR REPLACE FUNCTION public.delete_user()
RETURNS void LANGUAGE plpgsql SECURITY DEFINER AS $$
BEGIN
  IF auth.uid() IS NULL THEN
    RAISE EXCEPTION 'Not authenticated';
  END IF;

  -- 1. Explicitly delete from public tables (most have cascade, but this is safe)
  DELETE FROM public.interests WHERE user_id = auth.uid();
  DELETE FROM public.reviews WHERE user_id = auth.uid();
  DELETE FROM public.chat_messages WHERE sender_id = auth.uid();
  DELETE FROM public.thread_participants WHERE user_id = auth.uid();
  DELETE FROM public.properties WHERE owner_id = auth.uid();
  DELETE FROM public.users WHERE id = auth.uid();

  -- 2. Delete from auth.users (Security Definer handles permissions)
  DELETE FROM auth.users WHERE id = auth.uid();
END;
$$;

-- Alias for backward compatibility
CREATE OR REPLACE FUNCTION public.delete_user_data(target_user_id uuid)
RETURNS void LANGUAGE plpgsql SECURITY DEFINER AS $$
BEGIN
  DELETE FROM public.users WHERE id = target_user_id;
END;
$$;

-- ─── 2. TABLES ───────────────────────────────────────────────

-- Users Profile Table
CREATE TABLE IF NOT EXISTS public.users (
  id uuid REFERENCES auth.users ON DELETE CASCADE NOT NULL PRIMARY KEY,
  email text NOT NULL,
  name text,
  role text DEFAULT 'student', -- 'student', 'landlord', 'pgowner'
  gender text, -- 'male', 'female'
  fcm_token text, -- For push notifications
  created_at timestamp with time zone DEFAULT timezone('utc'::text, now()) NOT NULL
);

-- Ensure columns exist if table was already created in a previous run
ALTER TABLE public.users ADD COLUMN IF NOT EXISTS phone text;
ALTER TABLE public.users ADD COLUMN IF NOT EXISTS college text;
ALTER TABLE public.users ADD COLUMN IF NOT EXISTS gender text;
ALTER TABLE public.users ADD COLUMN IF NOT EXISTS fcm_token text;
ALTER TABLE public.users ADD COLUMN IF NOT EXISTS name text;
ALTER TABLE public.users ADD COLUMN IF NOT EXISTS role text;

-- Properties Table
CREATE TABLE IF NOT EXISTS public.properties (
  id uuid DEFAULT gen_random_uuid() PRIMARY KEY,
  owner_id uuid REFERENCES public.users(id) ON DELETE CASCADE NOT NULL,
  title text NOT NULL,
  location text NOT NULL,
  price numeric NOT NULL,
  type text NOT NULL, -- 'room', 'flat', 'pg'
  property_for text DEFAULT 'both', -- 'male', 'female', 'both'
  description text, -- Stores JSON extra details
  images text[] DEFAULT '{}',
  amenities text[] DEFAULT '{}',
  available boolean DEFAULT true,
  interested_users uuid[] DEFAULT '{}', -- Legacy array
  created_at timestamp with time zone DEFAULT timezone('utc'::text, now()) NOT NULL
);

-- Chat Threads
CREATE TABLE IF NOT EXISTS public.chat_threads (
  id uuid DEFAULT gen_random_uuid() PRIMARY KEY,
  property_id uuid REFERENCES public.properties(id) ON DELETE CASCADE,
  created_at timestamp with time zone DEFAULT timezone('utc'::text, now()) NOT NULL
);

-- Ensure columns exist if table was already created in a previous run
ALTER TABLE public.properties ADD COLUMN IF NOT EXISTS property_for text DEFAULT 'both';
ALTER TABLE public.properties ADD COLUMN IF NOT EXISTS amenities text[] DEFAULT '{}';
ALTER TABLE public.properties ADD COLUMN IF NOT EXISTS images text[] DEFAULT '{}';
ALTER TABLE public.properties ADD COLUMN IF NOT EXISTS available boolean DEFAULT true;
ALTER TABLE public.properties ADD COLUMN IF NOT EXISTS owner_id uuid;

-- Cleanup orphaned data before applying constraints
DELETE FROM public.properties WHERE owner_id IS NOT NULL AND owner_id NOT IN (SELECT id FROM public.users);

-- Ensure constraints are named and exist
DO $$ 
BEGIN 
  IF NOT EXISTS (SELECT 1 FROM pg_constraint WHERE conname = 'properties_owner_id_fkey') THEN
    ALTER TABLE public.properties ADD CONSTRAINT properties_owner_id_fkey FOREIGN KEY (owner_id) REFERENCES public.users(id) ON DELETE CASCADE;
  END IF;
END $$;

-- Thread Participants
CREATE TABLE IF NOT EXISTS public.thread_participants (
  thread_id uuid REFERENCES public.chat_threads(id) ON DELETE CASCADE,
  user_id uuid REFERENCES public.users(id) ON DELETE CASCADE,
  PRIMARY KEY (thread_id, user_id)
);

-- Ensure constraints exist for thread_participants
DO $$ 
BEGIN 
  IF NOT EXISTS (SELECT 1 FROM pg_constraint WHERE conname = 'thread_participants_thread_id_fkey') THEN
    ALTER TABLE public.thread_participants ADD CONSTRAINT thread_participants_thread_id_fkey FOREIGN KEY (thread_id) REFERENCES public.chat_threads(id) ON DELETE CASCADE;
  END IF;
  IF NOT EXISTS (SELECT 1 FROM pg_constraint WHERE conname = 'thread_participants_user_id_fkey') THEN
    ALTER TABLE public.thread_participants ADD CONSTRAINT thread_participants_user_id_fkey FOREIGN KEY (user_id) REFERENCES public.users(id) ON DELETE CASCADE;
  END IF;
END $$;

-- Chat Messages
CREATE TABLE IF NOT EXISTS public.chat_messages (
  id uuid DEFAULT gen_random_uuid() PRIMARY KEY,
  thread_id uuid REFERENCES public.chat_threads(id) ON DELETE CASCADE NOT NULL,
  sender_id uuid REFERENCES public.users(id) ON DELETE CASCADE NOT NULL,
  content text NOT NULL,
  is_edited boolean DEFAULT false,
  is_deleted boolean DEFAULT false,
  created_at timestamp with time zone DEFAULT timezone('utc'::text, now()) NOT NULL
);

-- Interests Table (Proper relationship)
CREATE TABLE IF NOT EXISTS public.interests (
  id uuid DEFAULT gen_random_uuid() PRIMARY KEY,
  user_id uuid REFERENCES public.users(id) ON DELETE CASCADE NOT NULL,
  property_id uuid REFERENCES public.properties(id) ON DELETE CASCADE NOT NULL,
  created_at timestamp with time zone DEFAULT timezone('utc'::text, now()) NOT NULL,
  UNIQUE(user_id, property_id)
);

-- Ensure constraints exist for interests
DO $$ 
BEGIN 
  -- Cleanup orphaned interests
  DELETE FROM public.interests WHERE user_id NOT IN (SELECT id FROM public.users);
  DELETE FROM public.interests WHERE property_id NOT IN (SELECT id FROM public.properties);

  IF NOT EXISTS (SELECT 1 FROM pg_constraint WHERE conname = 'interests_property_id_fkey') THEN
    ALTER TABLE public.interests ADD CONSTRAINT interests_property_id_fkey FOREIGN KEY (property_id) REFERENCES public.properties(id) ON DELETE CASCADE;
  END IF;
  IF NOT EXISTS (SELECT 1 FROM pg_constraint WHERE conname = 'interests_user_id_fkey') THEN
    ALTER TABLE public.interests ADD CONSTRAINT interests_user_id_fkey FOREIGN KEY (user_id) REFERENCES public.users(id) ON DELETE CASCADE;
  END IF;
END $$;

-- Reviews Table
CREATE TABLE IF NOT EXISTS public.reviews (
  id uuid DEFAULT gen_random_uuid() PRIMARY KEY,
  property_id uuid REFERENCES public.properties(id) ON DELETE CASCADE NOT NULL,
  user_id uuid REFERENCES public.users(id) ON DELETE CASCADE NOT NULL,
  rating smallint NOT NULL CHECK (rating BETWEEN 1 AND 5),
  comment text,
  created_at timestamp with time zone DEFAULT timezone('utc'::text, now()) NOT NULL,
  updated_at timestamp with time zone DEFAULT timezone('utc'::text, now()) NOT NULL,
  UNIQUE (property_id, user_id)
);

-- Ensure constraints exist for reviews
DO $$ 
BEGIN 
  -- Cleanup orphaned reviews
  DELETE FROM public.reviews WHERE user_id NOT IN (SELECT id FROM public.users);
  DELETE FROM public.reviews WHERE property_id NOT IN (SELECT id FROM public.properties);

  IF NOT EXISTS (SELECT 1 FROM pg_constraint WHERE conname = 'reviews_property_id_fkey') THEN
    ALTER TABLE public.reviews ADD CONSTRAINT reviews_property_id_fkey FOREIGN KEY (property_id) REFERENCES public.properties(id) ON DELETE CASCADE;
  END IF;
  IF NOT EXISTS (SELECT 1 FROM pg_constraint WHERE conname = 'reviews_user_id_fkey') THEN
    ALTER TABLE public.reviews ADD CONSTRAINT reviews_user_id_fkey FOREIGN KEY (user_id) REFERENCES public.users(id) ON DELETE CASCADE;
  END IF;
END $$;

-- ─── 3. REALTIME CONFIG ──────────────────────────────────────
-- Enable realtime for specified tables
-- (Publication supabase_realtime usually exists by default in some projects)
DO $$
BEGIN
  IF NOT EXISTS (SELECT 1 FROM pg_publication WHERE pubname = 'supabase_realtime') THEN
    CREATE PUBLICATION supabase_realtime;
  END IF;
END $$;

ALTER PUBLICATION supabase_realtime SET TABLE public.chat_messages, public.chat_threads, public.interests, public.reviews;

-- ─── 4. TRIGGERS ─────────────────────────────────────────────

-- Sync auth.users to public.users
CREATE OR REPLACE FUNCTION public.handle_new_user()
RETURNS trigger LANGUAGE plpgsql SECURITY DEFINER SET search_path = public AS $$
BEGIN
  INSERT INTO public.users (id, email, name, role, phone, college, gender)
  VALUES (
    new.id,
    new.email,
    new.raw_user_meta_data->>'full_name',
    COALESCE(new.raw_user_meta_data->>'role', 'student'),
    new.raw_user_meta_data->>'phone',
    new.raw_user_meta_data->>'college',
    new.raw_user_meta_data->>'gender'
  )
  ON CONFLICT (id) DO UPDATE SET
    email = EXCLUDED.email,
    name = EXCLUDED.name,
    role = EXCLUDED.role,
    phone = EXCLUDED.phone,
    college = EXCLUDED.college,
    gender = EXCLUDED.gender;
  RETURN new;
END;
$$;

-- Sync existing users (one-time)
INSERT INTO public.users (id, email, name, role, phone, college, gender)
SELECT 
  id, 
  email, 
  raw_user_meta_data->>'full_name', 
  COALESCE(raw_user_meta_data->>'role', 'student'),
  raw_user_meta_data->>'phone',
  raw_user_meta_data->>'college',
  raw_user_meta_data->>'gender'
FROM auth.users
ON CONFLICT (id) DO UPDATE SET
  email = EXCLUDED.email,
  name = EXCLUDED.name,
  role = EXCLUDED.role,
  phone = EXCLUDED.phone,
  college = EXCLUDED.college,
  gender = EXCLUDED.gender;

-- Auto-update updated_at on review edit
CREATE OR REPLACE FUNCTION public.handle_review_updated_at()
RETURNS TRIGGER LANGUAGE plpgsql AS $$
BEGIN
  NEW.updated_at = timezone('utc'::text, now());
  RETURN NEW;
END;
$$;

DROP TRIGGER IF EXISTS on_review_updated ON public.reviews;
CREATE TRIGGER on_review_updated
  BEFORE UPDATE ON public.reviews
  FOR EACH ROW EXECUTE PROCEDURE public.handle_review_updated_at();

-- ─── 5. ROW LEVEL SECURITY (RLS) ─────────────────────────────

ALTER TABLE public.users ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.properties ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.chat_threads ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.thread_participants ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.chat_messages ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.interests ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.reviews ENABLE ROW LEVEL SECURITY;

-- Users Policies
DROP POLICY IF EXISTS "Users can view own profile" ON public.users;
CREATE POLICY "Users can view own profile" ON public.users FOR SELECT USING (auth.uid() = id);
DROP POLICY IF EXISTS "Users can update own profile" ON public.users;
CREATE POLICY "Users can update own profile" ON public.users FOR UPDATE USING (auth.uid() = id);
DROP POLICY IF EXISTS "Authenticated users can view all profiles" ON public.users;
CREATE POLICY "Authenticated users can view all profiles" ON public.users FOR SELECT USING (auth.role() = 'authenticated');

-- Properties Policies
DROP POLICY IF EXISTS "Anyone can view properties" ON public.properties;
CREATE POLICY "Anyone can view properties" ON public.properties FOR SELECT USING (true);
DROP POLICY IF EXISTS "Owners can insert properties" ON public.properties;
CREATE POLICY "Owners can insert properties" ON public.properties FOR INSERT WITH CHECK (auth.uid() = owner_id);
DROP POLICY IF EXISTS "Owners can update own properties" ON public.properties;
CREATE POLICY "Owners can update own properties" ON public.properties FOR UPDATE USING (auth.uid() = owner_id);
DROP POLICY IF EXISTS "Owners can delete own properties" ON public.properties;
CREATE POLICY "Owners can delete own properties" ON public.properties FOR DELETE USING (auth.uid() = owner_id);

-- Chat Policies (Using security definer helper to avoid recursion)
DROP POLICY IF EXISTS "Users can view threads they are in" ON public.chat_threads;
CREATE POLICY "Users can view threads they are in" ON public.chat_threads FOR SELECT USING (public.is_thread_participant(id));
DROP POLICY IF EXISTS "Users can insert threads" ON public.chat_threads;
CREATE POLICY "Users can insert threads" ON public.chat_threads FOR INSERT WITH CHECK (auth.role() = 'authenticated');
DROP POLICY IF EXISTS "Users can delete threads they are in" ON public.chat_threads;
CREATE POLICY "Users can delete threads they are in" ON public.chat_threads FOR DELETE USING (public.is_thread_participant(id));

DROP POLICY IF EXISTS "Users can view participants for their threads" ON public.thread_participants;
CREATE POLICY "Users can view participants for their threads" ON public.thread_participants FOR SELECT USING (public.is_thread_participant(thread_id));
DROP POLICY IF EXISTS "Users can add participants" ON public.thread_participants;
CREATE POLICY "Users can add participants" ON public.thread_participants FOR INSERT WITH CHECK (auth.role() = 'authenticated');
DROP POLICY IF EXISTS "Users can delete their own participation" ON public.thread_participants;
CREATE POLICY "Users can delete their own participation" ON public.thread_participants FOR DELETE USING (user_id = auth.uid());

DROP POLICY IF EXISTS "Users can view messages in their threads" ON public.chat_messages;
CREATE POLICY "Users can view messages in their threads" ON public.chat_messages FOR SELECT USING (public.is_thread_participant(thread_id));
DROP POLICY IF EXISTS "Users can insert messages in their threads" ON public.chat_messages;
CREATE POLICY "Users can insert messages in their threads" ON public.chat_messages FOR INSERT WITH CHECK (auth.uid() = sender_id AND public.is_thread_participant(thread_id));
DROP POLICY IF EXISTS "Users can update own messages" ON public.chat_messages;
CREATE POLICY "Users can update own messages" ON public.chat_messages FOR UPDATE USING (auth.uid() = sender_id);
DROP POLICY IF EXISTS "Users can delete messages in their threads" ON public.chat_messages;
CREATE POLICY "Users can delete messages in their threads" ON public.chat_messages FOR DELETE USING (public.is_thread_participant(thread_id));

-- Interests Policies
DROP POLICY IF EXISTS "Users can view own interests" ON public.interests;
CREATE POLICY "Users can view own interests" ON public.interests FOR SELECT USING (auth.uid() = user_id);
DROP POLICY IF EXISTS "Owners can view interests on their properties" ON public.interests;
CREATE POLICY "Owners can view interests on their properties" ON public.interests FOR SELECT USING (EXISTS (SELECT 1 FROM public.properties WHERE id = public.interests.property_id AND owner_id = auth.uid()));
DROP POLICY IF EXISTS "Users can add interests" ON public.interests;
CREATE POLICY "Users can add interests" ON public.interests FOR INSERT WITH CHECK (auth.uid() = user_id);
DROP POLICY IF EXISTS "Users can delete own interests" ON public.interests;
CREATE POLICY "Users can delete own interests" ON public.interests FOR DELETE USING (auth.uid() = user_id);

-- Reviews Policies
DROP POLICY IF EXISTS "Anyone can read reviews" ON public.reviews;
CREATE POLICY "Anyone can read reviews" ON public.reviews FOR SELECT USING (true);
DROP POLICY IF EXISTS "Users can insert own review" ON public.reviews;
CREATE POLICY "Users can insert own review" ON public.reviews FOR INSERT WITH CHECK (auth.uid() = user_id);
DROP POLICY IF EXISTS "Users can update own review" ON public.reviews;
CREATE POLICY "Users can update own review" ON public.reviews FOR UPDATE USING (auth.uid() = user_id);
DROP POLICY IF EXISTS "Users can delete own review" ON public.reviews;
CREATE POLICY "Users can delete own review" ON public.reviews FOR DELETE USING (auth.uid() = user_id);

-- ─── 6. INDICES ──────────────────────────────────────────────
CREATE INDEX IF NOT EXISTS idx_interests_property_id ON public.interests(property_id);
CREATE INDEX IF NOT EXISTS idx_interests_user_id ON public.interests(user_id);
CREATE INDEX IF NOT EXISTS idx_properties_property_for ON public.properties(property_for);
CREATE INDEX IF NOT EXISTS idx_chat_messages_thread_id ON public.chat_messages(thread_id);

-- ─── DONE ───────────────────────────────────────────────────
