import http from './http'

export const categoriesApi = {
  // دسته‌بندی‌ها همیشه یکجا برمی‌گردند (pagination خاموش است، برای دراپ‌داون‌ها)
  list: (params) => http.get('/categories/', { params }).then((r) => r.data.data || []),

  get: (id) => http.get(`/categories/detail/${id}/`).then((r) => r.data.data),
  create: (title) => http.post('/categories/', { title }).then((r) => r.data.data),
  update: (id, title) => http.patch(`/categories/detail/${id}/`, { title }).then((r) => r.data.data),
  remove: (id) => http.delete(`/categories/detail/${id}/`),
  bulkRemove: (ids) => http.delete('/categories/', { data: { items: ids } }),
}