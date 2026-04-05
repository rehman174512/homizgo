import { useState, useEffect, useRef } from 'react'
import { formatDistanceToNow, format } from 'date-fns'
import { useLocation } from 'react-router-dom'
import { Send, MessageSquare, User, Building2 } from 'lucide-react'
import { useAdminChat } from '../hooks/useAdminChat'

function ConversationItem({ conv, isActive, onClick }) {
  const timeAgo = conv.lastTime
    ? formatDistanceToNow(new Date(conv.lastTime), { addSuffix: true })
    : ''

  return (
    <button
      onClick={onClick}
      className={`w-full flex items-start gap-3 px-4 py-3.5 text-left transition-all hover:bg-secondary/50 border-b border-border/50 ${
        isActive ? 'bg-primary/5 border-l-2 border-l-primary' : ''
      }`}
    >
      <div className="w-9 h-9 rounded-full bg-primary/10 flex items-center justify-center shrink-0">
        <User className="w-4 h-4 text-primary" />
      </div>
      <div className="flex-1 min-w-0">
        <div className="flex justify-between items-center mb-0.5">
          <p className="font-semibold text-sm text-foreground truncate">{conv.ownerName}</p>
          <span className="text-xs text-muted-foreground/70 whitespace-nowrap ml-2">{timeAgo}</span>
        </div>
        <p className="text-xs text-muted-foreground truncate">{conv.propertyTitle}</p>
        <p className={`text-xs truncate mt-0.5 ${conv.hasUnread ? 'text-foreground font-medium' : 'text-muted-foreground/70'}`}>
          {conv.lastSender === 'admin' ? 'You: ' : ''}{conv.lastMessage}
        </p>
      </div>
      {conv.hasUnread && (
        <div className="w-2 h-2 rounded-full bg-primary shrink-0 mt-2" />
      )}
    </button>
  )
}

function MessageBubble({ msg }) {
  const isAdmin = msg.sender === 'admin'
  const time = msg.created_at
    ? format(new Date(msg.created_at), 'h:mm a')
    : ''

  return (
    <div className={`flex ${isAdmin ? 'justify-end' : 'justify-start'} mb-2`}>
      <div className={`max-w-[70%] ${isAdmin ? 'items-end' : 'items-start'} flex flex-col`}>
        <div
          className={`px-4 py-2.5 rounded-2xl text-sm leading-relaxed ${
            isAdmin
              ? 'bg-primary text-primary-foreground rounded-br-sm'
              : 'bg-secondary text-foreground rounded-bl-sm border border-border'
          }`}
        >
          {msg.content}
        </div>
        <span className="text-xs text-muted-foreground/60 mt-1 px-1">{time}</span>
      </div>
    </div>
  )
}

export default function AdminChatsPage() {
  const location = useLocation()
  const {
    conversations, activeOwnerId, messages, loading, sending,
    openConversation, sendMessage, initiateChat,
  } = useAdminChat()

  const [input, setInput] = useState('')
  const messagesEndRef = useRef(null)
  const activeConv = conversations.find(c => c.ownerId === activeOwnerId)

  // Auto-open from navigation state (from property card)
  useEffect(() => {
    const { ownerId, propertyId } = location.state || {}
    if (ownerId && propertyId) {
      initiateChat(ownerId, propertyId)
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [])

  // Scroll to bottom on new messages
  useEffect(() => {
    messagesEndRef.current?.scrollIntoView({ behavior: 'smooth' })
  }, [messages])

  const handleSend = async (e) => {
    e.preventDefault()
    if (!input.trim()) return
    await sendMessage(input, activeConv?.propertyId)
    setInput('')
  }

  return (
    <div className="h-[calc(100vh-3.5rem-3rem)] flex rounded-2xl border border-border overflow-hidden bg-card animate-in fade-in duration-300">
      {/* Conversation list */}
      <div className="w-80 shrink-0 border-r border-border flex flex-col">
        <div className="px-4 py-4 border-b border-border">
          <h2 className="font-bold text-foreground" style={{ fontFamily: 'var(--font-heading)' }}>Messages</h2>
          <p className="text-xs text-muted-foreground mt-0.5">{conversations.length} conversation{conversations.length !== 1 ? 's' : ''}</p>
        </div>

        <div className="flex-1 overflow-y-auto">
          {conversations.length === 0 ? (
            <div className="flex flex-col items-center justify-center h-full text-center px-6 py-12">
              <MessageSquare className="w-8 h-8 text-muted-foreground/40 mb-3" />
              <p className="text-sm font-medium text-muted-foreground">No conversations yet</p>
              <p className="text-xs text-muted-foreground/60 mt-1">
                Start a chat from a property card
              </p>
            </div>
          ) : (
            conversations.map(conv => (
              <ConversationItem
                key={conv.ownerId}
                conv={conv}
                isActive={conv.ownerId === activeOwnerId}
                onClick={() => openConversation(conv.ownerId)}
              />
            ))
          )}
        </div>
      </div>

      {/* Chat panel */}
      <div className="flex-1 flex flex-col min-w-0">
        {activeOwnerId ? (
          <>
            {/* Chat header */}
            <div className="px-6 py-4 border-b border-border flex items-center gap-3">
              <div className="w-9 h-9 rounded-full bg-primary/10 flex items-center justify-center">
                <User className="w-4 h-4 text-primary" />
              </div>
              <div>
                <p className="font-semibold text-foreground text-sm">{activeConv?.ownerName}</p>
                <div className="flex items-center gap-1.5 text-xs text-muted-foreground">
                  <Building2 className="w-3 h-3" />
                  {activeConv?.propertyTitle || 'Property Enquiry'}
                </div>
              </div>
            </div>

            {/* Messages */}
            <div className="flex-1 overflow-y-auto px-6 py-4">
              {loading ? (
                <div className="flex items-center justify-center h-full">
                  <div className="w-6 h-6 border-2 border-primary/30 border-t-primary rounded-full animate-spin" />
                </div>
              ) : messages.length === 0 ? (
                <div className="flex flex-col items-center justify-center h-full text-center">
                  <MessageSquare className="w-8 h-8 text-muted-foreground/30 mb-3" />
                  <p className="text-sm text-muted-foreground">No messages yet. Say hello!</p>
                </div>
              ) : (
                <>
                  {messages.map(msg => (
                    <MessageBubble key={msg.id} msg={msg} />
                  ))}
                  <div ref={messagesEndRef} />
                </>
              )}
            </div>

            {/* Input */}
            <form onSubmit={handleSend} className="px-6 py-4 border-t border-border flex gap-3">
              <input
                value={input}
                onChange={e => setInput(e.target.value)}
                placeholder="Type a message..."
                className="flex-1 px-4 py-2.5 rounded-xl border border-input bg-background text-foreground placeholder:text-muted-foreground focus:outline-none focus:ring-2 focus:ring-ring text-sm"
                disabled={sending}
              />
              <button
                type="submit"
                disabled={!input.trim() || sending}
                className="w-10 h-10 rounded-xl bg-primary text-primary-foreground flex items-center justify-center hover:opacity-90 active:scale-95 transition-all disabled:opacity-40 disabled:cursor-not-allowed"
              >
                {sending ? (
                  <span className="w-4 h-4 border-2 border-primary-foreground/30 border-t-primary-foreground rounded-full animate-spin" />
                ) : (
                  <Send className="w-4 h-4" />
                )}
              </button>
            </form>
          </>
        ) : (
          <div className="flex-1 flex flex-col items-center justify-center text-center p-8">
            <div className="w-16 h-16 rounded-2xl bg-secondary flex items-center justify-center mb-4">
              <MessageSquare className="w-8 h-8 text-muted-foreground/50" />
            </div>
            <h3 className="text-lg font-semibold text-foreground mb-2" style={{ fontFamily: 'var(--font-heading)' }}>
              Select a conversation
            </h3>
            <p className="text-sm text-muted-foreground max-w-xs">
              Choose a conversation from the left, or message an owner directly from a property card.
            </p>
          </div>
        )}
      </div>
    </div>
  )
}
