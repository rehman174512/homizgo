import { useState } from 'react'
import { useNavigate } from 'react-router-dom'
import { createClient } from '@/lib/supabase'
import { Building2, GraduationCap, Home, Users } from 'lucide-react'
import { Button } from '@/components/ui/button'

const ROLES = [
  {
    key: 'user',
    label: 'Student',
    icon: GraduationCap,
    description: 'Looking for a PG or rental near your college',
    color: 'bg-primary/10 text-primary border-primary/20 hover:bg-primary/15',
    activeColor: 'bg-primary text-primary-foreground border-primary shadow-lg shadow-primary/20',
  },
  {
    key: 'landlord',
    label: 'landlord/Student Host (for seniors renting/sharing)',
    icon: Home,
    description: 'I have rooms / properties to rent out',
    color: 'bg-accent/10 text-accent border-accent/20 hover:bg-accent/15',
    activeColor: 'bg-accent text-accent-foreground border-accent shadow-lg shadow-accent/20',
  },
  {
    key: 'pgowner',
    label: 'PG Owner',
    icon: Users,
    description: 'I run a paying guest accommodation',
    color: 'bg-chart-3/10 text-chart-3 border-chart-3/20 hover:bg-chart-3/15',
    activeColor: 'bg-chart-3 text-white border-chart-3 shadow-lg shadow-chart-3/20',
  },
]

export default function SelectRolePage() {
  const [selectedRole, setSelectedRole] = useState(null)
  const [loading, setLoading] = useState(false)
  const [error, setError] = useState('')
  const navigate = useNavigate()

  const handleConfirm = async () => {
    if (!selectedRole) return
    setLoading(true)
    setError('')
    try {
      const supabase = createClient()
      const { data: { session } } = await supabase.auth.getSession()
      if (!session?.user) throw new Error('Not authenticated')

      const { error: updateErr } = await supabase
        .from('users')
        .update({ role: selectedRole })
        .eq('id', session.user.id)

      if (updateErr) throw updateErr

      if (selectedRole === 'landlord') navigate('/dashboard/landlord')
      else if (selectedRole === 'pgowner') navigate('/dashboard/pgowner')
      else navigate('/dashboard/user')
    } catch (err) {
      setError(err.message || 'Something went wrong. Please try again.')
    } finally {
      setLoading(false)
    }
  }

  return (
    <div className="min-h-screen flex items-center justify-center bg-background px-4 py-12">
      <div className="w-full max-w-md">
        {/* Logo */}
        <div className="flex justify-center mb-8">
          <div className="flex h-16 w-16 items-center justify-center overflow-hidden rounded-2xl bg-primary shadow-lg shadow-primary/20">
            <img src="/assets/logo.png" alt="Homizgo" className="h-full w-full object-contain p-3 brightness-0 invert" />
          </div>
        </div>

        <div className="text-center mb-8">
          <h1 className="font-heading text-3xl font-bold text-foreground">Welcome to Homizgo!</h1>
          <p className="mt-2 text-muted-foreground">
            Tell us who you are so we can personalize your experience.
          </p>
        </div>

        <div className="space-y-3">
          {ROLES.map((role) => {
            const isActive = selectedRole === role.key
            return (
              <button
                key={role.key}
                onClick={() => setSelectedRole(role.key)}
                className={`w-full flex items-center gap-4 rounded-2xl border-2 p-5 text-left transition-all duration-200 ${
                  isActive ? role.activeColor : role.color
                }`}
              >
                <div className={`flex h-12 w-12 flex-shrink-0 items-center justify-center rounded-xl ${
                  isActive ? 'bg-white/20' : 'bg-current/10'
                }`}>
                  <role.icon className="h-6 w-6" />
                </div>
                <div>
                  <p className="font-heading text-lg font-bold">{role.label}</p>
                  <p className={`text-sm ${isActive ? 'opacity-80' : 'text-muted-foreground'}`}>
                    {role.description}
                  </p>
                </div>
                {isActive && (
                  <div className="ml-auto flex h-6 w-6 flex-shrink-0 items-center justify-center rounded-full bg-white/30">
                    <div className="h-2.5 w-2.5 rounded-full bg-white" />
                  </div>
                )}
              </button>
            )
          })}
        </div>

        {error && (
          <p className="mt-4 text-center text-sm text-destructive">{error}</p>
        )}

        <Button
          className="mt-6 w-full rounded-2xl h-12 text-base font-semibold shadow-lg shadow-primary/20"
          onClick={handleConfirm}
          disabled={!selectedRole || loading}
        >
          {loading ? (
            <span className="flex items-center gap-2">
              <span className="h-4 w-4 animate-spin rounded-full border-2 border-white border-t-transparent" />
              Setting up your account…
            </span>
          ) : (
            'Continue →'
          )}
        </Button>
      </div>
    </div>
  )
}
