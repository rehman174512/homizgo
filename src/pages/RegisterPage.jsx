import { useState, useEffect } from 'react'
import { Link, useNavigate } from 'react-router-dom'
import { signInWithGoogle } from '@/lib/authService'
import SEO from '@/components/SEO'
import { Navbar } from '@/components/Navbar'
import { Button } from '@/components/ui/button'
import { Label } from '@/components/ui/label'
import { GoogleIcon } from '@/components/GoogleIcon'
import {
  User, Home, Building, CheckCircle2,
  ExternalLink, ArrowRight, ArrowLeft,
} from 'lucide-react'

export default function RegisterPage() {
  const [step, setStep] = useState(1)
  const [role, setRole] = useState('user')
  const [gender, setGender] = useState('male')
  const [agreedToTerms, setAgreedToTerms] = useState(false)

  const [error, setError] = useState('')
  const [googleLoading, setGoogleLoading] = useState(false)
  const navigate = useNavigate()

  // Rate Limiting States (Client-Side)
  const [attempts, setAttempts] = useState(() => {
    return parseInt(localStorage.getItem('npo_login_attempts') || '0', 10);
  });
  const [lockoutUntil, setLockoutUntil] = useState(() => {
    return parseInt(localStorage.getItem('npo_login_lockout') || '0', 10);
  });

  const isLockedOut = Date.now() < lockoutUntil;

  useEffect(() => {
    // If locked out, set a timer to automatically re-enable the form
    if (isLockedOut) {
      const timer = setTimeout(() => {
        setAttempts(0);
        setLockoutUntil(0);
        localStorage.removeItem('npo_login_attempts');
        localStorage.removeItem('npo_login_lockout');
        setError(''); // clear the error message
      }, lockoutUntil - Date.now());
      return () => clearTimeout(timer);
    }
  }, [isLockedOut, lockoutUntil]);

  const roles = [
    { value: 'user', label: 'Student', icon: User, desc: 'Looking for housing near campus', color: 'bg-primary/10 text-primary border-primary/20' },
    { value: 'landlord', label: 'landlord/Student Host (for seniors renting/sharing)', icon: Home, desc: 'List your rental property', color: 'bg-accent/10 text-accent border-accent/20' },
    { value: 'pgowner', label: 'PG Owner', icon: Building, desc: 'List your PG accommodation', color: 'bg-chart-3/10 text-chart-3 border-chart-3/20' },
  ]

  const handleGoogleSignUp = async () => {
    if (isLockedOut || googleLoading) return;
    setError('')

    if (!agreedToTerms) {
      setError('You must agree to the Terms & Conditions and Privacy Policy to continue.')
      return
    }

    setGoogleLoading(true)
    try {
      // Save role so AuthCallbackPage can assign it
      localStorage.setItem('homigo_pending_role', role)
      await signInWithGoogle()
      // Browser redirects to Google; loading stays true until redirect
    } catch (err) {
      setError(err.message || 'Google sign-up failed')
      setGoogleLoading(false)

      const newAttempts = attempts + 1;
      setAttempts(newAttempts);
      localStorage.setItem('npo_login_attempts', newAttempts.toString());
      
      if (newAttempts >= (import.meta.env.VITE_MAX_LOGIN_ATTEMPTS || 5) && !isLockedOut) {
        const newLockout = Date.now() + 15 * 60 * 1000; // 15 mins block
        setLockoutUntil(newLockout);
        localStorage.setItem('npo_login_lockout', newLockout.toString());
        setError("Too many attempts. Please wait 15 minutes to save resources.");
      }
    }
  }

  return (
    <div className="min-h-screen">
      <SEO 
        title="Register - Homizgo"
        description="Create your Homizgo account. Find the perfect room or list your property exclusively for students."
        url="/register"
      />
      <Navbar />
      <main className="flex items-center justify-center px-4 py-12">
        <div className="w-full max-w-md">
          <div className="relative overflow-hidden rounded-3xl border bg-card p-8 shadow-xl shadow-primary/5">
            <div className="absolute -right-16 -top-16 h-48 w-48 rounded-full bg-primary/5 blur-3xl" />
            <div className="absolute -left-12 bottom-0 h-36 w-36 rounded-full bg-accent/5 blur-3xl" />

            {/* Header */}
            <div className="relative mb-8 text-center">
              <div className="mx-auto mb-4 flex h-16 w-16 items-center justify-center overflow-hidden rounded-2xl bg-primary shadow-lg shadow-primary/20">
                <img src="/assets/logo.png" alt="Homizgo" className="h-full w-full object-contain p-3 brightness-0 invert" />
              </div>
              <h1 className="font-heading text-2xl font-bold text-card-foreground">Create your account</h1>
              <p className="mt-1 text-sm text-muted-foreground">Join Homizgo and find your perfect stay</p>
            </div>

            {/* Step indicators */}
            <div className="relative mb-8 flex items-center justify-center gap-3">
              {[1, 2].map((s) => (
                <div key={s} className="flex items-center gap-3">
                  <div className={`flex h-9 w-9 items-center justify-center rounded-xl text-sm font-bold transition-all ${
                    step >= s ? 'bg-primary text-primary-foreground shadow-lg shadow-primary/20' : 'bg-secondary text-muted-foreground'
                  }`}>
                    {step > s ? <CheckCircle2 className="h-4 w-4" /> : s}
                  </div>
                  {s < 2 && <div className={`h-0.5 w-12 rounded-full transition-colors ${step > 1 ? 'bg-primary' : 'bg-border'}`} />}
                </div>
              ))}
            </div>

            {error && (
              <div className="relative mb-4 rounded-xl bg-destructive/10 p-3 text-sm font-medium text-destructive">
                {error}
              </div>
            )}

            {/* Step 1 — Choose role & gender */}
            {step === 1 && (
              <div className="relative space-y-5">
                <p className="text-center text-sm font-medium text-card-foreground">Choose your role</p>
                <div className="grid gap-3">
                  {roles.map((r) => (
                    <button
                      key={r.value}
                      onClick={() => setRole(r.value)}
                      className={`flex items-center gap-4 rounded-2xl border-2 p-4 text-left transition-all ${
                        role === r.value
                          ? 'border-primary bg-primary/5 shadow-sm'
                          : 'border-transparent bg-secondary/50 hover:border-border hover:bg-secondary'
                      }`}
                    >
                      <div className={`flex h-11 w-11 items-center justify-center rounded-xl transition-all ${
                        role === r.value ? 'bg-primary text-primary-foreground shadow-sm' : r.color
                      }`}>
                        <r.icon className="h-5 w-5" />
                      </div>
                      <div className="flex-1">
                        <div className="font-heading font-semibold text-card-foreground">{r.label}</div>
                        <div className="text-sm text-muted-foreground">{r.desc}</div>
                      </div>
                      {role === r.value && <CheckCircle2 className="h-5 w-5 text-primary flex-shrink-0" />}
                    </button>
                  ))}
                </div>

                <div>
                  <Label className="text-sm font-medium">Gender</Label>
                  <div className="mt-1.5 flex gap-2">
                    <Button type="button" variant={gender === 'male' ? 'default' : 'outline'} className="flex-1 rounded-xl" onClick={() => setGender('male')}>Male</Button>
                    <Button type="button" variant={gender === 'female' ? 'default' : 'outline'} className="flex-1 rounded-xl" onClick={() => setGender('female')}>Female</Button>
                  </div>
                </div>

                <Button className="w-full rounded-xl h-11 shadow-lg shadow-primary/20" onClick={() => setStep(2)}>
                  Continue
                  <ArrowRight className="ml-2 h-4 w-4" />
                </Button>
              </div>
            )}

            {/* Step 2 — Google sign-up */}
            {step === 2 && (
              <div className="relative space-y-5">
                <div className="flex items-start gap-3 rounded-xl border bg-secondary/30 p-4">
                  <div className="pt-0.5">
                    <input
                      id="terms-checkbox"
                      type="checkbox"
                      checked={agreedToTerms}
                      onChange={(e) => setAgreedToTerms(e.target.checked)}
                      className="h-4 w-4 rounded border-gray-300 text-primary focus:ring-primary"
                    />
                  </div>
                  <Label htmlFor="terms-checkbox" className="text-sm leading-relaxed text-muted-foreground cursor-pointer">
                    I agree to the <Link to="/terms" className="font-semibold text-primary hover:underline">Terms & Conditions</Link> and <Link to="/privacy" className="font-semibold text-primary hover:underline">Privacy Policy</Link> of Homizgo.
                  </Label>
                </div>

                <Button
                  type="button"
                  variant="outline"
                  className={`w-full rounded-xl h-12 gap-3 font-semibold text-base transition-all ${
                    !agreedToTerms || isLockedOut ? 'opacity-50 cursor-not-allowed' : 'hover:bg-secondary/80 hover:shadow-md'
                  }`}
                  onClick={handleGoogleSignUp}
                  disabled={googleLoading || !agreedToTerms || isLockedOut}
                >
                  <GoogleIcon />
                  {googleLoading ? 'Redirecting to Google…' : isLockedOut ? 'Locked Temporarily' : 'Continue with Google'}
                </Button>

                {isLockedOut && (
                  <p className="mt-[-10px] text-sm text-center text-muted-foreground animate-pulse">
                    Try again in {Math.ceil((lockoutUntil - Date.now()) / 60000)} minutes.
                  </p>
                )}

                <Button type="button" variant="ghost" className="w-full rounded-xl" onClick={() => setStep(1)} disabled={googleLoading || isLockedOut}>
                  <ArrowLeft className="mr-1.5 h-4 w-4" />
                  Back
                </Button>
              </div>
            )}

            <p className="relative mt-6 text-center text-sm text-muted-foreground">
              Already have an account?{' '}
              <Link to="/login" className="font-semibold text-primary hover:underline">Log in</Link>
            </p>
          </div>
        </div>
      </main>
    </div>
  )
}

