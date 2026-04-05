import { createClient } from './supabase'

const supabase = createClient()

export async function signUp(email, password, fullName, role, gender, phone, college) {
  const { data, error } = await supabase.auth.signUp({
    email,
    password,
    options: {
      data: {
        full_name: fullName,
        role: role || 'student',
        gender: gender || 'male',
        phone: phone || '',
        college: college || '',
      },
    },
  })
  if (error) throw error
  return data.user
}

export async function signIn(email, password) {
  const { data, error } = await supabase.auth.signInWithPassword({
    email,
    password,
  })
  if (error) throw error
  return data.user
}

export async function signInWithGoogle() {
  const supabase = createClient()
  const redirectTo = `${window.location.origin}/auth/callback`
  console.log('[Auth] Google OAuth redirectTo:', redirectTo)

  const { data, error } = await supabase.auth.signInWithOAuth({
    provider: 'google',
    options: { redirectTo },
  })
  if (error) throw error
  return data
}

export async function signOut() {
  const { error } = await supabase.auth.signOut()
  if (error) throw error
}

export async function getCurrentUser() {
  const { data: { session }, error } = await supabase.auth.getSession()
  if (error) throw error
  
  if (!session) return null

  // Fetch full user details from our custom users table
  const { data: userProfile, error: profileError } = await supabase
    .from('users')
    .select('*')
    .eq('id', session.user.id)
    .single()

  if (profileError && profileError.code !== 'PGRST116') {
    // Profile fetch failed with unexpected error — fallback to metadata below
  }

  // If userProfile is null (trigger failed/missing), fallback to user_metadata
  const fallbackRole = session.user.user_metadata?.role || 'user'
  const fallbackName = session.user.user_metadata?.full_name || session.user.user_metadata?.name || 'User'

  // Prefer metadata role if it's explicitly landlord or pgowner
  let resolvedRole = userProfile?.role || fallbackRole
  if (fallbackRole === 'landlord' || fallbackRole === 'pgowner') {
    resolvedRole = fallbackRole
  }

  return {
    ...session.user,
    ...(userProfile || {}),
    role: resolvedRole,
    name: userProfile?.name || fallbackName,
    gender: userProfile?.gender || ((resolvedRole === 'student' || resolvedRole === 'user') ? 'male' : null),
  }
}
