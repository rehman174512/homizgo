import { Link, useNavigate } from 'react-router-dom'
import {
  MapPin,
  IndianRupee,
  Wifi,
  Car,
  UtensilsCrossed,
  Zap,
  ShieldCheck,
  Dumbbell,
  WashingMachine,
  Wind,
  Users,
  Home,
  Heart,
  ArrowUpRight,
  MessageSquare,
} from 'lucide-react'
import { Badge } from '@/components/ui/badge'
import { getCurrentUser, getOrCreateThread, toggleInterest } from '@/lib/store'
import { useState, useCallback } from 'react'

const facilityIcons = {
  WiFi: Wifi,
  Parking: Car,
  Food: UtensilsCrossed,
  Electricity: Zap,
  Security: ShieldCheck,
  Gym: Dumbbell,
  Laundry: WashingMachine,
  AC: Wind,
}

const propertyColors = [
  'from-primary/15 via-primary/5 to-accent/10',
  'from-accent/15 via-accent/5 to-chart-3/10',
  'from-chart-3/15 via-chart-3/5 to-chart-4/10',
  'from-chart-4/15 via-chart-4/5 to-primary/10',
]

/**
 * @param {object} property
 * @param {number} index
 * @param {boolean} isLiked - whether current user has saved/hearted this property
 * @param {function} onToggleLike - (propertyId, newState) => void, called after toggling
 */
export function PropertyCard({ property, index = 0, isLiked = false, onToggleLike }) {
  const isPG = property.ownerRole === 'pgowner'
  const gradient = propertyColors[index % propertyColors.length]
  const navigate = useNavigate()
  const [chatLoading, setChatLoading] = useState(false)
  const [liked, setLiked] = useState(isLiked)
  const [heartLoading, setHeartLoading] = useState(false)

  const handleHeartClick = useCallback(async (e) => {
    e.preventDefault()
    e.stopPropagation()
    if (heartLoading) return
    setHeartLoading(true)
    try {
      const user = await getCurrentUser()
      if (!user) { navigate('/login'); return }
      const newState = await toggleInterest(property.id, user.id)
      setLiked(newState)
      onToggleLike?.(property.id, newState)
    } catch (_) {
      // Toggle failed silently
    } finally {
      setHeartLoading(false)
    }
  }, [heartLoading, property.id, navigate, onToggleLike])

  const handleChatClick = useCallback(async (e) => {
    e.preventDefault()
    e.stopPropagation()
    setChatLoading(true)
    try {
      const user = await getCurrentUser()
      if (!user) { navigate('/login'); return }
      if (user.id === property.ownerId) { navigate('/chat'); return }
      const threadId = await getOrCreateThread(user.id, user.name, property.ownerId, property.ownerName || 'Owner', property.id)
      navigate(`/chat?threadId=${threadId}`)
    } catch (_) {
      navigate('/chat')
    } finally {
      setChatLoading(false)
    }
  }, [property.id, property.ownerId, property.ownerName, navigate])

  return (
    <Link to={`/property/${property.id}`} className="group block">
      <div className="relative overflow-hidden rounded-2xl border bg-card shadow-sm transition-all duration-300 hover:shadow-xl hover:shadow-primary/5 hover:-translate-y-1.5">
        {/* Image area */}
        <div className="relative h-52 overflow-hidden bg-secondary">
          {property.images && property.images.length > 0 ? (
            <img
              src={property.images[0]}
              alt={property.title}
              className="h-full w-full object-cover transition-transform duration-500 group-hover:scale-105"
              loading="lazy"
            />
          ) : (
            <div className={`flex h-full items-center justify-center bg-gradient-to-br ${gradient}`}>
              <Home className="h-14 w-14 text-primary/30 transition-transform duration-300 group-hover:scale-110 group-hover:rotate-3" />
            </div>
          )}

          {/* Badges */}
          <div className="absolute left-3 top-3 flex gap-2">
            <Badge className="rounded-lg bg-primary text-primary-foreground shadow-sm">
              {isPG ? 'PG' : 'Rental'}
            </Badge>
            <Badge variant="outline" className="rounded-lg border-card/50 bg-card/80 text-card-foreground backdrop-blur-sm capitalize">
              {(property.propertyFor === 'male' || property.propertyFor === 'boys') ? 'Boys' : (property.propertyFor === 'female' || property.propertyFor === 'girls') ? 'Girls' : 'Girls & Boys'}
            </Badge>
          </div>

          {/* Heart Button */}
          <button
            onClick={handleHeartClick}
            disabled={heartLoading}
            aria-label={liked ? 'Remove from saved' : 'Save property'}
            className={`absolute right-3 top-3 flex h-8 w-8 items-center justify-center rounded-full backdrop-blur-sm transition-all ${
              liked
                ? 'bg-red-500 text-white shadow-md scale-105'
                : 'bg-card/80 text-muted-foreground opacity-0 group-hover:opacity-100'
            }`}
          >
            {heartLoading ? (
              <span className="h-3.5 w-3.5 animate-spin rounded-full border-2 border-current border-t-transparent" />
            ) : (
              <Heart className={`h-4 w-4 ${liked ? 'fill-white' : ''}`} />
            )}
          </button>

          {/* View arrow */}
          <div className="absolute bottom-3 right-3 flex h-8 w-8 items-center justify-center rounded-full bg-primary text-primary-foreground opacity-0 transition-all group-hover:opacity-100 group-hover:translate-x-0 translate-x-2">
            <ArrowUpRight className="h-4 w-4" />
          </div>

          {!property.available && (
            <div className="absolute inset-0 flex items-center justify-center bg-foreground/60 backdrop-blur-sm">
              <span className="rounded-xl bg-destructive px-4 py-2 text-sm font-bold text-destructive-foreground">
                Not Available
              </span>
            </div>
          )}
        </div>

        {/* Content */}
        <div className="p-5">
          <h3 className="font-heading text-lg font-semibold leading-tight text-card-foreground line-clamp-1 group-hover:text-primary transition-colors">
            {property.title}
          </h3>

          <div className="mt-2 flex items-center gap-1.5 text-sm text-muted-foreground">
            <MapPin className="h-3.5 w-3.5 flex-shrink-0 text-primary/60" />
            <span className="line-clamp-1">{property.location}</span>
          </div>

          <div className="mt-3 flex items-baseline gap-1">
            <IndianRupee className="h-4 w-4 text-primary" />
            <span className="font-heading text-2xl font-bold text-card-foreground">
              {Number(property.price || 0).toLocaleString('en-IN')}
            </span>
            <span className="text-sm text-muted-foreground">
              {'/'}{property.rentDuration?.toLowerCase() || 'month'}
            </span>
          </div>

          {isPG && (
            <div className="mt-2.5 flex items-center gap-3 text-sm text-muted-foreground">
              <span className="flex items-center gap-1 rounded-md bg-secondary px-2 py-0.5">
                <Users className="h-3.5 w-3.5" />
                {property.currentOccupants}/{property.totalCapacity}
              </span>
              <span className="rounded-md bg-secondary px-2 py-0.5 capitalize">{property.roomType}</span>
              {property.foodIncluded && (
                <span className="flex items-center gap-1 rounded-md bg-primary/10 px-2 py-0.5 text-primary">
                  <UtensilsCrossed className="h-3.5 w-3.5" />
                  Food
                </span>
              )}
            </div>
          )}

          <div className="mt-3.5 flex flex-wrap gap-1.5">
            {(property.facilities || []).slice(0, 4).map((f) => {
              const Icon = facilityIcons[f]
              return (
                <span
                  key={f}
                  className="flex items-center gap-1 rounded-lg bg-secondary/70 px-2.5 py-1 text-xs font-medium text-secondary-foreground"
                >
                  {Icon && <Icon className="h-3 w-3 text-muted-foreground" />}
                  {f}
                </span>
              )
            })}
            {(property.facilities || []).length > 4 && (
              <span className="rounded-lg bg-secondary/70 px-2.5 py-1 text-xs font-medium text-muted-foreground">
                +{(property.facilities || []).length - 4}
              </span>
            )}
          </div>

          <div className="mt-4 flex items-center justify-between border-t pt-3 text-xs text-muted-foreground">
            <span className="flex items-center gap-1">
              <MapPin className="h-3 w-3" />
              {property.distanceRange?.toLowerCase().includes('km') ? property.distanceRange : `${property.distanceRange} km`} from campus
            </span>
            <span className={`flex items-center gap-1 font-medium ${liked ? 'text-red-500' : ''}`}>
              <Heart className={`h-3 w-3 ${liked ? 'fill-red-500 text-red-500' : ''}`} />
              {(property.interestedUsers || []).length} interested
            </span>
          </div>

          {/* Chat Button */}
          <button
            onClick={handleChatClick}
            disabled={chatLoading}
            className="mt-3 flex w-full items-center justify-center gap-2 rounded-xl bg-primary/10 py-2.5 text-sm font-semibold text-primary transition-all hover:bg-primary hover:text-primary-foreground active:scale-95 disabled:opacity-60"
          >
            {chatLoading ? (
              <span className="h-4 w-4 animate-spin rounded-full border-2 border-primary border-t-transparent" />
            ) : (
              <MessageSquare className="h-4 w-4" />
            )}
            {chatLoading ? 'Opening chat...' : 'Chat with Owner'}
          </button>
        </div>
      </div>
    </Link>
  )
}
