import http from './http'

// این تابع برای پاک‌سازی پارامترهای ارسالی به API استفاده می‌شود.
const clean = (params) =>
  Object.fromEntries(Object.entries(params || {}).filter(([, v]) => v !== undefined && v !== null && v !== ''))

export const authorsApi = {
  // لیست صفحه‌بندی‌شده؛ پارامترها: search, page, page_size, ordering
  list: (params) =>
    http.get('/authors/', { params: clean(params) }).then((r) => ({
      items: r.data.data || [],
      pagination: r.data.pagination || null,
    })),

  get: (id) => http.get(`/authors/detail/${id}/`).then((r) => r.data.data),
  create: (payload) => http.post('/authors/', payload).then((r) => r.data.data),
  update: (id, payload) => http.patch(`/authors/detail/${id}/`, payload).then((r) => r.data.data),
  remove: (id) => http.delete(`/authors/detail/${id}/`),
  bulkRemove: (ids) => http.delete('/authors/', { data: { items: ids } }),

  uploadImage: (id, file) => {
    const fd = new FormData()
    fd.append('image', file)
    return http.post(`/authors/${id}/image/`, fd)
  },
  deleteImage: (id) => http.delete(`/authors/${id}/image/`),
}
