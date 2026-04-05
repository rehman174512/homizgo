import { useEffect, useRef } from 'react'
import { gsap } from 'gsap'
import logoSrc from '@/logo.png'

/**
 * Full-screen logo loader.
 * Props:
 *   visible {boolean} — show or hide the loader
 *   onHide  {function} — called after fade-out animation completes
 *
 * Background adapts to light/dark mode using CSS custom properties
 * (--background, --primary) defined in globals.css / theme.
 */
export default function Loader({ visible, onHide }) {
  const overlayRef = useRef(null)
  const logoRef = useRef(null)
  const ringRef = useRef(null)

  // Entrance animation
  useEffect(() => {
    if (!visible || !overlayRef.current) return

    const tl = gsap.timeline()
    tl.set(overlayRef.current, { opacity: 1, display: 'flex' })
      .fromTo(
        logoRef.current,
        { scale: 0.6, opacity: 0, filter: 'blur(12px)' },
        { scale: 1, opacity: 1, filter: 'blur(0px)', duration: 0.7, ease: 'back.out(1.7)' }
      )
      .fromTo(
        ringRef.current,
        { scale: 0.4, opacity: 0 },
        { scale: 1, opacity: 1, duration: 0.5, ease: 'power3.out' },
        '-=0.4'
      )

    // Pulse the ring continuously
    gsap.to(ringRef.current, {
      scale: 1.08,
      opacity: 0.4,
      duration: 0.9,
      repeat: -1,
      yoyo: true,
      ease: 'sine.inOut',
    })

    return () => tl.kill()
  }, [visible])

  // Exit animation
  useEffect(() => {
    if (visible || !overlayRef.current) return
    gsap.to(overlayRef.current, {
      opacity: 0,
      duration: 0.5,
      ease: 'power2.inOut',
      onComplete: () => {
        if (overlayRef.current) overlayRef.current.style.display = 'none'
        onHide?.()
      },
    })
  }, [visible, onHide])

  return (
    <div
      ref={overlayRef}
      className="loader-overlay"
      aria-label="Loading Homizgo"
      role="status"
    >
      {/* Glowing ring behind logo */}
      <div ref={ringRef} className="loader-ring" />

      {/* Logo */}
      <img
        ref={logoRef}
        src={logoSrc}
        alt="Homizgo"
        className="loader-logo"
      />

      {/* App name */}
      <p className="loader-title">Homizgo</p>
      <p className="loader-subtitle">Finding your perfect stay…</p>

      <style>{`
        .loader-overlay {
          display: flex;
          position: fixed;
          inset: 0;
          z-index: 9999;
          align-items: center;
          justify-content: center;
          flex-direction: column;
          background: hsl(var(--background));
          opacity: 0;
          transition: background 0.3s;
        }

        .loader-ring {
          position: absolute;
          width: 140px;
          height: 140px;
          border-radius: 50%;
          background: radial-gradient(circle, hsl(var(--primary) / 0.3) 0%, transparent 70%);
        }

        .loader-logo {
          width: 90px;
          height: 90px;
          object-fit: contain;
          border-radius: 20px;
          position: relative;
          z-index: 1;
          filter: drop-shadow(0 8px 24px hsl(var(--primary) / 0.4));
        }

        .loader-title {
          margin-top: 20px;
          font-family: system-ui, sans-serif;
          font-size: 22px;
          font-weight: 700;
          letter-spacing: 0.05em;
          color: hsl(var(--foreground));
          position: relative;
          z-index: 1;
        }

        .loader-subtitle {
          margin-top: 6px;
          font-family: system-ui, sans-serif;
          font-size: 13px;
          color: hsl(var(--muted-foreground));
          position: relative;
          z-index: 1;
          letter-spacing: 0.08em;
        }
      `}</style>
    </div>
  )
}
