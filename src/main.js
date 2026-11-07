import { createApp } from 'vue'
import { createPinia } from 'pinia'

import '@fontsource/vazirmatn/400.css'
import '@fontsource/vazirmatn/500.css'
import '@fontsource/vazirmatn/700.css'
import './styles/tokens.css'
import './styles/base.css'

import App from './App.vue'
import router from './router'
import { setUnauthorizedHandler } from './api/http'
import { useAuthStore } from './stores/auth'

const app = createApp(App)
app.use(createPinia())
app.use(router)

// refresh هم شکست خورد → کاربر دیگر وارد نیست
setUnauthorizedHandler(() => {
  useAuthStore().clear()
  const route = router.currentRoute.value
  if (route.meta.requiresAuth) {
    router.replace({ name: 'login', query: { redirect: route.fullPath } })
  }
})

app.mount('#app')
