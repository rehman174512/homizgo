import { useTheme } from 'next-themes'
import { Sun, Moon, LogOut, Shield } from 'lucide-react'

export default function AdminTopbar({ user, onLogout }) {
  const { theme, setTheme } = useTheme()

  return (
    <header className="h-14 border-b border-border bg-card/80 backdrop-blur-sm flex items-center justify-between px-6 sticky top-0 z-10">
      {/* Left: Title */}
      <div className="flex items-center gap-2">
        <Shield className="w-4 h-4 text-primary" />
        <span className="text-sm font-semibold text-foreground" style={{ fontFamily: 'var(--font-heading)' }}>
          Admin Console
        </span>
        <span className="text-muted-foreground/40 mx-1">·</span>
        <span className="text-xs text-muted-foreground">
          Live
        </span>
        <span className="w-1.5 h-1.5 rounded-full bg-green-500 animate-pulse" />
      </div>

      {/* Right: User + actions */}
      <div className="flex items-center gap-3">
        {user && (
          <div className="flex items-center gap-2 px-3 py-1.5 rounded-xl bg-secondary border border-border">
            <div className="w-6 h-6 rounded-full bg-primary/20 flex items-center justify-center">
              <span className="text-xs font-bold text-primary">A</span>
            </div>
            <span className="text-xs font-medium text-foreground hidden sm:block">
              {user.email}
            </span>
          </div>
        )}

        {/* Theme toggle */}
        <button
          onClick={() => setTheme(theme === 'dark' ? 'light' : 'dark')}
          className="w-8 h-8 rounded-xl border border-border bg-card flex items-center justify-center text-muted-foreground hover:text-foreground hover:bg-secondary transition-all"
          title="Toggle theme"
        >
          {theme === 'dark' ? <Sun className="w-4 h-4" /> : <Moon className="w-4 h-4" />}
        </button>

        {/* Logout */}
        <button
          onClick={onLogout}
          className="flex items-center gap-2 px-3 py-1.5 rounded-xl text-destructive hover:bg-destructive/10 border border-transparent hover:border-destructive/20 transition-all text-sm font-medium"
          title="Logout"
        >
          <LogOut className="w-4 h-4" />
          <span className="hidden sm:inline">Logout</span>
        </button>
      </div>
    </header>
  )
}
