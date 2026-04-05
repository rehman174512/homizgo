import { supabase } from './supabase'

/**
 * NPO SAFETY GUARD: Local & Global Rate Limiting
 * Because we use standard free tiers (Supabase, Resend), we must heavily guard outbound actions.
 */

// 1. Local Auth Guard (Max 5 attempts / 15 min per device)
export function checkLoginRateLimit() {
  const MAX_ATTEMPTS = 5;
  const WINDOW_MS = 15 * 60 * 1000;

  const attemptsStr = localStorage.getItem('npo_login_attempts');
  const lockoutStr = localStorage.getItem('npo_login_lockout');

  if (lockoutStr) {
    const lockoutUntil = parseInt(lockoutStr, 10);
    if (Date.now() < lockoutUntil) {
      throw new Error(`Rate limit exceeded. Please wait ${Math.ceil((lockoutUntil - Date.now()) / 60000)} minutes.`);
    } else {
      localStorage.removeItem('npo_login_attempts');
      localStorage.removeItem('npo_login_lockout');
      return true;
    }
  }

  const attempts = parseInt(attemptsStr || '0', 10);
  if (attempts >= MAX_ATTEMPTS) {
    const newLockout = Date.now() + WINDOW_MS;
    localStorage.setItem('npo_login_lockout', newLockout.toString());
    throw new Error('Too many login attempts. Please wait 15 minutes.');
  }

  return true;
}

export function recordLoginAttempt() {
  const attempts = parseInt(localStorage.getItem('npo_login_attempts') || '0', 10);
  localStorage.setItem('npo_login_attempts', (attempts + 1).toString());
}

export function clearLoginAttempts() {
  localStorage.removeItem('npo_login_attempts');
  localStorage.removeItem('npo_login_lockout');
}

// 2. Global Resend Email Guard (Max 70 / Day)
// We check a dedicated 'email_logs' table in Supabase.
export async function checkEmailDailyLimit() {
  const MAX_GLOBAL_EMAILS_PER_DAY = import.meta.env.VITE_MAX_EMAILS_PER_DAY || 70;
  
  // Get start of today in ISO
  const today = new Date();
  today.setHours(0, 0, 0, 0);
  const startOfDay = today.toISOString();

  // Query Supabase for count of emails sent today
  const { count, error } = await supabase
    .from('email_logs')
    .select('*', { count: 'exact', head: true })
    .gte('sent_at', startOfDay);

  if (error) {
    console.error('[guards] Error checking email limit:', error);
    // Fail closed or open? For NPO safety, fail open with a local fallback, or fail closed.
    // Let's allow but warn. We rely on the backend tracking mostly.
    return true; 
  }

  if (count >= MAX_GLOBAL_EMAILS_PER_DAY) {
    console.warn(`[guards] CRITICAL: Daily email limit reached (${count}/${MAX_GLOBAL_EMAILS_PER_DAY}). Blocking outbound email.`);
    throw new Error('Daily email notification limit reached to preserve NPO free-tier. Please try again tomorrow.');
  }

  return true;
}

export async function logEmailSent(emailType, recipientUrl) {
  await supabase.from('email_logs').insert({
    email_type: emailType,
    recipient: recipientUrl,
    sent_at: new Date().toISOString()
  });
}

// 3. Sensitive Action Limiter (API Abuse Guard for Properties/Chats)
export function checkSensitiveActionLimit(actionName, maxRequests = 20, windowMs = 5 * 60 * 1000) {
  const key = `npo_action_${actionName}_timestamps`;
  const now = Date.now();
  
  let timestamps = [];
  try {
    timestamps = JSON.parse(localStorage.getItem(key) || '[]');
  } catch (e) {
    timestamps = [];
  }

  // Filter timestamps within the rolling window
  timestamps = timestamps.filter(t => now - t < windowMs);

  if (timestamps.length >= maxRequests) {
    throw new Error(`Rate limit exceeded for ${actionName}. Please slow down.`);
  }

  timestamps.push(now);
  localStorage.setItem(key, JSON.stringify(timestamps));
  return true;
}
