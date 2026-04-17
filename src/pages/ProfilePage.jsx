import { useEffect, useState } from 'react'
import { useNavigate, useSearchParams, Link } from 'react-router-dom'
import { createClient } from '@/lib/supabase'
import { Navbar } from '@/components/Navbar'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'
import {
  User, Mail, Phone, Shield, Pencil, Trash2,
  Save, X, AlertTriangle, CheckCircle2,
} from 'lucide-react'

export default function ProfilePage() {
  const navigate = useNavigate()
  const [searchParams] = useSearchParams()
  const supabase = createClient()

  const [user, setUser] = useState(null)
  const [loading, setLoading] = useState(true)
  const [incompleteFields, setIncompleteFields] = useState([])

  // Edit state
  const [editing, setEditing] = useState(false)
  const [editName, setEditName] = useState('')
  const [editPhone, setEditPhone] = useState('')
  const [editGender, setEditGender] = useState('')
  const [saving, setSaving] = useState(false)


  // Delete state
  const [showDeleteModal, setShowDeleteModal] = useState(false)
  const [deleteLoading, setDeleteLoading] = useState(false)

  // Toast
  const [toast, setToast] = useState(null)

  const showToast = (msg, type = 'success') => {
    setToast({ msg, type })
    setTimeout(() => setToast(null), 3500)
  }

  useEffect(() => {
    async function load() {
      const { data: { session } } = await supabase.auth.getSession()
      if (!session) { navigate('/login'); return }

      const { data: profile } = await supabase
        .from('users')
        .select('*')
        .eq('id', session.user.id)
        .single()

      const resolved = {
        ...session.user,
        ...(profile || {}),
        name: profile?.name || session.user.user_metadata?.full_name || 'User',
      }
      setUser(resolved)
      setEditName(resolved.name || '')
      setEditPhone(resolved.phone || '')
      setEditGender(resolved.gender || '')
      setLoading(false)
    }
    load().catch(() => navigate('/login'))

    // Check for incomplete profile redirect
    if (searchParams.get('incomplete') === '1') {
      const raw = sessionStorage.getItem('homizgo_incomplete_fields')
      if (raw) {
        try { setIncompleteFields(JSON.parse(raw)) } catch (_) {}
      }
    }
  }, [])

  const handleSaveProfile = async () => {
    setSaving(true)
    const syncChannel = new BroadcastChannel('homizgo_sync')
    try {
      const { error } = await supabase
        .from('users')
        .update({ name: editName.trim(), phone: editPhone.trim(), gender: editGender })
        .eq('id', user.id)
      if (error) throw error
      const updatedUser = { ...user, name: editName.trim(), phone: editPhone.trim(), gender: editGender }
      setUser(updatedUser)
      setEditing(false)

      // Clear any incomplete-profile banner
      setIncompleteFields([])
      sessionStorage.removeItem('homizgo_incomplete_fields')

      showToast('Profile updated successfully!')

      // Notify Navbar to update in current tab
      window.dispatchEvent(new CustomEvent('homizgo-user-updated', { detail: updatedUser }))
      // Sync other tabs
      syncChannel.postMessage({ type: 'PROFILE_UPDATED' })

      // If user arrived from an incomplete-profile redirect, send them to dashboard
      if (searchParams.get('incomplete') === '1') {
        setTimeout(() => {
          const role = updatedUser.role
          if (role === 'landlord') navigate('/dashboard/landlord', { replace: true })
          else if (role === 'pgowner') navigate('/dashboard/pgowner', { replace: true })
          else navigate('/dashboard/user', { replace: true })
        }, 1500) // small delay so the success toast is visible
      }
    } catch (err) {
      showToast(err.message || 'Failed to update profile.', 'error')
    } finally {
      setSaving(false)
      syncChannel.close()
    }
  }


  const handleDeleteAccount = async () => {
    setDeleteLoading(true)
    try {
      // Get the current session token to send to the Edge Function
      const { data: { session } } = await supabase.auth.getSession()
      if (!session?.access_token) throw new Error('Not authenticated. Please log in again.')

      // Call the Edge Function with explicit authorization header
      const supabaseUrl = import.meta.env.VITE_SUPABASE_URL
      const response = await fetch(`${supabaseUrl}/functions/v1/delete-account`, {
        method: 'POST',
        headers: {
          'Authorization': `Bearer ${session.access_token}`,
          'Content-Type': 'application/json',
          'apikey': import.meta.env.VITE_SUPABASE_ANON_KEY,
        },
      })

      if (!response.ok) {
        const body = await response.json().catch(() => ({}))
        throw new Error(body.error || `Server error (${response.status})`)
      }

      await supabase.auth.signOut()
      window.dispatchEvent(new CustomEvent('homizgo-user-updated', { detail: null }))
      navigate('/')
    } catch (err) {
      showToast(err.message || 'Failed to delete account.', 'error')
    } finally {
      setDeleteLoading(false)
      setShowDeleteModal(false)
    }
  }

  const roleLabel = (role) => {
    if (role === 'pgowner') return 'PG Owner'
    if (role === 'landlord') return 'landlord/Student Host (for seniors renting/sharing)'
    return 'Student'
  }

  if (loading) return (
    <div className="min-h-screen flex items-center justify-center">
      <div className="h-8 w-8 animate-spin rounded-full border-2 border-primary border-t-transparent" />
    </div>
  )

  return (
    <div className="min-h-screen pb-24 md:pb-0">
      <Navbar />

      {/* Toast */}
      {toast && (
        <div className={`fixed top-20 left-1/2 -translate-x-1/2 z-50 flex items-center gap-2 rounded-2xl px-5 py-3 text-sm font-medium shadow-xl transition-all ${
          toast.type === 'error' ? 'bg-destructive text-destructive-foreground' : 'bg-chart-3 text-white'
        }`}>
          {toast.type === 'error' ? <AlertTriangle className="h-4 w-4" /> : <CheckCircle2 className="h-4 w-4" />}
          {toast.msg}
        </div>
      )}

      <main className="mx-auto max-w-2xl px-4 py-8 lg:px-8">
        <div className="mb-6">
          <h1 className="font-heading text-3xl font-bold text-foreground">My Profile</h1>
          <p className="mt-1 text-muted-foreground">Manage your account details and security</p>
        </div>

        {/* Incomplete profile warning banner */}
        {incompleteFields.length > 0 && (
          <div className="mb-6 flex items-start gap-3 rounded-2xl border border-destructive/30 bg-destructive/8 p-5 shadow-sm">
            <AlertTriangle className="h-5 w-5 text-destructive mt-0.5 flex-shrink-0" />
            <div className="flex-1 min-w-0">
              <p className="font-semibold text-destructive text-sm">Complete your profile to access the dashboard</p>
              <p className="mt-1 text-sm text-muted-foreground">
                The following required {incompleteFields.length === 1 ? 'field is' : 'fields are'} missing:{' '}
                <span className="font-medium text-foreground">{incompleteFields.join(', ')}</span>
              </p>
            </div>
            <button
              onClick={() => setIncompleteFields([])}
              className="flex-shrink-0 text-muted-foreground hover:text-foreground transition-colors"
              aria-label="Dismiss"
            >
              <X className="h-4 w-4" />
            </button>
          </div>
        )}
        {/* Profile Card */}
        <div className="rounded-2xl border bg-card p-6 shadow-sm space-y-6">
          {/* Avatar + Role */}
          <div className="flex items-center gap-4">
            <div className="flex h-16 w-16 flex-shrink-0 items-center justify-center rounded-2xl bg-primary text-primary-foreground font-heading text-2xl font-bold shadow shadow-primary/20">
              {user.name?.charAt(0)?.toUpperCase()}
            </div>
            <div className="min-w-0 flex-1">
              <div className="flex flex-wrap items-center gap-2">
                <h2 className="font-heading text-xl font-bold text-card-foreground truncate">{user.name}</h2>
                {(!user.phone || (!user.gender && (user.role === 'user' || user.role === 'student'))) && (
                  <span className="inline-flex flex-shrink-0 items-center gap-1 rounded-full bg-destructive/10 px-2 py-0.5 text-[10px] font-bold text-destructive uppercase tracking-wider">
                    <AlertTriangle className="h-3 w-3" /> Incomplete
                  </span>
                )}
              </div>
              <span className="mt-1 inline-flex items-center gap-1.5 rounded-full bg-primary/10 px-3 py-0.5 text-xs font-semibold text-primary capitalize">
                <Shield className="h-3 w-3" />
                {roleLabel(user.role)}
              </span>
            </div>
            <Button
              variant="outline"
              size="sm"
              className="ml-auto rounded-xl"
              onClick={() => setEditing(!editing)}
            >
              {editing ? <X className="mr-1.5 h-4 w-4" /> : <Pencil className="mr-1.5 h-4 w-4" />}
              {editing ? 'Cancel' : 'Edit'}
            </Button>
          </div>

          {/* Info Fields */}
          {editing ? (
            <div className="space-y-4">
              <div>
                <Label htmlFor="profile-name">Full Name</Label>
                <Input id="profile-name" name="profile-name" value={editName} onChange={(e) => setEditName(e.target.value)} className="mt-1.5 rounded-xl" />
              </div>
              <div>
                <Label htmlFor="profile-phone">Phone Number</Label>
                <Input id="profile-phone" name="profile-phone" type="tel" value={editPhone} onChange={(e) => setEditPhone(e.target.value)} placeholder="+91 98765 XXXXX" className="mt-1.5 rounded-xl" />
              </div>
              {(user.role === 'user' || user.role === 'student') && (
                <div>
                  <Label htmlFor="profile-gender">Gender</Label>
                  <select
                    id="profile-gender"
                    name="profile-gender"
                    value={editGender}
                    onChange={(e) => setEditGender(e.target.value)}
                    className="mt-1.5 flex h-10 w-full rounded-xl border border-input bg-background px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-ring"
                  >
                    <option value="">Select gender</option>
                    <option value="male">Male</option>
                    <option value="female">Female</option>
                  </select>
                </div>
              )}
              <Button className="rounded-xl shadow-sm shadow-primary/20" onClick={handleSaveProfile} disabled={saving}>
                {saving ? (
                  <span className="flex items-center gap-2">
                    <span className="h-4 w-4 animate-spin rounded-full border-2 border-white border-t-transparent" />
                    Saving…
                  </span>
                ) : (
                  <><Save className="mr-1.5 h-4 w-4" />Save Changes</>
                )}
              </Button>
            </div>
          ) : (
            <div className="space-y-3">
              <InfoRow icon={User} label="Full Name" value={user.name} />
              <InfoRow icon={Mail} label="Email" value={user.email} />
              <InfoRow icon={Phone} label="Phone" value={user.phone || 'Not set'} />
              {(user.role === 'user' || user.role === 'student') && (
                <InfoRow icon={Shield} label="Gender" value={user.gender ? user.gender.charAt(0).toUpperCase() + user.gender.slice(1) : 'Not set'} />
              )}
            </div>
          )}
        </div>


        {/* Danger Zone */}
        <div className="mt-4 rounded-2xl border border-destructive/20 bg-destructive/5 p-6 shadow-sm">
          <h3 className="font-heading text-lg font-semibold text-destructive">Danger Zone</h3>
          <p className="mt-1 text-sm text-muted-foreground">Permanently delete your account and all associated data. This cannot be undone.</p>
          <Button variant="destructive" className="mt-4 rounded-xl" onClick={() => setShowDeleteModal(true)}>
            <Trash2 className="mr-1.5 h-4 w-4" />
            Delete Account
          </Button>
        </div>

        {/* Legal Agreements */}
        <div className="mt-4 rounded-2xl border bg-card p-6 shadow-sm space-y-4">
          <div className="flex items-center gap-3">
            <div className="flex h-9 w-9 items-center justify-center rounded-xl bg-primary/5 text-primary">
              <Shield className="h-5 w-5" />
            </div>
            <h3 className="font-heading text-lg font-semibold text-card-foreground">Legal & Privacy</h3>
          </div>

          <div className="space-y-3">
            <div className="flex items-center justify-between rounded-xl bg-secondary/40 px-4 py-3">
              <div className="flex items-center gap-3">
                <CheckCircle2 className={`h-5 w-5 ${user.terms_accepted ? 'text-chart-3' : 'text-muted-foreground'}`} />
                <span className="text-sm font-medium">Terms & Conditions Accepted</span>
              </div>
              {!user.terms_accepted && (
                <Button 
                  size="sm" 
                  variant="link" 
                  className="h-auto p-0 text-primary font-bold"
                  onClick={async () => {
                    const { error } = await supabase.from('users').update({ terms_accepted: true }).eq('id', user.id)
                    if (!error) setUser({...user, terms_accepted: true})
                  }}
                >
                  Accept Now
                </Button>
              )}
            </div>

            <div className="flex items-center justify-between rounded-xl bg-secondary/40 px-4 py-3 text-sm">
              <span className="text-muted-foreground">Privacy Policy & Cookie Policy</span>
              <div className="flex gap-4">
                <Link to="/terms" className="text-primary hover:underline font-medium">Terms</Link>
                <Link to="/privacy" className="text-primary hover:underline font-medium">Privacy</Link>
              </div>
            </div>
          </div>
        </div>
      </main>

      {/* Delete Confirm Modal */}
      {showDeleteModal && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/50 backdrop-blur-sm p-4" onClick={() => !deleteLoading && setShowDeleteModal(false)}>
          <div className="w-full max-w-sm rounded-2xl bg-card p-6 shadow-2xl" onClick={(e) => e.stopPropagation()}>
            <div className="flex items-start gap-4">
              <div className="flex h-11 w-11 flex-shrink-0 items-center justify-center rounded-xl bg-destructive/10">
                <AlertTriangle className="h-5 w-5 text-destructive" />
              </div>
              <div>
                <h3 className="font-heading text-lg font-semibold text-card-foreground">Delete Account?</h3>
                <p className="mt-1.5 text-sm text-muted-foreground">Your profile and all data will be permanently removed. This action cannot be undone.</p>
              </div>
            </div>
            <div className="mt-6 flex justify-end gap-3">
              <Button variant="outline" className="rounded-xl" onClick={() => setShowDeleteModal(false)} disabled={deleteLoading}>Cancel</Button>
              <Button variant="destructive" className="rounded-xl" onClick={handleDeleteAccount} disabled={deleteLoading}>
                {deleteLoading ? 'Deleting…' : 'Delete Account'}
              </Button>
            </div>
          </div>
        </div>
      )}
    </div>
  )
}

function InfoRow({ icon: Icon, label, value }) {
  return (
    <div className="flex items-center gap-3 rounded-xl bg-secondary/40 px-4 py-3">
      <Icon className="h-4 w-4 text-primary flex-shrink-0" />
      <div className="min-w-0">
        <p className="text-xs text-muted-foreground">{label}</p>
        <p className="text-sm font-medium text-foreground truncate">{value}</p>
      </div>
    </div>
  )
}
