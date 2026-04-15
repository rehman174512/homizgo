import { createClient } from '@/lib/supabase'

const supabase = createClient()

const ADMIN_EMAIL = 'raabdul08@gmail.com'

// ─── Auth ─────────────────────────────────────────────────────────────────────

export async function getAdminSession() {
  const { data: { session } } = await supabase.auth.getSession()
  return session
}

export async function adminSignIn() {
  const redirectTo = `${window.location.origin}/admin/auth-callback`
  const { data, error } = await supabase.auth.signInWithOAuth({
    provider: 'google',
    options: { redirectTo },
  })
  if (error) throw error
  return data
}

export async function checkAdminEmailGate() {
  const { data: { session } } = await supabase.auth.getSession()
  if (!session?.user) return false
  if (session.user.email !== ADMIN_EMAIL) {
    await supabase.auth.signOut()
    throw new Error('ACCESS_DENIED')
  }
  return true
}

export async function adminSignOut() {
  sessionStorage.removeItem('admin_pin_verified')
  await supabase.auth.signOut()
}

export async function verifyAdminPin(pin) {
  const { data, error } = await supabase.rpc('verify_admin_pin', { input_pin: pin })
  if (error) throw error
  return data === true
}

export async function changeAdminPin(oldPin, newPin) {
  const { data, error } = await supabase.rpc('change_admin_pin', {
    old_pin: oldPin,
    new_pin: newPin,
  })
  if (error) throw error
  return data === true
}

// ─── Properties ────────────────────────────────────────────────────────────────

export async function getPropertiesByStatus(status) {
  const { data, error } = await supabase
    .from('properties')
    .select(`
      *,
      users!properties_owner_id_fkey ( id, name, email, phone, role )
    `)
    .eq('status', status)
    .order('submitted_at', { ascending: false })

  if (error) throw error
  return (data || []).map(p => {
    let extra = {}
    try {
      if (p.description?.startsWith('{')) extra = JSON.parse(p.description)
    } catch (_) {}
    return { ...p, ...extra }
  })
}

export async function getAllPropertiesForAdmin() {
  const { data, error } = await supabase
    .from('properties')
    .select(`
      *,
      users!properties_owner_id_fkey ( id, name, email, phone, role )
    `)
    .order('submitted_at', { ascending: false })

  if (error) throw error
  return (data || []).map(p => {
    let extra = {}
    try {
      if (p.description?.startsWith('{')) extra = JSON.parse(p.description)
    } catch (_) {}
    return { ...p, ...extra }
  })
}

export async function approveProperty(propertyId) {
  const { error } = await supabase
    .from('properties')
    .update({ status: 'approved', rejection_reason: null })
    .eq('id', propertyId)
  if (error) throw error
}

export async function rejectProperty(propertyId, reason) {
  const { error } = await supabase
    .from('properties')
    .update({ status: 'rejected', rejection_reason: reason })
    .eq('id', propertyId)
  if (error) throw error
}

export async function getAdminStats() {
  const { data, error } = await supabase
    .from('properties')
    .select('status')

  if (error) throw error
  const stats = { pending: 0, approved: 0, rejected: 0, total: data?.length || 0 }
  ;(data || []).forEach(p => { if (stats[p.status] !== undefined) stats[p.status]++ })
  return stats
}

// ─── Admin Messages ─────────────────────────────────────────────────────────────

/**
 * Get all unique owner conversations for admin
 */
export async function getAdminConversations() {
  const { data, error } = await supabase
    .from('admin_messages')
    .select(`
      owner_id,
      property_id,
      content,
      sender,
      created_at,
      read_at,
      users!admin_messages_owner_id_fkey ( id, name, email ),
      properties!admin_messages_property_id_fkey ( id, title )
    `)
    .order('created_at', { ascending: false })

  if (error) throw error

  // Deduplicate: one entry per owner_id (latest message)
  const seen = new Set()
  const conversations = []
  for (const msg of (data || [])) {
    const key = msg.owner_id
    if (!seen.has(key)) {
      seen.add(key)
      conversations.push({
        ownerId: msg.owner_id,
        ownerName: msg.users?.name || 'Unknown',
        ownerEmail: msg.users?.email || '',
        propertyId: msg.property_id,
        propertyTitle: msg.properties?.title || 'Property',
        lastMessage: msg.content,
        lastSender: msg.sender,
        lastTime: msg.created_at,
        hasUnread: msg.sender === 'owner' && !msg.read_at,
      })
    }
  }
  return conversations
}

export async function getAdminMessages(ownerId) {
  const { data, error } = await supabase
    .from('admin_messages')
    .select('*')
    .eq('owner_id', ownerId)
    .order('created_at', { ascending: true })

  if (error) throw error
  return data || []
}

export async function sendAdminMessage(ownerId, propertyId, content, sender = 'admin') {
  const { data, error } = await supabase
    .from('admin_messages')
    .insert([{ owner_id: ownerId, property_id: propertyId, content, sender }])
    .select()
    .single()

  if (error) throw error
  return data
}

export async function markAdminMessagesRead(ownerId) {
  await supabase
    .from('admin_messages')
    .update({ read_at: new Date().toISOString() })
    .eq('owner_id', ownerId)
    .eq('sender', 'owner')
    .is('read_at', null)
}

export function subscribeToAdminMessages(ownerId, callback) {
  const channel = supabase
    .channel(`admin_chat_${ownerId}`)
    .on(
      'postgres_changes',
      {
        event: 'INSERT',
        schema: 'public',
        table: 'admin_messages',
        filter: `owner_id=eq.${ownerId}`,
      },
      payload => callback(payload.new)
    )
    .subscribe()
  return channel
}

export function subscribeToAllAdminMessages(callback) {
  const channel = supabase
    .channel('admin_all_messages')
    .on(
      'postgres_changes',
      { event: 'INSERT', schema: 'public', table: 'admin_messages' },
      payload => callback(payload.new)
    )
    .subscribe()
  return channel
}

export function unsubscribeAdminChannel(channel) {
  if (channel) supabase.removeChannel(channel)
}

// ─── Recent Activity ───────────────────────────────────────────────────────────

export async function getRecentActivity(limit = 8) {
  const { data, error } = await supabase
    .from('properties')
    .select(`
      id, title, status, submitted_at,
      users!properties_owner_id_fkey ( name )
    `)
    .order('submitted_at', { ascending: false })
    .limit(limit)

  if (error) throw error
  return data || []
}
