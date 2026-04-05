import { useEffect, useRef } from 'react'
import { gsap } from 'gsap'
import { X } from 'lucide-react'

/**
 * Foreground notification toast.
 * Slides in from top-right, auto-dismisses via parent timeout.
 */
export default function Toast({ icon = '🔔', title, body, onClose }) {
  const ref = useRef(null)

  useEffect(() => {
    if (!ref.current) return
    gsap.fromTo(
      ref.current,
      { x: 120, opacity: 0 },
      { x: 0, opacity: 1, duration: 0.45, ease: 'back.out(1.5)' }
    )
  }, [])

  const dismiss = () => {
    if (!ref.current) return
    gsap.to(ref.current, {
      x: 140,
      opacity: 0,
      duration: 0.3,
      ease: 'power2.in',
      onComplete: onClose,
    })
  }

  return (
    <div
      ref={ref}
      role="alert"
      aria-live="assertive"
      style={{
        position: 'fixed',
        top: 20,
        right: 20,
        zIndex: 10000,
        minWidth: 300,
        maxWidth: 360,
        background: 'linear-gradient(135deg, hsl(222 47% 10%) 0%, hsl(222 47% 14%) 100%)',
        border: '1px solid hsl(216 100% 60% / 0.3)',
        borderRadius: 16,
        padding: '14px 16px',
        display: 'flex',
        alignItems: 'flex-start',
        gap: 12,
        boxShadow: '0 8px 32px rgba(0,0,0,0.4), 0 0 0 1px hsl(216 100% 60% / 0.15)',
        backdropFilter: 'blur(16px)',
      }}
    >
      {/* Icon */}
      <span
        style={{
          fontSize: 22,
          flexShrink: 0,
          lineHeight: 1,
          marginTop: 2,
        }}
      >
        {icon}
      </span>

      {/* Text */}
      <div style={{ flex: 1, minWidth: 0 }}>
        <p
          style={{
            margin: 0,
            fontFamily: 'system-ui, sans-serif',
            fontSize: 14,
            fontWeight: 700,
            color: 'white',
            lineHeight: 1.3,
          }}
        >
          {title}
        </p>
        {body && (
          <p
            style={{
              margin: '4px 0 0',
              fontFamily: 'system-ui, sans-serif',
              fontSize: 12.5,
              color: 'rgba(255,255,255,0.6)',
              lineHeight: 1.5,
            }}
          >
            {body}
          </p>
        )}
      </div>

      {/* Close */}
      <button
        onClick={dismiss}
        style={{
          background: 'transparent',
          border: 'none',
          cursor: 'pointer',
          padding: 4,
          borderRadius: 8,
          color: 'rgba(255,255,255,0.4)',
          flexShrink: 0,
          transition: 'color 0.2s',
        }}
        aria-label="Dismiss notification"
      >
        <X size={14} />
      </button>
    </div>
  )
}
