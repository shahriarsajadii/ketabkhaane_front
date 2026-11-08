import http from './http'


// این تابع برای پاک‌سازی پارامترهای ارسالی به API استفاده می‌شود.
const clean = (params) =>
  Object.fromEntries(Object.entries(params || {}).filter(([, v]) => v !== undefined && v !== null && v !== ''))

export const booksApi = {
  list: (params) =>
    http.get('/books/', { params: clean(params) }).then((r) => ({
      items: r.data.data || [],
      pagination: r.data.pagination || null,
    })),

  stats: () => http.get('/books/stats/').then((r) => r.data.data),

  get: (id) => http.get(`/books/detail/${id}/`).then((r) => r.data.data),
  create: (payload) => http.post('/books/', payload).then((r) => r.data.data),
  update: (id, payload) => http.patch(`/books/detail/${id}/`, payload).then((r) => r.data.data),
  remove: (id) => http.delete(`/books/detail/${id}/`),
  bulkRemove: (ids) => http.delete('/books/', { data: { items: ids } }),

  uploadImage: (id, file) => {
    const fd = new FormData()
    fd.append('image', file)
    return http.post(`/books/${id}/image/`, fd)
  },
  deleteImage: (id) => http.delete(`/books/${id}/image/`),

  importExcel: (file, { skipInvalid = false } = {}) => {
    const fd = new FormData()
    fd.append('file', file)
    return http
      .post('/books/import/', fd, { params: skipInvalid ? { skip_invalid: true } : undefined })
      .then((r) => ({ message: r.data.message, data: r.data.data }))
  },

  downloadTemplate: () => http.get('/books/import/template/', { responseType: 'blob' }).then((r) => r.data),


  exportExcel: (params) =>
    http.get('/books/export/', { params: clean(params), responseType: 'blob' }).then((r) => r.data),

  // ---------- کتابخانه‌ی ملی ----------
  // type: 'shabak' | 'title'  →  [{ title, author, opac_id, publish_date, detail_url }]
  // اگر چیزی پیدا نشود سرور 404 می‌دهد؛ اینجا به لیست خالی تبدیلش می‌کنیم.
  searchOpac: ({ type, value }) =>
    http
      .post('/books/search_by_shabak/', { type, value })
      .then((r) => r.data.data || [])
      .catch((e) => {
        if (e?.response?.status === 404) return []
        throw e
      }),

  // جزئیات کامل یک کتاب از کتابخانه‌ی ملی
  getOpacBook: (opacId) =>
    http.post('/books/get_by_opac_id/', { opac_book_id: opacId }).then((r) => r.data.data),
}
