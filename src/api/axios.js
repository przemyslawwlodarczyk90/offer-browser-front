import axios from 'axios'

const api = axios.create({
  baseURL: '/api',
  timeout: 15000,
  headers: { 'Content-Type': 'application/json' },
})

// Dołącz token JWT do każdego zapytania
api.interceptors.request.use((config) => {
  const token = localStorage.getItem('jwt_token')
  if (token) {
    config.headers.Authorization = `Bearer ${token}`
  }
  return config
})

// Obsługa odpowiedzi
api.interceptors.response.use(
  (res) => res,
  (err) => {
    const status = err.response?.status

    if (status === 401) {
      window.dispatchEvent(new Event('auth:expired'))
    }

    // Normalizuj błąd — wyciągnij message z backendu
    const message =
      err.response?.data?.message ??
      err.response?.data?.error ??
      err.message ??
      'Nieznany błąd'

    return Promise.reject({ ...err, message, status })
  }
)

export default api