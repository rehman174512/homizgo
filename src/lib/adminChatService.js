import { createClient } from './supabase'

const supabase = createClient()

/**
 * Get messages between the current user (owner) and the admin.
 */
export async function getAdminChatMessages(ownerId) {
  const { data, error } = await supabase
    .from('admin_messages')
    .select('*')
    .eq('owner_id', ownerId)
    .order('created_at', { ascending: true })

  if (error) throw error
  return data || []
}

/**
 * Send a message from the owner to the admin.
 */
export async function sendReplyToAdmin(ownerId, content, propertyId = null) {
  const { data, error } = await supabase
    .from('admin_messages')
    .insert([{ 
      owner_id: ownerId, 
      property_id: propertyId, 
      content, 
      sender: 'owner' 
    }])
    .select()
    .single()

  if (error) throw error
  return data
}

/**
 * Mark all admin messages as read for the current owner.
 */
export async function markAdminMessagesRead(ownerId) {
  const { error } = await supabase
    .from('admin_messages')
    .update({ read_at: new Date().toISOString() })
    .eq('owner_id', ownerId)
    .eq('sender', 'admin')
    .is('read_at', null)

  if (error) console.error('[AdminChatService] Failed to mark read:', error)
}

/**
 * Subscribe to admin messages for the current owner.
 */
export function subscribeToAdminChat(ownerId, callback) {
  const channel = supabase
    .channel(`admin_chat_owner_${ownerId}`)
    .on(
      'postgres_changes',
      {
        event: 'INSERT',
        schema: 'public',
        table: 'admin_messages',
        filter: `owner_id=eq.${ownerId}`,
      },
      payload => callback({ event: 'INSERT', msg: payload.new })
    )
    .subscribe()
  return channel
}
