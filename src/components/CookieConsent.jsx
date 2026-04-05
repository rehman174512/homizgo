import { useState, useEffect } from 'react'
import { Link } from 'react-router-dom'
import { motion, AnimatePresence } from 'framer-motion'
import { Cookie, X, Check } from 'lucide-react'
import { Button } from '@/components/ui/button'

export function CookieConsent() {
  const [isVisible, setIsVisible] = useState(false)

  useEffect(() => {
    const consent = localStorage.getItem('homizgo_cookie_consent')
    if (!consent) {
      const timer = setTimeout(() => setIsVisible(true), 1500)
      return () => clearTimeout(timer)
    }
  }, [])

  const handleAccept = () => {
    localStorage.setItem('homizgo_cookie_consent', 'accepted')
    setIsVisible(false)
  }

  const handleReject = () => {
    localStorage.setItem('homizgo_cookie_consent', 'rejected')
    setIsVisible(false)
  }

  return (
    <AnimatePresence>
      {isVisible && (
        <motion.div
          initial={{ y: 100, opacity: 0 }}
          animate={{ y: 0, opacity: 1 }}
          exit={{ y: 100, opacity: 0 }}
          transition={{ type: 'spring', damping: 20, stiffness: 100 }}
          className="fixed bottom-6 left-1/2 z-[100] w-[calc(100%-2rem)] max-w-2xl -translate-x-1/2"
        >
          <div className="relative overflow-hidden rounded-2xl border border-border bg-card/80 p-6 shadow-2xl backdrop-blur-xl md:p-8">
            <div className="absolute -right-8 -top-8 h-32 w-32 rounded-full bg-primary/10 blur-2xl" />
            
            <div className="relative flex flex-col items-start gap-6 md:flex-row md:items-center">
              <div className="flex h-12 w-12 flex-shrink-0 items-center justify-center rounded-xl bg-primary/10 text-primary">
                <Cookie className="h-6 w-6" />
              </div>

              <div className="flex-1 space-y-2">
                <h3 className="font-heading text-lg font-bold text-foreground">Cookie Settings</h3>
                <p className="text-sm leading-relaxed text-muted-foreground">
                  We use cookies to improve your experience on Homizgo, remember your preferences, and provide personalized property recommendations. 
                  By continuing, you consent to our <Link to="/privacy" className="font-semibold text-primary hover:underline">Cookie Policy</Link>.
                </p>
              </div>

              <div className="flex w-full flex-col gap-2 sm:flex-row md:w-auto">
                <Button 
                  variant="outline" 
                  size="sm" 
                  onClick={handleReject}
                  className="rounded-xl border-border bg-transparent hover:bg-secondary"
                >
                  Reject All
                </Button>
                <Button 
                  size="sm" 
                  onClick={handleAccept}
                  className="rounded-xl bg-primary text-primary-foreground shadow-lg shadow-primary/20 hover:shadow-xl"
                >
                  <Check className="mr-1.5 h-4 w-4" />
                  Accept All
                </Button>
              </div>
            </div>

            <button
              onClick={() => setIsVisible(false)}
              className="absolute right-4 top-4 rounded-full p-1 text-muted-foreground transition-colors hover:bg-secondary hover:text-foreground"
              aria-label="Close"
            >
              <X className="h-4 w-4" />
            </button>
          </div>
        </motion.div>
      )}
    </AnimatePresence>
  )
}
