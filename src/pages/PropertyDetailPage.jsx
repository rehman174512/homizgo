import { useEffect, useState, useCallback, useRef } from 'react'
import { useParams, useNavigate } from 'react-router-dom'
import { gsap } from 'gsap'
import {
  getCurrentUser, getPropertyById, toggleInterest, getOrCreateThread,
} from '@/lib/store'
import { getReviews, upsertReview, deleteReview } from '@/lib/reviewService'
import { sendNotificationToOwner } from '@/lib/notificationService'
import SEO from '@/components/SEO'
import { Navbar } from '@/components/Navbar'
import { MapComponent } from '@/components/Map'
import { Button } from '@/components/ui/button'
import { Badge } from '@/components/ui/badge'
import { Textarea } from '@/components/ui/textarea'
import { Skeleton } from '@/components/ui/Skeleton'
import {
  ArrowLeft, Heart, MessageSquare, MapPin, IndianRupee, Wifi, Car, UtensilsCrossed, Zap,
  ShieldCheck, Dumbbell, WashingMachine, Wind, Users, Home, CheckCircle2, XCircle,
  CreditCard, Share2, Phone, Star, Send, Pencil, Trash2, AlertTriangle,
  Tv, Bath, Shield, Droplets, GlassWater, Bed, Table, Bus, Building2, Store, Flame, Brush, Wrench
} from 'lucide-react'
import { format } from 'date-fns'

const facilityIcons = {
  WiFi: Wifi, Parking: Car, Food: UtensilsCrossed, Electricity: Zap,
  Security: ShieldCheck, Gym: Dumbbell, Laundry: WashingMachine, AC: Wind,
  'TV': Tv,
  'Attached bathroom': Bath,
  'cctv': Shield,
  'water': Droplets,
  'drinking water': GlassWater,
  'bed': Bed,
  'study table': Table,
  'nearby transport': Bus,
  'nearby hospital': Building2,
  'nearby grocery store': Store,
  'fire safety': Flame,
  'room cleaning': Brush,
  'Maintenance service': Wrench
}

// ─── Star Rating ──────────────────────────────────────────────
function StarRating({ value, onChange, readonly = false, size = 'md' }) {
  const [hovered, setHovered] = useState(0)
  const sz = size === 'sm' ? 'h-4 w-4' : 'h-6 w-6'
  return (
    <div className="flex gap-0.5">
      {[1, 2, 3, 4, 5].map((star) => {
        const filled = (readonly ? value : (hovered || value)) >= star
        return (
          <button
            key={star}
            type="button"
            disabled={readonly}
            onClick={() => onChange?.(star)}
            onMouseEnter={() => !readonly && setHovered(star)}
            onMouseLeave={() => !readonly && setHovered(0)}
            className={`transition-transform ${readonly ? 'cursor-default' : 'hover:scale-110 cursor-pointer'}`}
            aria-label={`${star} star${star !== 1 ? 's' : ''}`}
          >
            <Star className={`${sz} ${filled ? 'fill-chart-4 text-chart-4' : 'text-muted-foreground/30'}`} />
          </button>
        )
      })}
    </div>
  )
}

// ─── Detail Row ───────────────────────────────────────────────
function DetailRow({ label, value, isPositive }) {
  return (
    <div className="flex items-center justify-between rounded-xl border bg-card p-3.5">
      <span className="text-sm text-muted-foreground">{label}</span>
      <span className="flex items-center gap-1.5 text-sm font-medium text-foreground">
        {isPositive !== undefined && (isPositive
          ? <CheckCircle2 className="h-3.5 w-3.5 text-chart-3" />
          : <XCircle className="h-3.5 w-3.5 text-muted-foreground" />
        )}
        {value}
      </span>
    </div>
  )
}

// ─── Review Delete Confirm ────────────────────────────────────
function ConfirmDeleteModal({ open, loading, onConfirm, onCancel }) {
  if (!open) return null
  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/50 p-4 backdrop-blur-sm" onClick={() => { if (!loading) onCancel() }}>
      <div className="w-full max-w-sm rounded-2xl bg-card p-6 shadow-2xl" onClick={(e) => e.stopPropagation()}>
        <div className="flex items-start gap-4">
          <div className="flex h-11 w-11 flex-shrink-0 items-center justify-center rounded-xl bg-destructive/10">
            <AlertTriangle className="h-5 w-5 text-destructive" />
          </div>
          <div>
            <h3 className="font-heading text-lg font-semibold text-card-foreground">Delete Review?</h3>
            <p className="mt-1.5 text-sm text-muted-foreground">
              Your review will be permanently removed.
            </p>
          </div>
        </div>
        <div className="mt-6 flex justify-end gap-3">
          <Button variant="outline" className="rounded-xl" onClick={onCancel} disabled={loading}>Cancel</Button>
          <Button variant="destructive" className="rounded-xl" onClick={onConfirm} disabled={loading}>
            {loading ? (
              <span className="flex items-center gap-2">
                <span className="h-4 w-4 animate-spin rounded-full border-2 border-white border-t-transparent" />
                Deleting…
              </span>
            ) : 'Delete'}
          </Button>
        </div>
      </div>
    </div>
  )
}

// ─── Main Page ────────────────────────────────────────────────
export default function PropertyDetailPage() {
  const { id } = useParams()
  const navigate = useNavigate()
  const [property, setProperty] = useState(null)
  const [loading, setLoading] = useState(true)
  const [owner, setOwner] = useState(null)
  const [currentUser, setCurrentUser] = useState(null)
  const [isInterested, setIsInterested] = useState(false)
  const [selectedImage, setSelectedImage] = useState(0)
  const [showPaymentModal, setShowPaymentModal] = useState(false)

  // Reviews state
  const [reviews, setReviews] = useState([])
  const [reviewsLoading, setReviewsLoading] = useState(true)
  const [myRating, setMyRating] = useState(0)
  const [myComment, setMyComment] = useState('')
  const [submittingReview, setSubmittingReview] = useState(false)
  const [reviewError, setReviewError] = useState('')
  const [reviewSuccess, setReviewSuccess] = useState(false)
  // Edit/delete state
  const [editingReview, setEditingReview] = useState(false)
  const [reviewToDelete, setReviewToDelete] = useState(null)
  const [deletingReview, setDeletingReview] = useState(false)

  // ── Fetch reviews ──────────────────────────────────────────
  const fetchReviews = useCallback(async () => {
    if (!id) return
    setReviewsLoading(true)
    try {
      const data = await getReviews(id)
      setReviews(data)
    } catch (err) {
      console.error('[PropertyDetail] fetchReviews failed:', err)
      setReviews([])
    } finally {
      setReviewsLoading(false)
    }
  }, [id])

  useEffect(() => {
    let active = true
    async function load() {
      setLoading(true)
      try {
        const [current, found] = await Promise.all([getCurrentUser(), getPropertyById(id)])
        if (!active) return
        setCurrentUser(current)
        
        if (!found) {
          console.warn('[PropertyDetail] Property not found or access denied:', id)
          navigate('/')
          return
        }

        setProperty(found)
        setIsInterested(current ? found.interestedUsers.includes(current.id) : false)
        
        // Owner data is now joined in the property object
        if (found.users) {
          setOwner(found.users)
        }
      } catch (err) {
        console.error('[PropertyDetail] load failed:', err)
        navigate('/')
      } finally {
        if (active) setLoading(false)
      }
    }
    load()
    fetchReviews()
    return () => { active = false }
  }, [id, navigate, fetchReviews])

  // Pre-fill review form with user's existing review
  useEffect(() => {
    if (reviews.length > 0 && currentUser) {
      const mine = reviews.find((r) => r.userId === currentUser.id)
      if (mine && !editingReview) {
        setMyRating(mine.rating)
        setMyComment(mine.comment || '')
      }
    }
  }, [reviews, currentUser, editingReview])

  const heartRef = useRef(null)
  const [isToggling, setIsToggling] = useState(false)

  const handleInterest = async () => {
    if (!currentUser) { navigate('/login'); return }
    if (isToggling) return // Anti-spam

    setIsToggling(true)
    try {
      const result = await toggleInterest(property.id, currentUser.id)
      setIsInterested(result)
      
      setProperty((prev) => ({
        ...prev,
        interestedUsers: result
          ? [...prev.interestedUsers, currentUser.id]
          : prev.interestedUsers.filter((uid) => uid !== currentUser.id),
      }))
      
      // Notify owner when interest is added (not removed)
      if (result && property.ownerId && property.ownerId !== currentUser.id) {
        sendNotificationToOwner(
          property.ownerId,
          '❤️ New Interest!',
          `Someone showed interest in your property "${property.title}".`,
          { propertyId: property.id, url: `/property/${property.id}` }
        )
      }
      
      // GSAP bounce animation
      if (heartRef.current) {
        gsap.fromTo(heartRef.current, 
          { scale: 0.5, opacity: 0 }, 
          { scale: 1, opacity: 1, duration: 0.5, ease: 'elastic.out(1, 0.4)' }
        )
      }
    } catch (err) {
      console.error('Failed to toggle interest:', err)
    } finally {
      setIsToggling(false)
    }
  }

  const handleChat = async () => {
    if (!currentUser) { navigate('/login'); return }
    if (currentUser.id === property.ownerId) return
    try {
      const threadId = await getOrCreateThread(currentUser.id, currentUser.name, property.ownerId, property.ownerName || 'Owner', property.id)
      navigate(`/chat?threadId=${threadId}`)
    } catch (err) {
      console.error('Failed to create/get chat thread:', err)
      navigate('/chat')
    }
  }

  const handleShare = () => {
    if (navigator.share) {
      navigator.share({ title: property.title, url: window.location.href })
    } else {
      navigator.clipboard.writeText(window.location.href)
      alert('Link copied to clipboard!')
    }
  }

  // ── Submit / update review ─────────────────────────────────
  const handleSubmitReview = async (e) => {
    e.preventDefault()
    if (!currentUser) { navigate('/login'); return }
    if (myRating === 0) { setReviewError('Please select a rating.'); return }
    setSubmittingReview(true)
    setReviewError('')
    setReviewSuccess(false)
    try {
      await upsertReview(id, currentUser.id, myRating, myComment)
      setReviewSuccess(true)
      setEditingReview(false)
      await fetchReviews()
      // Notify owner about new/updated review
      if (property?.ownerId && property.ownerId !== currentUser.id) {
        sendNotificationToOwner(
          property.ownerId,
          '⭐ New Review!',
          `A new review was added to your property "${property.title}".`,
          { propertyId: property.id, url: `/property/${property.id}` }
        )
      }
    } catch (err) {
      setReviewError(err.message || 'Failed to submit review. Please try again.')
    } finally {
      setSubmittingReview(false)
    }
  }

  // ── Delete review ──────────────────────────────────────────
  const handleDeleteReview = async () => {
    if (!reviewToDelete) return
    setDeletingReview(true)
    try {
      await deleteReview(reviewToDelete)
      setReviewToDelete(null)
      // Reset form
      setMyRating(0)
      setMyComment('')
      setEditingReview(false)
      setReviewSuccess(false)
      await fetchReviews()
    } catch (err) {
      alert(err.message || 'Failed to delete review.')
    } finally {
      setDeletingReview(false)
    }
  }

  if (loading || !property) {
    return (
      <div className="min-h-screen pb-20 md:pb-0">
        <Navbar />
        <main className="mx-auto max-w-7xl px-4 py-8 lg:px-8">
          <div className="mb-6 flex items-center gap-3">
            <Skeleton className="h-10 w-10 rounded-xl" />
            <div className="flex gap-2">
              <Skeleton className="h-6 w-32 rounded-lg" />
              <Skeleton className="h-6 w-24 rounded-lg" />
            </div>
          </div>
          <Skeleton className="mb-4 h-[400px] w-full rounded-2xl" />
          <div className="mt-8 grid gap-8 lg:grid-cols-3">
            <div className="lg:col-span-2 space-y-8">
              <div className="space-y-3">
                <Skeleton className="h-10 w-2/3" />
                <Skeleton className="h-5 w-1/3" />
              </div>
              <div className="flex gap-4">
                <Skeleton className="h-24 w-40 rounded-2xl" />
                <Skeleton className="h-24 w-40 rounded-2xl" />
              </div>
              <div className="space-y-4">
                <Skeleton className="h-6 w-32" />
                <div className="grid grid-cols-2 gap-3 sm:grid-cols-4">
                  {[1, 2, 3, 4].map(i => <Skeleton key={i} className="h-14 rounded-xl" />)}
                </div>
              </div>
            </div>
            <div className="space-y-4">
              <Skeleton className="h-40 rounded-2xl" />
              <Skeleton className="h-64 rounded-2xl" />
            </div>
          </div>
        </main>
      </div>
    )
  }

  const isPG = property.ownerRole === 'pgowner'
  const avgRating = reviews.length > 0
    ? reviews.reduce((s, r) => s + r.rating, 0) / reviews.length
    : 0
  const myReview = currentUser ? reviews.find((r) => r.userId === currentUser.id) : null
  const isStudent = currentUser?.role === 'user' || currentUser?.role === 'student'

  const propertyForLabel =
    (property?.propertyFor === 'male' || property?.propertyFor === 'boys') ? 'Boys' :
    (property?.propertyFor === 'female' || property?.propertyFor === 'girls') ? 'Girls' : 'Girls & Boys'

  return (
    <div className="min-h-screen pb-20 md:pb-0">
      <SEO 
        title={`${property.title} in ${property.location} - Homizgo`}
        description={`Rent this ${property.roomType || property.type || 'property'} for just ₹${property.rent || property.price}/month. ${propertyForLabel} preferred in ${property.location}.`}
        url={`/property/${property.id}`}
        image={property.images?.[0] || '/assets/logo.png'}
        schema={{
          "@context": "https://schema.org",
          "@type": "Apartment",
          "name": property.title,
          "description": property.notes || `A great place to stay in ${property.location}.`,
          "url": `https://homizgo.in/property/${property.id}`,
          "image": property.images?.[0] || 'https://homizgo.in/assets/logo.png',
          "address": {
            "@type": "PostalAddress",
            "addressLocality": property.location,
            "addressRegion": "Maharashtra",
            "addressCountry": "IN"
          },
          "offers": {
            "@type": "Offer",
            "priceCurrency": "INR",
            "price": property.rent || property.price,
            "availability": property.available ? "https://schema.org/InStock" : "https://schema.org/OutOfStock",
            "url": `https://homizgo.in/property/${property.id}`
          }
        }}
      />
      <Navbar />
      <main className="mx-auto max-w-7xl px-4 py-8 lg:px-8">
        {/* Back + badges */}
        <div className="mb-6 flex items-center gap-3">
          <Button variant="ghost" size="icon" className="rounded-xl" onClick={() => navigate(-1)}>
            <ArrowLeft className="h-5 w-5" />
          </Button>
          <div className="flex flex-wrap gap-2">
            <Badge className="rounded-lg">{isPG ? 'PG Accommodation' : 'Rental Property'}</Badge>
            <Badge variant="outline" className="rounded-lg">{propertyForLabel}</Badge>
            {property.available
              ? <Badge className="rounded-lg bg-chart-3/10 text-chart-3 border-chart-3/20">Available</Badge>
              : <Badge variant="destructive" className="rounded-lg">Not Available</Badge>
            }
            {property.status !== 'approved' && (
              <Badge variant="outline" className="rounded-lg bg-amber-50 text-amber-700 border-amber-200 flex items-center gap-1.5 px-3 py-1 animate-pulse">
                <AlertTriangle className="h-3.5 w-3.5" />
                <span className="font-bold uppercase tracking-wider text-[10px]">
                  {property.status === 'rejected' ? 'REJECTED' : 'UNDER MODERATION'}
                </span>
              </Badge>
            )}
          </div>
        </div>

        {/* Main image */}
        <div className="relative mb-4 overflow-hidden rounded-2xl bg-secondary" style={{ height: '400px' }}>
          {property.images && property.images.length > 0 ? (
            <img
              src={property.images[selectedImage]}
              alt={property.title}
              className="h-full w-full object-cover"
            />
          ) : (
            <div className="flex h-full items-center justify-center">
              <Home className="h-24 w-24 text-primary/20" />
            </div>
          )}
        </div>

        {property.images && property.images.length > 1 && (
          <div className="mt-4 flex gap-3 overflow-x-auto pb-2">
            {property.images.map((url, i) => (
              <div
                key={i}
                onClick={() => setSelectedImage(i)}
                className={`h-20 w-28 flex-shrink-0 cursor-pointer overflow-hidden rounded-xl border bg-secondary transition-all ${selectedImage === i ? 'ring-2 ring-primary ring-offset-2 ring-offset-background' : 'hover:opacity-80'}`}
              >
                <img src={url} alt={`${property.title} ${i + 1}`} className="h-full w-full object-cover" loading="lazy" />
              </div>
            ))}
          </div>
        )}

        <div className="mt-8 grid gap-8 lg:grid-cols-3">
          <div className="lg:col-span-2 space-y-8">
            {/* Title + rating */}
            <div>
              <h1 className="font-heading text-3xl font-bold text-foreground text-balance">{property.title}</h1>
              <div className="mt-3 flex items-center gap-2 text-muted-foreground">
                <MapPin className="h-4 w-4 text-primary/60" />
                <span>{property.location}</span>
              </div>
              {reviews.length > 0 && (
                <div className="mt-2 flex items-center gap-2">
                  <StarRating value={Math.round(avgRating)} readonly size="sm" />
                  <span className="text-sm font-semibold text-foreground">{avgRating.toFixed(1)}</span>
                  <span className="text-sm text-muted-foreground">({reviews.length} review{reviews.length !== 1 ? 's' : ''})</span>
                </div>
              )}
            </div>

            {/* Price cards */}
            <div className="flex flex-wrap gap-4">
              <div className="rounded-2xl bg-primary/5 border border-primary/10 px-6 py-4">
                <div className="flex items-center gap-1">
                  <IndianRupee className="h-5 w-5 text-primary" />
                  <span className="font-heading text-3xl font-bold text-foreground">
                    {(Number(property?.price) || 0).toLocaleString('en-IN')}
                  </span>
                </div>
                <p className="text-sm text-muted-foreground">per {property?.rentDuration?.toLowerCase() || 'month'}</p>
              </div>
              {isPG && (
                <>
                  <div className="rounded-2xl bg-accent/5 border border-accent/10 px-6 py-4">
                    <div className="flex items-center gap-1">
                      <Users className="h-5 w-5 text-accent" />
                      <span className="font-heading text-3xl font-bold text-foreground">
                        {property?.currentOccupants ?? 0}/{property?.totalCapacity ?? 0}
                      </span>
                    </div>
                    <p className="text-sm text-muted-foreground">occupants</p>
                  </div>
                  <div className="rounded-2xl bg-secondary px-6 py-4">
                    <p className="font-heading text-xl font-bold capitalize text-foreground">{property?.roomType || 'Standard'}</p>
                    <p className="text-sm text-muted-foreground">room type</p>
                  </div>
                </>
              )}
            </div>

            {/* Facilities */}
            <div>
              <h2 className="font-heading text-xl font-semibold text-foreground">Facilities</h2>
              <div className="mt-4 grid grid-cols-2 gap-3 sm:grid-cols-4">
                {(property?.facilities || []).map((f) => {
                  const Icon = facilityIcons[f] || CheckCircle2
                  return (
                    <div key={f} className="flex items-center gap-3 rounded-xl bg-card border p-3.5 transition-all hover:border-primary/20 hover:shadow-sm">
                      <Icon className="h-5 w-5 text-primary flex-shrink-0" />
                      <span className="text-sm font-medium text-foreground capitalize">{f}</span>
                    </div>
                  )
                })}
              </div>
            </div>

            {/* Details */}
            <div>
              <h2 className="font-heading text-xl font-semibold text-foreground">Details</h2>
              <div className="mt-4 grid grid-cols-2 gap-3">
                <DetailRow label="Distance" value={property.distanceRange?.toLowerCase().includes('km') ? property.distanceRange : `${property.distanceRange} km`} />
                <DetailRow label="Living Alone" value={property.livingAlone ? 'Yes' : 'No'} isPositive={property.livingAlone} />
                <DetailRow label="Rent Duration" value={property.rentDuration} />
                {isPG && property.foodIncluded !== undefined && (
                  <DetailRow label="Food Included" value={property.foodIncluded ? 'Yes' : 'No'} isPositive={property.foodIncluded} />
                )}
              </div>
            </div>

            {property.rules?.length > 0 && (
              <div>
                <h2 className="font-heading text-xl font-semibold text-foreground">Rules</h2>
                <ul className="mt-4 space-y-2.5">
                  {(property?.rules || []).map((r, i) => (
                    <li key={i} className="flex items-center gap-3 text-sm text-foreground">
                      <div className="flex h-5 w-5 items-center justify-center rounded-md bg-primary/10">
                        <div className="h-1.5 w-1.5 rounded-full bg-primary" />
                      </div>
                      {r}
                    </li>
                  ))}
                </ul>
              </div>
            )}

            {property.notes && (
              <div>
                <h2 className="font-heading text-xl font-semibold text-foreground">Notes</h2>
                <p className="mt-3 leading-relaxed text-muted-foreground">{property.notes}</p>
              </div>
            )}

            {/* Map */}
            <div>
              <h2 className="font-heading text-xl font-semibold text-foreground">Location</h2>
              <div className="mt-4">
                {property.mapEmbed ? (
                  <div className="overflow-hidden rounded-2xl border aspect-video shadow-sm">
                    <iframe src={property.mapEmbed} width="100%" height="100%" style={{ border: 0 }} allowFullScreen loading="lazy" referrerPolicy="no-referrer-when-downgrade" title="Property location on Google Maps" />
                  </div>
                ) : (
                  <div className="overflow-hidden rounded-2xl border aspect-[16/9] shadow-sm">
                    <MapComponent address={property.location} />
                  </div>
                )}
              </div>
            </div>

            {/* ─── Reviews ─── */}
            <div>
              <div className="flex items-center justify-between mb-6">
                <div>
                  <h2 className="font-heading text-xl font-semibold text-foreground">Reviews</h2>
                  {reviews.length > 0 && (
                    <p className="mt-1 text-sm text-muted-foreground">
                      Average: <span className="font-semibold text-foreground">{avgRating.toFixed(1)}/5</span> · {reviews.length} review{reviews.length !== 1 ? 's' : ''}
                    </p>
                  )}
                </div>
                {reviews.length > 0 && <StarRating value={Math.round(avgRating)} readonly size="sm" />}
              </div>

              {/* Review form — students only */}
              {isStudent && (
                <div className="mb-8 rounded-2xl border bg-card p-6">
                  <div className="flex items-center justify-between mb-4">
                    <h3 className="text-sm font-semibold text-card-foreground">
                      {myReview && !editingReview ? 'Your Review' : myReview ? 'Edit Your Review' : 'Write a Review'}
                    </h3>
                    {myReview && !editingReview && (
                      <div className="flex gap-2">
                        <Button
                          type="button"
                          variant="ghost"
                          size="sm"
                          className="rounded-lg h-8 px-3 text-muted-foreground hover:text-foreground"
                          onClick={() => setEditingReview(true)}
                        >
                          <Pencil className="h-3.5 w-3.5 mr-1.5" />Edit
                        </Button>
                        <Button
                          type="button"
                          variant="ghost"
                          size="sm"
                          className="rounded-lg h-8 px-3 text-destructive hover:text-destructive hover:bg-destructive/5"
                          onClick={() => setReviewToDelete(myReview.id)}
                        >
                          <Trash2 className="h-3.5 w-3.5 mr-1.5" />Delete
                        </Button>
                      </div>
                    )}
                  </div>

                  {/* Show read-only view if review exists and not editing */}
                  {myReview && !editingReview ? (
                    <div>
                      <StarRating value={myReview.rating} readonly size="sm" />
                      {myReview.comment && (
                        <p className="mt-2 text-sm text-muted-foreground leading-relaxed">{myReview.comment}</p>
                      )}
                      <p className="mt-2 text-[10px] text-muted-foreground">
                        Submitted {format(new Date(myReview.createdAt), 'MMM d, yyyy')}
                        {myReview.updatedAt !== myReview.createdAt && ' · edited'}
                      </p>
                    </div>
                  ) : (
                    /* Write / edit form */
                    <form onSubmit={handleSubmitReview} className="space-y-4">
                      <div>
                        <p className="text-xs text-muted-foreground mb-2">Your rating</p>
                        <StarRating value={myRating} onChange={setMyRating} />
                      </div>
                      <div>
                        <Textarea
                          value={myComment}
                          onChange={(e) => setMyComment(e.target.value)}
                          placeholder="Share your experience with this property..."
                          className="rounded-xl resize-none"
                          rows={3}
                        />
                      </div>
                      {reviewError && <p className="text-sm text-destructive">{reviewError}</p>}
                      {reviewSuccess && !editingReview && (
                        <p className="text-sm font-medium text-chart-3 flex items-center gap-1.5">
                          <CheckCircle2 className="h-4 w-4" /> Review submitted!
                        </p>
                      )}
                      <div className="flex gap-2">
                        <Button type="submit" className="rounded-xl shadow-sm shadow-primary/20" disabled={submittingReview}>
                          <Send className="mr-2 h-4 w-4" />
                          {submittingReview ? 'Submitting...' : editingReview ? 'Update Review' : 'Submit Review'}
                        </Button>
                        {editingReview && (
                          <Button
                            type="button"
                            variant="outline"
                            className="rounded-xl"
                            onClick={() => setEditingReview(false)}
                          >
                            Cancel
                          </Button>
                        )}
                      </div>
                    </form>
                  )}
                </div>
              )}

              {/* Review list */}
              {reviewsLoading ? (
                <div className="flex items-center justify-center py-8">
                  <div className="h-5 w-5 animate-spin rounded-full border-2 border-primary border-t-transparent" />
                </div>
              ) : reviews.length === 0 ? (
                <div className="rounded-2xl border bg-secondary/30 py-12 text-center">
                  <div className="mx-auto mb-3 flex h-12 w-12 items-center justify-center rounded-2xl bg-secondary">
                    <Star className="h-6 w-6 text-muted-foreground/30" />
                  </div>
                  <p className="text-sm font-medium text-card-foreground">No reviews yet</p>
                  <p className="mt-1 text-xs text-muted-foreground">Be the first to leave a review!</p>
                </div>
              ) : (
                <div className="space-y-4">
                  {reviews.map((review) => {
                    const isOwnReview = currentUser?.id === review.userId
                    return (
                      <div
                        key={review.id}
                        className={`rounded-2xl border bg-card p-5 transition-all ${isOwnReview ? 'border-primary/20 bg-primary/5' : ''}`}
                      >
                        <div className="flex items-start gap-3">
                          <div className="flex h-10 w-10 flex-shrink-0 items-center justify-center rounded-xl bg-primary/10 font-heading text-sm font-bold text-primary">
                            {(review.userName || 'A').charAt(0).toUpperCase()}
                          </div>
                          <div className="flex-1 min-w-0">
                            <div className="flex items-center justify-between flex-wrap gap-2">
                              <div>
                                <p className="font-semibold text-card-foreground text-sm">
                                  {review.userName}
                                  {isOwnReview && (
                                    <span className="ml-2 text-[10px] font-normal text-primary bg-primary/10 px-2 py-0.5 rounded-full">You</span>
                                  )}
                                </p>
                                <StarRating value={review.rating} readonly size="sm" />
                              </div>
                              <span className="text-xs text-muted-foreground">
                                {format(new Date(review.createdAt), 'MMM d, yyyy')}
                              </span>
                            </div>
                            {review.comment && (
                              <p className="mt-2 text-sm text-muted-foreground leading-relaxed">{review.comment}</p>
                            )}
                          </div>
                        </div>
                      </div>
                    )
                  })}
                </div>
              )}
            </div>
          </div>

          {/* Sidebar */}
          <div className="space-y-4">
            <div className="sticky top-24 space-y-4">
              {owner && (
                <div className="rounded-2xl border bg-card p-5">
                  <h3 className="text-xs font-semibold uppercase tracking-wider text-muted-foreground">{isPG ? 'PG Owner' : 'landlord/Student Host (for seniors renting/sharing)'}</h3>
                  <div className="mt-3 flex items-center gap-3">
                    <div className="flex h-12 w-12 items-center justify-center rounded-xl bg-primary text-primary-foreground font-bold text-lg shadow-sm">
                      {owner?.name?.charAt(0) || '?'}
                    </div>
                    <div>
                      <p className="font-semibold text-card-foreground">{owner?.name || 'Landlord'}</p>
                      {owner?.phone && (
                        <p className="flex items-center gap-1 text-sm text-muted-foreground">
                          <Phone className="h-3 w-3" />{owner.phone}
                        </p>
                      )}
                    </div>
                  </div>
                  <div className="mt-3 flex items-center gap-1">
                    {[1, 2, 3, 4, 5].map((i) => <Star key={i} className="h-3.5 w-3.5 fill-chart-4 text-chart-4" />)}
                    <span className="ml-1 text-xs text-muted-foreground">Verified</span>
                  </div>
                </div>
              )}

              <div className="rounded-2xl border bg-card p-5 space-y-3">
                <Button
                  className={`w-full rounded-xl h-11 transition-all ${isInterested ? 'shadow-none' : 'shadow-lg shadow-primary/20'}`}
                  variant={isInterested ? 'outline' : 'default'}
                  onClick={handleInterest}
                  disabled={isToggling}
                >
                  <div ref={heartRef} className="mr-2 flex items-center justify-center">
                    <Heart className={`h-4 w-4 ${isInterested ? 'fill-primary text-primary' : ''}`} />
                  </div>
                  {isToggling ? 'Updating...' : isInterested ? 'Interested' : 'Show Interest'}
                </Button>
                <Button variant="outline" className="w-full rounded-xl h-11" onClick={handleChat}>
                  <MessageSquare className="mr-2 h-4 w-4" />Chat with Owner
                </Button>
                <Button variant="outline" className="w-full rounded-xl h-11" onClick={handleShare}>
                  <Share2 className="mr-2 h-4 w-4" />Share
                </Button>
                <Button variant="outline" className="w-full rounded-xl h-11" onClick={() => setShowPaymentModal(true)}>
                  <CreditCard className="mr-2 h-4 w-4" />Proceed to Booking
                </Button>
                <p className="text-center text-xs text-muted-foreground">
                  {property.interestedUsers.length} student{property.interestedUsers.length !== 1 ? 's' : ''} interested
                </p>
              </div>
            </div>
          </div>
        </div>
      </main>

      {/* Payment modal */}
      {showPaymentModal && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-foreground/50 backdrop-blur-sm p-4" onClick={() => setShowPaymentModal(false)}>
          <div className="w-full max-w-md rounded-3xl bg-card p-8 shadow-2xl" onClick={(e) => e.stopPropagation()}>
            <div className="text-center">
              <div className="mx-auto mb-4 flex h-16 w-16 items-center justify-center rounded-2xl bg-primary/10">
                <CreditCard className="h-8 w-8 text-primary" />
              </div>
              <h3 className="font-heading text-xl font-bold text-card-foreground">Coming Soon</h3>
              <p className="mt-3 text-muted-foreground leading-relaxed">
                Payment system will be integrated in a future version. Contact the owner directly to finalise.
              </p>
              <Button className="mt-6 rounded-xl" onClick={() => setShowPaymentModal(false)}>Got it</Button>
            </div>
          </div>
        </div>
      )}

      {/* Review delete confirmation */}
      <ConfirmDeleteModal
        open={!!reviewToDelete}
        loading={deletingReview}
        onConfirm={handleDeleteReview}
        onCancel={() => setReviewToDelete(null)}
      />
    </div>
  )
}
