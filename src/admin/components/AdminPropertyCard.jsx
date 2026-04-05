import { useState } from 'react'
import { Link } from 'react-router-dom'
import { formatDistanceToNow } from 'date-fns'
import {
  MapPin, IndianRupee, User, Calendar, ChevronLeft, ChevronRight,
  CheckCircle2, XCircle, MessageSquare, Image, Tag, Clock, Eye
} from 'lucide-react'

export default function AdminPropertyCard({ property, onApprove, onReject, onChat }) {
  const [imageIndex, setImageIndex] = useState(0)
  const [approving, setApproving] = useState(false)
  const [expanded, setExpanded] = useState(false)

  const images = property.images || []
  const owner = property.users || {}

  const handleApprove = async () => {
    setApproving(true)
    try { await onApprove(property.id) } finally { setApproving(false) }
  }

  const prevImage = (e) => {
    e.stopPropagation()
    setImageIndex(i => (i === 0 ? images.length - 1 : i - 1))
  }
  const nextImage = (e) => {
    e.stopPropagation()
    setImageIndex(i => (i === images.length - 1 ? 0 : i + 1))
  }

  const submittedAt = property.submitted_at || property.created_at
  const timeAgo = submittedAt ? formatDistanceToNow(new Date(submittedAt), { addSuffix: true }) : 'Unknown'

  let descPreview = property.notes || property.description || ''
  if (descPreview.startsWith('{')) {
    try { descPreview = JSON.parse(descPreview).notes || '' } catch (_) { descPreview = '' }
  }

  const statusConfig = {
    pending: { label: 'Pending Review', className: 'bg-orange-500/10 text-orange-600 border-orange-500/20 dark:text-orange-400' },
    approved: { label: 'Approved', className: 'bg-green-500/10 text-green-600 border-green-500/20 dark:text-green-400' },
    rejected: { label: 'Rejected', className: 'bg-red-500/10 text-red-600 border-red-500/20 dark:text-red-400' },
  }
  const status = statusConfig[property.status] || statusConfig.pending

  return (
    <div className="bg-card border border-border rounded-2xl overflow-hidden hover:shadow-lg hover:shadow-primary/5 transition-all duration-300 group flex flex-col">
      {/* Image carousel */}
      <div className="relative h-48 bg-muted overflow-hidden">
        {images.length > 0 ? (
          <>
            <img
              src={images[imageIndex]}
              alt={property.title}
              className="w-full h-full object-cover transition-opacity duration-300"
              loading="lazy"
            />
            {images.length > 1 && (
              <>
                <button onClick={prevImage} className="absolute left-2 top-1/2 -translate-y-1/2 w-7 h-7 rounded-full bg-black/40 text-white flex items-center justify-center hover:bg-black/60 transition-colors">
                  <ChevronLeft className="w-4 h-4" />
                </button>
                <button onClick={nextImage} className="absolute right-2 top-1/2 -translate-y-1/2 w-7 h-7 rounded-full bg-black/40 text-white flex items-center justify-center hover:bg-black/60 transition-colors">
                  <ChevronRight className="w-4 h-4" />
                </button>
                <div className="absolute bottom-2 left-1/2 -translate-x-1/2 flex gap-1">
                  {images.map((_, i) => (
                    <button
                      key={i}
                      onClick={(e) => { e.stopPropagation(); setImageIndex(i) }}
                      className={`w-1.5 h-1.5 rounded-full transition-all ${i === imageIndex ? 'bg-white w-3' : 'bg-white/50'}`}
                    />
                  ))}
                </div>
              </>
            )}
          </>
        ) : (
          <div className="w-full h-full flex items-center justify-center text-muted-foreground">
            <Image className="w-8 h-8 opacity-40" />
          </div>
        )}

        {/* Status badge */}
        <div className="absolute top-3 left-3">
          <span className={`text-xs font-semibold px-2.5 py-1 rounded-full border ${status.className}`}>
            {status.label}
          </span>
        </div>

        {/* Image count */}
        {images.length > 0 && (
          <div className="absolute top-3 right-3 flex items-center gap-1 bg-black/40 text-white text-xs px-2 py-1 rounded-full">
            <Image className="w-3 h-3" />
            {images.length}
          </div>
        )}
      </div>

      {/* Content */}
      <div className="p-5 flex-1 flex flex-col gap-3">
        {/* Title + price */}
        <div className="flex items-start justify-between gap-2">
          <h3 className="font-semibold text-foreground text-base leading-snug line-clamp-2 flex-1" style={{ fontFamily: 'var(--font-heading)' }}>
            {property.title}
          </h3>
          <div className="flex items-center gap-0.5 text-primary font-bold text-sm whitespace-nowrap">
            <IndianRupee className="w-3.5 h-3.5" />
            {Number(property.price).toLocaleString('en-IN')}
            <span className="text-muted-foreground font-normal text-xs">/mo</span>
          </div>
        </div>

        {/* Tags */}
        <div className="flex flex-wrap gap-1.5">
          <span className="flex items-center gap-1 text-xs bg-primary/10 text-primary px-2 py-0.5 rounded-full border border-primary/20">
            <Tag className="w-3 h-3" />
            {property.type?.toUpperCase() || 'ROOM'}
          </span>
          {property.propertyFor && (
            <span className="text-xs bg-secondary text-secondary-foreground px-2 py-0.5 rounded-full">
              For {property.propertyFor}
            </span>
          )}
          {property.roomType && (
            <span className="text-xs bg-secondary text-secondary-foreground px-2 py-0.5 rounded-full">
              {property.roomType}
            </span>
          )}
        </div>

        {/* Location */}
        <div className="flex items-start gap-1.5 text-sm text-muted-foreground">
          <MapPin className="w-3.5 h-3.5 shrink-0 mt-0.5 text-accent" />
          <span className="line-clamp-1">{property.location}</span>
        </div>

        {/* Description */}
        {descPreview && (
          <div className="text-xs text-muted-foreground">
            <p className={expanded ? '' : 'line-clamp-2'}>{descPreview}</p>
            {descPreview.length > 80 && (
              <button
                onClick={() => setExpanded(e => !e)}
                className="text-primary hover:underline mt-0.5 font-medium"
              >
                {expanded ? 'Show less' : 'Read more'}
              </button>
            )}
          </div>
        )}

        {/* Rejection reason (if rejected) */}
        {property.status === 'rejected' && property.rejection_reason && (
          <div className="bg-red-500/5 border border-red-500/20 rounded-xl p-3 text-xs">
            <p className="font-semibold text-red-600 dark:text-red-400 mb-1">Rejection Reason:</p>
            <p className="text-muted-foreground">{property.rejection_reason}</p>
          </div>
        )}

        {/* Divider */}
        <div className="border-t border-border" />

        {/* Owner info */}
        <div className="flex items-center gap-3">
          <div className="w-8 h-8 rounded-full bg-primary/10 flex items-center justify-center shrink-0">
            <User className="w-4 h-4 text-primary" />
          </div>
          <div className="flex-1 min-w-0">
            <p className="text-sm font-medium text-foreground truncate">{owner.name || 'Unknown Owner'}</p>
            <p className="text-xs text-muted-foreground truncate">{owner.email || ''}</p>
          </div>
          <div className="flex items-center gap-1 text-xs text-muted-foreground whitespace-nowrap">
            <Clock className="w-3 h-3" />
            {timeAgo}
          </div>
        </div>

        {/* Actions */}
        <div className="flex flex-col gap-2 mt-auto pt-1">
          <div className="flex gap-2">
            <Link
              to={`/property/${property.id}`}
              className="flex-1 flex items-center justify-center gap-2 py-2 rounded-xl border border-primary/30 text-primary hover:bg-primary/5 transition-all text-sm font-semibold active:scale-[0.98]"
            >
              <Eye className="w-4 h-4" />
              View Listing
            </Link>
            
            {owner.id && (
              <button
                onClick={() => onChat(owner.id, property.id, owner.name)}
                className="flex-1 flex items-center justify-center gap-2 py-2 rounded-xl border border-border text-muted-foreground hover:text-foreground hover:border-primary/30 hover:bg-primary/5 transition-all text-sm active:scale-[0.98]"
              >
                <MessageSquare className="w-4 h-4" />
                Message
              </button>
            )}
          </div>

          {/* Status specific actions */}
          {property.status === 'pending' && (
            <div className="flex gap-2">
              <button
                onClick={handleApprove}
                disabled={approving}
                className="flex-1 flex items-center justify-center gap-2 py-2.5 rounded-xl bg-green-500/10 text-green-600 dark:text-green-400 border border-green-500/20 hover:bg-green-500/20 transition-all text-sm font-semibold active:scale-[0.98] disabled:opacity-50"
              >
                {approving ? (
                  <span className="w-4 h-4 border-2 border-green-500/30 border-t-green-500 rounded-full animate-spin" />
                ) : (
                  <CheckCircle2 className="w-4 h-4" />
                )}
                Approve
              </button>
              <button
                onClick={() => onReject(property)}
                className="flex-1 flex items-center justify-center gap-2 py-2.5 rounded-xl bg-red-500/10 text-red-600 dark:text-red-400 border border-red-500/20 hover:bg-red-500/20 transition-all text-sm font-semibold active:scale-[0.98]"
              >
                <XCircle className="w-4 h-4" />
                Reject
              </button>
            </div>
          )}

          {property.status === 'approved' && (
            <button
              onClick={() => onReject(property)}
              className="w-full flex items-center justify-center gap-2 py-2.5 rounded-xl bg-red-500/10 text-red-600 dark:text-red-400 border border-red-500/20 hover:bg-red-500/20 transition-all text-sm font-semibold active:scale-[0.98]"
            >
              <XCircle className="w-4 h-4" />
              Reject Property
            </button>
          )}

          {property.status === 'rejected' && (
            <button
              onClick={handleApprove}
              disabled={approving}
              className="w-full flex items-center justify-center gap-2 py-2.5 rounded-xl bg-green-500/10 text-green-600 dark:text-green-400 border border-green-500/20 hover:bg-green-500/20 transition-all text-sm font-semibold active:scale-[0.98] disabled:opacity-50"
            >
              {approving ? (
                <span className="w-4 h-4 border-2 border-green-500/30 border-t-green-500 rounded-full animate-spin" />
              ) : (
                <CheckCircle2 className="w-4 h-4" />
              )}
              Approve Listing
            </button>
          )}
        </div>
      </div>
    </div>
  )
}
