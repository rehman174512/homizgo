-- ═══════════════════════════════════════════════════════════════════════════
-- Homizgo Supabase Setup Script
-- Run this ONCE in the Supabase SQL Editor (Dashboard → SQL Editor → New Query)
-- ═══════════════════════════════════════════════════════════════════════════

-- ─── 1. FCM Token column on users ──────────────────────────────────────────
ALTER TABLE users ADD COLUMN IF NOT EXISTS fcm_token TEXT;
COMMENT ON COLUMN users.fcm_token IS 'Firebase Cloud Messaging device token for push notifications';

-- ─── 2. Enable pg_cron extension ───────────────────────────────────────────
-- (Available on Supabase Pro & Team plans; Free plan has limited support)
-- If this fails, see "Alternative: Client-Side Cleanup" comment below.
CREATE EXTENSION IF NOT EXISTS pg_cron;

-- ─── 3. Auto-delete chat messages older than 40 days ───────────────────────
-- Runs daily at 2:00 AM UTC
SELECT cron.schedule(
  'delete-old-chat-messages',
  '0 2 * * *',
  $$
    DELETE FROM chat_messages
    WHERE created_at < NOW() - INTERVAL '40 days';
  $$
);

-- ─── 4. Auto-delete chat threads older than 40 days ────────────────────────
-- (Messages are cascade-deleted via FK, so this cleans up threads + participants)
SELECT cron.schedule(
  'delete-old-chat-threads',
  '0 2 * * *',
  $$
    DELETE FROM chat_threads
    WHERE created_at < NOW() - INTERVAL '40 days';
  $$
);

-- ─── Verify cron jobs are registered ───────────────────────────────────────
-- Run this to confirm: SELECT jobname, schedule, command FROM cron.job;

-- ═══════════════════════════════════════════════════════════════════════════
-- Alternative: If pg_cron is unavailable (Free tier), the app already does
-- client-side cleanup via cleanupOldThreads() called on login.
-- The UI also filters threads older than 40 days from the chat list.
-- ═══════════════════════════════════════════════════════════════════════════
