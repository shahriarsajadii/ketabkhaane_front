import { defineStore } from 'pinia'

/**
 * فیلتر سراسریِ داشبورد (مثل Slicerهای Power BI).
 * با کلیک روی یک ستونِ نمودار یا یک کارت، شناسه‌ی مربوطه این‌جا toggle می‌شود؛
 * همه‌ی کارت‌ها و نمودارهای دیگر با این فیلترها دوباره از سرور خوانده می‌شوند (DashboardView.vue).
 */
export const useDashboardFiltersStore = defineStore('dashboardFilters', {
  state: () => ({
    categories: [],   // [id]
    authors: [],      // [id]
    publishers: [],   // [id]
    series: [],       // [id]
    yearFrom: null,
    yearTo: null,
    isLoaned: null,   // null = فرقی نمی‌کند | true = فقط امانت‌داده‌شده | false = فقط موجود
  }),

  getters: {
    // پارامترهای آماده‌ی ارسال به api/dashboard.js
    params(state) {
      const p = {}
      if (state.categories.length) p.category = state.categories.join(',')
      if (state.authors.length) p.author = state.authors.join(',')
      if (state.publishers.length) p.publisher = state.publishers.join(',')
      if (state.series.length) p.series = state.series.join(',')
      if (state.yearFrom !== null) p.year_from = state.yearFrom
      if (state.yearTo !== null) p.year_to = state.yearTo
      if (state.isLoaned !== null) p.is_loaned = state.isLoaned
      return p
    },

    activeCount(state) {
      return (
        state.categories.length +
        state.authors.length +
        state.publishers.length +
        state.series.length +
        (state.yearFrom !== null || state.yearTo !== null ? 1 : 0) +
        (state.isLoaned !== null ? 1 : 0)
      )
    },

    hasFilters() {
      return this.activeCount > 0
    },
  },

  actions: {
    _toggle(listKey, id) {
      const list = this[listKey]
      this[listKey] = list.includes(id) ? list.filter((x) => x !== id) : [...list, id]
    },
    toggleCategory(id) { this._toggle('categories', id) },
    toggleAuthor(id) { this._toggle('authors', id) },
    togglePublisher(id) { this._toggle('publishers', id) },
    toggleSeries(id) { this._toggle('series', id) },
    // برای چیپ‌های فیلتر فعال در FilterBar: حذف با دانستن فقط نام کلید (categories/authors/...)
    toggleByKey(key, id) { this._toggle(key, id) },

    setYearRange(from, to) {
      this.yearFrom = from
      this.yearTo = to
    },
    // کلیک روی یک میله‌ی سال/دهه: اگر همان بازه از قبل فعال بود، پاک می‌شود (toggle)
    toggleYearRange(from, to) {
      if (this.yearFrom === from && this.yearTo === to) this.setYearRange(null, null)
      else this.setYearRange(from, to)
    },

    // کلیک روی کارت «امانت‌داده‌شده» یا «موجود»: true → false → null → true ...
    toggleLoaned(value) {
      this.isLoaned = this.isLoaned === value ? null : value
    },

    clearAll() {
      this.categories = []
      this.authors = []
      this.publishers = []
      this.series = []
      this.yearFrom = null
      this.yearTo = null
      this.isLoaned = null
    },
  },
})