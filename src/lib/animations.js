/**
 * GSAP ScrollTrigger animation helpers for Homizgo.
 * Import and call these inside useEffect() after elements mount.
 *
 * IMPORTANT: Call registerScrollTrigger() once per module load.
 */
import { gsap } from 'gsap'
import { ScrollTrigger } from 'gsap/ScrollTrigger'

gsap.registerPlugin(ScrollTrigger)

// ─── Hero Section ──────────────────────────────────────────────────────────────
/**
 * Fade + scale entrance for hero elements. Reverses on scroll-up.
 * @param {string | Element} target  – CSS selector or DOM element
 */
export function animateHero(target) {
  return gsap.fromTo(
    target,
    { y: 40, opacity: 0, scale: 0.97 },
    {
      y: 0,
      opacity: 1,
      scale: 1,
      duration: 1.1,
      ease: 'power3.out',
      scrollTrigger: {
        trigger: target,
        start: 'top 88%',
        end: 'top 40%',
        toggleActions: 'play reverse play reverse',
      },
    }
  )
}

// ─── Card Grid ────────────────────────────────────────────────────────────────
/**
 * Staggered slide-up for a row of cards. Plays forward on scroll-down,
 * reverses on scroll-up (uses toggleActions for natural feel).
 * @param {string} selector   – CSS selector matching the card elements
 * @param {string} trigger    – CSS selector for the scroll trigger container
 * @param {number} stagger    – seconds between each card's animation
 */
export function animateCards(selector, trigger, stagger = 0.1) {
  const els = document.querySelectorAll(selector)
  if (!els.length) return

  return gsap.fromTo(
    els,
    { y: 50, opacity: 0, scale: 0.96 },
    {
      y: 0,
      opacity: 1,
      scale: 1,
      duration: 0.7,
      stagger,
      ease: 'power3.out',
      scrollTrigger: {
        trigger: trigger || selector,
        start: 'top 85%',
        end: 'top 30%',
        toggleActions: 'play reverse play reverse',
      },
    }
  )
}

// ─── Section Heading ──────────────────────────────────────────────────────────
/**
 * Slide-in from left for section titles/headings.
 * @param {string} selector
 */
export function animateSectionHeading(selector) {
  const els = document.querySelectorAll(selector)
  if (!els.length) return

  return gsap.fromTo(
    els,
    { x: -30, opacity: 0 },
    {
      x: 0,
      opacity: 1,
      duration: 0.65,
      ease: 'power3.out',
      stagger: 0.08,
      scrollTrigger: {
        trigger: els[0],
        start: 'top 90%',
        end: 'top 60%',
        toggleActions: 'play reverse play reverse',
      },
    }
  )
}

// ─── Fade Up (generic) ────────────────────────────────────────────────────────
/**
 * Simple fade-up for any element.
 * @param {string | Element} target
 * @param {number} delay
 */
export function animateFadeUp(target, delay = 0) {
  return gsap.fromTo(
    target,
    { y: 30, opacity: 0 },
    {
      y: 0,
      opacity: 1,
      duration: 0.65,
      delay,
      ease: 'power3.out',
      scrollTrigger: {
        trigger: target,
        start: 'top 88%',
        end: 'top 50%',
        toggleActions: 'play reverse play reverse',
      },
    }
  )
}

// ─── Cleanup helper ───────────────────────────────────────────────────────────
/** Kill all ScrollTriggers created in a component (call in useEffect cleanup). */
export function killScrollTriggers(context) {
  if (context) {
    context.revert()
  } else {
    ScrollTrigger.getAll().forEach((st) => st.kill())
  }
}

export { ScrollTrigger }
