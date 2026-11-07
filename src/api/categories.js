import http from './http'

export const categoriesApi = {
  list: () => http.get('/categories/').then((r) => r.data.data || []),
  create: (title) => http.post('/categories/', { title }).then((r) => r.data.data),
}
