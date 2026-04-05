import { useState, useEffect } from 'react'
import { Link, useNavigate } from 'react-router-dom'
import { getCurrentUser } from '@/lib/store'
import { signInWithGoogle } from '@/lib/authService'
import SEO from '@/components/SEO'
import { Navbar } from '@/components/Navbar'
import { Button } from '@/components/ui/button'
import { GoogleIcon } from '@/components/GoogleIcon'

export default function LoginPage() {
  const [error, setError] = useState('')
  const [googleLoading, setGoogleLoading] = useState(false)
  const navigate = useNavigate()

  // Rate Limiting States (Client-Side)
  const [attempts, setAttempts] = useState(() => {
    return parseInt(localStorage.getItem('homizgo_login_attempts') || '0', 10);
  });
  const [lockoutUntil, setLockoutUntil] = useState(() => {
    return parseInt(localStorage.getItem('homizgo_login_lockout') || '0', 10);
  });

  const isLockedOut = Date.now() < lockoutUntil;

  useEffect(() => {
    let active = true
    async function checkUser() {
      try {
        const current = await getCurrentUser()
        if (active && current) {
          if (current.role === 'landlord') navigate('/dashboard/landlord')
          else if (current.role === 'pgowner') navigate('/dashboard/pgowner')
          else navigate('/dashboard/user')
        }
      } catch (_) {
        // Session check failed silently — user stays on login
      }
    }
    checkUser()
    return () => { active = false }
  }, [navigate])

  useEffect(() => {
    // If locked out, set a timer to automatically re-enable the form
    if (isLockedOut) {
      const timer = setTimeout(() => {
        setAttempts(0);
        setLockoutUntil(0);
        localStorage.removeItem('homizgo_login_attempts');
        localStorage.removeItem('homizgo_login_lockout');
        setError(''); // clear the error message
      }, lockoutUntil - Date.now());
      return () => clearTimeout(timer);
    }
  }, [isLockedOut, lockoutUntil]);

  const handleGoogleSignIn = async () => {
    if (isLockedOut || googleLoading) return;

    setError('')
    setGoogleLoading(true)
    try {
      await signInWithGoogle()
      // Browser will redirect to Google; no need to setGoogleLoading(false)
    } catch (err) {
      setError(err.message || 'Google sign-in failed')
      setGoogleLoading(false)

      // Increment local UI attempts and lock out if >= 3 fails
      const newAttempts = attempts + 1;
      setAttempts(newAttempts);
      localStorage.setItem('homizgo_login_attempts', newAttempts.toString());
      
      if (newAttempts >= 3 && !isLockedOut) {
        const newLockout = Date.now() + 15 * 60 * 1000; // 15 mins block
        setLockoutUntil(newLockout);
        localStorage.setItem('homizgo_login_lockout', newLockout.toString());
        setError("Too many login attempts. Please wait 15 minutes.");
      }
    }
  }

  return (
    <div className="min-h-screen">
      <SEO 
        title="Login - Homizgo"
        description="Sign in to your Homizgo account to find and secure your perfect PG or flat rental."
        url="/login"
      />
      <Navbar />
      <main className="flex items-center justify-center px-4 py-16">
        <div className="w-full max-w-sm">
          <div className="relative overflow-hidden rounded-3xl border bg-card p-8 shadow-xl shadow-primary/5">
            <div className="absolute -right-12 -top-12 h-40 w-40 rounded-full bg-primary/5 blur-2xl" />
            <div className="absolute -left-8 -bottom-8 h-32 w-32 rounded-full bg-accent/5 blur-2xl" />

            {/* Logo & heading */}
            <div className="relative mb-8 text-center">
              <div className="mx-auto mb-4 flex h-16 w-16 items-center justify-center overflow-hidden rounded-2xl bg-primary shadow-lg shadow-primary/20">
                <img src="/assets/logo.png" alt="Homizgo" className="h-full w-full object-contain p-3 brightness-0 invert" />
              </div>
              <h1 className="font-heading text-2xl font-bold text-card-foreground">Welcome to Homizgo</h1>
              <p className="mt-1.5 text-sm text-muted-foreground">Sign in to find your perfect stay</p>
            </div>

            {error && (
              <div className="relative mb-5 rounded-xl bg-destructive/10 p-3 text-sm font-medium text-destructive">
                {error}
              </div>
            )}

            {/* Google sign-in button */}
            <Button
              type="button"
              variant="outline"
              className="w-full rounded-xl h-12 gap-3 font-semibold text-base hover:bg-secondary/80 transition-all hover:shadow-md disabled:opacity-50"
              onClick={handleGoogleSignIn}
              disabled={isLockedOut || googleLoading}
            >
              <GoogleIcon />
              {googleLoading ? 'Redirecting to Google…' : isLockedOut ? 'Locked Temporarily' : 'Continue with Google'}
            </Button>

            {isLockedOut && (
              <p className="mt-3 text-sm text-center text-muted-foreground animate-pulse">
                Try again in {Math.ceil((lockoutUntil - Date.now()) / 60000)} minutes.
              </p>
            )}

            <p className="relative mt-6 text-center text-xs text-muted-foreground">
              By continuing, you agree to our{' '}
              <Link to="/" className="text-primary hover:underline">Terms</Link>
              {' '}and{' '}
              <Link to="/" className="text-primary hover:underline">Privacy Policy</Link>
            </p>

            <p className="relative mt-4 text-center text-sm text-muted-foreground">
              {"New here? "}
              <Link to="/register" className="font-semibold text-primary hover:underline">Create an account</Link>
            </p>
          </div>
        </div>
      </main>
    </div>
  )
}

