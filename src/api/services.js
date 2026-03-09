import api from './axios'

// ── Auth ──────────────────────────────────────────────────────────
export const authApi = {
  register: (data)  => api.post('/auth/register', data),
  login:    (data)  => api.post('/auth/login', data),
  updateProfile:    (data)  => api.put('/auth/update', data),
  changePassword:   (data)  => api.post('/auth/change-password', data),
  confirmRegistration: (token) =>
    api.get('/v1/registration/confirm', { params: { token } }),
}

// ── Offers ────────────────────────────────────────────────────────
export const offersApi = {
  getAll:   ()           => api.get('/offers'),
  getById:  (id)         => api.get(`/offers/${id}`),
  create:   (data)       => api.post('/offers', data),
  update:   (id, data)   => api.put(`/offers/${id}`, data),
  delete:   (id)         => api.delete(`/offers/${id}`),
  markDuplicateById: (id) => api.post(`/offers/${id}/mark-duplicate`),
}

// ── User Offers ───────────────────────────────────────────────────
export const userOffersApi = {
  getNotApplied: (userId) =>
    api.get('/user-offers/not-applied', { headers: { userId } }),
  getApplied: (userId) =>
    api.get('/user-offers/applied', { headers: { userId } }),
  applyToOffer: (userId, offerId) =>
    api.post(`/user-offers/${offerId}/apply`, null, { headers: { userId } }),
}

// ── Application Notes ─────────────────────────────────────────────
export const notesApi = {
  getAll:              (userId) => api.get('/application-notes', { params: { userId } }),
  getCompaniesWithDates:(userId) => api.get('/application-notes/companies-with-dates', { params: { userId } }),
  createExternal: (userId, companyName, offerUrl) =>
    api.post('/application-notes/external', null, { params: { userId, companyName, offerUrl } }),
}

// ── Statistics ────────────────────────────────────────────────────
export const statsApi = {
  getTotalOffers:      () => api.get('/statistics/total-offers'),
  getLevelDistribution:() => api.get('/statistics/level-distribution'),
  getCityDistribution: () => api.get('/statistics/city-distribution'),
}

// ── Import ────────────────────────────────────────────────────────
export const importApi = {
  runScript:       ()     => api.get('/python-script/run'),
  importFromJson:  (data) => api.post('/python-script/import', data),
  importFromUrl:   (url)  => api.post('/python-script/import-from-url', null, { params: { url } }),
}