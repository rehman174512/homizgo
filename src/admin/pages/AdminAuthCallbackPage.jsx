import { useEffect, useRef, useState } from 'react'
import { useNavigate } from 'react-router-dom'
import { createClient } from '@/lib/supabase'
import { Shield, AlertTriangle } from 'lucide-react'

const ADMIN_EMAIL = 'raabdul08@gmail.com'

export default function AdminAuthCallbackPage() {
  const navigate = useNavigate()
  const [status, setStatus] = useState('loading') // 'loading' | 'denied' | 'error'
  const [errorMsg, setErrorMsg] = useState('')
  const processingRef = useRef(false)

  useEffect(() => {
    const supabase = createClient()
    let isMounted = true

    async function handleCallback(user) {
      if (!isMounted || processingRef.current) return
      processingRef.current = true

      try {
        if (user.email !== ADMIN_EMAIL) {
          // Not the admin — sign them out immediately
          await supabase.auth.signOut()
          if (isMounted) setStatus('denied')
          return
        }
        // Email matches — go to PIN verification
        if (isMounted) navigate('/admin/pin', { replace: true })
      } catch (err) {
        if (isMounted) {
          setErrorMsg(err.message || 'Something went wrong.')
          setStatus('error')
        }
      }
    }

    // Listen for auth state changes (Google callback)
    const { data: { subscription } } = supabase.auth.onAuthStateChange((event, session) => {
      if (session?.user && !processingRef.current) {
        handleCallback(session.user)
      }
    })

    // Also check immediately (session may already exist)
    supabase.auth.getSession().then(({ data: { session } }) => {
      if (session?.user && !processingRef.current) {
        handleCallback(session.user)
      }
    })

    // Timeout guard — 12s
    const timer = setTimeout(() => {
      if (isMounted && !processingRef.current) {
        setErrorMsg('Authentication timed out. Please try again.')
        setStatus('error')
      }
    }, 12000)

    return () => {
      isMounted = false
      subscription.unsubscribe()
      clearTimeout(timer)
    }
  }, [navigate])

  if (status === 'denied') {
    return (
      <div className="min-h-screen bg-[hsl(var(--background))] flex items-center justify-center p-4">
        <div className="max-w-md w-full text-center animate-in fade-in zoom-in duration-500">
          <div className="w-20 h-20 rounded-2xl bg-red-500/10 border border-red-500/20 flex items-center justify-center mx-auto mb-6">
            <AlertTriangle className="w-10 h-10 text-red-500" />
          </div>
          <h1 className="text-2xl font-bold text-foreground mb-3">Access Denied</h1>
          <p className="text-muted-foreground mb-8">
            The Google account you used is not authorized to access the admin console.
          </p>
          <button
            onClick={() => navigate('/admin/login', { replace: true })}
            className="px-6 py-2.5 rounded-xl bg-primary text-primary-foreground text-sm font-medium hover:opacity-90 transition-opacity"
          >
            Try Another Account
          </button>
        </div>
      </div>
    )
  }

  if (status === 'error') {
    return (
      <div className="min-h-screen bg-[hsl(var(--background))] flex items-center justify-center p-4">
        <div className="max-w-md w-full text-center animate-in fade-in zoom-in duration-500">
          <div className="w-20 h-20 rounded-2xl bg-destructive/10 border border-destructive/20 flex items-center justify-center mx-auto mb-6">
            <AlertTriangle className="w-10 h-10 text-destructive" />
          </div>
          <h1 className="text-2xl font-bold text-foreground mb-3">Authentication Failed</h1>
          <p className="text-muted-foreground mb-8">{errorMsg}</p>
          <button
            onClick={() => navigate('/admin/login', { replace: true })}
            className="px-6 py-2.5 rounded-xl bg-primary text-primary-foreground text-sm font-medium hover:opacity-90 transition-opacity"
          >
            Back to Login
          </button>
        </div>
      </div>
    )
  }

  return (
    <div className="min-h-screen bg-[hsl(var(--background))] flex items-center justify-center p-4">
      <div className="text-center space-y-5">
        <div className="w-16 h-16 rounded-2xl bg-primary/10 border border-primary/20 flex items-center justify-center mx-auto">
          <Shield className="w-8 h-8 text-primary animate-pulse" />
        </div>
        <div>
          <p className="font-semibold text-foreground">Verifying admin credentials…</p>
          <p className="text-sm text-muted-foreground mt-1">Please wait while we validate your access</p>
        </div>
        <div className="flex justify-center">
          <span className="w-6 h-6 border-2 border-primary/30 border-t-primary rounded-full animate-spin" />
        </div>
      </div>
    </div>
  )
}
