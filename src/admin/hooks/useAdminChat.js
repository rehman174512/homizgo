import { useState, useEffect, useCallback, useRef } from 'react'
import {
  getAdminConversations,
  getAdminMessages,
  sendAdminMessage as svcSend,
  markAdminMessagesRead,
  subscribeToAdminMessages,
  subscribeToAllAdminMessages,
  unsubscribeAdminChannel,
} from '../services/adminService'

export function useAdminChat() {
  const [conversations, setConversations] = useState([])
  const [activeOwnerId, setActiveOwnerId] = useState(null)
  const [messages, setMessages] = useState([])
  const [loading, setLoading] = useState(false)
  const [sending, setSending] = useState(false)
  const channelRef = useRef(null)
  const allChannelRef = useRef(null)

  // Fetch conversations list
  const fetchConversations = useCallback(async () => {
    try {
      const data = await getAdminConversations()
      setConversations(data)
    } catch (err) {
      console.error('[AdminChat] fetchConversations', err)
    }
  }, [])

  useEffect(() => {
    fetchConversations()

    // Subscribe to all new messages → refresh conversation list
    allChannelRef.current = subscribeToAllAdminMessages(() => {
      fetchConversations()
    })

    return () => {
      unsubscribeAdminChannel(allChannelRef.current)
    }
  }, [fetchConversations])

  // Load messages when active owner changes
  const openConversation = useCallback(async (ownerId) => {
    setActiveOwnerId(ownerId)
    setLoading(true)
    
    // Cleanup previous subscription
    if (channelRef.current) {
      unsubscribeAdminChannel(channelRef.current)
    }

    try {
      const data = await getAdminMessages(ownerId)
      setMessages(data)
      await markAdminMessagesRead(ownerId)
    } catch (err) {
      console.error('[AdminChat] openConversation', err)
    } finally {
      setLoading(false)
    }

    // Subscribe to realtime for this owner
    channelRef.current = subscribeToAdminMessages(ownerId, (newMsg) => {
      setMessages(prev => {
        if (prev.some(m => m.id === newMsg.id)) return prev
        return [...prev, newMsg]
      })
      fetchConversations()
    })
  }, [fetchConversations])

  const sendMessage = useCallback(async (content, propertyId) => {
    if (!activeOwnerId || !content.trim()) return
    setSending(true)
    try {
      const msg = await svcSend(activeOwnerId, propertyId, content.trim(), 'admin')
      setMessages(prev => [...prev, msg])
      await fetchConversations()
    } catch (err) {
      console.error('[AdminChat] sendMessage', err)
    } finally {
      setSending(false)
    }
  }, [activeOwnerId, fetchConversations])

  // Open chat from property card (creates or opens existing thread with owner)
  const initiateChat = useCallback(async (ownerId, propertyId) => {
    // Create a thread init message if no conversation exists
    const existing = conversations.find(c => c.ownerId === ownerId)
    if (!existing) {
      await svcSend(ownerId, propertyId, '👋 Hello! The admin has a message regarding your property listing.', 'admin')
      await fetchConversations()
    }
    await openConversation(ownerId)
  }, [conversations, openConversation, fetchConversations])

  // Cleanup on unmount
  useEffect(() => {
    return () => {
      unsubscribeAdminChannel(channelRef.current)
      unsubscribeAdminChannel(allChannelRef.current)
    }
  }, [])

  return {
    conversations,
    activeOwnerId,
    messages,
    loading,
    sending,
    openConversation,
    sendMessage,
    initiateChat,
    fetchConversations,
  }
}
