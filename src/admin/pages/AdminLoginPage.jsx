import { useState, useEffect } from 'react'
import { useNavigate } from 'react-router-dom'
import { Shield, AlertTriangle, Loader2 } from 'lucide-react'
import { adminSignIn } from '../services/adminService'
import { GoogleIcon } from '@/components/GoogleIcon'
import { createClient } from '@/lib/supabase'

const ADMIN_EMAIL = 'raabdul08@gmail.com'

export default function AdminLoginPage() {
  const navigate = useNavigate()
  const [loading, setLoading] = useState(true)   // start true — check session first
  const [googleLoading, setGoogleLoading] = useState(false)
  const [error, setError] = useState(null)
  const [accessDenied, setAccessDenied] = useState(false)

  // ── On mount: check if admin is already signed in ──────────────────────────
  useEffect(() => {
    let mounted = true
    async function checkExistingSession() {
      try {
        const supabase = createClient()
        const { data: { session } } = await supabase.auth.getSession()
        if (!mounted) return

        if (session?.user?.email === ADMIN_EMAIL) {
          // Already signed in as admin — go to PIN
          navigate('/admin/pin', { replace: true })
          return
        }
      } catch (_) {
        // ignore
      } finally {
        if (mounted) setLoading(false)
      }
    }
    checkExistingSession()
    return () => { mounted = false }
  }, [navigate])

  const handleGoogleSignIn = async () => {
    setError(null)
    setGoogleLoading(true)
    try {
      await adminSignIn()
      // Browser redirects to Google — no further action
    } catch (err) {
      if (err.message === 'ACCESS_DENIED') {
        setAccessDenied(true)
      } else {
        setError(err.message || 'Authentication failed.')
      }
      setGoogleLoading(false)
    }
  }

  // ── Access Denied screen ───────────────────────────────────────────────────
  if (accessDenied) {
    return (
      <div className="min-h-screen bg-[hsl(var(--background))] flex items-center justify-center p-4">
        <div className="max-w-md w-full text-center animate-in fade-in zoom-in duration-500">
          <div className="w-20 h-20 rounded-2xl bg-red-500/10 border border-red-500/20 flex items-center justify-center mx-auto mb-6">
            <AlertTriangle className="w-10 h-10 text-red-500" />
          </div>
          <h1 className="text-3xl font-bold text-foreground mb-3" style={{ fontFamily: 'var(--font-heading)' }}>
            Access Denied
          </h1>
          <p className="text-muted-foreground text-lg mb-2">
            This admin portal is restricted to authorized personnel only.
          </p>
          <p className="text-muted-foreground/60 text-sm mb-8">
            The Google account you used is not authorized to access this console.
          </p>
          <div className="flex gap-3 justify-center">
            <button
              onClick={() => setAccessDenied(false)}
              className="px-5 py-2.5 rounded-xl border border-border text-sm font-medium hover:bg-secondary transition-colors"
            >
              Try Another Account
            </button>
            <button
              onClick={() => navigate('/')}
              className="px-5 py-2.5 rounded-xl bg-primary text-primary-foreground text-sm font-medium hover:opacity-90 transition-opacity"
            >
              Return Home
            </button>
          </div>
        </div>
      </div>
    )
  }

  // ── Checking session spinner ───────────────────────────────────────────────
  if (loading) {
    return (
      <div className="min-h-screen bg-[hsl(var(--background))] flex items-center justify-center">
        <Loader2 className="w-8 h-8 text-primary animate-spin" />
      </div>
    )
  }

  // ── Main login card ────────────────────────────────────────────────────────
  return (
    <div className="min-h-screen bg-[hsl(var(--background))] flex items-center justify-center p-4">
      {/* Background gradient orbs */}
      <div className="fixed inset-0 overflow-hidden pointer-events-none">
        <div className="absolute -top-40 -left-40 w-80 h-80 bg-primary/10 rounded-full blur-3xl" />
        <div className="absolute -bottom-40 -right-40 w-80 h-80 bg-accent/10 rounded-full blur-3xl" />
      </div>

      <div className="relative w-full max-w-md animate-in fade-in slide-in-from-bottom-4 duration-500">
        {/* Logo + badge */}
        <div className="text-center mb-8">
          <div className="inline-flex items-center gap-2 bg-primary/10 text-primary px-4 py-2 rounded-full text-sm font-medium mb-6 border border-primary/20">
            <Shield className="w-4 h-4" />
            Admin Portal
          </div>
          <h1 className="text-3xl font-bold text-foreground" style={{ fontFamily: 'var(--font-heading)' }}>
            Homizgo Console
          </h1>
          <p className="text-muted-foreground mt-2">
            Restricted access · Authorized personnel only
          </p>
        </div>

        {/* Card */}
        <div className="bg-card border border-border rounded-2xl p-8 shadow-lg shadow-primary/5">
          <div className="flex items-center gap-3 mb-6 pb-6 border-b border-border">
            <div className="w-10 h-10 rounded-xl bg-primary/10 flex items-center justify-center">
              <Shield className="w-5 h-5 text-primary" />
            </div>
            <div>
              <p className="font-semibold text-foreground">Sign in to continue</p>
              <p className="text-xs text-muted-foreground">Step 1 of 2 · Google Account Verification</p>
            </div>
          </div>

          <p className="text-sm text-muted-foreground mb-6">
            Use your authorized Google account. Only the designated admin account will be granted access.
          </p>

          {error && (
            <div className="flex items-center gap-2 bg-destructive/10 border border-destructive/20 text-destructive px-4 py-3 rounded-xl text-sm mb-4">
              <AlertTriangle className="w-4 h-4 shrink-0" />
              {error}
            </div>
          )}

          <button
            onClick={handleGoogleSignIn}
            disabled={googleLoading}
            className="w-full py-3 px-4 rounded-xl border border-border bg-background hover:bg-secondary/80 text-foreground font-semibold flex items-center justify-center gap-3 transition-all hover:shadow-md active:scale-[0.98] disabled:opacity-50 disabled:cursor-not-allowed"
          >
            {googleLoading ? (
              <>
                <span className="w-4 h-4 border-2 border-foreground/20 border-t-foreground rounded-full animate-spin" />
                Redirecting to Google…
              </>
            ) : (
              <>
                <GoogleIcon />
                Continue with Google
              </>
            )}
          </button>
        </div>

        <p className="text-center text-xs text-muted-foreground/60 mt-6">
          Protected by Supabase Auth · Homizgo © 2026
        </p>
      </div>
    </div>
  )
}
