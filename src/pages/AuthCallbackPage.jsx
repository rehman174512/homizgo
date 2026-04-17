import { useEffect, useRef, useState } from 'react'
import { useNavigate } from 'react-router-dom'
import { createClient } from '@/lib/supabase'
import { Loader2, CheckCircle2, AlertTriangle } from 'lucide-react'

export default function AuthCallbackPage() {
  const navigate = useNavigate()
  const [status, setStatus] = useState('loading') // 'loading' | 'success' | 'error'
  const [errorMessage, setErrorMessage] = useState('')
  const processed = useRef(false)

  useEffect(() => {
    if (processed.current) return
    processed.current = true

    const supabase = createClient()

    async function handleCallback() {
      try {
        // 1. Exchange the PKCE code for a session.
        //    With flowType:'pkce', Supabase auto-handles the ?code= param in the URL.
        //    getSession() will trigger the exchange if a code is present.
        const { data: { session }, error: sessionError } = await supabase.auth.getSession()

        if (sessionError) throw sessionError

        // 2. If no session yet (can happen on slow connections), wait for the auth event
        if (!session) {
          await new Promise((resolve, reject) => {
            const timeout = setTimeout(() => {
              sub.data.subscription.unsubscribe()
              reject(new Error('Timed out waiting for authentication. Please try again.'))
            }, 10000)

            const sub = supabase.auth.onAuthStateChange((event, sess) => {
              if (sess) {
                clearTimeout(timeout)
                sub.data.subscription.unsubscribe()
                resolve(sess)
              }
            })
          })

          // Re-fetch session after the event fires
          const { data: { session: freshSession }, error: freshError } = await supabase.auth.getSession()
          if (freshError) throw freshError
          if (!freshSession) throw new Error('No valid session found. Please try logging in again.')
          await redirectUser(supabase, freshSession.user)
          return
        }

        await redirectUser(supabase, session.user)
      } catch (err) {
        console.error('[AuthCallback] Error:', err)
        setErrorMessage(err?.message || 'Something went wrong. Please try again.')
        setStatus('error')
      }
    }

    handleCallback()
  }, [navigate])

  async function redirectUser(supabase, user) {
    // 3. Fetch or create the profile row
    let { data: profile } = await supabase
      .from('users')
      .select('id, role, name')
      .eq('id', user.id)
      .maybeSingle()

    // 4. Apply the pending role the user selected on the Register page
    // Check both localStorage (same tab) and sessionStorage (just in case)
    const pendingRole =
      localStorage.getItem('homigo_pending_role') ||
      sessionStorage.getItem('homigo_pending_role')

    if (pendingRole) {
      localStorage.removeItem('homigo_pending_role')
      sessionStorage.removeItem('homigo_pending_role')

      // Only update if profile doesn't already have a specific role
      if (!profile || profile.role === 'student' || profile.role === 'user') {
        const { data: updatedProfile, error: updateError } = await supabase
          .from('users')
          .update({
            role: pendingRole,
            terms_accepted: true,
            privacy_policy_accepted: true,
            cookie_policy_accepted: true,
          })
          .eq('id', user.id)
          .select('id, role, name')
          .single()

        if (!updateError && updatedProfile) {
          profile = updatedProfile
        }
      }
    }

    // 5. Handle brand-new Google users who skipped role selection
    if (!pendingRole) {
      const noRole = !profile || profile.role === 'user' || profile.role === 'student'
      const isGoogleUser = user.app_metadata?.provider === 'google'
      if (isGoogleUser && noRole) {
        navigate('/select-role', { replace: true })
        return
      }
    }

    // 6. Send login email notification (non-blocking)
    import('@/lib/emailService').then(({ sendLoginEmail }) => {
      sendLoginEmail(
        user.email,
        user.user_metadata?.full_name || user.user_metadata?.name || profile?.name || 'User'
      )
    }).catch(() => {})

    // 7. Redirect to the correct dashboard
    setStatus('success')
    const role = profile?.role || 'user'
    setTimeout(() => {
      if (role === 'landlord') navigate('/dashboard/landlord', { replace: true })
      else if (role === 'pgowner') navigate('/dashboard/pgowner', { replace: true })
      else navigate('/dashboard/user', { replace: true })
    }, 600) // brief moment to show success state
  }

  return (
    <div className="min-h-screen flex items-center justify-center bg-background px-4">
      <div className="text-center space-y-5">
        <div className="mx-auto flex h-16 w-16 items-center justify-center overflow-hidden rounded-2xl bg-primary shadow-lg shadow-primary/20">
          <img src="/assets/logo.png" alt="Homizgo" className="h-full w-full object-contain p-3 brightness-0 invert" />
        </div>

        {status === 'loading' && (
          <>
            <Loader2 className="mx-auto h-8 w-8 animate-spin text-primary" />
            <div className="space-y-1">
              <p className="font-semibold text-foreground">Signing you in…</p>
              <p className="text-sm text-muted-foreground">Please wait while we set up your account.</p>
            </div>
          </>
        )}

        {status === 'success' && (
          <>
            <CheckCircle2 className="mx-auto h-8 w-8 text-green-500 animate-bounce" />
            <div className="space-y-1">
              <p className="font-semibold text-foreground">Signed in!</p>
              <p className="text-sm text-muted-foreground">Taking you to your dashboard…</p>
            </div>
          </>
        )}

        {status === 'error' && (
          <>
            <AlertTriangle className="mx-auto h-8 w-8 text-destructive" />
            <div className="space-y-2">
              <h1 className="text-xl font-bold text-destructive">Authentication Failed</h1>
              <p className="text-sm text-muted-foreground max-w-sm">{errorMessage}</p>
              <a
                href="/login"
                className="inline-block mt-4 rounded-xl bg-primary px-6 py-2.5 text-sm font-semibold text-primary-foreground hover:bg-primary/90 transition-colors"
              >
                Back to Login
              </a>
            </div>
          </>
        )}
      </div>
    </div>
  )
}
