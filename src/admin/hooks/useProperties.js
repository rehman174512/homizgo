import { useState, useEffect, useCallback } from 'react'
import {
  getPropertiesByStatus,
  getAdminStats,
  approveProperty as svcApprove,
  rejectProperty as svcReject,
} from '../services/adminService'
import { createClient } from '@/lib/supabase'

const supabase = createClient()

export function useProperties() {
  const [properties, setProperties] = useState({ pending: [], approved: [], rejected: [] })
  const [stats, setStats] = useState({ pending: 0, approved: 0, rejected: 0, total: 0 })
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState(null)
  const [activeTab, setActiveTab] = useState('pending')

  const fetchAll = useCallback(async () => {
    setLoading(true)
    setError(null)
    try {
      const [pending, approved, rejected, statsData] = await Promise.all([
        getPropertiesByStatus('pending'),
        getPropertiesByStatus('approved'),
        getPropertiesByStatus('rejected'),
        getAdminStats(),
      ])
      setProperties({ pending, approved, rejected })
      setStats(statsData)
    } catch (err) {
      setError(err.message)
    } finally {
      setLoading(false)
    }
  }, [])

  useEffect(() => {
    fetchAll()

    // Realtime subscription: refresh on any property change
    const channel = supabase
      .channel('admin_properties_watch')
      .on('postgres_changes', { event: '*', schema: 'public', table: 'properties' }, () => {
        fetchAll()
      })
      .subscribe()

    return () => supabase.removeChannel(channel)
  }, [fetchAll])

  const approve = useCallback(async (id) => {
    await svcApprove(id)
    await fetchAll()
  }, [fetchAll])

  const reject = useCallback(async (id, reason) => {
    await svcReject(id, reason)
    await fetchAll()
  }, [fetchAll])

  return {
    properties,
    stats,
    loading,
    error,
    activeTab,
    setActiveTab,
    approve,
    reject,
    refetch: fetchAll,
  }
}
