import { useState } from 'react'
import { XCircle, AlertTriangle } from 'lucide-react'

export default function RejectModal({ property, onConfirm, onClose }) {
  const [reason, setReason] = useState('')
  const [loading, setLoading] = useState(false)
  const MAX = 500

  const handleConfirm = async () => {
    if (!reason.trim()) return
    setLoading(true)
    try {
      await onConfirm(property.id, reason.trim())
      onClose()
    } finally {
      setLoading(false)
    }
  }

  if (!property) return null

  return (
    <div
      className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/50 backdrop-blur-sm animate-in fade-in duration-150"
      onClick={(e) => { if (e.target === e.currentTarget) onClose() }}
    >
      <div className="bg-card border border-border rounded-2xl shadow-2xl w-full max-w-md animate-in zoom-in-95 slide-in-from-bottom-4 duration-200">
        {/* Header */}
        <div className="flex items-start justify-between p-6 pb-4">
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 rounded-xl bg-red-500/10 border border-red-500/20 flex items-center justify-center">
              <XCircle className="w-5 h-5 text-red-500" />
            </div>
            <div>
              <h2 className="font-bold text-foreground" style={{ fontFamily: 'var(--font-heading)' }}>
                Reject Listing
              </h2>
              <p className="text-xs text-muted-foreground mt-0.5">Provide a reason for the owner</p>
            </div>
          </div>
          <button
            onClick={onClose}
            className="w-8 h-8 rounded-lg hover:bg-secondary flex items-center justify-center text-muted-foreground hover:text-foreground transition-colors"
          >
            ✕
          </button>
        </div>

        {/* Property preview */}
        <div className="mx-6 mb-4 p-3 bg-secondary rounded-xl border border-border">
          <p className="font-medium text-sm text-foreground">{property.title}</p>
          <p className="text-xs text-muted-foreground mt-0.5">{property.location}</p>
        </div>

        {/* Reason input */}
        <div className="px-6 pb-4">
          <label className="text-sm font-medium text-foreground block mb-2">
            Rejection Reason <span className="text-destructive">*</span>
          </label>

          {/* Quick reason chips */}
          <div className="flex flex-wrap gap-2 mb-3">
            {[
              'Incomplete information',
              'Invalid images',
              'Incorrect pricing',
              'Duplicate listing',
              'Policy violation',
            ].map(chip => (
              <button
                key={chip}
                onClick={() => setReason(chip)}
                className={`text-xs px-3 py-1.5 rounded-full border transition-all ${
                  reason === chip
                    ? 'bg-destructive/10 border-destructive/30 text-destructive font-medium'
                    : 'border-border text-muted-foreground hover:border-primary/30 hover:text-foreground'
                }`}
              >
                {chip}
              </button>
            ))}
          </div>

          <textarea
            value={reason}
            onChange={e => setReason(e.target.value.slice(0, MAX))}
            placeholder="Explain why this listing is being rejected. The owner will receive this message."
            rows={4}
            className="w-full px-4 py-3 rounded-xl border border-input bg-background text-foreground placeholder:text-muted-foreground focus:outline-none focus:ring-2 focus:ring-ring resize-none text-sm"
          />
          <div className="flex justify-between items-center mt-1">
            <span className="text-xs text-muted-foreground/60">
              The owner will receive this reason via their dashboard
            </span>
            <span className={`text-xs ${reason.length > MAX * 0.9 ? 'text-destructive' : 'text-muted-foreground/60'}`}>
              {reason.length}/{MAX}
            </span>
          </div>
        </div>

        {!reason.trim() && (
          <div className="mx-6 mb-4 flex items-center gap-2 text-xs text-orange-600 dark:text-orange-400">
            <AlertTriangle className="w-3.5 h-3.5" />
            A reason is required to reject a listing
          </div>
        )}

        {/* Footer */}
        <div className="flex gap-3 p-6 pt-2 border-t border-border mt-2">
          <button
            onClick={onClose}
            className="flex-1 py-2.5 rounded-xl border border-border text-foreground hover:bg-secondary transition-colors text-sm font-medium"
          >
            Cancel
          </button>
          <button
            onClick={handleConfirm}
            disabled={!reason.trim() || loading}
            className="flex-1 py-2.5 rounded-xl bg-destructive text-destructive-foreground hover:opacity-90 active:scale-[0.98] transition-all text-sm font-semibold disabled:opacity-40 disabled:cursor-not-allowed flex items-center justify-center gap-2"
          >
            {loading ? (
              <span className="w-4 h-4 border-2 border-white/30 border-t-white rounded-full animate-spin" />
            ) : (
              <XCircle className="w-4 h-4" />
            )}
            Reject Listing
          </button>
        </div>
      </div>
    </div>
  )
}
