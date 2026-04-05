import { useState, useEffect, useCallback } from 'react'
import { useNavigate, useLocation } from 'react-router-dom'
import { getAdminSession, adminSignOut } from '../services/adminService'

const ADMIN_EMAIL = 'raabdul08@gmail.com'
const PIN_SESSION_KEY = 'admin_pin_verified'

/**
 * Multi-stage admin auth hook.
 * stage: 'loading' | 'unauthenticated' | 'unauthorized' | 'needs_pin' | 'authorized'
 */
export function useAdminAuth({ requirePin = true } = {}) {
  const [stage, setStage] = useState('loading')
  const [user, setUser] = useState(null)
  const navigate = useNavigate()
  const location = useLocation()

  const checkAuth = useCallback(async () => {
    try {
      const session = await getAdminSession()

      if (!session) {
        setStage('unauthenticated')
        return
      }

      if (session.user?.email !== ADMIN_EMAIL) {
        setStage('unauthorized')
        return
      }

      setUser(session.user)

      if (requirePin) {
        const pinVerified = sessionStorage.getItem(PIN_SESSION_KEY) === 'true'
        if (!pinVerified) {
          setStage('needs_pin')
          return
        }
      }

      setStage('authorized')
    } catch {
      setStage('unauthenticated')
    }
  }, [requirePin])

  useEffect(() => {
    checkAuth()
  }, [checkAuth, location.pathname])

  const logout = useCallback(async () => {
    await adminSignOut()
    setStage('unauthenticated')
    setUser(null)
    navigate('/admin/login', { replace: true })
  }, [navigate])

  const markPinVerified = useCallback(() => {
    sessionStorage.setItem(PIN_SESSION_KEY, 'true')
    setStage('authorized')
  }, [])

  return { stage, user, logout, markPinVerified, refetch: checkAuth }
}
