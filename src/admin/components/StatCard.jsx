import { useEffect, useRef } from 'react'

function countUp(el, target, duration = 800) {
  const start = performance.now()
  const update = (time) => {
    const elapsed = Math.min((time - start) / duration, 1)
    const ease = 1 - Math.pow(1 - elapsed, 3)
    el.textContent = Math.round(ease * target)
    if (elapsed < 1) requestAnimationFrame(update)
  }
  requestAnimationFrame(update)
}

export default function StatCard({ icon: Icon, label, value, color = 'primary', trend }) {
  const numRef = useRef(null)

  useEffect(() => {
    if (numRef.current && typeof value === 'number') {
      countUp(numRef.current, value)
    }
  }, [value])

  const colorMap = {
    primary: 'bg-primary/10 text-primary border-primary/20',
    green: 'bg-green-500/10 text-green-600 dark:text-green-400 border-green-500/20',
    red: 'bg-red-500/10 text-red-600 dark:text-red-400 border-red-500/20',
    orange: 'bg-orange-500/10 text-orange-600 dark:text-orange-400 border-orange-500/20',
    muted: 'bg-muted text-muted-foreground border-border',
  }

  return (
    <div className="bg-card border border-border rounded-2xl p-5 hover:shadow-md hover:shadow-primary/5 transition-all duration-200 group">
      <div className="flex items-start justify-between mb-4">
        <div className={`w-10 h-10 rounded-xl border flex items-center justify-center ${colorMap[color]}`}>
          <Icon className="w-5 h-5" />
        </div>
        {trend !== undefined && (
          <span className={`text-xs font-medium px-2 py-1 rounded-full ${
            trend > 0 ? 'text-green-600 bg-green-500/10' :
            trend < 0 ? 'text-red-600 bg-red-500/10' :
            'text-muted-foreground bg-muted'
          }`}>
            {trend > 0 ? '+' : ''}{trend}%
          </span>
        )}
      </div>
      <div
        ref={numRef}
        className="text-3xl font-bold text-foreground mb-1 tabular-nums"
        style={{ fontFamily: 'var(--font-heading)' }}
      >
        {typeof value === 'number' ? 0 : value}
      </div>
      <p className="text-sm text-muted-foreground">{label}</p>
    </div>
  )
}
