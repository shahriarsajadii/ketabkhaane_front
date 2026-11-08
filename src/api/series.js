import http from './http'

// مجموعه‌ی کتاب‌ها (مثلاً «لغت‌نامه دهخدا» که از جلد ۱ تا ۲۰ دارد)
export const seriesApi = {
  // یکجا برمی‌گردد (pagination خاموش است، برای دراپ‌داون فرم کتاب)
  list: (params) => http.get('/books/series/', { params }).then((r) => ({ items: r.data.data || [] })),

  get: (id) => http.get(`/books/series/detail/${id}/`).then((r) => r.data.data),
  create: (payload) => http.post('/books/series/', payload).then((r) => r.data.data),
  update: (id, payload) => http.patch(`/books/series/detail/${id}/`, payload).then((r) => r.data.data),
  remove: (id) => http.delete(`/books/series/detail/${id}/`),
  bulkRemove: (ids) => http.delete('/books/series/', { data: { items: ids } }),
}