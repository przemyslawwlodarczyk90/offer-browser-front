import { create } from 'zustand'
import { persist } from 'zustand/middleware'

const TOKEN_KEY = 'jwt_token'
const USER_KEY = 'user_data'

export function decodeJwtPayload(token) {
  try {
    const base64 = token.split('.')[1].replace(/-/g, '+').replace(/_/g, '/')
    return JSON.parse(atob(base64))
  } catch {
    return null
  }
}

export function isTokenExpired(token) {
  const payload = decodeJwtPayload(token)
  if (!payload?.exp) return true
  return payload.exp * 1000 < Date.now() + 10000
}

export function getTokenExpiresAt(token) {
  const payload = decodeJwtPayload(token)
  if (!payload?.exp) return null
  return new Date(payload.exp * 1000)
}

export const useAuthStore = create(
  persist(
    (set, get) => ({
      token: null,
      user: null,
      isAuthenticated: false,

      setAuth: (token, user) => {
        localStorage.setItem(TOKEN_KEY, token)
        localStorage.setItem(USER_KEY, JSON.stringify(user))
        set({ token, user, isAuthenticated: true })
      },

      logout: () => {
        localStorage.removeItem(TOKEN_KEY)
        localStorage.removeItem(USER_KEY)
        set({ token: null, user: null, isAuthenticated: false })
      },

      updateUser: (updates) =>
        set((state) => ({
          user: state.user ? { ...state.user, ...updates } : null,
        })),

      rehydrate: () => {
        const token = localStorage.getItem(TOKEN_KEY)
        const userRaw = localStorage.getItem(USER_KEY)

        if (token && !isTokenExpired(token) && userRaw) {
          try {
            const user = JSON.parse(userRaw)
            set({ token, user, isAuthenticated: true })
          } catch {
            get().logout()
          }
        } else {
          localStorage.removeItem(TOKEN_KEY)
          localStorage.removeItem(USER_KEY)
          set({ token: null, user: null, isAuthenticated: false })
        }
      },

      checkExpiry: () => {
        const { token } = get()
        if (token && isTokenExpired(token)) {
          get().logout()
          return false
        }
        return true
      },

      getExpiresAt: () => {
        const { token } = get()
        return token ? getTokenExpiresAt(token) : null
      },
    }),
    {
      name: 'ob-auth',
      partialize: (state) => ({
        token: state.token,
        user: state.user,
        isAuthenticated: state.isAuthenticated,
      }),
    }
  )
)

let toastId = 0

export const useUIStore = create((set, get) => ({
  toasts: [],
  sidebarOpen: true,

  addToast: (message, type = 'info', duration = 4000) => {
    const id = ++toastId
    set((state) => ({
      toasts: [...state.toasts, { id, message, type, duration }],
    }))
    if (duration > 0) setTimeout(() => get().removeToast(id), duration)
    return id
  },

  removeToast: (id) =>
    set((state) => ({
      toasts: state.toasts.filter((t) => t.id !== id),
    })),

  toggleSidebar: () =>
    set((state) => ({ sidebarOpen: !state.sidebarOpen })),

  setSidebarOpen: (v) => set({ sidebarOpen: v }),
}))

export const toast = {
  success: (msg, d) => useUIStore.getState().addToast(msg, 'success', d),
  error: (msg, d) => useUIStore.getState().addToast(msg, 'error', d),
  info: (msg, d) => useUIStore.getState().addToast(msg, 'info', d),
  warn: (msg, d) => useUIStore.getState().addToast(msg, 'warn', d),
}