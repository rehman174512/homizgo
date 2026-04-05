import { useEffect, useState } from 'react'
import { useNavigate, useSearchParams } from 'react-router-dom'
import { createClient } from '@/lib/supabase'
import { Navbar } from '@/components/Navbar'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'
import { Eye, EyeOff, KeyRound, Loader2, CheckCircle2 } from 'lucide-react'

export default function ResetPasswordPage() {
  const navigate = useNavigate()
  const [searchParams] = useSearchParams()
  const [exchanging, setExchanging] = useState(true)
  const [exchangeError, setExchangeError] = useState('')
  const [password, setPassword] = useState('')
  const [confirmPassword, setConfirmPassword] = useState('')
  const [showPassword, setShowPassword] = useState(false)
  const [loading, setLoading] = useState(false)
  const [error, setError] = useState('')
  const [success, setSuccess] = useState(false)

  useEffect(() => {
    async function exchangeCode() {
      const supabase = createClient()
      const code = searchParams.get('code')
      if (!code) {
        setExchangeError('Invalid or expired reset link. Please request a new one.')
        setExchanging(false)
        return
      }
      const { error } = await supabase.auth.exchangeCodeForSession(code)
      if (error) {
        setExchangeError('Reset link is invalid or has expired. Please request a new one.')
      }
      setExchanging(false)
    }
    exchangeCode()
  }, [searchParams])

  const handleSubmit = async (e) => {
    e.preventDefault()
    setError('')
    
    if (password !== confirmPassword) {
      setError('Passwords do not match.')
      return
    }
    if (password.length < 6) {
      setError('Password must be at least 6 characters.')
      return
    }
    // Basic password strength: at least one number and one letter
    if (!/(?=.*[a-zA-Z])(?=.*[0-9])/.test(password)) {
      setError('Password must contain at least one letter and one number.')
      return
    }

    setLoading(true)
    try {
      const supabase = createClient()
      const { error: updateError } = await supabase.auth.updateUser({
        password: password
      })
      
      if (updateError) {
        setError(updateError.message || 'Failed to reset password. Please try again.')
      } else {
        setSuccess(true)
        setTimeout(() => navigate('/login'), 2500)
      }
    } catch {
      setError('Network error. Please check your connection.')
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
                {success ? <CheckCircle2 className="h-7 w-7 text-primary-foreground" /> : <KeyRound className="h-7 w-7 text-primary-foreground" />}
              </div>
              <h1 className="font-heading text-2xl font-bold text-card-foreground">
                {success ? 'Password updated!' : 'Set new password'}
              </h1>
              <p className="mt-1 text-sm text-muted-foreground">
                {success ? 'Redirecting you to login...' : 'Enter a new password for your account'}
              </p>
            </div>

            {exchanging && (
              <div className="flex flex-col items-center gap-3 py-6">
                <Loader2 className="h-8 w-8 animate-spin text-primary" />
                <p className="text-sm text-muted-foreground">Verifying reset link...</p>
              </div>
            )}

            {!exchanging && exchangeError && (
              <div className="space-y-4">
                <div className="rounded-xl bg-destructive/10 p-4 text-sm font-medium text-destructive text-center">{exchangeError}</div>
                <Button variant="outline" className="w-full rounded-xl" onClick={() => navigate('/forgot-password')}>
                  Request new reset link
                </Button>
              </div>
            )}

            {!exchanging && !exchangeError && !success && (
              <>
                {error && (
                  <div className="mb-4 rounded-xl bg-destructive/10 p-3 text-sm font-medium text-destructive">{error}</div>
                )}
                <form onSubmit={handleSubmit} className="relative space-y-5">
                  <div>
                    <Label htmlFor="password" className="text-sm font-medium">New Password</Label>
                    <div className="relative mt-1.5">
                      <Input
                        id="password"
                        type={showPassword ? 'text' : 'password'}
                        value={password}
                        onChange={(e) => setPassword(e.target.value)}
                        required
                        minLength={6}
                        placeholder="At least 6 characters"
                        className="rounded-xl pr-10"
                        autoComplete="new-password"
                      />
                      <button type="button" onClick={() => setShowPassword(!showPassword)} className="absolute right-3 top-1/2 -translate-y-1/2 text-muted-foreground hover:text-foreground transition-colors" aria-label={showPassword ? 'Hide password' : 'Show password'}>
                        {showPassword ? <EyeOff className="h-4 w-4" /> : <Eye className="h-4 w-4" />}
                      </button>
                    </div>
                  </div>
                  <div>
                    <Label htmlFor="confirm-password" className="text-sm font-medium">Confirm New Password</Label>
                    <Input id="confirm-password" type={showPassword ? 'text' : 'password'} value={confirmPassword} onChange={(e) => setConfirmPassword(e.target.value)} required minLength={6} placeholder="Re-enter your password" className="mt-1.5 rounded-xl" autoComplete="new-password" />
                  </div>
                  <Button type="submit" className="w-full rounded-xl h-11 shadow-lg shadow-primary/20" disabled={loading}>
                    {loading ? 'Updating...' : 'Update Password'}
                  </Button>
                </form>
              </>
            )}

            {success && (
              <div className="flex flex-col items-center gap-3 py-4">
                <Loader2 className="h-6 w-6 animate-spin text-primary" />
                <p className="text-sm text-muted-foreground">Taking you to login...</p>
              </div>
            )}
          </div>
        </div>
      </main>
    </div>
  )
}
