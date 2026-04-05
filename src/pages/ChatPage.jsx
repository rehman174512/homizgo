import { useEffect, useState, useRef, useCallback } from 'react'
import { useNavigate, useSearchParams } from 'react-router-dom'
import {
  getCurrentUser, getUserThreads, getThreadMessages, sendMessage,
  clearChatMessages, deleteChatThread, subscribeToMessages,
  unsubscribeFromMessages, getProperties, getOrCreateThread,
  editMessage, deleteMessage, cleanupOldThreads, supabase,
  getAdminChatMessages, sendReplyToAdmin, subscribeToAdminChat, markAdminMessagesRead
} from '@/lib/store'
import { Navbar } from '@/components/Navbar'
import { Button } from '@/components/ui/button'
import {
  MessageSquare, Send, ArrowLeft, Clock, Users,
  MoreVertical, Trash2, Eraser, AlertTriangle, Plus, X,
  Building2, Search, Pencil, Check, RotateCcw,
} from 'lucide-react'
import { format } from 'date-fns'

// ─── Per-message action menu ─────────────────────────────────────────────────
function MessageBubble({ msg, isOwn, user, onEdit, onDelete, onResend }) {
  const [showMenu, setShowMenu] = useState(false)
  const [editing, setEditing] = useState(false)
  const [editText, setEditText] = useState(msg.messageText)
  const editRef = useRef(null)
  const menuRef = useRef(null)
  const isSending = String(msg.id).startsWith('opt-')
  const isFailed = msg.failed === true

  // Close menu on outside click
  useEffect(() => {
    const handler = (e) => {
      if (menuRef.current && !menuRef.current.contains(e.target)) setShowMenu(false)
    }
    document.addEventListener('mousedown', handler)
    return () => document.removeEventListener('mousedown', handler)
  }, [])

  // Focus edit input when editing starts
  useEffect(() => {
    if (editing) {
      setTimeout(() => editRef.current?.focus(), 50)
      setEditText(msg.messageText)
    }
  }, [editing, msg.messageText])

  const confirmEdit = () => {
    const trimmed = editText.trim()
    if (trimmed && trimmed !== msg.messageText) {
      onEdit(msg.id, trimmed)
    }
    setEditing(false)
  }

  const cancelEdit = () => {
    setEditing(false)
    setEditText(msg.messageText)
  }

  const handleEditKeyDown = (e) => {
    if (e.key === 'Enter' && !e.shiftKey) { e.preventDefault(); confirmEdit() }
    if (e.key === 'Escape') cancelEdit()
  }

  if (msg.isDeleted) {
    return (
      <div className={`flex ${isOwn ? 'justify-end' : 'justify-start'}`}>
        <div className="max-w-[75%] rounded-2xl px-4 py-3 bg-secondary/50 border border-dashed">
          <p className="text-xs italic text-muted-foreground">
            {isOwn ? 'You unsent a message' : 'Message deleted'}
          </p>
        </div>
      </div>
    )
  }

  return (
    <div className={`group flex items-end gap-1.5 ${isOwn ? 'justify-end' : 'justify-start'}`}>
      {/* Action menu trigger — only for own, non-sending messages */}
      {isOwn && !isSending && !editing && (
        <div className="relative opacity-0 group-hover:opacity-100 transition-opacity" ref={menuRef}>
          <button
            onClick={() => setShowMenu((v) => !v)}
            className="flex h-7 w-7 items-center justify-center rounded-lg hover:bg-secondary transition-colors"
            aria-label="Message options"
          >
            <MoreVertical className="h-3.5 w-3.5 text-muted-foreground" />
          </button>
          {showMenu && (
            <div className="absolute bottom-8 right-0 z-30 w-36 overflow-hidden rounded-xl border bg-card shadow-xl shadow-black/10">
              {!isFailed && (
                <button
                  onClick={() => { setShowMenu(false); setEditing(true) }}
                  className="flex w-full items-center gap-2 px-3 py-2.5 text-xs text-foreground hover:bg-secondary transition-colors"
                >
                  <Pencil className="h-3 w-3 text-muted-foreground" />
                  Edit
                </button>
              )}
              {isFailed && (
                <button
                  onClick={() => { setShowMenu(false); onResend(msg) }}
                  className="flex w-full items-center gap-2 px-3 py-2.5 text-xs text-foreground hover:bg-secondary transition-colors"
                >
                  <RotateCcw className="h-3 w-3 text-muted-foreground" />
                  Resend
                </button>
              )}
              <div className="h-px bg-border" />
              <button
                onClick={() => { setShowMenu(false); onDelete(msg.id) }}
                className="flex w-full items-center gap-2 px-3 py-2.5 text-xs text-destructive hover:bg-destructive/5 transition-colors"
              >
                <Trash2 className="h-3 w-3" />
                Unsend
              </button>
            </div>
          )}
        </div>
      )}

      <div className={`max-w-[75%] transition-opacity ${isSending ? 'opacity-60' : isFailed ? 'opacity-50' : 'opacity-100'}`}>
        {/* Inline edit mode */}
        {editing ? (
          <div className="rounded-2xl rounded-br-lg border-2 border-primary/40 bg-card p-2 shadow-sm">
            <textarea
              ref={editRef}
              value={editText}
              onChange={(e) => setEditText(e.target.value)}
              onKeyDown={handleEditKeyDown}
              className="block w-full resize-none bg-transparent text-sm text-foreground focus:outline-none"
              style={{ minWidth: 180, maxHeight: 120, overflowY: 'auto' }}
              rows={Math.min(4, editText.split('\n').length)}
            />
            <div className="mt-2 flex justify-end gap-1">
              <button onClick={cancelEdit} className="rounded-lg px-2 py-1 text-[10px] text-muted-foreground hover:bg-secondary">
                Cancel
              </button>
              <button onClick={confirmEdit} disabled={!editText.trim()} className="rounded-lg bg-primary px-2 py-1 text-[10px] text-primary-foreground hover:bg-primary/90 disabled:opacity-50">
                <Check className="inline h-3 w-3 mr-0.5" />Save
              </button>
            </div>
          </div>
        ) : (
          <div className={`rounded-2xl px-4 py-3 ${
            isOwn
              ? 'bg-primary text-primary-foreground rounded-br-lg shadow-sm shadow-primary/10'
              : 'bg-card border text-card-foreground rounded-bl-lg'
          }`}>
            <p className="text-sm leading-relaxed whitespace-pre-wrap">{msg.messageText}</p>
            <div className={`mt-1 flex items-center gap-1.5 text-[10px] ${isOwn ? 'text-primary-foreground/50' : 'text-muted-foreground'}`}>
              <Clock className="h-2.5 w-2.5" />
              {format(new Date(msg.createdAt), 'HH:mm')}
              {isSending && <span className="ml-0.5">Sending…</span>}
              {isFailed && <span className="ml-0.5 text-destructive font-medium">Failed · tap ··· to resend</span>}
              {msg.isEdited && !isSending && !isFailed && <span className="ml-0.5 italic">edited</span>}
            </div>
          </div>
        )}
      </div>
    </div>
  )
}

// ─── Main page ────────────────────────────────────────────────────────────────
export default function ChatPage() {
  const [user, setUser] = useState(null)
  const [conversations, setConversations] = useState([])
  const [activeConversation, setActiveConversation] = useState(null)
  const [messages, setMessages] = useState([])
  const [loadingConvs, setLoadingConvs] = useState(true)
  const [loadingMessages, setLoadingMessages] = useState(false)
  const [inputText, setInputText] = useState('')
  const [sending, setSending] = useState(false)
  const [showSidebar, setShowSidebar] = useState(true)
  const [showMenu, setShowMenu] = useState(false)
  const [confirmModal, setConfirmModal] = useState(null)
  const [actionLoading, setActionLoading] = useState(false)
  // New chat compose modal (students only)
  const [showNewChat, setShowNewChat] = useState(false)
  const [properties, setProperties] = useState([])
  const [newChatSearch, setNewChatSearch] = useState('')
  const [startingChat, setStartingChat] = useState(null)

  const messagesEndRef = useRef(null)
  const headerMenuRef = useRef(null)
  const inputRef = useRef(null)
  const navigate = useNavigate()
  const [searchParams] = useSearchParams()

  const mapConversations = useCallback((threads, currentUser, propertiesMap = {}) => {
    return (threads || []).map((conv) => {
      const other = conv.thread_participants?.find((p) => p.user_id !== currentUser.id)
      return {
        id: conv.id,
        createdAt: conv.created_at,
        otherId: other?.user_id,
        otherName: other?.users?.name || 'User',
        propertyId: conv.property_id,
        propertyTitle: propertiesMap[conv.property_id] || null,
      }
    })
  }, [])

  const loadConversations = useCallback(async (currentUser) => {
    setLoadingConvs(true)
    try {
      const [threads, allProps] = await Promise.all([
        getUserThreads(),
        getProperties(),
      ])
      const propsMap = Object.fromEntries((allProps || []).map((p) => [p.id, p.title]))
      setConversations(mapConversations(threads, currentUser, propsMap))
    } catch {
      setConversations([])
    } finally {
      setLoadingConvs(false)
    }
  }, [mapConversations])

  const loadAdminStatus = useCallback(async (userId) => {
    try {
      const msgs = await getAdminChatMessages(userId)
      if (msgs.length > 0) {
        const last = msgs[msgs.length - 1]
        return {
          id: 'admin_support',
          createdAt: last.created_at,
          otherId: 'admin',
          otherName: 'Homizgo Admin',
          lastMessage: last.content,
          lastMessageTime: last.created_at,
          isAdmin: true
        }
      } else {
        // Default empty entry for owners
        return {
          id: 'admin_support',
          createdAt: new Date().toISOString(),
          otherId: 'admin',
          otherName: 'Homizgo Admin',
          lastMessage: 'Messages from the Homizgo team will appear here.',
          isAdmin: true
        }
      }
    } catch { return null }
  }, [])

  // Initial load + cleanup old threads
  useEffect(() => {
    let active = true
    async function load() {
      const current = await getCurrentUser()
      if (!current) { navigate('/login'); return }
      if (active) setUser(current)
      // Load threads and properties in parallel
      const [threads, allProps] = await Promise.all([
        getUserThreads(),
        getProperties(),
      ])
      if (!active) return
      const propsMap = Object.fromEntries((allProps || []).map((p) => [p.id, p.title]))
      let mapped = mapConversations(threads, current, propsMap)
      
      // Add Admin Support if owner
      const isOwner = current.role === 'landlord' || current.role === 'pgowner'
      if (isOwner) {
        const adminEntry = await loadAdminStatus(current.id)
        if (adminEntry) mapped = [adminEntry, ...mapped]
      }

      setConversations(mapped)
      setLoadingConvs(false)

      // Auto-select thread from URL param
      const urlThreadId = searchParams.get('threadId')
      if (urlThreadId) {
        const target = mapped.find((c) => c.id === urlThreadId)
        if (target) setActiveConversation(target)
      } else if (searchParams.get('admin') === 'true') {
        const adminTab = mapped.find(c => c.isAdmin)
        if (adminTab) setActiveConversation(adminTab)
      }

      // Non-critical cleanup
      cleanupOldThreads(current.id).catch(() => {})
    }
    load().catch(() => navigate('/login'))
    return () => { active = false }
  }, [navigate, mapConversations, searchParams, loadAdminStatus])


  // Close header menu on outside click
  useEffect(() => {
    const handler = (e) => {
      if (headerMenuRef.current && !headerMenuRef.current.contains(e.target)) setShowMenu(false)
    }
    document.addEventListener('mousedown', handler)
    return () => document.removeEventListener('mousedown', handler)
  }, [])

  // Scroll to bottom on new messages
  useEffect(() => {
    messagesEndRef.current?.scrollIntoView({ behavior: 'smooth' })
  }, [messages])

  // Focus input when conversation selected
  useEffect(() => {
    if (activeConversation) setTimeout(() => inputRef.current?.focus(), 100)
  }, [activeConversation])

  const loadMessages = useCallback(async (conv) => {
    setLoadingMessages(true)
    try {
      let msgs
      if (conv.isAdmin) {
        msgs = await getAdminChatMessages(user.id)
        await markAdminMessagesRead(user.id)
      } else {
        msgs = await getThreadMessages(conv.id)
      }
      
      setMessages((msgs || []).map((m) => ({
        id: m.id,
        conversationId: m.thread_id || 'admin_support',
        senderId: m.sender_id || (m.sender === 'admin' ? 'admin' : user.id),
        messageText: m.content,
        isEdited: m.is_edited,
        isDeleted: m.is_deleted,
        createdAt: m.created_at,
        isAdminMsg: !!m.sender
      })))
    } catch { setMessages([]) }
    finally { setLoadingMessages(false) }
  }, [user])

  // Realtime subscription
  useEffect(() => {
    if (!activeConversation || !user) return
    
    let channel
    if (activeConversation.isAdmin) {
      channel = subscribeToAdminChat(user.id, ({ event, msg }) => {
        if (event === 'INSERT') {
          if (msg.sender === 'owner') return
          setMessages((prev) => {
            if (prev.some(m => m.id === msg.id)) return prev
            return [...prev, {
              id: msg.id, conversationId: 'admin_support', senderId: 'admin',
              messageText: msg.content, createdAt: msg.created_at, isAdminMsg: true
            }]
          })
          // Update sidebar
          setConversations(prev => prev.map(c => c.isAdmin ? { ...c, lastMessage: msg.content, lastMessageTime: msg.created_at } : c))
        }
      })
    } else {
      channel = subscribeToMessages(activeConversation.id, ({ event, msg }) => {
        if (event === 'INSERT') {
          if (msg.sender_id === user.id) return
          setMessages((prev) => {
            if (prev.some((m) => m.id === msg.id)) return prev
            const newMsg = {
              id: msg.id, conversationId: msg.thread_id, senderId: msg.sender_id,
              messageText: msg.content, isEdited: msg.is_edited, isDeleted: msg.is_deleted,
              createdAt: msg.created_at,
            }
            // Update message preview in sidebar
            setConversations(prevConv => {
              const found = prevConv.find(c => c.id === msg.thread_id)
              if (found) {
                const updated = { ...found, lastMessage: msg.content, lastMessageTime: msg.created_at }
                return [updated, ...prevConv.filter(c => c.id !== msg.thread_id)]
              }
              return prevConv
            })
            return [...prev, newMsg]
          })
        } else if (event === 'UPDATE') {
          setMessages((prev) => prev.map((m) =>
            m.id === msg.id
              ? { ...m, messageText: msg.content, isEdited: msg.is_edited, isDeleted: msg.is_deleted }
              : m
          ))
        }
      })
    }
    return () => {
      if (activeConversation.isAdmin) {
        supabase.removeChannel(channel)
      } else {
        unsubscribeFromMessages(channel)
      }
    }
  }, [activeConversation, user])

  // Realtime subscription for NEW threads (Discovery)
  useEffect(() => {
    if (!user) return
    const channel = supabase.channel('user-thread-discovery')
      .on('postgres_changes', { 
        event: 'INSERT', 
        schema: 'public', 
        table: 'thread_participants',
        filter: `user_id=eq.${user.id}`
      }, () => {
        // Refresh sidebar for new thread
        loadConversations(user)
      })
      .subscribe()
    
    return () => { supabase.removeChannel(channel) }
  }, [user, loadConversations])

  const selectConversation = (conv) => {
    setActiveConversation(conv)
    setShowSidebar(false)
    setMessages([])
    loadMessages(conv)
  }

  const handleSend = async (e) => {
    e?.preventDefault()
    if (!inputText.trim() || !activeConversation || !user) return
    const text = inputText.trim()
    setInputText('')
    setSending(true)
    const optimisticId = `opt-${Date.now()}`
    const optimistic = {
      id: optimisticId, conversationId: activeConversation.id, senderId: user.id,
      messageText: text, isEdited: false, isDeleted: false,
      createdAt: new Date().toISOString(),
      isAdminMsg: activeConversation.isAdmin
    }
    setMessages((prev) => [...prev, optimistic])
    try {
      let data
      if (activeConversation.isAdmin) {
        data = await sendReplyToAdmin(user.id, text)
        setMessages((prev) => prev.map((m) =>
          m.id === optimisticId
            ? { id: data.id, conversationId: 'admin_support', senderId: user.id, messageText: data.content, createdAt: data.created_at, isAdminMsg: true }
            : m
        ))
      } else {
        data = await sendMessage(activeConversation.id, user.id, user.name, activeConversation.otherId, text)
        setMessages((prev) => prev.map((m) =>
          m.id === optimisticId
            ? { id: data.id, conversationId: data.thread_id, senderId: data.sender_id, messageText: data.content, isEdited: false, isDeleted: false, createdAt: data.created_at }
            : m
        ))
      }
    } catch {
      // Mark as failed so user can resend
      setMessages((prev) => prev.map((m) => m.id === optimisticId ? { ...m, failed: true } : m))
    } finally {
      setSending(false)
      inputRef.current?.focus()
    }
  }

  const handleKeyDown = (e) => {
    if (e.key === 'Enter' && !e.shiftKey) { e.preventDefault(); handleSend() }
  }

  // ── Per-message actions ──────────────────────────────────────
  const handleEditMessage = async (messageId, newText) => {
    // Optimistic update
    setMessages((prev) => prev.map((m) => m.id === messageId ? { ...m, messageText: newText, isEdited: true } : m))
    try {
      await editMessage(messageId, newText)
    } catch (err) {
      // Revert optimistic on failure
      setMessages((prev) => prev.map((m) => m.id === messageId ? { ...m, messageText: m.messageText, isEdited: m.isEdited } : m))
      console.error('[ChatPage] Edit failed:', err)
    }
  }

  const handleDeleteMessage = async (messageId) => {
    // Optimistic update
    setMessages((prev) => prev.map((m) => m.id === messageId ? { ...m, isDeleted: true, messageText: '' } : m))
    try {
      await deleteMessage(messageId)
    } catch (err) {
      // Revert on failure
      setMessages((prev) => prev.map((m) => m.id === messageId ? { ...m, isDeleted: false } : m))
      console.error('[ChatPage] Delete failed:', err)
    }
  }

  const handleResend = async (failedMsg) => {
    // Remove failed message and re-send
    setMessages((prev) => prev.filter((m) => m.id !== failedMsg.id))
    setInputText(failedMsg.messageText)
    setTimeout(() => inputRef.current?.focus(), 100)
  }

  // ── Conversation-level actions ───────────────────────────────
  const handleClearChat = async () => {
    if (!activeConversation) return
    setActionLoading(true)
    try {
      await clearChatMessages(activeConversation.id)
      setMessages([])
      setConfirmModal(null)
    } catch (err) { alert(err.message || 'Failed to clear chat') }
    finally { setActionLoading(false) }
  }

  const handleDeleteConversation = async () => {
    if (!activeConversation) return
    setActionLoading(true)
    try {
      await deleteChatThread(activeConversation.id)
      setConversations((prev) => prev.filter((c) => c.id !== activeConversation.id))
      setActiveConversation(null)
      setMessages([])
      setShowSidebar(true)
      setConfirmModal(null)
    } catch (err) { alert(err.message || 'Failed to delete conversation') }
    finally { setActionLoading(false) }
  }

  // ── New Chat modal (students only) ──────────────────────────
  const isStudent = user?.role === 'user' || user?.role === 'student'

  const openNewChat = async () => {
    if (!isStudent) return
    setShowNewChat(true)
    setNewChatSearch('')
    if (properties.length === 0) {
      const props = await getProperties().catch(() => [])
      setProperties(props)
    }
  }

  const startChatWithProperty = async (property) => {
    if (!user || user.id === property.ownerId) return
    setStartingChat(property.id)
    try {
      const threadId = await getOrCreateThread(user.id, user.name, property.ownerId, property.ownerName || 'Owner', property.id)
      const threads = await getUserThreads()
      const mapped = mapConversations(threads, user)
      setConversations(mapped)
      setShowNewChat(false)
      const created = mapped.find((c) => c.id === threadId)
      if (created) selectConversation(created)
    } catch (err) {
      alert('Could not start chat: ' + (err.message || 'Check RLS policies in Supabase'))
    } finally {
      setStartingChat(null)
    }
  }

  const filteredProps = properties.filter((p) =>
    p.title?.toLowerCase().includes(newChatSearch.toLowerCase()) ||
    p.location?.toLowerCase().includes(newChatSearch.toLowerCase()) ||
    p.ownerName?.toLowerCase().includes(newChatSearch.toLowerCase())
  )

  if (!user) return (
    <div className="flex h-screen items-center justify-center">
      <div className="h-8 w-8 animate-spin rounded-full border-2 border-primary border-t-transparent" />
    </div>
  )

  return (
    <div className="flex flex-col" style={{ height: '100dvh' }}>
      <Navbar />
      <div className="flex min-h-0 flex-1 overflow-hidden">

        {/* ── Sidebar ── */}
        <aside className={`${showSidebar ? 'flex' : 'hidden md:flex'} w-full flex-col border-r bg-card md:w-80 lg:w-96`}>
          <div className="border-b p-4">
            <div className="flex items-center justify-between">
              <div className="flex items-center gap-2">
                <div className="flex h-8 w-8 items-center justify-center rounded-xl bg-primary/10">
                  <MessageSquare className="h-4 w-4 text-primary" />
                </div>
                <div>
                  <h2 className="font-heading text-lg font-semibold text-card-foreground">Messages</h2>
                  <p className="text-xs text-muted-foreground">
                    {loadingConvs ? 'Loading...' : `${conversations.length} conversation${conversations.length !== 1 ? 's' : ''}`}
                  </p>
                </div>
              </div>
              {/* Only students can start new conversations */}
              {isStudent && (
                <Button
                  size="icon"
                  className="h-9 w-9 rounded-xl shadow-sm shadow-primary/20"
                  onClick={openNewChat}
                  title="Start new conversation"
                >
                  <Plus className="h-4 w-4" />
                </Button>
              )}
            </div>
          </div>

          <div className="flex-1 overflow-y-auto">
            {loadingConvs ? (
              <div className="flex items-center justify-center p-8">
                <div className="h-5 w-5 animate-spin rounded-full border-2 border-primary border-t-transparent" />
              </div>
            ) : conversations.length === 0 ? (
              <div className="flex flex-col items-center justify-center p-8 text-center gap-3">
                <div className="flex h-16 w-16 items-center justify-center rounded-2xl bg-secondary">
                  <Users className="h-8 w-8 text-muted-foreground/30" />
                </div>
                <p className="text-sm font-semibold text-card-foreground">No conversations yet</p>
                <p className="text-xs text-muted-foreground">
                  {isStudent
                    ? 'Tap the + button above to start chatting with a property owner.'
                    : 'Students will message you from property listings.'}
                </p>
                {isStudent && (
                  <Button size="sm" className="mt-1 rounded-xl" onClick={openNewChat}>
                    <Plus className="mr-1.5 h-3.5 w-3.5" />
                    Start a Conversation
                  </Button>
                )}
              </div>
            ) : (
              conversations.map((conv) => {
                const isActive = activeConversation?.id === conv.id
                return (
                  <button
                    key={conv.id}
                    onClick={() => selectConversation(conv)}
                    className={`flex w-full items-start gap-3 border-b p-4 text-left transition-all hover:bg-secondary/50 ${isActive ? 'bg-primary/5 border-l-[3px] border-l-primary' : 'border-l-[3px] border-l-transparent'}`}
                  >
                    <div className={`flex h-11 w-11 flex-shrink-0 items-center justify-center rounded-xl font-heading text-sm font-bold ${isActive ? 'bg-primary text-primary-foreground shadow-sm' : 'bg-primary/10 text-primary'}`}>
                      {conv.otherName.charAt(0).toUpperCase()}
                    </div>
                    <div className="min-w-0 flex-1">
                      <div className="flex items-center justify-between">
                        <span className="font-semibold text-card-foreground truncate">{conv.otherName}</span>
                        <span className="flex-shrink-0 text-[10px] text-muted-foreground">{format(new Date(conv.createdAt), 'MMM d')}</span>
                      </div>
                      <p className="mt-0.5 text-xs text-muted-foreground truncate">
                        {conv.propertyTitle
                          ? <><span className="text-primary/70">About:</span> {conv.propertyTitle}</>
                          : 'Tap to open chat'}
                      </p>
                    </div>
                  </button>
                )
              })
            )}
          </div>
        </aside>

        {/* ── Chat area ── */}
        <div className={`${showSidebar ? 'hidden md:flex' : 'flex'} min-h-0 flex-1 flex-col bg-background`}>
          {activeConversation ? (
            <>
              {/* Header */}
              <div className="flex items-center gap-3 border-b bg-card p-4">
                <button onClick={() => setShowSidebar(true)} className="md:hidden rounded-xl p-1.5 hover:bg-secondary" aria-label="Back">
                  <ArrowLeft className="h-5 w-5" />
                </button>
                <div className="flex h-10 w-10 items-center justify-center rounded-xl bg-primary text-primary-foreground font-heading font-bold shadow-sm">
                  {activeConversation.otherName.charAt(0).toUpperCase()}
                </div>
                <div className="flex-1">
                  <p className="font-semibold text-card-foreground">{activeConversation.otherName}</p>
                  <div className="flex items-center gap-1.5">
                    <span className="relative flex h-1.5 w-1.5">
                      <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-green-400 opacity-75" />
                      <span className="relative inline-flex rounded-full h-1.5 w-1.5 bg-green-500" />
                    </span>
                    <p className="text-[10px] text-muted-foreground">Live · Real-time chat</p>
                  </div>
                </div>
                <div className="relative" ref={headerMenuRef}>
                  <button onClick={() => setShowMenu((v) => !v)} className="flex h-9 w-9 items-center justify-center rounded-xl hover:bg-secondary transition-colors" aria-label="More options">
                    <MoreVertical className="h-4 w-4 text-muted-foreground" />
                  </button>
                  {showMenu && (
                    <div className="absolute right-0 top-10 z-30 w-48 overflow-hidden rounded-xl border bg-card shadow-xl shadow-black/10">
                      <button onClick={() => { setShowMenu(false); setConfirmModal('clear') }} className="flex w-full items-center gap-2.5 px-4 py-3 text-sm text-foreground hover:bg-secondary transition-colors">
                        <Eraser className="h-4 w-4 text-muted-foreground" />Clear Chat
                      </button>
                      <div className="h-px bg-border" />
                      <button onClick={() => { setShowMenu(false); setConfirmModal('delete') }} className="flex w-full items-center gap-2.5 px-4 py-3 text-sm text-destructive hover:bg-destructive/5 transition-colors">
                        <Trash2 className="h-4 w-4" />Delete Conversation
                      </button>
                    </div>
                  )}
                </div>
              </div>

              {/* Messages */}
              <div className="flex-1 overflow-y-auto p-4">
                {loadingMessages ? (
                  <div className="flex h-full items-center justify-center">
                    <div className="h-6 w-6 animate-spin rounded-full border-2 border-primary border-t-transparent" />
                  </div>
                ) : messages.length === 0 ? (
                  <div className="flex h-full items-center justify-center">
                    <div className="text-center">
                      <div className="mx-auto flex h-14 w-14 items-center justify-center rounded-2xl bg-secondary">
                        <MessageSquare className="h-7 w-7 text-muted-foreground/30" />
                      </div>
                      <p className="mt-3 text-sm font-medium text-muted-foreground">No messages yet</p>
                      <p className="mt-1 text-xs text-muted-foreground">Send your first message below 👇</p>
                    </div>
                  </div>
                ) : (
                  <div className="space-y-3">
                    {messages.map((msg) => (
                      <MessageBubble
                        key={msg.id}
                        msg={msg}
                        isOwn={msg.senderId === user.id}
                        user={user}
                        onEdit={handleEditMessage}
                        onDelete={handleDeleteMessage}
                        onResend={handleResend}
                      />
                    ))}
                    <div ref={messagesEndRef} />
                  </div>
                )}
              </div>

              {/* Input */}
              <div className="border-t bg-card px-4 py-3">
                <form onSubmit={handleSend} className="flex items-end gap-2">
                  <div className="flex-1 rounded-2xl border bg-background px-4 py-2.5 focus-within:border-primary/50 focus-within:ring-2 focus-within:ring-primary/10 transition-all">
                    <textarea
                      ref={inputRef}
                      value={inputText}
                      onChange={(e) => setInputText(e.target.value)}
                      onKeyDown={handleKeyDown}
                      placeholder="Type a message… (Enter to send)"
                      rows={1}
                      disabled={sending}
                      className="block w-full resize-none bg-transparent text-sm text-foreground placeholder:text-muted-foreground focus:outline-none"
                      style={{ maxHeight: '120px', overflowY: 'auto' }}
                    />
                  </div>
                  <Button
                    type="submit"
                    size="icon"
                    className="h-10 w-10 flex-shrink-0 rounded-xl shadow-sm shadow-primary/20"
                    disabled={!inputText.trim() || sending}
                  >
                    {sending
                      ? <span className="h-4 w-4 animate-spin rounded-full border-2 border-white border-t-transparent" />
                      : <Send className="h-4 w-4" />
                    }
                    <span className="sr-only">Send message</span>
                  </Button>
                </form>
                <p className="mt-1.5 text-center text-[10px] text-muted-foreground">Enter to send · Shift+Enter for new line</p>
              </div>
            </>
          ) : (
            /* Empty state */
            <div className="flex flex-1 flex-col items-center justify-center gap-4 p-6">
              <div className="flex h-20 w-20 items-center justify-center rounded-3xl bg-secondary">
                <MessageSquare className="h-10 w-10 text-muted-foreground/20" />
              </div>
              <div className="text-center">
                <h3 className="font-heading text-xl font-semibold text-foreground">Your messages</h3>
                <p className="mt-2 max-w-xs text-sm text-muted-foreground">
                  {isStudent
                    ? 'Select a conversation from the sidebar, or start a new one by tapping +'
                    : 'Select a conversation from the sidebar to read and reply.'}
                </p>
              </div>
              {isStudent && (
                <Button className="rounded-xl shadow-sm shadow-primary/20" onClick={openNewChat}>
                  <Plus className="mr-2 h-4 w-4" />
                  Start New Conversation
                </Button>
              )}
            </div>
          )}
        </div>
      </div>

      {/* ── New Chat Modal (students only) ── */}
      {showNewChat && (
        <div className="fixed inset-0 z-50 flex items-end sm:items-center justify-center bg-black/50 p-4 backdrop-blur-sm" onClick={() => setShowNewChat(false)}>
          <div className="w-full max-w-md rounded-2xl bg-card shadow-2xl overflow-hidden" onClick={(e) => e.stopPropagation()}>
            <div className="flex items-center justify-between border-b px-5 py-4">
              <h3 className="font-heading text-lg font-semibold text-card-foreground">Start a Chat</h3>
              <button onClick={() => setShowNewChat(false)} className="rounded-lg p-1.5 hover:bg-secondary transition-colors">
                <X className="h-4 w-4 text-muted-foreground" />
              </button>
            </div>
            <div className="px-5 pt-4">
              <div className="flex items-center gap-2 rounded-xl border bg-secondary/50 px-3 py-2">
                <Search className="h-4 w-4 text-muted-foreground flex-shrink-0" />
                <input
                  autoFocus
                  value={newChatSearch}
                  onChange={(e) => setNewChatSearch(e.target.value)}
                  placeholder="Search properties or owner names..."
                  className="w-full bg-transparent text-sm focus:outline-none"
                />
              </div>
            </div>
            <div className="max-h-72 overflow-y-auto px-5 py-3 space-y-2">
              {filteredProps.length === 0 ? (
                <p className="py-8 text-center text-sm text-muted-foreground">No properties found</p>
              ) : (
                filteredProps.map((p) => (
                  <button
                    key={p.id}
                    onClick={() => startChatWithProperty(p)}
                    disabled={!!startingChat}
                    className="flex w-full items-center gap-3 rounded-xl border bg-card p-3 text-left hover:border-primary/30 hover:bg-primary/5 transition-all disabled:opacity-60"
                  >
                    <div className="flex h-10 w-10 flex-shrink-0 items-center justify-center rounded-xl bg-primary/10">
                      {p.ownerRole === 'pgowner'
                        ? <Users className="h-5 w-5 text-primary" />
                        : <Building2 className="h-5 w-5 text-primary" />
                      }
                    </div>
                    <div className="min-w-0 flex-1">
                      <p className="text-sm font-semibold text-card-foreground truncate">{p.title}</p>
                      <p className="text-xs text-muted-foreground truncate">{p.ownerName || 'Owner'} · {p.location}</p>
                    </div>
                    {startingChat === p.id
                      ? <span className="h-4 w-4 animate-spin rounded-full border-2 border-primary border-t-transparent flex-shrink-0" />
                      : <MessageSquare className="h-4 w-4 text-muted-foreground flex-shrink-0" />
                    }
                  </button>
                ))
              )}
            </div>
          </div>
        </div>
      )}

      {/* ── Confirm Modal ── */}
      {confirmModal && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/50 p-4 backdrop-blur-sm" onClick={() => { if (!actionLoading) setConfirmModal(null) }}>
          <div className="w-full max-w-sm rounded-2xl bg-card p-6 shadow-2xl" onClick={(e) => e.stopPropagation()}>
            <div className="flex items-start gap-4">
              <div className={`flex h-11 w-11 flex-shrink-0 items-center justify-center rounded-xl ${confirmModal === 'delete' ? 'bg-destructive/10' : 'bg-amber-500/10'}`}>
                <AlertTriangle className={`h-5 w-5 ${confirmModal === 'delete' ? 'text-destructive' : 'text-amber-500'}`} />
              </div>
              <div>
                <h3 className="font-heading text-lg font-semibold text-card-foreground">
                  {confirmModal === 'clear' ? 'Clear Chat?' : 'Delete Conversation?'}
                </h3>
                <p className="mt-1.5 text-sm text-muted-foreground">
                  {confirmModal === 'clear'
                    ? 'All messages will be permanently deleted. The conversation thread will remain.'
                    : 'This will permanently delete the entire conversation and all messages.'}
                </p>
              </div>
            </div>
            <div className="mt-6 flex justify-end gap-3">
              <Button variant="outline" className="rounded-xl" onClick={() => setConfirmModal(null)} disabled={actionLoading}>Cancel</Button>
              <Button variant="destructive" className="rounded-xl" disabled={actionLoading} onClick={confirmModal === 'clear' ? handleClearChat : handleDeleteConversation}>
                {actionLoading ? (
                  <span className="flex items-center gap-2">
                    <span className="h-4 w-4 animate-spin rounded-full border-2 border-white border-t-transparent" />
                    {confirmModal === 'clear' ? 'Clearing...' : 'Deleting...'}
                  </span>
                ) : confirmModal === 'clear' ? 'Clear Messages' : 'Delete'}
              </Button>
            </div>
          </div>
        </div>
      )}
    </div>
  )
}
