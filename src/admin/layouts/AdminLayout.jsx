import { useEffect } from 'react'
import { Outlet, useNavigate } from 'react-router-dom'
import { useAdminAuth } from '../hooks/useAdminAuth'
import AdminSidebar from '../components/AdminSidebar'
import AdminTopbar from '../components/AdminTopbar'

// Split into a guard wrapper to allow hooks at top level
function AdminGuard({ children }) {
  const navigate = useNavigate()
  const { stage, user, logout } = useAdminAuth({ requirePin: true })

  useEffect(() => {
    if (stage === 'loading') return
    if (stage === 'unauthenticated' || stage === 'unauthorized') {
      navigate('/admin/login', { replace: true })
    } else if (stage === 'needs_pin') {
      navigate('/admin/pin', { replace: true })
    }
  }, [stage, navigate])

  if (stage === 'loading') {
    return (
      <div className="min-h-screen flex items-center justify-center bg-background">
        <div className="w-8 h-8 border-2 border-primary/30 border-t-primary rounded-full animate-spin" />
      </div>
    )
  }

  if (stage !== 'authorized') return null

  return children({ user, logout })
}

export default function AdminLayout({ pendingCount = 0, unreadCount = 0 }) {
  return (
    <AdminGuard>
      {({ user, logout }) => (
        <div className="flex h-screen bg-background overflow-hidden relative">
          <AdminSidebar pendingCount={pendingCount} unreadCount={unreadCount} />
          <div className="flex-1 flex flex-col min-w-0 overflow-hidden">
            <AdminTopbar user={user} onLogout={logout} />
            <main className="flex-1 overflow-y-auto p-6">
              <Outlet />
            </main>
          </div>
        </div>
      )}
    </AdminGuard>
  )
}
