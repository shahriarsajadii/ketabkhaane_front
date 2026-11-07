import http from './http'

const clean = (params) =>
  Object.fromEntries(Object.entries(params || {}).filter(([, v]) => v !== undefined && v !== null && v !== ''))

export const usersApi = {
  list: (params) =>
    http.get('/users/', { params: clean(params) }).then((r) => ({
      items: r.data.data || [],
      pagination: r.data.pagination || null,
    })),

  get: (id) => http.get(`/users/detail/${id}/`).then((r) => r.data.data),
  create: (payload) => http.post('/users/', payload).then((r) => r.data.data),
  update: (id, payload) => http.patch(`/users/detail/${id}/`, payload).then((r) => r.data.data),
  remove: (id) => http.delete(`/users/detail/${id}/`),
}
