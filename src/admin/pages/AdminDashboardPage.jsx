import { useEffect, useState } from 'react'
import { useNavigate } from 'react-router-dom'
import { formatDistanceToNow } from 'date-fns'
import {
  Building2, CheckCircle2, XCircle, Clock, ArrowRight,
  TrendingUp, MessageSquare, Activity,
} from 'lucide-react'
import { getAdminStats, getRecentActivity } from '../services/adminService'
import StatCard from '../components/StatCard'
import SkeletonCard from '../components/SkeletonCard'

const statusConfig = {
  pending: { label: 'Pending', className: 'bg-orange-500/10 text-orange-600 dark:text-orange-400 border-orange-500/20', icon: Clock },
  approved: { label: 'Approved', className: 'bg-green-500/10 text-green-600 dark:text-green-400 border-green-500/20', icon: CheckCircle2 },
  rejected: { label: 'Rejected', className: 'bg-red-500/10 text-red-600 dark:text-red-400 border-red-500/20', icon: XCircle },
}

export default function AdminDashboardPage() {
  const navigate = useNavigate()
  const [stats, setStats] = useState(null)
  const [activity, setActivity] = useState([])
  const [loading, setLoading] = useState(true)

  useEffect(() => {
    let mounted = true
    async function load() {
      try {
        const [s, a] = await Promise.all([getAdminStats(), getRecentActivity(8)])
        if (mounted) { setStats(s); setActivity(a) }
      } catch (err) {
        console.error(err)
      } finally {
        if (mounted) setLoading(false)
      }
    }
    load()
    return () => { mounted = false }
  }, [])

  return (
    <div className="max-w-screen-xl mx-auto animate-in fade-in duration-300">
      {/* Header */}
      <div className="mb-8">
        <h1 className="text-2xl font-bold text-foreground" style={{ fontFamily: 'var(--font-heading)' }}>
          Dashboard
        </h1>
        <p className="text-muted-foreground text-sm mt-1">
          Welcome back. Here's what's happening with Homizgo.
        </p>
      </div>

      {/* Stat Cards */}
      <div className="grid grid-cols-2 lg:grid-cols-4 gap-5 mb-8">
        {loading ? (
          Array(4).fill(null).map((_, i) => (
            <div key={i} className="bg-card border border-border rounded-2xl p-5 h-32 animate-shimmer" />
          ))
        ) : (
          <>
            <StatCard icon={Building2} label="Total Listings" value={stats?.total || 0} color="primary" />
            <StatCard icon={Clock} label="Pending Review" value={stats?.pending || 0} color="orange" />
            <StatCard icon={CheckCircle2} label="Approved" value={stats?.approved || 0} color="green" />
            <StatCard icon={XCircle} label="Rejected" value={stats?.rejected || 0} color="red" />
          </>
        )}
      </div>

      {/* Quick actions */}
      <div className="grid grid-cols-1 md:grid-cols-2 gap-5 mb-8">
        <button
          onClick={() => navigate('/admin/properties')}
          className="group bg-card border border-border rounded-2xl p-6 text-left hover:shadow-md hover:shadow-primary/5 hover:border-primary/30 transition-all duration-200"
        >
          <div className="flex items-center justify-between mb-4">
            <div className="w-12 h-12 rounded-2xl bg-orange-500/10 flex items-center justify-center">
              <Clock className="w-6 h-6 text-orange-600 dark:text-orange-400" />
            </div>
            <ArrowRight className="w-5 h-5 text-muted-foreground group-hover:text-primary group-hover:translate-x-1 transition-all" />
          </div>
          <h3 className="font-bold text-foreground mb-1" style={{ fontFamily: 'var(--font-heading)' }}>
            Review Pending Listings
          </h3>
          <p className="text-sm text-muted-foreground">
            {loading ? '...' : `${stats?.pending || 0} listing${stats?.pending !== 1 ? 's' : ''} waiting for your review`}
          </p>
        </button>

        <button
          onClick={() => navigate('/admin/chats')}
          className="group bg-card border border-border rounded-2xl p-6 text-left hover:shadow-md hover:shadow-primary/5 hover:border-primary/30 transition-all duration-200"
        >
          <div className="flex items-center justify-between mb-4">
            <div className="w-12 h-12 rounded-2xl bg-primary/10 flex items-center justify-center">
              <MessageSquare className="w-6 h-6 text-primary" />
            </div>
            <ArrowRight className="w-5 h-5 text-muted-foreground group-hover:text-primary group-hover:translate-x-1 transition-all" />
          </div>
          <h3 className="font-bold text-foreground mb-1" style={{ fontFamily: 'var(--font-heading)' }}>
            Owner Messages
          </h3>
          <p className="text-sm text-muted-foreground">
            Communicate directly with property owners
          </p>
        </button>
      </div>

      {/* Recent Activity */}
      <div className="bg-card border border-border rounded-2xl overflow-hidden">
        <div className="flex items-center justify-between px-6 py-4 border-b border-border">
          <div className="flex items-center gap-2.5">
            <Activity className="w-4 h-4 text-primary" />
            <h2 className="font-bold text-foreground" style={{ fontFamily: 'var(--font-heading)' }}>
              Recent Activity
            </h2>
          </div>
          <button
            onClick={() => navigate('/admin/properties')}
            className="text-xs text-primary hover:underline font-medium"
          >
            View all →
          </button>
        </div>

        {loading ? (
          <div className="divide-y divide-border">
            {Array(5).fill(null).map((_, i) => (
              <div key={i} className="flex items-center gap-4 px-6 py-4">
                <div className="w-8 h-8 rounded-full bg-muted animate-shimmer" />
                <div className="flex-1 space-y-2">
                  <div className="h-3.5 bg-muted rounded w-1/2 animate-shimmer" />
                  <div className="h-3 bg-muted rounded w-1/3 animate-shimmer" />
                </div>
              </div>
            ))}
          </div>
        ) : activity.length === 0 ? (
          <div className="text-center py-12">
            <TrendingUp className="w-8 h-8 text-muted-foreground/30 mx-auto mb-3" />
            <p className="text-sm text-muted-foreground">No activity yet</p>
          </div>
        ) : (
          <div className="divide-y divide-border">
            {activity.map(item => {
              const sc = statusConfig[item.status] || statusConfig.pending
              const Icon = sc.icon
              const timeAgo = item.submitted_at
                ? formatDistanceToNow(new Date(item.submitted_at), { addSuffix: true })
                : ''
              return (
                <div key={item.id} className="flex items-center gap-4 px-6 py-4 hover:bg-secondary/30 transition-colors">
                  <div className={`w-8 h-8 rounded-full border flex items-center justify-center shrink-0 ${sc.className}`}>
                    <Icon className="w-4 h-4" />
                  </div>
                  <div className="flex-1 min-w-0">
                    <p className="text-sm font-medium text-foreground truncate">{item.title}</p>
                    <p className="text-xs text-muted-foreground">
                      by {item.users?.name || 'Unknown'} · {timeAgo}
                    </p>
                  </div>
                  <span className={`text-xs font-semibold px-2.5 py-1 rounded-full border ${sc.className}`}>
                    {sc.label}
                  </span>
                </div>
              )
            })}
          </div>
        )}
      </div>
    </div>
  )
}
