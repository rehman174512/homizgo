import { useEffect, useRef, useState, useCallback } from 'react'
import { useNavigate } from 'react-router-dom'
import { getProperties, getUserInterests, subscribeToProperties, subscribeToInterests } from '@/lib/store'
import { useProfileGuard } from '@/hooks/useProfileGuard'
import { Navbar } from '@/components/Navbar'
import { PropertyCard } from '@/components/PropertyCard'
import { Skeleton } from '@/components/ui/Skeleton'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'
import { Slider } from '@/components/ui/slider'
import { Search, SlidersHorizontal, Building2, Users, X, Heart } from 'lucide-react'

const ALL_FACILITIES = [
  'WiFi', 'Parking', 'Food', 'Electricity', 'Laundry', 'AC', 'Gym', 'Security',
  'TV', 'Attached bathroom', 'cctv', 'water', 'drinking water', 'bed', 'study table',
  'nearby transport', 'nearby hospital', 'nearby grocery store', 'fire safety',
  'room cleaning', 'Maintenance service'
]

export default function UserDashboard() {
  const { user, profileReady } = useProfileGuard('user')
  const [properties, setProperties] = useState([])
  const [loading, setLoading] = useState(true)
  const [showFilters, setShowFilters] = useState(false)
  const [search, setSearch] = useState('')
  const [savedIds, setSavedIds] = useState([]) // set of property IDs the user has hearted
  const navigate = useNavigate()

  const [filterType, setFilterType] = useState('all')
  const [filterMaxPrice, setFilterMaxPrice] = useState(15000)
  const [filterFacilities, setFilterFacilities] = useState([])
  const [filterInterested, setFilterInterested] = useState(false)

  const loadData = useCallback(async () => {
    if (!user) return
    try {
      const [rows, interests] = await Promise.all([
        getProperties(user.gender || null),
        getUserInterests(user.id),
      ])
      setProperties(rows)
      setSavedIds(interests)
    } catch (_) {
      // Data load failed silently; empty state is shown to user
    } finally {
      setLoading(false)
    }
  }, [user])

  useEffect(() => {
    if (!profileReady || !user) return
    let active = true
    loadData()

    // Real-time synchronization for properties and interests
    const unsubProps = subscribeToProperties(() => {
      if (active) loadData()
    })
    const unsubInterests = subscribeToInterests(() => {
      if (active) loadData()
    })

    return () => { 
      active = false
      unsubProps()
      unsubInterests()
    }
  }, [profileReady, user, loadData])

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
        gsap.fromTo('.udash-heading', { x: -30, opacity: 0 }, {
          x: 0, opacity: 1, duration: 0.65, ease: 'power3.out',
          scrollTrigger: { trigger: '.udash-heading', start: 'top 90%', toggleActions: 'play reverse play reverse' },
        })
        gsap.fromTo('.udash-card', { y: 48, opacity: 0, scale: 0.96 }, {
          y: 0, opacity: 1, scale: 1, duration: 0.6, stagger: 0.1, ease: 'power3.out',
          scrollTrigger: { trigger: '.udash-card', start: 'top 88%', toggleActions: 'play reverse play reverse' },
        })
      }, pageRef)
    })()
    return () => ctx?.revert()
  }, [properties.length])

  const filtered = properties.filter((p) => {
    if (!p.available) return false
    if (filterInterested && !savedIds.includes(p.id)) return false
    if (
      search &&
      !p.title.toLowerCase().includes(search.toLowerCase()) &&
      !p.location.toLowerCase().includes(search.toLowerCase())
    ) return false
    if (filterType !== 'all' && p.ownerRole !== filterType) return false
    if (p.price > filterMaxPrice) return false
    if (filterFacilities.length > 0 && !filterFacilities.every((f) => p.facilities.includes(f))) return false
    return true
  })

  const landlordListings = filtered.filter((p) => p.ownerRole === 'landlord')
  const pgListings = filtered.filter((p) => p.ownerRole === 'pgowner')
  const activeFilters = (filterType !== 'all' ? 1 : 0) + (filterMaxPrice < 15000 ? 1 : 0) + filterFacilities.length

  const clearFilters = () => {
    setFilterType('all')
    setFilterMaxPrice(15000)
    setFilterFacilities([])
    setSearch('')
    setFilterInterested(false)
  }
  const toggleFacility = (f) =>
    setFilterFacilities((prev) => (prev.includes(f) ? prev.filter((x) => x !== f) : [...prev, f]))

  const handleToggleLike = (propId, newState) => {
    setSavedIds((prev) =>
      newState ? [...prev, propId] : prev.filter((id) => id !== propId)
    )
  }

  if (!profileReady || !user) return null

  // Human-readable description based on auto-applied gender filter
  const genderNote =
    user.gender === 'male'
      ? 'Showing Boys & Both PGs'
      : user.gender === 'female'
      ? 'Showing Girls & Both PGs'
      : null

  return (
    <div ref={pageRef} className="min-h-screen pb-20 md:pb-0">
      <Navbar />
      <main className="mx-auto max-w-7xl px-4 py-8 lg:px-8">
        <div className="flex flex-col gap-4 sm:flex-row sm:items-center sm:justify-between">
          <div>
            <div className="flex items-center gap-2 mb-1">
              <span className="inline-flex items-center gap-1.5 rounded-full bg-primary/10 px-3 py-1 text-xs font-medium text-primary">
                <Building2 className="h-3 w-3" />
                Student
              </span>
              {genderNote && (
                <span className="inline-flex items-center rounded-full bg-secondary px-3 py-1 text-xs text-muted-foreground">
                  {genderNote}
                </span>
              )}
            </div>
            <h1 className="font-heading text-3xl font-bold text-foreground">Find Your Stay</h1>
            <p className="mt-1 text-muted-foreground">
              {user.gender ? `Hey ${user.name}, browse ${filtered.length} available propert${filtered.length !== 1 ? 'ies' : 'y'}` : `Hey ${user.name}, please complete your profile to view properties.`}
            </p>
          </div>
          {user.gender && (
            <Button variant="outline" className="rounded-xl" onClick={() => setShowFilters(!showFilters)}>
              <SlidersHorizontal className="mr-2 h-4 w-4" />
              {showFilters ? 'Hide Filters' : 'Filters'}
              {activeFilters > 0 && (
                <span className="ml-2 flex h-5 w-5 items-center justify-center rounded-full bg-primary text-[10px] font-bold text-primary-foreground">
                  {activeFilters}
                </span>
              )}
            </Button>
          )}
        </div>

        {!user.gender && (
          <div className="mt-12 text-center p-8 rounded-2xl border bg-card shadow-sm">
            <h2 className="text-xl font-bold mb-2">Profile Incomplete</h2>
            <p className="text-muted-foreground mb-4">You need to set your gender to view matching properties.</p>
            <Button onClick={() => navigate('/profile')}>Complete Profile</Button>
          </div>
        )}

        {user.gender && (
          <div className="w-full">
            {/* Search bar */}
        <div className="mt-6">
          <div className="flex items-center gap-2 rounded-2xl border bg-card p-2 shadow-sm">
            <div className="flex flex-1 items-center gap-2 rounded-xl bg-secondary/50 px-4 py-3">
              <Search className="h-5 w-5 text-muted-foreground" />
              <input
                id="user-search-input"
                name="user-search-input"
                type="text"
                placeholder="Search by name or location..."
                className="w-full bg-transparent text-sm text-foreground placeholder:text-muted-foreground focus:outline-none"
                value={search}
                onChange={(e) => setSearch(e.target.value)}
              />
              {search && (
                <button onClick={() => setSearch('')} className="text-muted-foreground hover:text-foreground">
                  <X className="h-4 w-4" />
                </button>
              )}
            </div>
          </div>
        </div>

        {/* Filters (gender filter removed) */}
        {showFilters && (
          <div className="mt-4 rounded-2xl border bg-card p-6 shadow-sm">
            <div className="flex items-center justify-between mb-5">
              <h3 className="font-heading text-lg font-semibold text-card-foreground">Filters</h3>
              <Button variant="ghost" size="sm" className="rounded-xl text-muted-foreground" onClick={clearFilters}>
                <X className="mr-1 h-4 w-4" />
                Clear All
              </Button>
            </div>
            <div className="grid gap-6 md:grid-cols-2 lg:grid-cols-3">
              <div>
                <Label className="text-xs font-semibold uppercase tracking-wider text-muted-foreground">Type</Label>
                <div className="mt-2 flex flex-wrap gap-2">
                  {['all', 'landlord', 'pgowner'].map((t) => (
                    <Button
                      key={t}
                      type="button"
                      variant={filterType === t ? 'default' : 'outline'}
                      size="sm"
                      className="rounded-xl"
                      onClick={() => setFilterType(t)}
                    >
                      {t === 'all' ? 'All' : t === 'landlord' ? 'Rental' : 'PG'}
                    </Button>
                  ))}
                  <Button
                    type="button"
                    variant={filterInterested ? 'default' : 'outline'}
                    size="sm"
                    className={`rounded-xl ${filterInterested ? 'bg-red-500 hover:bg-red-600 border-red-500' : ''}`}
                    onClick={() => setFilterInterested(!filterInterested)}
                  >
                    <Heart className={`mr-1.5 h-3.5 w-3.5 ${filterInterested ? 'fill-white' : ''}`} />
                    Interested
                  </Button>
                </div>
              </div>
              <div>
                <Label className="text-xs font-semibold uppercase tracking-wider text-muted-foreground">
                  Max Price: <span className="text-primary font-bold">INR {filterMaxPrice.toLocaleString('en-IN')}</span>
                </Label>
                <div className="mt-3">
                  <Slider value={[filterMaxPrice]} onValueChange={([v]) => setFilterMaxPrice(v)} max={20000} min={1000} step={500} />
                </div>
              </div>
              <div>
                <Label className="text-xs font-semibold uppercase tracking-wider text-muted-foreground">Facilities</Label>
                <div className="mt-2 flex flex-wrap gap-1.5">
                  {ALL_FACILITIES.map((f) => (
                    <button
                      key={f}
                      onClick={() => toggleFacility(f)}
                      className={`rounded-lg px-2.5 py-1 text-xs font-medium transition-all ${
                        filterFacilities.includes(f)
                          ? 'bg-primary text-primary-foreground shadow-sm'
                          : 'bg-secondary text-secondary-foreground hover:bg-secondary/80'
                      }`}
                    >
                      {f}
                    </button>
                  ))}
                </div>
              </div>
            </div>
          </div>
        )}

        {/* Skeleton state */}
        {loading && (
          <div className="space-y-12">
            {[1, 2].map((section) => (
              <div key={section} className="mt-10">
                <div className="flex items-center gap-2 mb-6">
                  <Skeleton className="h-8 w-8 rounded-lg" />
                  <Skeleton className="h-6 w-40" />
                  <Skeleton className="h-5 w-8 rounded-full" />
                </div>
                <div className="grid gap-6 sm:grid-cols-2 lg:grid-cols-3">
                  {[1, 2, 3].map((i) => (
                    <div key={i} className="udash-card overflow-hidden rounded-3xl border bg-card/50">
                      <Skeleton className="aspect-[4/3] w-full" />
                      <div className="p-5 space-y-4">
                        <div className="flex justify-between items-center">
                          <Skeleton className="h-7 w-1/2" />
                          <Skeleton className="h-6 w-1/4 rounded-full" />
                        </div>
                        <Skeleton className="h-4 w-3/4" />
                        <div className="flex gap-3">
                          <Skeleton className="h-4 w-16" />
                          <Skeleton className="h-4 w-16" />
                        </div>
                        <div className="pt-2 flex gap-3">
                          <Skeleton className="h-11 flex-1 rounded-xl" />
                          <Skeleton className="h-11 w-11 rounded-xl" />
                        </div>
                      </div>
                    </div>
                  ))}
                </div>
              </div>
            ))}
          </div>
        )}

        {/* Listings */}
        {!loading && landlordListings.length > 0 && (
          <div className="mt-10">
            <div className="flex items-center gap-2 mb-6">
              <div className="flex h-8 w-8 items-center justify-center overflow-hidden rounded-lg bg-primary/10">
                <img src="/assets/logo.png" alt="Landlord Rentals" className="h-full w-full object-contain p-1.5" />
              </div>
              <h2 className="udash-heading font-heading text-xl font-semibold text-foreground">Landlord Rentals</h2>
              <span className="rounded-full bg-secondary px-2.5 py-0.5 text-xs font-medium text-muted-foreground">
                {landlordListings.length}
              </span>
            </div>
            <div className="grid gap-6 sm:grid-cols-2 lg:grid-cols-3">
              {landlordListings.map((p, i) => (
                <PropertyCard
                  key={p.id}
                  property={p}
                  index={i}
                  isLiked={savedIds.includes(p.id)}
                  onToggleLike={handleToggleLike}
                  className="udash-card"
                />
              ))}
            </div>
          </div>
        )}

        {!loading && pgListings.length > 0 && (
          <div className="mt-14">
            <div className="flex items-center gap-2 mb-6">
              <div className="flex h-8 w-8 items-center justify-center rounded-lg bg-accent/10">
                <Users className="h-4 w-4 text-accent" />
              </div>
              <h2 className="udash-heading font-heading text-xl font-semibold text-foreground">PG Accommodations</h2>
              <span className="rounded-full bg-secondary px-2.5 py-0.5 text-xs font-medium text-muted-foreground">
                {pgListings.length}
              </span>
            </div>
            <div className="grid gap-6 sm:grid-cols-2 lg:grid-cols-3">
              {pgListings.map((p, i) => (
                <PropertyCard
                  key={p.id}
                  property={p}
                  index={i + 2}
                  isLiked={savedIds.includes(p.id)}
                  onToggleLike={handleToggleLike}
                  className="udash-card"
                />
              ))}
            </div>
          </div>
        )}

        {!loading && user.gender && filtered.length === 0 && (
          <div className="mt-20 text-center">
            <div className="mx-auto mb-4 flex h-16 w-16 items-center justify-center rounded-2xl bg-secondary">
              {filterInterested
                ? <Heart className="h-8 w-8 text-muted-foreground/40" />
                : <Search className="h-8 w-8 text-muted-foreground/40" />}
            </div>
            <p className="text-lg font-semibold text-foreground">
              {filterInterested ? 'No interested properties yet' : 'No properties found'}
            </p>
            <p className="mt-1 text-muted-foreground">
              {filterInterested ? 'Heart a property to save it here.' : 'Try adjusting your filters or search criteria.'}
            </p>
            <Button variant="outline" className="mt-4 rounded-xl" onClick={clearFilters}>
              Clear Filters
            </Button>
          </div>
        )}
          </div>
        )}
      </main>
    </div>
  )
}
