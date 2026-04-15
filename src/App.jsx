import { Suspense, lazy, useEffect, useState, useCallback } from 'react'
import { BrowserRouter, Routes, Route } from 'react-router-dom'
import { ThemeProvider } from 'next-themes'
import { HelmetProvider } from 'react-helmet-async'
import Loader from '@/components/Loader'
import Toast from '@/components/Toast'
import { requestNotificationPermission, onMessageListener } from '@/lib/notificationService'
import { CookieConsent } from '@/components/CookieConsent'

const HomePage = lazy(() => import('./pages/HomePage'))
const LoginPage = lazy(() => import('./pages/LoginPage'))
const RegisterPage = lazy(() => import('./pages/RegisterPage'))
const ForgotPasswordPage = lazy(() => import('./pages/ForgotPasswordPage'))
const ResetPasswordPage = lazy(() => import('./pages/ResetPasswordPage'))
const PropertyDetailPage = lazy(() => import('./pages/PropertyDetailPage'))
const ChatPage = lazy(() => import('./pages/ChatPage'))
const UserDashboard = lazy(() => import('./pages/dashboard/UserDashboard'))
const LandlordDashboard = lazy(() => import('./pages/dashboard/LandlordDashboard'))
const PGOwnerDashboard = lazy(() => import('./pages/dashboard/PGOwnerDashboard'))
const AuthCallbackPage = lazy(() => import('./pages/AuthCallbackPage'))
const SelectRolePage = lazy(() => import('./pages/SelectRolePage'))
const ProfilePage = lazy(() => import('./pages/ProfilePage'))
const TermsPage = lazy(() => import('./pages/TermsPage'))
const PrivacyPage = lazy(() => import('./pages/PrivacyPage'))

// ── Admin Panel ──────────────────────────────────────────────────────────────
const AdminLoginPage = lazy(() => import('./admin/pages/AdminLoginPage'))
const AdminPinPage = lazy(() => import('./admin/pages/AdminPinPage'))
const AdminAuthCallbackPage = lazy(() => import('./admin/pages/AdminAuthCallbackPage'))
const AdminLayout = lazy(() => import('./admin/layouts/AdminLayout'))
const AdminDashboardPage = lazy(() => import('./admin/pages/AdminDashboardPage'))
const AdminPropertiesPage = lazy(() => import('./admin/pages/AdminPropertiesPage'))
const AdminChatsPage = lazy(() => import('./admin/pages/AdminChatsPage'))
const AdminSettingsPage = lazy(() => import('./admin/pages/AdminSettingsPage'))

export default function App() {
  const [appLoading, setAppLoading] = useState(true)
  const [loaderVisible, setLoaderVisible] = useState(true)
  const [toast, setToast] = useState(null)

  const showToast = useCallback((title, body, icon = '🔔') => {
    setToast({ title, body, icon })
    setTimeout(() => setToast(null), 5000)
  }, [])

  // App initialization — request FCM permission after brief initial load
  useEffect(() => {
    const timer = setTimeout(() => setLoaderVisible(false), 1800)
    const fcmTimer = setTimeout(() => requestNotificationPermission(), 2500)

    let unsubscribe
    const setupListener = async () => {
      try {
        const unsub = await onMessageListener((payload) => {
          const { title, body } = payload.notification || {}
          if (title) showToast(title, body)
        })
        unsubscribe = unsub
      } catch (err) {
        console.warn('[FCM] Listener setup failed:', err)
      }
    }

    setupListener()

    return () => {
      clearTimeout(timer)
      clearTimeout(fcmTimer)
      if (typeof unsubscribe === 'function') unsubscribe()
    }
  }, [showToast])

  return (
    <HelmetProvider>
      <ThemeProvider attribute="class" defaultTheme="light" enableSystem disableTransitionOnChange>
        {/* Global Logo Loader */}
        <Loader
          visible={loaderVisible}
          onHide={() => setAppLoading(false)}
        />

        {/* Foreground FCM Toast */}
        {toast && (
          <Toast
            icon={toast.icon}
            title={toast.title}
            body={toast.body}
            onClose={() => setToast(null)}
          />
        )}

        <BrowserRouter>
          <CookieConsent />
          {/* Route-level fallback loader (page transitions) */}
          <Suspense fallback={<Loader visible />}>
            <Routes>
              <Route path="/" element={<HomePage />} />
              <Route path="/login" element={<LoginPage />} />
              <Route path="/register" element={<RegisterPage />} />
              <Route path="/forgot-password" element={<ForgotPasswordPage />} />
              <Route path="/reset-password" element={<ResetPasswordPage />} />
              <Route path="/property/:id" element={<PropertyDetailPage />} />
              <Route path="/chat" element={<ChatPage />} />
              <Route path="/dashboard/user" element={<UserDashboard />} />
              <Route path="/dashboard/landlord" element={<LandlordDashboard />} />
              <Route path="/dashboard/pgowner" element={<PGOwnerDashboard />} />
              <Route path="/auth/callback" element={<AuthCallbackPage />} />
              <Route path="/select-role" element={<SelectRolePage />} />
              <Route path="/profile" element={<ProfilePage />} />
              <Route path="/terms" element={<TermsPage />} />
              <Route path="/privacy" element={<PrivacyPage />} />

              {/* ── Admin Panel routes ─────────────────────────────────── */}
              <Route path="/admin/login" element={<AdminLoginPage />} />
              <Route path="/admin/pin" element={<AdminPinPage />} />
              <Route path="/admin/auth-callback" element={<AdminAuthCallbackPage />} />
              <Route path="/admin" element={<AdminLayout />}>
                <Route index element={<AdminDashboardPage />} />
                <Route path="dashboard" element={<AdminDashboardPage />} />
                <Route path="properties" element={<AdminPropertiesPage />} />
                <Route path="chats" element={<AdminChatsPage />} />
                <Route path="settings" element={<AdminSettingsPage />} />
              </Route>
            </Routes>
          </Suspense>
        </BrowserRouter>
      </ThemeProvider>
    </HelmetProvider>
  )
}
