import React from 'react'
import ReactDOM from 'react-dom/client'
import { RouterProvider } from 'react-router-dom'
import { router } from '@/router'
import { useAuthStore } from '@/store'
import '@/styles/globals.css'

// Przywrócenie sesji z localStorage przy starcie
useAuthStore.getState().rehydrate()

// Wylogowanie po wygaśnięciu tokena
window.addEventListener('auth:expired', () => {
  useAuthStore.getState().logout()
})

ReactDOM.createRoot(document.getElementById('root')).render(
  <React.StrictMode>
    <RouterProvider router={router} />
  </React.StrictMode>
)