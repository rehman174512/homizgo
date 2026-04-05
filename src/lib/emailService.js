import { Resend } from 'resend'
import { checkEmailDailyLimit, logEmailSent } from './guards'

const resend = new Resend(import.meta.env.VITE_RESEND_API_KEY)
const FROM_EMAIL = 'Homizgo <no-reply@notifications.homizgo.com>'
const getSiteUrl = () => {
  if (typeof window !== 'undefined') return window.location.origin
  return 'https://homizgo.com'
}

/**
 * Common styles for email templates
 */
const STYLES = {
  container: 'font-family: -apple-system, BlinkMacSystemFont, "Segoe UI", Roboto, Helvetica, Arial, sans-serif; max-width: 600px; margin: 0 auto; background-color: #ffffff; padding: 40px 20px; color: #1f2937;',
  logo: 'width: 48px; height: 48px; background-color: #6366f1; border-radius: 12px; margin-bottom: 24px;',
  h1: 'font-size: 24px; font-weight: 700; color: #111827; margin-bottom: 16px; border-bottom: 1px solid #f3f4f6; padding-bottom: 16px;',
  p: 'font-size: 16px; line-height: 24px; color: #4b5563; margin-bottom: 24px;',
  button: 'display: inline-block; background-color: #6366f1; color: #ffffff; padding: 12px 24px; border-radius: 8px; text-decoration: none; font-weight: 600; font-size: 14px; box-shadow: 0 4px 6px -1px rgba(99, 102, 241, 0.4);',
  footer: 'margin-top: 40px; border-top: 1px solid #f3f4f6; padding-top: 24px; font-size: 12px; color: #9ca3af; text-align: center;',
  box: 'background-color: #f9fafb; border-radius: 12px; padding: 20px; margin-bottom: 24px; border: 1px solid #f3f4f6;'
}

/**
 * Send a "Successful Login" email
 * @param {string} email
 * @param {string} name
 */
export async function sendLoginEmail(email, name) {
  if (!email) return
  
  const istTime = new Date().toLocaleString('en-IN', {
    timeZone: 'Asia/Kolkata',
    dateStyle: 'full',
    timeStyle: 'short'
  })

  const html = `
    <div style="${STYLES.container}">
      <div style="${STYLES.logo}"></div>
      <h1 style="${STYLES.h1}">✅ Successful Login</h1>
      <p style="${STYLES.p}">Hi ${name || 'there'},</p>
      <p style="${STYLES.p}">Your Homizgo account was just accessed from a new device/browser.</p>
      
      <div style="${STYLES.box}">
        <p style="margin: 0; font-weight: 600; font-size: 14px; color: #111827;">Login Details:</p>
        <p style="margin: 4px 0 0; font-size: 14px;">Time: ${istTime} (IST)</p>
        <p style="margin: 4px 0 0; font-size: 14px;">Status: Authorized</p>
      </div>

      <p style="${STYLES.p}">If this was you, you can safely ignore this email. If not, please secure your account immediately.</p>
      
      <a href="${getSiteUrl()}/profile" style="${STYLES.button}">Security Dashboard</a>
      
      <div style="${STYLES.footer}">
        <p>&copy; ${new Date().getFullYear()} Homizgo. Real Estate for the Modern World.</p>
        <p>If you have questions, please contact support@homizgo.com</p>
      </div>
    </div>
  `

  try {
    // NPO SAFETY: Check daily limits before sending
    await checkEmailDailyLimit()

    const result = await resend.emails.send({
      from: FROM_EMAIL,
      to: email,
      subject: '✅ Successful Login - Homizgo',
      html
    })

    // Log the send to maintain our global count
    await logEmailSent('login', email)
    return result
  } catch (error) {
    console.error('[emailService] Login email failed:', error)
    return { error }
  }
}

/**
 * Send a "New Chat Message" notification
 * @param {string} recipientEmail
 * @param {string} senderName
 * @param {string} messagePreview
 * @param {string} threadId
 */
export async function sendChatNotification(recipientEmail, senderName, messagePreview, threadId) {
  if (!recipientEmail) return

  const html = `
    <div style="${STYLES.container}">
      <div style="${STYLES.logo}"></div>
      <h1 style="${STYLES.h1}">💬 New Message from ${senderName}</h1>
      <p style="${STYLES.p}">You have received a new message in your chat.</p>
      
      <div style="${STYLES.box}">
        <p style="margin: 0; font-style: italic; color: #4b5563;">"${messagePreview.substring(0, 150)}${messagePreview.length > 150 ? '...' : ''}"</p>
      </div>

      <a href="${getSiteUrl()}/chat?threadId=${threadId}" style="${STYLES.button}">Reply Now</a>
      
      <div style="${STYLES.footer}">
        <p>&copy; ${new Date().getFullYear()} Homizgo. You received this because you have an active conversation.</p>
      </div>
    </div>
  `

  try {
    // NPO SAFETY: Check daily limits before sending
    await checkEmailDailyLimit()

    const result = await resend.emails.send({
      from: FROM_EMAIL,
      to: recipientEmail,
      subject: `💬 New Message from ${senderName} - Homizgo`,
      html
    })

    await logEmailSent('chat', recipientEmail)
    return result
  } catch (error) {
    console.error('[emailService] Chat notification failed:', error)
    return { error }
  }
}

/**
 * Send an admin notification for new property submission
 * @param {string[]} adminEmails
 * @param {string} propertyTitle
 * @param {string} ownerName
 * @param {string} propertyId
 */
export async function sendAdminPropertyNotification(adminEmails, propertyTitle, ownerName, propertyId) {
  if (!adminEmails || adminEmails.length === 0) return

  const html = `
    <div style="${STYLES.container}">
      <div style="${STYLES.logo}"></div>
      <h1 style="${STYLES.h1}">🏠 New Property Submission</h1>
      <p style="${STYLES.p}">A new property listing has been submitted and is waiting for your review.</p>
      
      <div style="${STYLES.box}">
        <p style="margin: 0; font-weight: 600; font-size: 14px; color: #111827;">Listing Details:</p>
        <p style="margin: 4px 0 0; font-size: 14px;">Title: ${propertyTitle}</p>
        <p style="margin: 4px 0 0; font-size: 14px;">Owner: ${ownerName}</p>
        <p style="margin: 4px 0 0; font-size: 14px;">Status: Pending Approval</p>
      </div>

      <a href="${getSiteUrl()}/admin/properties" style="${STYLES.button}">Review Listing</a>
      
      <div style="${STYLES.footer}">
        <p>&copy; ${new Date().getFullYear()} Homizgo Admin Panel.</p>
      </div>
    </div>
  `

  try {
    // NPO SAFETY: Check daily limits before sending
    await checkEmailDailyLimit()

    const result = await resend.emails.send({
      from: FROM_EMAIL,
      to: adminEmails,
      subject: `🚨 Action Required: New Listing - ${propertyTitle}`,
      html
    })

    await logEmailSent('admin_property', adminEmails.join(','))
    return result
  } catch (error) {
    console.error('[emailService] Admin property notification failed:', error)
    return { error }
  }
}
