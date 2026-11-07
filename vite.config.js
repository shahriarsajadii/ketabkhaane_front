import { fileURLToPath, URL } from 'node:url'
import { defineConfig } from 'vite'
import vue from '@vitejs/plugin-vue'
import tailwindcss from "@tailwindcss/vite";

// آدرس Django در حالت توسعه. /api و /media از طریق پروکسی می‌روند
// تا فرانت و بک «هم‌مبدا» باشند و cookie های لاگین بدون دردسر کار کنند.
const backend = process.env.BACKEND_URL || 'http://127.0.0.1:8000'

export default defineConfig({
  plugins: [vue(),tailwindcss(),],
  resolve: {
    alias: { '@': fileURLToPath(new URL('./src', import.meta.url)) },
  },
  server: {
    port: 5173,
    proxy: {
      '/api': backend,
      '/media': backend,
    },
  },
})
