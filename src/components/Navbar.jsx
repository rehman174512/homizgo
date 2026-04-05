import { useEffect, useState } from 'react'
import { Link, useLocation, useNavigate } from 'react-router-dom'
import { useTheme } from 'next-themes'
import { getCurrentUser, setCurrentUser, getUserThreadIds } from '@/lib/store'
import {
  Home,
  LogOut,
  Menu,
  MessageSquare,
  Moon,
  Sun,
  X,
  LayoutDashboard,
  UserCircle,
  ArrowRight,
  UserPlus,
} from 'lucide-react'
import { Button } from '@/components/ui/button'
import { createClient } from '@/lib/supabase'

const supabase = createClient()

export function Navbar() {
  const [user, setUser] = useState(null)
  const [mobileOpen, setMobileOpen] = useState(false)
  const [mounted, setMounted] = useState(false)
  const [scrolled, setScrolled] = useState(false)
  const [hasNewMessage, setHasNewMessage] = useState(() => {
    return localStorage.getItem('homizgo_unread_chat') === 'true'
  })
  const { theme, setTheme } = useTheme()
  const location = useLocation()
  const pathname = location.pathname
  const navigate = useNavigate()

  useEffect(() => {
    let active = true
    setMounted(true)
    async function initUser() {
      const u = await getCurrentUser()
      if (active) setUser(u)
    }
    initUser()
    
    // Listen for real-time profile updates from ProfilePage
    const handleUserUpdate = (e) => {
      if (active) setUser(e.detail)
    }
    window.addEventListener('homizgo-user-updated', handleUserUpdate)

    return () => {
      active = false
      window.removeEventListener('homizgo-user-updated', handleUserUpdate)
    }
  }, [location.pathname])

  useEffect(() => {
    const handleScroll = () => setScrolled(window.scrollY > 16)
    window.addEventListener('scroll', handleScroll)
    return () => window.removeEventListener('scroll', handleScroll)
  }, [])

  // Real-time chat notifications with persistence
  useEffect(() => {
    if (!user) return
    let active = true
    let channel = null
    const syncChannel = new BroadcastChannel('homizgo_sync')

    async function setupChatListener() {
      try {
        const threadIds = await getUserThreadIds(user.id)
        if (!active || threadIds.length === 0) return

        // Initial check for unread messages since last visit
        const lastSeen = localStorage.getItem('homizgo_last_chat_seen') || new Date(0).toISOString()
        const { count, error } = await supabase
          .from('chat_messages')
          .select('id', { count: 'exact', head: true })
          .in('thread_id', threadIds)
          .neq('sender_id', user.id)
          .gt('created_at', lastSeen)

        if (!error && count > 0) {
          setHasNewMessage(true)
          localStorage.setItem('homizgo_unread_chat', 'true')
        }

        channel = supabase
          .channel('global-chat-notifications')
          .on(
            'postgres_changes',
            {
              event: 'INSERT',
              schema: 'public',
              table: 'chat_messages',
            },
            (payload) => {
              if (
                active &&
                threadIds.includes(payload.new.thread_id) &&
                payload.new.sender_id !== user.id &&
                window.location.pathname !== '/chat'
              ) {
                setHasNewMessage(true)
                localStorage.setItem('homizgo_unread_chat', 'true')
                // Notify other tabs
                syncChannel.postMessage({ type: 'NEW_CHAT_MESSAGE' })
              }
            }
          )
          .subscribe()
      } catch (_) {
        // Chat listener failed silently — badge will just not show
      }
    }

    setupChatListener()

    // Listen for sync from other tabs
    syncChannel.onmessage = (event) => {
      if (!active) return
      if (event.data.type === 'CHAT_READ') {
        setHasNewMessage(false)
      } else if (event.data.type === 'NEW_CHAT_MESSAGE') {
        if (window.location.pathname !== '/chat') {
          setHasNewMessage(true)
        }
      } else if (event.data.type === 'PROFILE_UPDATED') {
        // Refresh local user state
        getCurrentUser().then(u => {
          if (active) setUser(u)
        })
      }
    }

    // Clear badge if navigating to chat
    if (pathname === '/chat') {
      setHasNewMessage(false)
      localStorage.setItem('homizgo_unread_chat', 'false')
      localStorage.setItem('homizgo_last_chat_seen', new Date().toISOString())
      // Sync with other tabs
      syncChannel.postMessage({ type: 'CHAT_READ' })
    }

    return () => {
      active = false
      if (channel) supabase.removeChannel(channel)
      syncChannel.close()
    }
  }, [user, pathname])

  const handleLogout = async () => {
    await setCurrentUser(null)
    setUser(null)
    navigate('/')
  }

  const dashboardLink = user
    ? user.role === 'landlord'
      ? '/dashboard/landlord'
      : user.role === 'pgowner'
        ? '/dashboard/pgowner'
        : '/dashboard/user'
    : null

  const navLinks = [
    { href: '/', label: 'Home', icon: Home },
    ...(user
      ? [
          { href: dashboardLink, label: 'Dashboard', icon: LayoutDashboard },
          { href: '/chat', label: 'Chat', icon: MessageSquare, badge: hasNewMessage },
        ]
      : []),
  ]

  return (
    <>
      <header
        className={`sticky top-0 z-50 w-full transition-all duration-300 ${
          scrolled
            ? 'border-b border-border/60 bg-background/85 backdrop-blur-xl shadow-sm'
            : 'bg-transparent'
        }`}
      >
        <div className="mx-auto flex h-16 max-w-7xl items-center justify-between px-4 lg:px-8">
          <Link to="/" className="group flex items-center gap-2.5">
            <div className="flex h-9 w-9 items-center justify-center overflow-hidden rounded-xl bg-primary transition-transform group-hover:scale-105 shadow-sm">
              <img src="/assets/logo.png" alt="Homizgo" className="h-full w-full object-contain p-1.5 brightness-0 invert" />
            </div>
            <span className="font-heading text-xl font-bold tracking-tight">Homizgo</span>
          </Link>

          <nav className="hidden items-center gap-1 md:flex" role="navigation" aria-label="Main navigation">
            {navLinks.map((link) => (
              <Link
                key={link.href}
                to={link.href}
                className={`relative flex items-center gap-2 rounded-xl px-4 py-2 text-sm font-medium transition-all ${
                  pathname === link.href
                    ? 'bg-primary/10 text-primary'
                    : 'text-muted-foreground hover:bg-secondary hover:text-foreground'
                }`}
              >
                <link.icon className="h-4 w-4" />
                {link.label}
                {link.badge && (
                  <span className="absolute -top-1 -right-1 flex h-2.5 w-2.5 rounded-full bg-destructive ring-2 ring-background shadow-[0_0_8px_hsl(var(--destructive)/0.5)]"></span>
                )}
                {pathname === link.href && (
                  <span className="absolute bottom-0 left-1/2 h-0.5 w-6 -translate-x-1/2 rounded-full bg-primary" />
                )}
              </Link>
            ))}
          </nav>

          <div className="flex items-center gap-2">
            {mounted && (
              <Button
                variant="ghost"
                size="icon"
                className="rounded-xl"
                onClick={() => setTheme(theme === 'dark' ? 'light' : 'dark')}
                aria-label="Toggle theme"
              >
                {theme === 'dark' ? <Sun className="h-5 w-5" /> : <Moon className="h-5 w-5" />}
              </Button>
            )}

            {user ? (
              <div className="hidden items-center gap-3 md:flex">
                <Link
                  to="/profile"
                  className="relative flex items-center gap-2 rounded-xl bg-secondary px-3 py-1.5 hover:bg-secondary/70 transition-colors"
                >
                  <div className="relative flex h-6 w-6 items-center justify-center rounded-full bg-primary text-primary-foreground text-xs font-bold">
                    {user.name.charAt(0)}
                    {(!user.phone || (!user.gender && (user.role === 'user' || user.role === 'student'))) && (
                      <span className="absolute -top-1 -right-1 flex h-2.5 w-2.5 rounded-full bg-destructive ring-2 ring-background"></span>
                    )}
                  </div>
                  <span className="text-sm font-medium text-foreground">
                    {user.name.split(' ')[0]}
                  </span>
                  <UserCircle className="h-3.5 w-3.5 text-muted-foreground" />
                </Link>
                <Button variant="ghost" size="sm" className="rounded-xl" onClick={handleLogout}>
                  <LogOut className="mr-1.5 h-4 w-4" />
                  Logout
                </Button>
              </div>
            ) : (
              <div className="hidden items-center gap-2 md:flex">
                <Link to="/login">
                  <Button variant="ghost" size="sm" className="rounded-xl">Log in</Button>
                </Link>
                <Link to="/register">
                  <Button size="sm" className="rounded-xl">
                    <UserPlus className="mr-1.5 h-4 w-4" />
                    Get Started
                  </Button>
                </Link>
              </div>
            )}

            <Button
              variant="ghost"
              size="icon"
              className="rounded-xl md:hidden"
              onClick={() => setMobileOpen(!mobileOpen)}
              aria-label="Toggle menu"
            >
              {mobileOpen ? <X className="h-5 w-5" /> : <Menu className="h-5 w-5" />}
            </Button>
          </div>
        </div>

        {mobileOpen && (
          <div className="border-t bg-background/95 backdrop-blur-xl md:hidden">
            <nav className="flex flex-col gap-1 p-4" role="navigation" aria-label="Mobile navigation">
              {navLinks.map((link) => (
                <Link
                  key={link.href}
                  to={link.href}
                  onClick={() => setMobileOpen(false)}
                  className={`flex items-center gap-3 rounded-xl px-4 py-3 text-sm font-medium transition-colors ${
                    pathname === link.href
                      ? 'bg-primary/10 text-primary'
                      : 'text-muted-foreground hover:bg-secondary'
                  }`}
                >
                  <link.icon className="h-5 w-5" />
                  {link.label}
                  {link.badge && (
                    <span className="ml-auto flex h-2.5 w-2.5 rounded-full bg-destructive shadow-[0_0_8px_hsl(var(--destructive)/0.5)]"></span>
                  )}
                </Link>
              ))}
              <div className="mt-3 border-t pt-3">
                {user ? (
                  <>
                    <div className="flex items-center gap-3 px-4 py-2">
                      <div className="flex h-8 w-8 items-center justify-center rounded-full bg-primary text-primary-foreground text-sm font-bold">
                        {user.name.charAt(0)}
                      </div>
                      <div>
                        <span className="text-sm font-medium text-foreground">{user.name}</span>
                        <span className="ml-2 rounded-full bg-primary/10 px-2 py-0.5 text-xs font-medium capitalize text-primary">
                          {user.role === 'pgowner' ? 'PG Owner' : (user.role === 'landlord' ? 'landlord/Student Host (for seniors renting/sharing)' : user.role)}
                        </span>
                      </div>
                    </div>
                    <Button
                      variant="outline"
                      size="sm"
                      className="mt-2 w-full rounded-xl"
                      onClick={() => { handleLogout(); setMobileOpen(false) }}
                    >
                      <LogOut className="mr-1.5 h-4 w-4" />
                      Logout
                    </Button>
                  </>
                ) : (
                  <div className="flex flex-col gap-2">
                    <Link to="/login" onClick={() => setMobileOpen(false)}>
                      <Button variant="outline" size="sm" className="w-full rounded-xl">Login</Button>
                    </Link>
                    <Link to="/register" onClick={() => setMobileOpen(false)}>
                      <Button size="sm" className="w-full rounded-xl">
                        <ArrowRight className="mr-1.5 h-4 w-4" />
                        Get Started
                      </Button>
                    </Link>
                  </div>
                )}
              </div>
            </nav>
          </div>
        )}
      </header>

      {user && (
        <nav
          className="fixed bottom-0 left-0 right-0 z-50 border-t bg-background/95 backdrop-blur-xl md:hidden"
          role="navigation"
          aria-label="Mobile bottom navigation"
        >
          <div className="flex items-center justify-around py-2">
            {navLinks.map((link) => (
              <Link
                key={link.href}
                to={link.href}
                className={`flex flex-col items-center gap-1 rounded-xl px-3 py-1.5 text-xs font-medium transition-colors ${
                  pathname === link.href ? 'text-primary' : 'text-muted-foreground'
                }`}
              >
                <div className="relative">
                  <link.icon className={`h-5 w-5 ${pathname === link.href ? 'drop-shadow-[0_0_6px_hsl(var(--primary)/0.4)]' : ''}`} />
                  {link.badge && (
                    <span className="absolute -top-1 -right-1 flex h-2.5 w-2.5 rounded-full bg-destructive ring-2 ring-background shadow-[0_0_8px_hsl(var(--destructive)/0.5)]"></span>
                  )}
                </div>
                {link.label}
              </Link>
            ))}
            <button
              onClick={handleLogout}
              className="flex flex-col items-center gap-1 rounded-xl px-3 py-1.5 text-xs font-medium text-muted-foreground transition-colors"
            >
              <LogOut className="h-5 w-5" />
              Logout
            </button>
          </div>
        </nav>
      )}
    </>
  )
}
