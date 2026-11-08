import http from './http'

// پارامترهای خالی/نامعتبر حذف می‌شوند تا querystring تمیز بماند
const clean = (params) =>
  Object.fromEntries(
    Object.entries(params || {}).filter(([, v]) => v !== undefined && v !== null && v !== '' && !(Array.isArray(v) && !v.length)),
  )

// همه‌ی اندپوینت‌ها یک ست فیلتر مشترک قبول می‌کنند (برای کراس‌فیلترینگِ سراسری):
// category, author, publisher, series (هرکدام چند شناسه با کاما) + year_from, year_to + is_loaned
const get = (path, params) => http.get(path, { params: clean(params) }).then((r) => r.data.data)

export const dashboardApi = {
  summary: (filters) => get('/dashboard/summary/', filters),
  booksByAuthor: (filters, limit) => get('/dashboard/books-by-author/', { ...filters, limit }),
  booksByCategory: (filters, limit) => get('/dashboard/books-by-category/', { ...filters, limit }),
  booksByPublisher: (filters, limit) => get('/dashboard/books-by-publisher/', { ...filters, limit }),
  copiesByBook: (filters, limit) => get('/dashboard/copies-by-book/', { ...filters, limit }),
  copiesByShelf: (filters) => get('/dashboard/copies-by-shelf/', filters),
  booksByYear: (filters, bucket) => get('/dashboard/books-by-year/', { ...filters, bucket }),
  series: (filters, limit, search) => get('/dashboard/series/', { ...filters, limit, search }),
}