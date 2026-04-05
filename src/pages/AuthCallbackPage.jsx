import { useEffect, useRef, useState } from 'react'
import { useNavigate } from 'react-router-dom'
import { createClient } from '@/lib/supabase'
import { Loader2 } from 'lucide-react'

export default function AuthCallbackPage() {
  const navigate = useNavigate()
  const [status, setStatus] = useState('loading')
  const [errorMessage, setErrorMessage] = useState('')

  useEffect(() => {
    const supabase = createClient()
    const processingRef = { current: false }
    
    // Use a local variable to track component mount status for this specific effect run
    let isMounted = true

    async function handleUserSession(user) {
      if (!isMounted || processingRef.current) return
      processingRef.current = true

      try {
        let { data: profile } = await supabase
          .from('users')
          .select('id, role')
          .eq('id', user.id)
          .single()

        // Apply pending role from Google Sign-Up if exists
        const pendingRole = localStorage.getItem('homigo_pending_role')
        if (pendingRole) {
          localStorage.removeItem('homigo_pending_role')
          // If profile's role is missing or default student/user, update it to what they selected
          if (!profile || profile.role === 'student' || profile.role === 'user') {
            const { data: updatedProfile, error: updateError } = await supabase
              .from('users')
              .update({ role: pendingRole, terms_accepted: true, privacy_policy_accepted: true, cookie_policy_accepted: true })
              .eq('id', user.id)
              .select('id, role')
              .single()
            
            if (!updateError && updatedProfile) {
              profile = updatedProfile
            }
          }
        }

        if (!isMounted) return

        // New Google user without a proper role — send to role selection
        const noRole = !profile || profile.role === 'user' || profile.role === 'student'
        const isGoogleUser = user.app_metadata?.provider === 'google'
        if (isGoogleUser && noRole && !pendingRole) {
          const hasSelectedRole = localStorage.getItem('homigo_role_selected')
          if (!hasSelectedRole) {
            navigate('/select-role', { replace: true })
            return
          }
        }

        if (!profile) {
          navigate('/dashboard/user', { replace: true })
        } else {
          // Send Successful Login Email
          import('@/lib/emailService').then(({ sendLoginEmail }) => {
            sendLoginEmail(user.email, user.user_metadata?.full_name || user.user_metadata?.name || profile.name)
          }).catch(err => console.error('[AuthCallback] Email notification failed:', err))

          if (profile.role === 'landlord') navigate('/dashboard/landlord', { replace: true })
          else if (profile.role === 'pgowner') navigate('/dashboard/pgowner', { replace: true })
          else navigate('/dashboard/user', { replace: true })
        }
      } catch (err) {
        if (isMounted) {
          console.error('[AuthCallback] Profile error:', err)
          setErrorMessage(err?.message || 'Something went wrong fetching your profile.')
          setStatus('error')
        }
        processingRef.current = false // Allow retry if it failed due to network
      }
    }

    // 1. Listen for auth state changes
    const { data: { subscription } } = supabase.auth.onAuthStateChange((event, session) => {
      if (session?.user && !processingRef.current) {
        handleUserSession(session.user)
      }
    })

    // 2. Initial check + retry logic
    let retryAttempted = false
    const checkSession = async () => {
      const { data: { session }, error } = await supabase.auth.getSession()
      
      if (error) {
        if (isMounted) {
          setErrorMessage(error.message || 'Authentication failed.')
          setStatus('error')
        }
        return
      }

      if (session?.user) {
        handleUserSession(session.user)
      } else if (!retryAttempted) {
        retryAttempted = true
        // Wait briefly; the token may still be processing in the URL params
        setTimeout(async () => {
          if (!isMounted || processingRef.current) return
          const { data: { session: retrySession } } = await supabase.auth.getSession()
          if (retrySession?.user) {
            handleUserSession(retrySession.user)
          } else if (isMounted) {
            setErrorMessage('No valid session found. Please try logging in again.')
            setStatus('error')
          }
        }, 1500)
      }
    }

    checkSession()

    // 3. Absolute timeout guard (12 seconds)
    const failoverTimer = setTimeout(() => {
      if (isMounted && !processingRef.current) {
        // Only trigger if we are still 'loading'
        setStatus(current => {
          if (current === 'loading') {
            setErrorMessage('Authentication timed out. Please check your internet or try again.')
            return 'error'
          }
          return current
        })
      }
    }, 12000)

    return () => {
      isMounted = false
      subscription.unsubscribe()
      clearTimeout(failoverTimer)
    }
  }, [navigate])

  return (
    <div className="min-h-screen flex items-center justify-center bg-background px-4">
      <div className="text-center space-y-4">
        <div className="mx-auto flex h-16 w-16 items-center justify-center overflow-hidden rounded-2xl bg-primary shadow-lg shadow-primary/20">
          <img src="/assets/logo.png" alt="Homizgo" className="h-full w-full object-contain p-3 brightness-0 invert" />
        </div>

        {status === 'loading' ? (
          <>
            <Loader2 className="mx-auto h-8 w-8 animate-spin text-primary" />
            <p className="text-sm text-muted-foreground">Signing you in...</p>
          </>
        ) : (
          <>
            <h1 className="text-xl font-bold text-destructive">Authentication Failed</h1>
            <p className="text-sm text-muted-foreground max-w-sm">{errorMessage}</p>
            <a href="/login" className="inline-block mt-4 text-sm font-semibold text-primary hover:underline">
              Back to Login
            </a>
          </>
        )}
      </div>
    </div>
  )
}
