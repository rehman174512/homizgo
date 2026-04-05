import { useState } from 'react'
import { useNavigate } from 'react-router-dom'
import { Shield, Key, Mail, LogOut, Eye, EyeOff, CheckCircle2, AlertTriangle } from 'lucide-react'
import { changeAdminPin, adminSignOut } from '../services/adminService'

function Section({ title, description, children }) {
  return (
    <div className="bg-card border border-border rounded-2xl overflow-hidden">
      <div className="px-6 py-5 border-b border-border">
        <h2 className="font-bold text-foreground" style={{ fontFamily: 'var(--font-heading)' }}>{title}</h2>
        {description && <p className="text-sm text-muted-foreground mt-0.5">{description}</p>}
      </div>
      <div className="p-6">{children}</div>
    </div>
  )
}

export default function AdminSettingsPage() {
  const navigate = useNavigate()
  const [oldPin, setOldPin] = useState('')
  const [newPin, setNewPin] = useState('')
  const [confirmPin, setConfirmPin] = useState('')
  const [showPins, setShowPins] = useState(false)
  const [pinLoading, setPinLoading] = useState(false)
  const [pinResult, setPinResult] = useState(null) // { success, message }
  const [logoutLoading, setLogoutLoading] = useState(false)

  const adminEmail = 'raabdul08@gmail.com'
  const sessionActive = sessionStorage.getItem('admin_pin_verified') === 'true'

  const handleChangePin = async (e) => {
    e.preventDefault()
    setPinResult(null)

    if (newPin.length !== 6 || !/^\d{6}$/.test(newPin)) {
      setPinResult({ success: false, message: 'PIN must be exactly 6 digits.' })
      return
    }
    if (newPin !== confirmPin) {
      setPinResult({ success: false, message: 'New PIN and confirmation do not match.' })
      return
    }

    setPinLoading(true)
    try {
      const ok = await changeAdminPin(oldPin, newPin)
      if (ok) {
        setPinResult({ success: true, message: 'PIN changed successfully!' })
        setOldPin(''); setNewPin(''); setConfirmPin('')
      } else {
        setPinResult({ success: false, message: 'Current PIN is incorrect.' })
      }
    } catch (err) {
      setPinResult({ success: false, message: err.message || 'Failed to change PIN.' })
    } finally {
      setPinLoading(false)
    }
  }

  const handleLogout = async () => {
    setLogoutLoading(true)
    await adminSignOut()
    navigate('/admin/login', { replace: true })
  }

  return (
    <div className="max-w-2xl mx-auto animate-in fade-in duration-300 space-y-6">
      {/* Header */}
      <div className="mb-8">
        <h1 className="text-2xl font-bold text-foreground" style={{ fontFamily: 'var(--font-heading)' }}>
          Settings
        </h1>
        <p className="text-muted-foreground text-sm mt-1">
          Manage your admin account and security preferences
        </p>
      </div>

      {/* Account section */}
      <Section title="Account" description="Your admin identity">
        <div className="space-y-4">
          <div className="flex items-center gap-3 p-4 rounded-xl bg-secondary border border-border">
            <div className="w-10 h-10 rounded-full bg-primary/10 flex items-center justify-center">
              <Mail className="w-5 h-5 text-primary" />
            </div>
            <div>
              <p className="text-xs text-muted-foreground font-medium">Admin Email</p>
              <p className="font-semibold text-foreground">{adminEmail}</p>
            </div>
            <span className="ml-auto text-xs bg-green-500/10 text-green-600 border border-green-500/20 px-2.5 py-1 rounded-full font-medium">
              Verified
            </span>
          </div>

          <div className="flex items-center gap-3 p-4 rounded-xl bg-secondary border border-border">
            <div className="w-10 h-10 rounded-full bg-primary/10 flex items-center justify-center">
              <Shield className="w-5 h-5 text-primary" />
            </div>
            <div>
              <p className="text-xs text-muted-foreground font-medium">Session Status</p>
              <p className="font-semibold text-foreground">
                {sessionActive ? 'Active · PIN verified' : 'Inactive'}
              </p>
            </div>
            <span className={`ml-auto text-xs px-2.5 py-1 rounded-full font-medium border ${
              sessionActive
                ? 'bg-green-500/10 text-green-600 border-green-500/20'
                : 'bg-muted text-muted-foreground border-border'
            }`}>
              {sessionActive ? '● Live' : '○ Offline'}
            </span>
          </div>
        </div>
      </Section>

      {/* Change PIN */}
      <Section title="Change PIN" description="Update your 6-digit security PIN">
        <form onSubmit={handleChangePin} className="space-y-4">
          {[
            { label: 'Current PIN', value: oldPin, setter: setOldPin, placeholder: 'Enter current PIN' },
            { label: 'New PIN', value: newPin, setter: setNewPin, placeholder: 'Enter new 6-digit PIN' },
            { label: 'Confirm New PIN', value: confirmPin, setter: setConfirmPin, placeholder: 'Repeat new PIN' },
          ].map(({ label, value, setter, placeholder }) => (
            <div key={label}>
              <label className="text-sm font-medium text-foreground block mb-1.5">{label}</label>
              <div className="relative">
                <input
                  type={showPins ? 'text' : 'password'}
                  value={value}
                  onChange={e => setter(e.target.value.replace(/\D/g, '').slice(0, 6))}
                  placeholder={placeholder}
                  inputMode="numeric"
                  maxLength={6}
                  className="w-full px-4 py-3 pr-12 rounded-xl border border-input bg-background text-foreground placeholder:text-muted-foreground focus:outline-none focus:ring-2 focus:ring-ring tracking-widest font-mono"
                />
                {label === 'Current PIN' && (
                  <button
                    type="button"
                    onClick={() => setShowPins(p => !p)}
                    className="absolute right-3 top-1/2 -translate-y-1/2 text-muted-foreground hover:text-foreground p-1"
                  >
                    {showPins ? <EyeOff className="w-4 h-4" /> : <Eye className="w-4 h-4" />}
                  </button>
                )}
              </div>
            </div>
          ))}

          {pinResult && (
            <div className={`flex items-center gap-2 px-4 py-3 rounded-xl border text-sm ${
              pinResult.success
                ? 'bg-green-500/10 text-green-600 border-green-500/20 dark:text-green-400'
                : 'bg-destructive/10 text-destructive border-destructive/20'
            }`}>
              {pinResult.success ? (
                <CheckCircle2 className="w-4 h-4 shrink-0" />
              ) : (
                <AlertTriangle className="w-4 h-4 shrink-0" />
              )}
              {pinResult.message}
            </div>
          )}

          <button
            type="submit"
            disabled={!oldPin || !newPin || !confirmPin || pinLoading}
            className="w-full py-3 rounded-xl flex items-center justify-center gap-2 bg-primary text-primary-foreground font-semibold hover:opacity-90 active:scale-[0.98] transition-all disabled:opacity-40 disabled:cursor-not-allowed"
          >
            {pinLoading ? (
              <span className="w-4 h-4 border-2 border-primary-foreground/30 border-t-primary-foreground rounded-full animate-spin" />
            ) : (
              <Key className="w-4 h-4" />
            )}
            {pinLoading ? 'Updating PIN...' : 'Update PIN'}
          </button>
        </form>
      </Section>

      {/* Danger Zone */}
      <Section title="Session" description="Manage your current admin session">
        <div className="space-y-3">
          <p className="text-sm text-muted-foreground">
            Logging out will invalidate your PIN session. You will need to authenticate again and re-enter your PIN.
          </p>
          <button
            onClick={handleLogout}
            disabled={logoutLoading}
            className="flex items-center gap-2 px-5 py-2.5 rounded-xl bg-destructive/10 text-destructive border border-destructive/20 hover:bg-destructive/20 transition-colors text-sm font-semibold disabled:opacity-50"
          >
            {logoutLoading ? (
              <span className="w-4 h-4 border-2 border-destructive/30 border-t-destructive rounded-full animate-spin" />
            ) : (
              <LogOut className="w-4 h-4" />
            )}
            Sign Out of Admin Panel
          </button>
        </div>
      </Section>
    </div>
  )
}
