import { defineStore } from 'pinia'
import { authApi } from '@/api/auth'
import { initials } from '@/utils/format'

export const useAuthStore = defineStore('auth', {
  state: () => ({ user: null, ready: false }),

  getters: {
    isAuthenticated: (state) => !!state.user,
    isManager: (state) => !!state.user?.is_staff,
    displayName: (state) => state.user?.name || state.user?.username || '',
    initials: (state) => initials(state.user?.name || state.user?.username || ''),
  },

  actions: {
    /** یک‌بار در شروع برنامه: ببین cookie ی معتبر داریم یا نه */
    async init() {
      if (this.ready) return
      try {
        this.user = await authApi.me()
      } catch {
        this.user = null
      } finally {
        this.ready = true
      }
    },

    async login(username, password) {
      this.user = await authApi.login(username, password)
      this.ready = true
    },

    async logout() {
      try {
        await authApi.logout()
      } catch {
        /* در هر صورت وضعیت کلاینت پاک می‌شود */
      }
      this.clear()
    },

    clear() {
      this.user = null
    },
  },
})
