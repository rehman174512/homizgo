import { useState, useRef, useEffect } from 'react'
import { useNavigate } from 'react-router-dom'
import { Shield, AlertTriangle, RefreshCw, Eye, EyeOff } from 'lucide-react'
import { verifyAdminPin } from '../services/adminService'
import { adminSignOut } from '../services/adminService'

const PIN_LENGTH = 6
const MAX_ATTEMPTS = 5
const COOLDOWN_SECONDS = 30

export default function AdminPinPage() {
  const navigate = useNavigate()
  const [pins, setPins] = useState(Array(PIN_LENGTH).fill(''))
  const [loading, setLoading] = useState(false)
  const [error, setError] = useState(null)
  const [attempts, setAttempts] = useState(0)
  const [cooldown, setCooldown] = useState(0)
  const [shake, setShake] = useState(false)
  const [showPin, setShowPin] = useState(false)
  const refs = useRef([])

  // Cooldown timer
  useEffect(() => {
    if (cooldown <= 0) return
    const timer = setInterval(() => {
      setCooldown(c => {
        if (c <= 1) { clearInterval(timer); return 0 }
        return c - 1
      })
    }, 1000)
    return () => clearInterval(timer)
  }, [cooldown])

  const handleChange = (index, value) => {
    if (!/^\d?$/.test(value)) return
    const newPins = [...pins]
    newPins[index] = value
    setPins(newPins)
    if (value && index < PIN_LENGTH - 1) refs.current[index + 1]?.focus()
    // Auto-submit when all filled
    if (value && index === PIN_LENGTH - 1 && newPins.every(p => p)) {
      submitPin(newPins.join(''))
    }
  }

  const handleKeyDown = (index, e) => {
    if (e.key === 'Backspace' && !pins[index] && index > 0) {
      refs.current[index - 1]?.focus()
    }
  }

  const handlePaste = (e) => {
    e.preventDefault()
    const pasted = e.clipboardData.getData('text').replace(/\D/g, '').slice(0, PIN_LENGTH)
    if (pasted.length !== PIN_LENGTH) return
    setPins(pasted.split(''))
    refs.current[PIN_LENGTH - 1]?.focus()
    submitPin(pasted)
  }

  const submitPin = async (pin) => {
    if (cooldown > 0 || loading) return
    setLoading(true)
    setError(null)

    try {
      const valid = await verifyAdminPin(pin)
      if (valid) {
        sessionStorage.setItem('admin_pin_verified', 'true')
        navigate('/admin/dashboard', { replace: true })
      } else {
        const newAttempts = attempts + 1
        setAttempts(newAttempts)
        setShake(true)
        setTimeout(() => setShake(false), 600)
        setPins(Array(PIN_LENGTH).fill(''))
        refs.current[0]?.focus()

        if (newAttempts >= MAX_ATTEMPTS) {
          setError(`Too many failed attempts. Wait ${COOLDOWN_SECONDS}s before retrying.`)
          setCooldown(COOLDOWN_SECONDS)
          setAttempts(0)
        } else {
          setError(`Incorrect PIN. ${MAX_ATTEMPTS - newAttempts} attempt${MAX_ATTEMPTS - newAttempts !== 1 ? 's' : ''} remaining.`)
        }
      }
    } catch (err) {
      setError('Verification failed. Please try again.')
    } finally {
      setLoading(false)
    }
  }

  const handleLogout = async () => {
    await adminSignOut()
    navigate('/admin/login', { replace: true })
  }

  const filled = pins.filter(Boolean).length

  return (
    <div className="min-h-screen bg-[hsl(var(--background))] flex items-center justify-center p-4">
      <div className="fixed inset-0 overflow-hidden pointer-events-none">
        <div className="absolute -top-40 -right-40 w-80 h-80 bg-primary/10 rounded-full blur-3xl" />
        <div className="absolute -bottom-40 -left-40 w-80 h-80 bg-accent/10 rounded-full blur-3xl" />
      </div>

      <div className="relative w-full max-w-sm animate-in fade-in slide-in-from-bottom-4 duration-500">
        <div className="text-center mb-8">
          <div className="inline-flex items-center gap-2 bg-primary/10 text-primary px-4 py-2 rounded-full text-sm font-medium mb-6 border border-primary/20">
            <Shield className="w-4 h-4" />
            PIN Verification
          </div>
          <h1 className="text-3xl font-bold text-foreground" style={{ fontFamily: 'var(--font-heading)' }}>
            Enter Admin PIN
          </h1>
          <p className="text-muted-foreground mt-2 text-sm">
            Step 2 of 2 · 6-digit security code
          </p>
        </div>

        <div className="bg-card border border-border rounded-2xl p-8 shadow-lg shadow-primary/5">
          {/* Progress dots */}
          <div className="flex justify-center gap-1.5 mb-6">
            {Array(PIN_LENGTH).fill(null).map((_, i) => (
              <div
                key={i}
                className={`w-2 h-2 rounded-full transition-all duration-200 ${
                  i < filled ? 'bg-primary scale-110' : 'bg-border'
                }`}
              />
            ))}
          </div>

          {/* PIN inputs */}
          <div className="flex justify-center mb-10">
            <div
              className={`relative flex gap-3 ${shake ? 'animate-[wiggle_0.5s_ease-in-out]' : ''}`}
              style={shake ? {
                animation: 'shake 0.5s cubic-bezier(.36,.07,.19,.97) both',
              } : {}}
            >
              {pins.map((digit, i) => (
                <input
                  key={i}
                  ref={el => refs.current[i] = el}
                  type={showPin ? "text" : "password"}
                  inputMode="numeric"
                  maxLength={1}
                  value={digit}
                  onChange={e => handleChange(i, e.target.value)}
                  onKeyDown={e => handleKeyDown(i, e)}
                  onPaste={handlePaste}
                  disabled={cooldown > 0 || loading}
                  className={`w-12 h-14 text-center text-xl font-bold rounded-xl border-2 bg-background text-foreground transition-all duration-200 focus:outline-none ${
                    digit
                      ? 'border-primary bg-primary/5 shadow-sm shadow-primary/10'
                      : 'border-input focus:border-primary'
                  } disabled:opacity-40 disabled:cursor-not-allowed`}
                />
              ))}

              {/* Visibility toggle floating button below the last box */}
              <button
                type="button"
                onClick={() => setShowPin(!showPin)}
                className="absolute right-0 top-full mt-2 p-1.5 rounded-lg hover:bg-secondary text-muted-foreground transition-all duration-200 focus:outline-none flex items-center gap-1.5 text-xs font-medium"
                title={showPin ? "Hide PIN" : "Show PIN"}
              >
                {showPin ? (
                  <>
                    <EyeOff className="w-3.5 h-3.5" />
                    <span>Hide</span>
                  </>
                ) : (
                  <>
                    <Eye className="w-3.5 h-3.5" />
                    <span>Show</span>
                  </>
                )}
              </button>
            </div>
          </div>

          {/* Error / cooldown */}
          {cooldown > 0 ? (
            <div className="flex items-center gap-2 bg-orange-500/10 border border-orange-500/20 text-orange-600 dark:text-orange-400 px-4 py-3 rounded-xl text-sm mb-4">
              <RefreshCw className="w-4 h-4 shrink-0" />
              Rate limited · Try again in {cooldown}s
            </div>
          ) : error ? (
            <div className="flex items-center gap-2 bg-destructive/10 border border-destructive/20 text-destructive px-4 py-3 rounded-xl text-sm mb-4">
              <AlertTriangle className="w-4 h-4 shrink-0" />
              {error}
            </div>
          ) : null}

          {/* Submit */}
          <button
            onClick={() => submitPin(pins.join(''))}
            disabled={filled < PIN_LENGTH || loading || cooldown > 0}
            className="w-full py-3 rounded-xl bg-primary text-primary-foreground font-semibold hover:opacity-90 active:scale-[0.98] transition-all disabled:opacity-40 disabled:cursor-not-allowed flex items-center justify-center gap-2 mb-4"
          >
            {loading ? (
              <span className="flex items-center gap-2">
                <span className="w-4 h-4 border-2 border-primary-foreground/30 border-t-primary-foreground rounded-full animate-spin" />
                Verifying...
              </span>
            ) : (
              'Verify PIN'
            )}
          </button>

          <button
            onClick={handleLogout}
            className="w-full py-2 text-sm text-muted-foreground hover:text-foreground transition-colors"
          >
            ← Back to login
          </button>
        </div>

        <p className="text-center text-xs text-muted-foreground/60 mt-6">
          Default PIN: 123456 · Change in Settings after login
        </p>
      </div>

      <style>{`
        @keyframes shake {
          10%, 90% { transform: translateX(-1px); }
          20%, 80% { transform: translateX(2px); }
          30%, 50%, 70% { transform: translateX(-4px); }
          40%, 60% { transform: translateX(4px); }
        }
      `}</style>
    </div>
  )
}
