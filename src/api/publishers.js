import http from './http'

// این تابع برای پاک‌سازی پارامترهای ارسالی به API استفاده می‌شود.
const clean = (params) =>
  Object.fromEntries(Object.entries(params || {}).filter(([, v]) => v !== undefined && v !== null && v !== ''))

export const publishersApi = {
  // لیست صفحه‌بندی‌شده؛ پارامترها: search, page, page_size, ordering
  list: (params) =>
    http.get('/publishers/', { params: clean(params) }).then((r) => ({
      items: r.data.data || [],
      pagination: r.data.pagination || null,
    })),

  get: (id) => http.get(`/publishers/detail/${id}/`).then((r) => r.data.data),
  create: (payload) => http.post('/publishers/', payload).then((r) => r.data.data),
  update: (id, payload) => http.patch(`/publishers/detail/${id}/`, payload).then((r) => r.data.data),
  remove: (id) => http.delete(`/publishers/detail/${id}/`),
  bulkRemove: (ids) => http.delete('/publishers/', { data: { items: ids } }),

  uploadImage: (id, file) => {
    const fd = new FormData()
    fd.append('image', file)
    return http.post(`/publishers/${id}/image/`, fd)
  },
  deleteImage: (id) => http.delete(`/publishers/${id}/image/`),
}
