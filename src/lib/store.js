import { signUp, signIn, getCurrentUser as authGetCurrent, signOut } from './authService'
import {
  getChatThreads as chatGetThreads,
  getOrCreateThread as chatGetOrCreate,
  sendMessage as chatSendMessage,
  editMessage as chatEditMessage,
  deleteMessage as chatDeleteMessage,
  getThreadMessages as chatGetMessages,
  subscribeToMessages as chatSubscribe,
  unsubscribeFromMessages as chatUnsubscribe,
  clearChatMessages as chatClearMessages,
  deleteChatThread as chatDeleteThread,
  cleanupOldThreads as chatCleanupOld,
  getUserThreadIds as chatGetThreadIds,
} from './chatService'
import {
  getAdminChatMessages as adminGetMessages,
  sendReplyToAdmin as adminSendMessage,
  subscribeToAdminChat as adminSubscribe,
  markAdminMessagesRead as adminMarkRead,
} from './adminChatService'
import { createClient } from './supabase'
import { checkSensitiveActionLimit } from './guards'

export const supabase = createClient()

export function subscribeToInterests(callback) {
  const channel = supabase.channel('interests_changes')
    .on('postgres_changes', { event: '*', schema: 'public', table: 'interests' }, payload => {
      callback(payload)
    })
    .subscribe()
    
  return () => {
    supabase.removeChannel(channel)
  }
}

export function subscribeToProperties(callback) {
  const channel = supabase.channel('properties_changes')
    .on('postgres_changes', { event: '*', schema: 'public', table: 'properties' }, payload => {
      callback(payload)
    })
    .subscribe()
    
  return () => {
    supabase.removeChannel(channel)
  }
}

// ─── Auth ──────────────────────────────────────────────────────
export async function registerUser(user) {
  const newUser = await signUp(user.email, user.password, user.name, user.role, user.gender, user.phone, user.college)
  return { ...newUser, role: user.role, name: user.name }
}

export async function loginUser(email, password) {
  const user = await signIn(email, password)
  const profile = await authGetCurrent()
  return profile || user
}

export async function getCurrentUser() {
  return await authGetCurrent()
}

export async function setCurrentUser(user) {
  if (!user) await signOut()
}

export async function getUsers() {
  const { data, error } = await supabase
    .from('users')
    .select('id, name, email, role, gender')
  if (error || !data) return []
  return data
}

// ─── Properties ────────────────────────────────────────────────
/**
 * Fetch all available properties from Supabase.
 * Pass userGender ('male'|'female') to apply backend gender filtering.
 * @param {string|null} userGender
 */
export async function getProperties(userGender = null) {
  let query = supabase.from('properties').select(`
    *,
    users!properties_owner_id_fkey ( name, role ),
    interests ( user_id )
  `)
  // Only show APPROVED properties in the main app
  .eq('status', 'approved')

  // Backend-level STRICT gender filter:
  if (userGender === 'male') {
    query = query.or('property_for.eq.boys,property_for.eq.male,property_for.eq.both')
  } else if (userGender === 'female') {
    query = query.or('property_for.eq.girls,property_for.eq.female,property_for.eq.both')
  } else if (userGender !== null) {
    query = query.eq('id', '00000000-0000-0000-0000-000000000000') 
  }

  const { data, error } = await query

  if (error || !data || data.length === 0) return []

  return data.map((p) => {
    let extra = {}
    try {
      if (p.description && p.description.startsWith('{')) {
        extra = JSON.parse(p.description)
      }
    } catch (_) {}

    return {
      ...p,
      ownerId: p.owner_id,
      ownerRole: p.users?.role || extra.ownerRole || 'landlord',
      ownerName: p.users?.name || extra.ownerName || 'Unknown User',
      facilities: p.amenities || [],
      interestedUsers: p.interests ? p.interests.map(i => i.user_id) : (p.interested_users || []),
      propertyFor: p.property_for || extra.propertyFor || 'both',
      ...extra,
    }
  })
}

/**
 * Fetch a single property by its ID.
 * Bypasses the 'approved' filter so owners and admins can view listings in any state.
 */
export async function getPropertyById(id) {
  if (!id) return null

  const { data: p, error } = await supabase
    .from('properties')
    .select(`
      *,
      users!properties_owner_id_fkey ( name, role, email, phone ),
      interests ( user_id )
    `)
    .eq('id', id)
    .maybeSingle()

  if (error) {
    console.error('[getPropertyById] error:', error)
    return null
  }
  if (!p) return null

  let extra = {}
  try {
    if (p.description && p.description.startsWith('{')) {
      extra = JSON.parse(p.description)
    }
  } catch (_) {}

  return {
    ...p,
    ownerId: p.owner_id,
    ownerRole: p.users?.role || extra.ownerRole || 'landlord',
    ownerName: p.users?.name || extra.ownerName || 'Unknown User',
    facilities: p.amenities || [],
    images: p.images || [], // Ensure images is always an array
    interestedUsers: p.interests ? p.interests.map(i => i.user_id) : (p.interested_users || []),
    propertyFor: p.property_for || extra.propertyFor || 'both',
    ...extra,
  }
}

/**
 * Fetch ALL properties for a specific owner (any status).
 * Used in landlord/PG owner dashboards so they can see pending + approved + rejected.
 */
export async function getMyProperties(ownerId) {
  if (!ownerId) return []

  const { data, error } = await supabase
    .from('properties')
    .select(`
      *,
      interests ( user_id )
    `)
    .eq('owner_id', ownerId)
    .order('submitted_at', { ascending: false })

  if (error || !data) return []

  return data.map((p) => {
    let extra = {}
    try {
      if (p.description && p.description.startsWith('{')) {
        extra = JSON.parse(p.description)
      }
    } catch (_) {}

    return {
      ...p,
      ownerId: p.owner_id,
      facilities: p.amenities || [],
      interestedUsers: p.interests ? p.interests.map(i => i.user_id) : [],
      propertyFor: p.property_for || extra.propertyFor || 'both',
      ...extra,
    }
  })
}

export async function addProperty(property) {
  // NPO LIMIT: Prevent property submission spam
  checkSensitiveActionLimit('add_property', import.meta.env.VITE_SENSITIVE_ACTIONS_LIMIT || 20);

  const descriptionJson = JSON.stringify({
    notes: property.notes,
    rules: property.rules,
    mapEmbed: property.mapEmbed,
    available: property.available,
    rentDuration: property.rentDuration,
    distanceRange: property.distanceRange,
    livingAlone: property.livingAlone,
    isPG: !!property.roomType,
    roomType: property.roomType,
    foodIncluded: property.foodIncluded,
    currentOccupants: property.currentOccupants,
    totalCapacity: property.totalCapacity,
    ownerRole: property.ownerRole,
    ownerName: property.ownerName,
    propertyFor: property.propertyFor,
  })

  const dbProperty = {
    owner_id: property.ownerId,
    title: property.title,
    location: property.location,
    price: property.price,
    type: property.roomType ? 'pg' : 'room',
    amenities: property.facilities || [],
    images: property.images || [],
    property_for: property.propertyFor || 'both',
    description: descriptionJson,
    status: 'pending',          // ← NEW: all submissions go to moderation queue
    submitted_at: new Date().toISOString(),
  }

  const { data, error } = await supabase
    .from('properties')
    .insert(dbProperty)
    .select()
    .single()

  if (error) throw new Error(error.message)

  // Trigger Admin Notification (Non-blocking)
  const notifyAdmins = async () => {
    try {
      const { data: admins } = await supabase
        .from('users')
        .select('email')
        .eq('role', 'admin')
      
      const adminEmails = (admins || []).map(a => a.email).filter(Boolean)
      
      if (adminEmails.length > 0) {
        const { sendAdminPropertyNotification } = await import('./emailService')
        await sendAdminPropertyNotification(
          adminEmails,
          property.title,
          property.ownerName || 'A listing owner',
          data.id
        )
      }
    } catch (err) {
      console.error('[store] Admin notification error:', err)
    }
  }
  
  notifyAdmins()

  return { ...property, id: data.id, owner_id: data.owner_id }
}

/**
 * Update a property — saves ALL fields, not just title/price/location.
 */
export async function updateProperty(id, updates) {
  const descriptionJson = JSON.stringify({
    notes: updates.notes,
    rules: updates.rules,
    mapEmbed: updates.mapEmbed,
    available: updates.available,
    rentDuration: updates.rentDuration,
    distanceRange: updates.distanceRange,
    livingAlone: updates.livingAlone,
    isPG: !!updates.roomType,
    roomType: updates.roomType,
    foodIncluded: updates.foodIncluded,
    currentOccupants: updates.currentOccupants,
    totalCapacity: updates.totalCapacity,
    ownerRole: updates.ownerRole,
    ownerName: updates.ownerName,
    propertyFor: updates.propertyFor,
  })

  const { data, error } = await supabase
    .from('properties')
    .update({
      title: updates.title,
      price: updates.price,
      location: updates.location,
      amenities: updates.facilities || [],
      images: updates.images || [],
      property_for: updates.propertyFor || 'both',
      description: descriptionJson,
    })
    .eq('id', id)
    .select()

  if (error) throw new Error(error.message)
  return data
}

export async function deleteProperty(id) {
  // 1. Delete interests referencing this property
  const { error: intErr } = await supabase.from('interests').delete().eq('property_id', id)
  if (intErr) throw new Error(intErr.message)

  // 2. Delete chat threads referencing this property 
  // (Participants and messages should cascade from thread deletion)
  const { error: chatErr } = await supabase.from('chat_threads').delete().eq('property_id', id)
  if (chatErr) throw new Error(chatErr.message)

  // 3. Finally delete the property record
  const { error } = await supabase.from('properties').delete().eq('id', id)
  if (error) throw new Error(error.message)
}

export async function toggleInterest(propertyId, userId) {
  if (!userId) return false
  
  const { data: existing, error: fetchErr } = await supabase
    .from('interests')
    .select('id')
    .eq('user_id', userId)
    .eq('property_id', propertyId)
    .maybeSingle()

  if (fetchErr && fetchErr.code !== 'PGRST116') throw fetchErr

  if (existing) {
    const { error: delErr } = await supabase
      .from('interests')
      .delete()
      .eq('id', existing.id)
    if (delErr) throw delErr
    return false // Not interested
  } else {
    const { error: insErr } = await supabase
      .from('interests')
      .insert({ user_id: userId, property_id: propertyId })
    if (insErr) throw insErr
    return true // Interested
  }
}

export async function getPropertyInterests(propertyId) {
  const { data, error } = await supabase
    .from('interests')
    .select(`
      id,
      created_at,
      user_id,
      users!user_id ( name, email, phone )
    `)
    .eq('property_id', propertyId)
    .order('created_at', { ascending: false })

  if (error) throw error
  return data
}

export async function getUserInterests(userId) {
  if (!userId) return []
  const { data, error } = await supabase
    .from('interests')
    .select('property_id')
    .eq('user_id', userId)
  if (error) return []
  return (data || []).map((r) => r.property_id)
}

// ─── Chat (re-exported from chatService) ───────────────────────
export async function getChatThreads() {
  const user = await authGetCurrent()
  if (!user) return []
  return await chatGetThreads(user.id)
}

export async function getOrCreateThread(userId, userName, otherUserId, otherUserName, propertyId) {
  return await chatGetOrCreate(userId, otherUserId, propertyId)
}

export async function sendMessage(threadId, senderId, senderName, receiverId, message) {
  // NPO LIMIT: Prevent chat spam
  checkSensitiveActionLimit('send_chat', import.meta.env.VITE_SENSITIVE_ACTIONS_LIMIT || 20, 1 * 60 * 1000); // 20 per minute

  return await chatSendMessage(threadId, senderId, message)
}

export async function editMessage(messageId, newContent) {
  return await chatEditMessage(messageId, newContent)
}

export async function deleteMessage(messageId) {
  return await chatDeleteMessage(messageId)
}

export async function getThreadMessages(threadId) {
  return await chatGetMessages(threadId)
}

export function subscribeToMessages(threadId, callback) {
  return chatSubscribe(threadId, callback)
}

export function unsubscribeFromMessages(channel) {
  chatUnsubscribe(channel)
}

export async function getUserThreadIds(userId) {
  return await chatGetThreadIds(userId)
}

// Alias kept for ChatPage compatibility
export async function getUserThreads() {
  return getChatThreads()
}

export async function clearChatMessages(threadId) {
  return await chatClearMessages(threadId)
}

export async function deleteChatThread(threadId) {
  return await chatDeleteThread(threadId)
}

export async function cleanupOldThreads(userId, maxDays = 40) {
  return await chatCleanupOld(userId, maxDays)
}

// ─── Admin Support Chat (for Owners) ───────────────────────────
export async function getAdminChatMessages(ownerId) {
  return await adminGetMessages(ownerId)
}

export async function sendReplyToAdmin(ownerId, content, propertyId = null) {
  return await adminSendMessage(ownerId, content, propertyId)
}

export function subscribeToAdminChat(ownerId, callback) {
  return adminSubscribe(ownerId, callback)
}

export async function markAdminMessagesRead(ownerId) {
  return await adminMarkRead(ownerId)
}

