-- ============================================================
-- RLS FIXES: Run this ENTIRE script in your Supabase SQL Editor
-- Fixes:
-- 1. Infinite recursion in thread_participants RLS policy
-- 2. INSERT policies for chat creation (were failing)
-- 3. Public user profile reads (needed for property listings)
-- 4. Chat clear/delete operations
-- ============================================================

-- ── HELPER FUNCTION ─────────────────────────────────────────
-- Avoids recursive RLS by using SECURITY DEFINER
CREATE OR REPLACE FUNCTION public.is_thread_participant(p_thread_id uuid)
RETURNS boolean
LANGUAGE sql
STABLE
SECURITY DEFINER
AS $$
  SELECT EXISTS (
    SELECT 1 FROM public.thread_participants
    WHERE thread_id = p_thread_id AND user_id = auth.uid()
  );
$$;

-- ── USERS TABLE ──────────────────────────────────────────────
-- Drop old restrictive policy and allow any authenticated user to read profiles
DROP POLICY IF EXISTS "Authenticated users can view all profiles" ON public.users;
CREATE POLICY "Authenticated users can view all profiles"
  ON public.users
  FOR SELECT
  USING (auth.role() = 'authenticated');

-- ── CHAT THREADS ─────────────────────────────────────────────
-- Drop old insert policy and recreate with explicit authenticated check
DROP POLICY IF EXISTS "Users can insert threads" ON public.chat_threads;
CREATE POLICY "Users can insert threads"
  ON public.chat_threads
  FOR INSERT
  WITH CHECK (auth.role() = 'authenticated');

-- Add DELETE policy for threads
DROP POLICY IF EXISTS "Users can delete threads they are in" ON public.chat_threads;
CREATE POLICY "Users can delete threads they are in"
  ON public.chat_threads
  FOR DELETE
  USING (public.is_thread_participant(id));

-- ── THREAD PARTICIPANTS ──────────────────────────────────────
-- Fix the infinite recursion SELECT policy
DROP POLICY IF EXISTS "Users can view participants for their threads" ON public.thread_participants;
CREATE POLICY "Users can view participants for their threads"
  ON public.thread_participants
  FOR SELECT
  USING (public.is_thread_participant(thread_id));

-- Fix INSERT policy
DROP POLICY IF EXISTS "Users can add participants" ON public.thread_participants;
CREATE POLICY "Users can add participants"
  ON public.thread_participants
  FOR INSERT
  WITH CHECK (auth.role() = 'authenticated');

-- Add DELETE policy
DROP POLICY IF EXISTS "Users can delete their own participation" ON public.thread_participants;
CREATE POLICY "Users can delete their own participation"
  ON public.thread_participants
  FOR DELETE
  USING (user_id = auth.uid());

-- ── CHAT MESSAGES ────────────────────────────────────────────
-- Fix the SELECT policy (was also recursing via thread_participants)
DROP POLICY IF EXISTS "Users can view messages in their threads" ON public.chat_messages;
CREATE POLICY "Users can view messages in their threads"
  ON public.chat_messages
  FOR SELECT
  USING (public.is_thread_participant(thread_id));

-- Add DELETE policy for clearing chats
DROP POLICY IF EXISTS "Users can delete messages in their threads" ON public.chat_messages;
CREATE POLICY "Users can delete messages in their threads"
  ON public.chat_messages
  FOR DELETE
  USING (public.is_thread_participant(thread_id));
