import { useState } from 'react'
import { useNavigate, Link } from 'react-router-dom'
import { createClient } from '@/lib/supabase'
import { Navbar } from '@/components/Navbar'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'
import { Mail, Loader2, CheckCircle2, AlertCircle } from 'lucide-react'

export default function ForgotPasswordPage() {
  const navigate = useNavigate()
  const [email, setEmail] = useState('')
  const [loading, setLoading] = useState(false)
  const [error, setError] = useState('')
  const [success, setSuccess] = useState(false)

  const handleSubmit = async (e) => {
    e.preventDefault()
    setError('')
    setSuccess(false)

    if (!email || !/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(email)) {
      setError('Please enter a valid email address.')
      return
    }

    setLoading(true)
    try {
      const supabase = createClient()
      const { error: resetError } = await supabase.auth.resetPasswordForEmail(email, {
        redirectTo: `${window.location.origin}/reset-password`,
      })

      if (resetError) {
        // Handle specific Supabase error messages
        if (resetError.message.includes('User not found')) {
          setError('No account found with this email.')
        } else {
          setError(resetError.message)
        }
      } else {
        setSuccess(true)
      }
    } catch (err) {
      setError('Network error. Please try again later.')
    } finally {
      setLoading(false)
    }
  }

  return (
    <div className="min-h-screen">
      <Navbar />
      <main className="flex items-center justify-center px-4 py-16">
        <div className="w-full max-w-md">
          <div className="relative overflow-hidden rounded-3xl border bg-card p-8 shadow-xl shadow-primary/5">
            <div className="absolute -right-12 -top-12 h-40 w-40 rounded-full bg-primary/5 blur-2xl" />
            <div className="absolute -left-8 -bottom-8 h-32 w-32 rounded-full bg-accent/5 blur-2xl" />

            <div className="relative mb-8 text-center">
              <div className="mx-auto mb-4 flex h-14 w-14 items-center justify-center rounded-2xl bg-primary shadow-lg shadow-primary/20">
                {success ? (
                  <CheckCircle2 className="h-7 w-7 text-primary-foreground" />
                ) : (
                  <Mail className="h-7 w-7 text-primary-foreground" />
                )}
              </div>
              <h1 className="font-heading text-2xl font-bold text-card-foreground">
                {success ? 'Check your email' : 'Forgot Password?'}
              </h1>
              <p className="mt-1 text-sm text-muted-foreground">
                {success
                  ? 'We have sent a password reset link to your email address.'
                  : "No worries, we'll send you reset instructions."}
              </p>
            </div>

            {!success && (
              <form onSubmit={handleSubmit} className="relative space-y-5">
                {error && (
                  <div className="mb-4 flex items-center gap-2 rounded-xl bg-destructive/10 p-3 text-sm font-medium text-destructive">
                    <AlertCircle className="h-4 w-4" />
                    {error}
                  </div>
                )}
                
                <div>
                  <Label htmlFor="email" className="text-sm font-medium">Email Address</Label>
                  <Input
                    id="email"
                    type="email"
                    value={email}
                    onChange={(e) => {
                      setEmail(e.target.value)
                      if (error) setError('')
                    }}
                    required
                    placeholder="Enter your email"
                    className="mt-1.5 rounded-xl"
                    autoComplete="email"
                  />
                </div>
                
                <Button 
                  type="submit" 
                  className="w-full rounded-xl h-11 shadow-lg shadow-primary/20" 
                  disabled={loading}
                >
                  {loading ? (
                    <>
                      <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                      Sending Link...
                    </>
                  ) : (
                    'Reset Password'
                  )}
                </Button>

                <div className="mt-6 text-center text-sm">
                  <Link to="/login" className="font-medium text-primary hover:underline">
                    Back to Login
                  </Link>
                </div>
              </form>
            )}

            {success && (
              <div className="relative space-y-5 text-center">
                <Button 
                  type="button" 
                  className="w-full rounded-xl h-11 shadow-lg shadow-primary/20"
                  onClick={() => navigate('/login')}
                >
                  Return to Login
                </Button>
                <div className="mt-6 text-center text-sm">
                  <p className="text-muted-foreground">
                    Didn't receive the email?{' '}
                    <button 
                      type="button" 
                      onClick={() => {
                        setSuccess(false)
                        setEmail('')
                      }} 
                      className="font-medium text-primary hover:underline"
                    >
                      Click to resend
                    </button>
                  </p>
                </div>
              </div>
            )}
          </div>
        </div>
      </main>
    </div>
  )
}
