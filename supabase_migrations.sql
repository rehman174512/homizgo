-- ============================================================
-- Homizgo SQL Migrations
-- Run this ONCE in your Supabase SQL Editor
-- Safe to run multiple times (uses IF NOT EXISTS / OR REPLACE)
-- ============================================================

-- ─── 1. USERS TABLE: Add gender column ───────────────────────
ALTER TABLE public.users
  ADD COLUMN IF NOT EXISTS gender text; -- 'male' | 'female' | null

-- ─── 2. PROPERTIES TABLE: Add property_for column ────────────
ALTER TABLE public.properties
  ADD COLUMN IF NOT EXISTS property_for text DEFAULT 'both'; -- 'male' | 'female' | 'both'

-- ─── 3. CHAT MESSAGES TABLE: Soft edit/delete columns ─────────
ALTER TABLE public.chat_messages
  ADD COLUMN IF NOT EXISTS is_edited boolean DEFAULT false;
ALTER TABLE public.chat_messages
  ADD COLUMN IF NOT EXISTS is_deleted boolean DEFAULT false;

-- Allow message owners to update their own messages (for edit + soft delete)
DO $$
BEGIN
  IF NOT EXISTS (
    SELECT 1 FROM pg_policies
    WHERE schemaname = 'public'
      AND tablename = 'chat_messages'
      AND policyname = 'Users can update own messages'
  ) THEN
    CREATE POLICY "Users can update own messages" ON public.chat_messages
      FOR UPDATE USING (auth.uid() = sender_id);
  END IF;
END
$$;

-- Allow message owners (and thread members) to hard-delete own messages
DO $$
BEGIN
  IF NOT EXISTS (
    SELECT 1 FROM pg_policies
    WHERE schemaname = 'public'
      AND tablename = 'chat_messages'
      AND policyname = 'Users can delete own messages'
  ) THEN
    CREATE POLICY "Users can delete own messages" ON public.chat_messages
      FOR DELETE USING (auth.uid() = sender_id);
  END IF;
END
$$;

-- Allow thread members to delete threads they own (already handled by RLS + cascade)
DO $$
BEGIN
  IF NOT EXISTS (
    SELECT 1 FROM pg_policies
    WHERE schemaname = 'public'
      AND tablename = 'chat_threads'
      AND policyname = 'Users can delete threads they are in'
  ) THEN
    CREATE POLICY "Users can delete threads they are in" ON public.chat_threads
      FOR DELETE USING (
        EXISTS (
          SELECT 1 FROM public.thread_participants
          WHERE thread_id = public.chat_threads.id
            AND user_id = auth.uid()
        )
      );
  END IF;
END
$$;

-- ─── 4. REVIEWS TABLE ─────────────────────────────────────────
CREATE TABLE IF NOT EXISTS public.reviews (
  id          uuid DEFAULT gen_random_uuid() PRIMARY KEY,
  property_id uuid REFERENCES public.properties(id) ON DELETE CASCADE NOT NULL,
  user_id     uuid REFERENCES public.users(id) ON DELETE CASCADE NOT NULL,
  rating      smallint NOT NULL CHECK (rating BETWEEN 1 AND 5),
  comment     text,
  created_at  timestamp with time zone DEFAULT timezone('utc'::text, now()) NOT NULL,
  updated_at  timestamp with time zone DEFAULT timezone('utc'::text, now()) NOT NULL,
  -- One review per user per property
  UNIQUE (property_id, user_id)
);

ALTER TABLE public.reviews ENABLE ROW LEVEL SECURITY;

-- Anyone can read reviews
DO $$
BEGIN
  IF NOT EXISTS (
    SELECT 1 FROM pg_policies
    WHERE schemaname = 'public'
      AND tablename = 'reviews'
      AND policyname = 'Anyone can read reviews'
  ) THEN
    CREATE POLICY "Anyone can read reviews" ON public.reviews
      FOR SELECT USING (true);
  END IF;
END
$$;

-- Authenticated users can insert their own review
DO $$
BEGIN
  IF NOT EXISTS (
    SELECT 1 FROM pg_policies
    WHERE schemaname = 'public'
      AND tablename = 'reviews'
      AND policyname = 'Users can insert own review'
  ) THEN
    CREATE POLICY "Users can insert own review" ON public.reviews
      FOR INSERT WITH CHECK (auth.uid() = user_id);
  END IF;
END
$$;

-- Users can update their own review
DO $$
BEGIN
  IF NOT EXISTS (
    SELECT 1 FROM pg_policies
    WHERE schemaname = 'public'
      AND tablename = 'reviews'
      AND policyname = 'Users can update own review'
  ) THEN
    CREATE POLICY "Users can update own review" ON public.reviews
      FOR UPDATE USING (auth.uid() = user_id);
  END IF;
END
$$;

-- Users can delete their own review
DO $$
BEGIN
  IF NOT EXISTS (
    SELECT 1 FROM pg_policies
    WHERE schemaname = 'public'
      AND tablename = 'reviews'
      AND policyname = 'Users can delete own review'
  ) THEN
    CREATE POLICY "Users can delete own review" ON public.reviews
      FOR DELETE USING (auth.uid() = user_id);
  END IF;
END
$$;

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

-- Enable realtime for reviews (optional, for live review counts)
ALTER PUBLICATION supabase_realtime ADD TABLE public.reviews;

-- ─── 5. SUPABASE STORAGE BUCKET ───────────────────────────────
-- Create the property-images bucket if it does not exist.
-- Run this separately if needed (requires storage admin):
--   INSERT INTO storage.buckets (id, name, public) VALUES ('property-images', 'property-images', true)
--   ON CONFLICT (id) DO NOTHING;

-- ─── 6. CHAT THREADS: Missing INSERT policies ─────────────────
DO $$
BEGIN
  IF NOT EXISTS (
    SELECT 1 FROM pg_policies
    WHERE schemaname = 'public'
      AND tablename = 'chat_threads'
      AND policyname = 'Users can insert threads'
  ) THEN
    CREATE POLICY "Users can insert threads" ON public.chat_threads
      FOR INSERT WITH CHECK (true);
  END IF;
  
  IF NOT EXISTS (
    SELECT 1 FROM pg_policies
    WHERE schemaname = 'public'
      AND tablename = 'thread_participants'
      AND policyname = 'Users can add participants'
  ) THEN
    CREATE POLICY "Users can add participants" ON public.thread_participants
      FOR INSERT WITH CHECK (true);
  END IF;
END
$$;

-- ─── DONE ─────────────────────────────────────────────────────
