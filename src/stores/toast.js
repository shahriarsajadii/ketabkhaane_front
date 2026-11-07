import { defineStore } from 'pinia'

let uid = 0

export const useToastStore = defineStore('toast', {
  state: () => ({ items: [] }),
  actions: {
    push(message, type = 'info', timeout = 4500) {
      const id = ++uid
      this.items.push({ id, message, type })
      if (timeout) setTimeout(() => this.dismiss(id), timeout)
    },
    dismiss(id) {
      this.items = this.items.filter((t) => t.id !== id)
    },
    success(message) { this.push(message, 'success') },
    error(message) { this.push(message, 'error', 6000) },
    warning(message) { this.push(message, 'warning', 6000) },
  },
})
