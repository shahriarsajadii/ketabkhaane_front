import { defineStore } from 'pinia'

const KEY = 'theme' // 'light' | 'dark' — هم‌نام با اسکریپت داخل index.html

const prefersDark = () => !!window.matchMedia?.('(prefers-color-scheme: dark)').matches

function readSaved() {
  try {
    const v = localStorage.getItem(KEY)
    return v === 'dark' || v === 'light' ? v : null
  } catch {
    return null
  }
}

export const useThemeStore = defineStore('theme', {
  // اگر کاربر هنوز انتخابی نکرده باشد، از تنظیم سیستم‌عامل پیروی می‌کنیم
  state: () => {
    const saved = readSaved()
    return { mode: saved ?? (prefersDark() ? 'dark' : 'light'), chosen: !!saved }
  },

  getters: {
    isDark: (state) => state.mode === 'dark',
  },

  actions: {
    apply() {
      document.documentElement.classList.toggle('dark', this.isDark)
    },

    set(mode) {
      this.mode = mode
      this.chosen = true
      try { localStorage.setItem(KEY, mode) } catch { /* حالت خصوصی مرورگر */ }
      this.apply()
    },

    toggle() {
      this.set(this.isDark ? 'light' : 'dark')
    },

    /** یک‌بار در شروع برنامه */
    init() {
      this.apply()
      // تا وقتی کاربر دستی انتخاب نکرده، تغییر تم سیستم را دنبال کن
      window.matchMedia?.('(prefers-color-scheme: dark)').addEventListener('change', (e) => {
        if (this.chosen) return
        this.mode = e.matches ? 'dark' : 'light'
        this.apply()
      })
    },
  },
})
