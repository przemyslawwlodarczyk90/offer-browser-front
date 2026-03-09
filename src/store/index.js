import { create } from 'zustand'

export const useAuthStore = create((set) => ({
  user: null,
  token: null,

  rehydrate: () => {
    const savedToken = localStorage.getItem('token')
    const savedUser = localStorage.getItem('user')

    set({
      token: savedToken || null,
      user: savedUser ? JSON.parse(savedUser) : null,
    })
  },

  logout: () => {
    localStorage.removeItem('token')
    localStorage.removeItem('user')

    set({
      user: null,
      token: null,
    })
  },
}))