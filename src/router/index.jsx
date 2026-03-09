import { lazy, Suspense } from 'react'
import { createBrowserRouter, Navigate } from 'react-router-dom'
import { useAuthStore } from '@/store'
import AppLayout    from '@/components/layout/AppLayout'
import AuthLayout   from '@/components/layout/AuthLayout'
import PageLoader   from '@/components/ui/PageLoader'

// Auth
const LoginPage    = lazy(() => import('@/pages/auth/LoginPage'))
const RegisterPage = lazy(() => import('@/pages/auth/RegisterPage'))
const ConfirmPage  = lazy(() => import('@/pages/auth/ConfirmPage'))

// Oferty (Blok 3)
const OffersPage      = lazy(() => import('@/pages/offers/OffersPage'))
const OfferDetailPage = lazy(() => import('@/pages/offers/OfferDetailPage'))

// Pozostałe — proste stuby do czasu implementacji
const DashboardPage = lazy(() => import('@/pages/DashboardPage'))
const MyOffersPage  = lazy(() => import('@/pages/MyOffersPage'))
const ImportPage    = lazy(() => import('@/pages/ImportPage'))
const NotesPage     = lazy(() => import('@/pages/NotesPage'))
const StatsPage     = lazy(() => import('@/pages/StatsPage'))
const ProfilePage   = lazy(() => import('@/pages/ProfilePage'))

// ── Guards ────────────────────────────────────────────────────────
export function PrivateRoute({ children }) {
  const ok = useAuthStore((s) => s.isAuthenticated)
  if (!ok) return <Navigate to="/login" replace />
  return children
}

export function GuestRoute({ children }) {
  const ok = useAuthStore((s) => s.isAuthenticated)
  if (ok) return <Navigate to="/dashboard" replace />
  return children
}

const S = ({ children }) => <Suspense fallback={<PageLoader />}>{children}</Suspense>

export const router = createBrowserRouter([
  // ── Publiczne (auth)
  {
    element: <AuthLayout />,
    children: [
      { path: '/login',    element: <GuestRoute><S><LoginPage /></S></GuestRoute> },
      { path: '/register', element: <GuestRoute><S><RegisterPage /></S></GuestRoute> },
      { path: '/confirm',  element: <S><ConfirmPage /></S> },
    ],
  },
  // ── Chronione (app)
  {
    element: <PrivateRoute><AppLayout /></PrivateRoute>,
    children: [
      { index: true,         element: <Navigate to="/dashboard" replace /> },
      { path: '/dashboard',  element: <S><DashboardPage /></S> },
      { path: '/offers',     element: <S><OffersPage /></S> },
      { path: '/offers/:id', element: <S><OfferDetailPage /></S> },
      { path: '/my-offers',  element: <S><MyOffersPage /></S> },
      { path: '/import',     element: <S><ImportPage /></S> },
      { path: '/notes',      element: <S><NotesPage /></S> },
      { path: '/stats',      element: <S><StatsPage /></S> },
      { path: '/profile',    element: <S><ProfilePage /></S> },
    ],
  },
  { path: '*', element: <Navigate to="/dashboard" replace /> },
])