import { lazy, Suspense } from 'react'
import { createBrowserRouter, Navigate } from 'react-router-dom'
import { useAuthStore } from '@/store'

import AppLayout from '@/components/layout/AppLayout'
import AuthLayout from '@/components/layout/AuthLayout'
import PageLoader from '@/components/ui/PageLoader'

const LoginPage = lazy(() => import('@/pages/auth/LoginPage'))
const RegisterPage = lazy(() => import('@/pages/auth/RegisterPage'))
const ConfirmPage = lazy(() => import('@/pages/auth/ConfirmPage'))

export function PrivateRoute({ children }) {
  const isAuthenticated = useAuthStore((s) => s.isAuthenticated)
  if (!isAuthenticated) return <Navigate to="/login" replace />
  return children
}

export function GuestRoute({ children }) {
  const isAuthenticated = useAuthStore((s) => s.isAuthenticated)
  if (isAuthenticated) return <Navigate to="/dashboard" replace />
  return children
}

const S = ({ children }) => (
  <Suspense fallback={<PageLoader />}>{children}</Suspense>
)

export const router = createBrowserRouter([
  {
    element: <AuthLayout />,
    children: [
      { path: '/login', element: <GuestRoute><S><LoginPage /></S></GuestRoute> },
      { path: '/register', element: <GuestRoute><S><RegisterPage /></S></GuestRoute> },
      { path: '/confirm', element: <S><ConfirmPage /></S> },
    ],
  },
  {
    element: <PrivateRoute><AppLayout /></PrivateRoute>,
    children: [
      { path: '/dashboard', element: <div>Dashboard</div> },
    ],
  },
])