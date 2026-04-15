import { useState } from 'react'
import { NavLink, useLocation } from 'react-router-dom'
import {
  LayoutDashboard, Building2, MessageSquare, Settings,
  ChevronLeft, ChevronRight, Shield
} from 'lucide-react'

const NAV_ITEMS = [
  { to: '/admin/dashboard', icon: LayoutDashboard, label: 'Dashboard' },
  { to: '/admin/properties', icon: Building2, label: 'Properties' },
  { to: '/admin/chats', icon: MessageSquare, label: 'Chats' },
  { to: '/admin/settings', icon: Settings, label: 'Settings' },
]

export default function AdminSidebar({ pendingCount = 0, unreadCount = 0 }) {
  const [collapsed, setCollapsed] = useState(false)
  const location = useLocation()

  return (
    <aside
      className={`
        h-screen sticky top-0 flex flex-col bg-sidebar border-r border-sidebar-border
        transition-all duration-300 ease-in-out shrink-0
        ${collapsed ? 'w-16' : 'w-60'}
      `}
    >
      {/* Logo */}
      <div className={`flex items-center gap-3 p-4 border-b border-sidebar-border ${collapsed ? 'justify-center' : ''}`}>
        <div className="w-8 h-8 rounded-lg bg-primary flex items-center justify-center shrink-0">
          <Shield className="w-4 h-4 text-primary-foreground" />
        </div>
        {!collapsed && (
          <div className="overflow-hidden">
            <p className="font-bold text-sidebar-foreground text-sm leading-none" style={{ fontFamily: 'var(--font-heading)' }}>
              Homizgo
            </p>
            <p className="text-xs text-muted-foreground mt-0.5">Admin Console</p>
          </div>
        )}
      </div>

      {/* Navigation */}
      <nav className="flex-1 p-2 space-y-1 overflow-y-auto">
        {NAV_ITEMS.map(({ to, icon: Icon, label }) => {
          const isActive = location.pathname.startsWith(to)
          const badge = to === '/admin/properties' ? pendingCount
            : to === '/admin/chats' ? unreadCount : 0

          return (
            <NavLink
              key={to}
              to={to}
              className={`
                flex items-center gap-3 px-3 py-2.5 rounded-xl transition-all duration-150 group relative
                ${isActive
                  ? 'bg-sidebar-primary text-sidebar-primary-foreground shadow-sm'
                  : 'text-sidebar-foreground hover:bg-sidebar-accent hover:text-sidebar-accent-foreground'
                }
                ${collapsed ? 'justify-center' : ''}
              `}
              title={collapsed ? label : undefined}
            >
              <Icon className="w-5 h-5 shrink-0" />
              {!collapsed && (
                <span className="text-sm font-medium flex-1">{label}</span>
              )}
              {badge > 0 && !collapsed && (
                <span className="text-xs font-bold bg-accent text-accent-foreground px-1.5 py-0.5 rounded-full min-w-[20px] text-center leading-none">
                  {badge > 99 ? '99+' : badge}
                </span>
              )}
              {badge > 0 && collapsed && (
                <span className="absolute top-1 right-1 w-2 h-2 rounded-full bg-accent" />
              )}
            </NavLink>
          )
        })}
      </nav>

      {/* Collapse toggle */}
      <div className="p-2 border-t border-sidebar-border">
        <button
          onClick={() => setCollapsed(c => !c)}
          className={`
            w-full flex items-center gap-3 px-3 py-2.5 rounded-xl text-muted-foreground
            hover:bg-sidebar-accent hover:text-sidebar-accent-foreground transition-colors
            ${collapsed ? 'justify-center' : ''}
          `}
        >
          {collapsed ? <ChevronRight className="w-4 h-4" /> : <ChevronLeft className="w-4 h-4" />}
          {!collapsed && <span className="text-sm">Collapse</span>}
        </button>
      </div>
    </aside>
  )
}
