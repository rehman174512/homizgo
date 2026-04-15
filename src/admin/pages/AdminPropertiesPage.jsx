import { useState } from 'react'
import { useNavigate } from 'react-router-dom'
import { Building2, CheckCircle2, XCircle, Clock, RefreshCw, AlertCircle } from 'lucide-react'
import { useProperties } from '../hooks/useProperties'
import AdminPropertyCard from '../components/AdminPropertyCard'
import RejectModal from '../components/RejectModal'
import SkeletonCard from '../components/SkeletonCard'

const TABS = [
  { key: 'pending', label: 'Pending', icon: Clock, color: 'orange' },
  { key: 'approved', label: 'Approved', icon: CheckCircle2, color: 'green' },
  { key: 'rejected', label: 'Rejected', icon: XCircle, color: 'red' },
]

const colorMap = {
  orange: 'text-orange-600 dark:text-orange-400 bg-orange-500/10 border-orange-500/20',
  green: 'text-green-600 dark:text-green-400 bg-green-500/10 border-green-500/20',
  red: 'text-red-600 dark:text-red-400 bg-red-500/10 border-red-500/20',
}

export default function AdminPropertiesPage() {
  const navigate = useNavigate()
  const { properties, stats, loading, error, activeTab, setActiveTab, approve, reject, refetch } = useProperties()
  const [rejectTarget, setRejectTarget] = useState(null)

  const handleChat = (ownerId, propertyId, ownerName) => {
    navigate('/admin/chats', { state: { ownerId, propertyId, ownerName } })
  }

  const currentList = properties[activeTab] || []

  return (
    <div className="max-w-screen-2xl mx-auto animate-in fade-in duration-300">
      {/* Header */}
      <div className="flex items-center justify-between mb-8">
        <div>
          <h1 className="text-2xl font-bold text-foreground" style={{ fontFamily: 'var(--font-heading)' }}>
            Property Moderation
          </h1>
          <p className="text-muted-foreground text-sm mt-1">
            Review and manage property listing submissions
          </p>
        </div>
        <button
          onClick={refetch}
          className="flex items-center gap-2 px-4 py-2 rounded-xl border border-border hover:bg-secondary transition-colors text-sm text-muted-foreground hover:text-foreground"
        >
          <RefreshCw className="w-4 h-4" />
          Refresh
        </button>
      </div>

      {/* Tabs */}
      <div className="flex gap-2 mb-8 border-b border-border pb-0">
        {TABS.map(({ key, label, icon: Icon, color }) => {
          const count = stats[key] || 0
          const isActive = activeTab === key
          return (
            <button
              key={key}
              onClick={() => setActiveTab(key)}
              className={`
                flex items-center gap-2 px-5 py-3 text-sm font-medium transition-all duration-150 border-b-2 -mb-px relative
                ${isActive
                  ? 'border-primary text-primary'
                  : 'border-transparent text-muted-foreground hover:text-foreground hover:border-border'
                }
              `}
            >
              <Icon className="w-4 h-4" />
              {label}
              <span className={`text-xs font-bold px-2 py-0.5 rounded-full border min-w-[24px] text-center ${
                isActive ? colorMap[color] : 'bg-muted text-muted-foreground border-border'
              }`}>
                {count}
              </span>
            </button>
          )
        })}
      </div>

      {/* Error state */}
      {error && (
        <div className="flex items-center gap-3 bg-destructive/10 border border-destructive/20 text-destructive px-5 py-4 rounded-xl mb-6">
          <AlertCircle className="w-5 h-5 shrink-0" />
          <div>
            <p className="font-semibold">Failed to load properties</p>
            <p className="text-sm opacity-80">{error}</p>
          </div>
          <button onClick={refetch} className="ml-auto px-3 py-1.5 rounded-lg border border-destructive/30 text-sm hover:bg-destructive/10 transition-colors">
            Retry
          </button>
        </div>
      )}

      {/* Grid */}
      {loading ? (
        <div className="grid grid-cols-1 md:grid-cols-2 xl:grid-cols-3 gap-6">
          {Array(6).fill(null).map((_, i) => <SkeletonCard key={i} />)}
        </div>
      ) : currentList.length === 0 ? (
        <div className="text-center py-24 animate-in fade-in duration-300">
          <div className="w-16 h-16 rounded-2xl bg-secondary flex items-center justify-center mx-auto mb-4">
            <Building2 className="w-8 h-8 text-muted-foreground" />
          </div>
          <h3 className="text-lg font-semibold text-foreground mb-2" style={{ fontFamily: 'var(--font-heading)' }}>
            No {activeTab} listings
          </h3>
          <p className="text-muted-foreground text-sm">
            {activeTab === 'pending'
              ? 'All caught up! No properties are waiting for review.'
              : `No properties with "${activeTab}" status found.`
            }
          </p>
        </div>
      ) : (
        <div className="grid grid-cols-1 md:grid-cols-2 xl:grid-cols-3 gap-6">
          {currentList.map(p => (
            <AdminPropertyCard
              key={p.id}
              property={p}
              onApprove={approve}
              onReject={setRejectTarget}
              onChat={handleChat}
            />
          ))}
        </div>
      )}

      {/* Reject Modal */}
      {rejectTarget && (
        <RejectModal
          property={rejectTarget}
          onConfirm={reject}
          onClose={() => setRejectTarget(null)}
        />
      )}
    </div>
  )
}
