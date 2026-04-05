import { useEffect, useState } from 'react'
import { useNavigate } from 'react-router-dom'
import { getCurrentUser } from '@/lib/store'

/**
 * Checks whether the current user has all required profile fields filled in.
 * If not, redirects to /profile?incomplete=1 so the user can complete their profile.
 *
 * Required for every role : name, phone
 * Required for student/user only : gender
 *
 * Returns { user, profileReady } — render null while profileReady is false.
 */
export function useProfileGuard(requiredRole = null) {
  const navigate = useNavigate()
  const [user, setUser] = useState(null)
  const [profileReady, setProfileReady] = useState(false)

  useEffect(() => {
    let active = true
    async function check() {
      try {
        const current = await getCurrentUser()

        // Not logged in
        if (!current) {
          navigate('/login')
          return
        }

        // Wrong role — treat 'user' and 'student' as equivalent for the user dashboard
        const effectiveRequired = requiredRole === 'user' ? ['user', 'student'] : [requiredRole]
        if (requiredRole && !effectiveRequired.includes(current.role)) {
          navigate('/login')
          return
        }

        // Determine missing fields
        const isStudent = current.role === 'user' || current.role === 'student'
        const missing = []

        if (!current.name || current.name.trim() === '' || current.name === 'User') missing.push('Full Name')
        if (!current.phone || current.phone.trim() === '') missing.push('Phone Number')
        if (isStudent && (!current.gender || current.gender.trim() === '')) missing.push('Gender')

        if (missing.length > 0) {
          // Store the missing fields so ProfilePage can display a banner
          sessionStorage.setItem('homizgo_incomplete_fields', JSON.stringify(missing))
          navigate('/profile?incomplete=1')
          return
        }

        // All good
        sessionStorage.removeItem('homizgo_incomplete_fields')
        if (active) {
          setUser(current)
          setProfileReady(true)
        }
      } catch (err) {
        console.error('Profile guard error:', err)
        navigate('/login')
      }
    }

    check()
    return () => { active = false }
  }, [navigate, requiredRole])

  return { user, profileReady }
}
