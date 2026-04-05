import { createClient } from './supabase'

const supabase = createClient()

/**
 * Get all chat threads for a user, with participants and their names.
 * @param {string} userId
 */
const CHAT_MAX_AGE_DAYS = 40

export async function getChatThreads(userId) {
  const { data: myThreads, error: myErr } = await supabase
    .from('thread_participants')
    .select('thread_id')
    .eq('user_id', userId)

  if (myErr) throw myErr
  if (!myThreads || myThreads.length === 0) return []

  const threadIds = myThreads.map((t) => t.thread_id)

  // Compute cutoff: only show threads created within the last 40 days
  const cutoff = new Date()
  cutoff.setDate(cutoff.getDate() - CHAT_MAX_AGE_DAYS)

  const { data, error } = await supabase
    .from('chat_threads')
    .select(`
      id,
      property_id,
      created_at,
      thread_participants (
        user_id,
        users!thread_participants_user_id_fkey ( name )
      )
    `)
    .in('id', threadIds)
    .gte('created_at', cutoff.toISOString())  // filter out stale threads
    .order('created_at', { ascending: false })

  if (error) throw error
  return data || []
}

/**
 * Find an existing thread between two users for a property, or create one.
 * Only students should call this (role check done in UI).
 * @param {string} userId         – the student's id
 * @param {string} otherUserId    – the owner's id
 * @param {string} propertyId
 * @returns {Promise<string>} threadId
 */
export async function getOrCreateThread(userId, otherUserId, propertyId) {
  // Check my threads for this property
  const { data: myThreads } = await supabase
    .from('thread_participants')
    .select('thread_id, chat_threads!inner(property_id)')
    .eq('user_id', userId)
    .eq('chat_threads.property_id', propertyId)

  // Check owner's threads for this property
  const { data: theirThreads } = await supabase
    .from('thread_participants')
    .select('thread_id, chat_threads!inner(property_id)')
    .eq('user_id', otherUserId)
    .eq('chat_threads.property_id', propertyId)

  if (myThreads && theirThreads) {
    const myIds = myThreads.map((t) => t.thread_id)
    const shared = theirThreads.find((t) => myIds.includes(t.thread_id))
    if (shared) return shared.thread_id
  }

  // Create new thread using client-side UUID to avoid RLS select issues
  const newThreadId = crypto.randomUUID()
  const { error: createErr } = await supabase
    .from('chat_threads')
    .insert([{ id: newThreadId, property_id: propertyId }])

  if (createErr) throw createErr

  // Add both participants
  const { error: partErr } = await supabase
    .from('thread_participants')
    .insert([
      { thread_id: newThreadId, user_id: userId },
      { thread_id: newThreadId, user_id: otherUserId },
    ])

  if (partErr) throw partErr
  return newThreadId
}

/**
 * Send a new message in a thread.
 * @param {string} threadId
 * @param {string} senderId
 * @param {string} content
 */
export async function sendMessage(threadId, senderId, content) {
  const { data, error } = await supabase
    .from('chat_messages')
    .insert([{ thread_id: threadId, sender_id: senderId, content }])
    .select()
    .single()

  if (error) throw error

  // Trigger Email Notification (Non-blocking)
  const triggerNotification = async () => {
    try {
      const { data: participants, error: pErr } = await supabase
        .from('thread_participants')
        .select(`
          user_id,
          users!thread_participants_user_id_fkey ( name, email )
        `)
        .eq('thread_id', threadId)
      
      if (pErr || !participants) return

      const sender = participants.find(p => p.user_id === senderId)
      const recipient = participants.find(p => p.user_id !== senderId)
      
      if (recipient?.users?.email) {
        const { sendChatNotification } = await import('./emailService')
        await sendChatNotification(
          recipient.users.email,
          sender?.users?.name || 'A user',
          content,
          threadId
        )
      }
    } catch (err) {
      console.error('[chatService] Notification trigger error:', err)
    }
  }
  
  triggerNotification()

  return data
}

/**
 * Edit an existing message (only the sender can do this via RLS).
 * @param {string} messageId
 * @param {string} newContent
 */
export async function editMessage(messageId, newContent) {
  const { data, error } = await supabase
    .from('chat_messages')
    .update({ content: newContent, is_edited: true })
    .eq('id', messageId)
    .select()
    .single()

  if (error) throw error
  return data
}

/**
 * Soft-delete a message: marks it as deleted and clears content.
 * RLS enforces that only the sender can do this.
 * @param {string} messageId
 */
export async function deleteMessage(messageId) {
  const { error } = await supabase
    .from('chat_messages')
    .update({ is_deleted: true, content: '' })
    .eq('id', messageId)

  if (error) throw error
}

/**
 * Subscribe to INSERT and UPDATE events on chat_messages for a thread.
 * Calls callback(payload.new) for both events.
 * @param {string} threadId
 * @param {Function} callback
 * @returns channel
 */
export function subscribeToMessages(threadId, callback) {
  const channel = supabase
    .channel(`chat:${threadId}`)
    .on(
      'postgres_changes',
      {
        event: 'INSERT',
        schema: 'public',
        table: 'chat_messages',
        filter: `thread_id=eq.${threadId}`,
      },
      (payload) => callback({ event: 'INSERT', msg: payload.new })
    )
    .on(
      'postgres_changes',
      {
        event: 'UPDATE',
        schema: 'public',
        table: 'chat_messages',
        filter: `thread_id=eq.${threadId}`,
      },
      (payload) => callback({ event: 'UPDATE', msg: payload.new })
    )
    .subscribe()

  return channel
}

export function unsubscribeFromMessages(channel) {
  supabase.removeChannel(channel)
}

/**
 * Fetch all messages for a thread (paginated by limit, newest last).
 * @param {string} threadId
 * @param {number} limit – messages per page (default 50)
 */
export async function getThreadMessages(threadId, limit = 50) {
  const { data, error } = await supabase
    .from('chat_messages')
    .select('*')
    .eq('thread_id', threadId)
    .order('created_at', { ascending: true })
    .limit(limit)

  if (error) throw error
  return data || []
}

/**
 * Delete all messages in a thread (clear chat).
 * @param {string} threadId
 */
export async function clearChatMessages(threadId) {
  const { error } = await supabase
    .from('chat_messages')
    .delete()
    .eq('thread_id', threadId)

  if (error) throw error
}

/**
 * Delete an entire chat thread (cascades to messages via FK).
 * @param {string} threadId
 */
export async function deleteChatThread(threadId) {
  const { error } = await supabase
    .from('chat_threads')
    .delete()
    .eq('id', threadId)

  if (error) throw error
}

/**
 * Client-side cleanup: remove thread_participants rows for threads older
 * than maxDays days. Safe alternative to pg_cron for free-tier Supabase.
 * @param {string} userId
 * @param {number} maxDays – default 30
 */
export async function cleanupOldThreads(userId, maxDays = 40) {
  try {
    const cutoff = new Date()
    cutoff.setDate(cutoff.getDate() - maxDays)

    // Find old threads this user is in
    const { data: myThreads } = await supabase
      .from('thread_participants')
      .select('thread_id, chat_threads!inner(created_at)')
      .eq('user_id', userId)
      .lt('chat_threads.created_at', cutoff.toISOString())

    if (!myThreads || myThreads.length === 0) return

    const oldThreadIds = myThreads.map((t) => t.thread_id)

    // Delete those threads (cascade handles messages + participants)
    await supabase
      .from('chat_threads')
      .delete()
      .in('id', oldThreadIds)
  } catch (err) {
    // Non-critical; silently fail
    console.warn('[cleanupOldThreads]', err.message)
  }
}
/**
 * Lightweight helper to get just the thread IDs for the current user.
 * Useful for real-time subscriptions in the Navbar.
 * @param {string} userId
 */
export async function getUserThreadIds(userId) {
  const { data, error } = await supabase
    .from('thread_participants')
    .select('thread_id')
    .eq('user_id', userId)

  if (error) throw error
  return (data || []).map((t) => t.thread_id)
}
