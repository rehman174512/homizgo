import { useEffect, useRef, useState } from 'react'
import { Link, useNavigate } from 'react-router-dom'
import { getMyProperties, addProperty, updateProperty, deleteProperty, getUsers, subscribeToInterests } from '@/lib/store'
import { useProfileGuard } from '@/hooks/useProfileGuard'
import { Skeleton } from '@/components/ui/Skeleton'
import { Navbar } from '@/components/Navbar'
import { PropertyForm } from '@/components/PropertyForm'
import { Button } from '@/components/ui/button'
import { Plus, Pencil, Trash2, Eye, Users, MessageSquare, MapPin, IndianRupee, Building2, Home, TrendingUp, Clock, CheckCircle2, XCircle, AlertCircle } from 'lucide-react'

export default function LandlordDashboard() {
  const { user, profileReady } = useProfileGuard('landlord')
  const [properties, setProperties] = useState([])
  const [allUsers, setAllUsers] = useState([])
  const [loading, setLoading] = useState(true)
  const [showForm, setShowForm] = useState(false)
  const [editProp, setEditProp] = useState(null)
  const [viewInterested, setViewInterested] = useState(null)
  const [isSubmitting, setIsSubmitting] = useState(false)
  const [errorStatus, setErrorStatus] = useState(null)
  const [propToDelete, setPropToDelete] = useState(null)
  const navigate = useNavigate()

  useEffect(() => {
    if (!profileReady || !user) return
    let active = true
    async function load() {
      setLoading(true)
      try {
        const [users, props] = await Promise.all([getUsers(), getMyProperties(user.id)])
        if (!active) return
        setAllUsers(users)
        setProperties(props)
      } catch (_) {
        // Load failed silently; empty state shown
      } finally {
        if (active) setLoading(false)
      }
    }
    load()

    // Real-time interests subscription
    const unsub = subscribeToInterests(() => {
      if (active) refreshProperties(user.id)
    })

    return () => { 
      active = false
      unsub()
    }
  }, [profileReady, user])

  // ── GSAP scroll animations ──────────────────────────────────────────
  const pageRef = useRef(null)
  useEffect(() => {
    if (!properties.length) return
    let ctx
    ;(async () => {
      const { gsap } = await import('gsap')
      const { ScrollTrigger } = await import('gsap/ScrollTrigger')
      gsap.registerPlugin(ScrollTrigger)
      ctx = gsap.context(() => {
        gsap.fromTo('.ldash-stat', { y: 40, opacity: 0, scale: 0.95 }, {
          y: 0, opacity: 1, scale: 1, duration: 0.6, stagger: 0.1, ease: 'power3.out',
          scrollTrigger: { trigger: '.ldash-stat', start: 'top 88%', toggleActions: 'play reverse play reverse' },
        })
        gsap.fromTo('.ldash-row', { x: -20, opacity: 0 }, {
          x: 0, opacity: 1, duration: 0.55, stagger: 0.08, ease: 'power3.out',
          scrollTrigger: { trigger: '.ldash-row', start: 'top 88%', toggleActions: 'play reverse play reverse' },
        })
      }, pageRef)
    })()
    return () => ctx?.revert()
  }, [properties.length])

  const refreshProperties = async (ownerId) => {
    const props = await getMyProperties(ownerId)
    setProperties(props)
  }

  const handleAdd = async (data) => {
    if (!user) return
    setIsSubmitting(true)
    setErrorStatus(null)
    try {
      await addProperty({ ...data, ownerId: user.id, ownerName: user.name, ownerRole: 'landlord' })
      await refreshProperties(user.id)
      setShowForm(false)
    } catch (err) {
      console.error('[LandlordDashboard] Failed to add property:', err)
      setErrorStatus(err.message || 'Failed to add property. Please check your connection.')
    } finally {
      setIsSubmitting(false)
    }
  }

  const handleEdit = async (data) => {
    if (!editProp) return
    setIsSubmitting(true)
    setErrorStatus(null)
    try {
      await updateProperty(editProp.id, data)
      await refreshProperties(user.id)
      setEditProp(null)
    } catch (err) {
      console.error('[LandlordDashboard] Failed to update property:', err)
      setErrorStatus(err.message || 'Failed to update property.')
    } finally {
      setIsSubmitting(false)
    }
  }

  const handleDeleteConfirm = async () => {
    if (propToDelete) {
      try {
        await deleteProperty(propToDelete)
        await refreshProperties(user.id)
        setPropToDelete(null)
      } catch (_) {
        setPropToDelete(null)
      }
    }
  }

  const getInterestedUserNames = (userIds) =>
    userIds.map((id) => { const u = allUsers.find((usr) => usr.id === id); return u ? u.name : 'Unknown User' })

  if (!profileReady || !user) return null

  const totalInterested = properties.reduce((sum, p) => sum + p.interestedUsers.length, 0)

  return (
    <div ref={pageRef} className="min-h-screen pb-20 md:pb-0">
      <Navbar />
      <main className="mx-auto max-w-7xl px-4 py-8 lg:px-8">
        <div className="flex flex-col gap-4 sm:flex-row sm:items-center sm:justify-between">
          <div>
            <div className="flex items-center gap-2 mb-1">
              <span className="inline-flex items-center gap-1.5 rounded-full bg-primary/10 px-3 py-1 text-xs font-medium text-primary">
                <Home className="h-3 w-3" />
                landlord/Student Host (for seniors renting/sharing)
              </span>
            </div>
            <h1 className="font-heading text-3xl font-bold text-foreground">My Properties</h1>
            <p className="mt-1 text-muted-foreground">Welcome back, {user.name}</p>
          </div>
          <Button className="rounded-xl shadow-lg shadow-primary/20" onClick={() => { setShowForm(true); setEditProp(null) }}>
            <Plus className="mr-2 h-4 w-4" />
            Add Property
          </Button>
        </div>

        {/* Stats */}
        <div className="mt-8 grid gap-4 sm:grid-cols-3">
          {loading ? (
             [1, 2, 3].map(i => (
              <div key={i} className="rounded-2xl border bg-card p-5">
                <div className="flex items-center gap-3">
                  <Skeleton className="h-11 w-11 rounded-xl" />
                  <div className="space-y-2">
                    <Skeleton className="h-6 w-12" />
                    <Skeleton className="h-4 w-20" />
                  </div>
                </div>
              </div>
            ))
          ) : (
            [
              { label: 'Total Properties', value: properties.length, icon: Home, color: 'bg-primary/10 text-primary' },
              { label: 'Interested Users', value: totalInterested, icon: Users, color: 'bg-accent/10 text-accent' },
              { label: 'Available', value: properties.filter((p) => p.available).length, icon: TrendingUp, color: 'bg-chart-3/10 text-chart-3' },
            ].map((stat) => (
              <div key={stat.label} className="ldash-stat rounded-2xl border bg-card p-5 transition-all hover:shadow-md">
                <div className="flex items-center gap-3">
                  <div className={`flex h-11 w-11 items-center justify-center rounded-xl ${stat.color}`}>
                    <stat.icon className="h-5 w-5" />
                  </div>
                  <div>
                    <p className="font-heading text-2xl font-bold text-card-foreground">{stat.value}</p>
                    <p className="text-sm text-muted-foreground">{stat.label}</p>
                  </div>
                </div>
              </div>
            ))
          )}
        </div>

        {(showForm || editProp) && (
          <div className="mt-8 rounded-2xl border bg-card p-6 shadow-sm animate-in zoom-in-95 duration-200">
            {errorStatus && (
              <div className="mb-4 rounded-xl bg-destructive/10 p-3 text-sm text-destructive border border-destructive/20 flex items-center gap-2">
                <AlertCircle className="h-4 w-4" />
                {errorStatus}
              </div>
            )}
            <PropertyForm 
              onSubmit={editProp ? handleEdit : handleAdd} 
              onCancel={() => { setShowForm(false); setEditProp(null); setErrorStatus(null) }} 
              initial={editProp || undefined} 
              isPG={false}
              isLoading={isSubmitting}
            />
          </div>
        )}

        <div className="mt-8 space-y-4">
          {loading ? (
            [1, 2, 3].map(i => (
              <div key={i} className="rounded-2xl border bg-card p-5 space-y-4">
                <div className="flex justify-between items-center">
                  <div className="flex-1 space-y-2">
                    <Skeleton className="h-6 w-1/3" />
                    <Skeleton className="h-4 w-1/2" />
                  </div>
                  <div className="flex gap-2">
                    <Skeleton className="h-8 w-16 rounded-xl" />
                    <Skeleton className="h-8 w-16 rounded-xl" />
                  </div>
                </div>
              </div>
            ))
          ) : properties.length === 0 && !showForm ? (
            <div className="rounded-2xl border bg-card p-16 text-center">
              <div className="mx-auto mb-4 flex h-16 w-16 items-center justify-center overflow-hidden rounded-2xl bg-secondary shadow-sm">
                <img src="/assets/logo.png" alt="No properties" className="h-full w-full object-contain p-3 opacity-20 grayscale" />
              </div>
              <p className="text-lg font-semibold text-card-foreground">No properties yet</p>
              <p className="mt-1 text-sm text-muted-foreground">Add your first rental property to get started.</p>
              <Button className="mt-5 rounded-xl" onClick={() => setShowForm(true)}>
                <Plus className="mr-2 h-4 w-4" />
                Add First Property
              </Button>
            </div>
          ) : (
            properties.map((prop) => (
              <div key={prop.id} className="ldash-row group rounded-2xl border bg-card p-5 transition-all hover:shadow-md hover:border-primary/20">
                <div className="flex flex-col gap-4 lg:flex-row lg:items-center lg:justify-between">
                  <div className="flex-1">
                    <div className="flex items-center gap-2 flex-wrap">
                      <h3 className="font-heading text-lg font-semibold text-card-foreground">{prop.title}</h3>
                      {/* Approval status badge */}
                      {prop.status === 'pending' && (
                        <span className="inline-flex items-center gap-1 rounded-lg bg-orange-500/10 px-2.5 py-0.5 text-xs font-medium text-orange-600 dark:text-orange-400">
                          <Clock className="h-3 w-3" />Pending Review
                        </span>
                      )}
                      {prop.status === 'approved' && (
                        <span className="inline-flex items-center gap-1 rounded-lg bg-green-500/10 px-2.5 py-0.5 text-xs font-medium text-green-600 dark:text-green-400">
                          <CheckCircle2 className="h-3 w-3" />Approved
                        </span>
                      )}
                      {prop.status === 'rejected' && (
                        <span className="inline-flex items-center gap-1 rounded-lg bg-red-500/10 px-2.5 py-0.5 text-xs font-medium text-red-600 dark:text-red-400">
                          <XCircle className="h-3 w-3" />Rejected
                        </span>
                      )}
                      <span className={`rounded-lg px-2.5 py-0.5 text-xs font-medium ${prop.available ? 'bg-chart-3/10 text-chart-3' : 'bg-destructive/10 text-destructive'}`}>
                        {prop.available ? 'Available' : 'Unavailable'}
                      </span>
                      <span className="rounded-lg bg-secondary px-2.5 py-0.5 text-xs font-medium capitalize text-muted-foreground">
                        {(prop.propertyFor === 'male' || prop.propertyFor === 'boys') ? 'Boys' : (prop.propertyFor === 'female' || prop.propertyFor === 'girls') ? 'Girls' : 'Girls & Boys'}
                      </span>
                    </div>
                    {prop.status === 'rejected' && prop.rejection_reason && (
                      <div className="mt-2 rounded-lg bg-red-500/5 border border-red-500/20 px-3 py-2 flex flex-col sm:flex-row sm:items-center justify-between gap-2">
                        <p className="text-xs text-red-600 dark:text-red-400"><span className="font-semibold">Rejection reason:</span> {prop.rejection_reason}</p>
                        <Link to="/chat?admin=true">
                          <Button variant="ghost" size="sm" className="h-7 px-2 text-[10px] text-red-600 hover:bg-red-500/10 hover:text-red-700">
                            Contact Support
                          </Button>
                        </Link>
                      </div>
                    )}
                    <div className="mt-2 flex flex-wrap items-center gap-4 text-sm text-muted-foreground">
                      <span className="flex items-center gap-1"><MapPin className="h-3.5 w-3.5" />{prop.location}</span>
                      <span className="flex items-center gap-1"><IndianRupee className="h-3.5 w-3.5" />{prop.price.toLocaleString('en-IN')}/{prop.rentDuration?.toLowerCase()}</span>
                      <span className="flex items-center gap-1"><Users className="h-3.5 w-3.5" />{prop.interestedUsers.length} interested</span>
                    </div>
                  </div>
                  <div className="flex flex-wrap gap-2">
                    <Link to={`/property/${prop.id}`}><Button variant="outline" size="sm" className="rounded-xl"><Eye className="mr-1.5 h-4 w-4" />View</Button></Link>
                    <Button variant="outline" size="sm" className="rounded-xl" onClick={() => setViewInterested(viewInterested === prop.id ? null : prop.id)}>
                      <Users className="mr-1.5 h-4 w-4" />Interested ({prop.interestedUsers.length})
                    </Button>
                    <Link to="/chat"><Button variant="outline" size="sm" className="rounded-xl"><MessageSquare className="mr-1.5 h-4 w-4" />Chat</Button></Link>
                    <Button variant="outline" size="sm" className="rounded-xl" onClick={() => { setEditProp(prop); setShowForm(false) }}><Pencil className="mr-1.5 h-4 w-4" />Edit</Button>
                    <Button variant="outline" size="sm" className="rounded-xl text-destructive hover:bg-destructive/10" onClick={() => setPropToDelete(prop.id)}><Trash2 className="mr-1.5 h-4 w-4" />Delete</Button>
                  </div>
                </div>
                {viewInterested === prop.id && (
                  <div className="mt-4 rounded-xl bg-secondary/50 p-4">
                    <h4 className="text-sm font-semibold text-card-foreground">Interested Users</h4>
                    {prop.interestedUsers.length === 0 ? (
                      <p className="mt-1 text-sm text-muted-foreground">No one has shown interest yet.</p>
                    ) : (
                      <ul className="mt-2 space-y-1.5">
                        {getInterestedUserNames(prop.interestedUsers).map((name, i) => (
                          <li key={i} className="flex items-center gap-2 text-sm text-card-foreground">
                            <div className="h-2 w-2 rounded-full bg-primary" />{name}
                          </li>
                        ))}
                      </ul>
                    )}
                  </div>
                )}
              </div>
            ))
          )}
        </div>

        {propToDelete && (
          <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/50 p-4 backdrop-blur-sm">
            <div className="w-full max-w-sm rounded-2xl bg-card p-6 shadow-xl">
              <h3 className="font-heading text-lg font-semibold text-card-foreground">Delete Property</h3>
              <p className="mt-2 text-sm text-muted-foreground">Are you sure you want to delete this property? This action cannot be undone.</p>
              <div className="mt-6 flex justify-end gap-3">
                <Button variant="outline" className="rounded-xl" onClick={() => setPropToDelete(null)}>Cancel</Button>
                <Button variant="destructive" className="rounded-xl" onClick={handleDeleteConfirm}>Delete</Button>
              </div>
            </div>
          </div>
        )}
      </main>
    </div>
  )
}
