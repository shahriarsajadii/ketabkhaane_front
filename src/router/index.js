import { createRouter, createWebHistory } from 'vue-router'
import { useAuthStore } from '@/stores/auth'

// guestOnly: true
/*
این ویژگی مشخص می‌کند که این صفحه مخصوص کاربران مهمان است.
یعنی کاربری که قبلاً وارد سیستم شده، نباید مجدداً به صفحه Login دسترسی داشته باشد.
 */

const routes = [
  {
    path: '/',
    redirect: () => ({ name: 'dashboard' }),
  },
  { path: '/login', name: 'login', component: () => import('@/views/LoginView.vue'), meta: { layout: 'public', guestOnly: true } },

  { path: '/dashboard', name: 'dashboard', component: () => import('@/views/DashboardView.vue'), meta: { layout: 'app', requiresAuth: true } },

  { path: '/books', name: 'books', component: () => import('@/views/BooksListView.vue'), meta: { layout: 'app', requiresAuth: true } },
  { path: '/books/new', name: 'book-new', component: () => import('@/views/BookFormView.vue'), props: true, meta: { layout: 'app', requiresAuth: true } },
  { path: '/books/:id(\\d+)/edit', name: 'book-edit', component: () => import('@/views/BookFormView.vue'), props: true, meta: { layout: 'app', requiresAuth: true } },

  { path: '/authors', name: 'authors', component: () => import('@/views/AuthorsListView.vue'), meta: { layout: 'app', requiresAuth: true } },
  { path: '/authors/new', name: 'author-new', component: () => import('@/views/AuthorFormView.vue'), props: true, meta: { layout: 'app', requiresAuth: true } },
  { path: '/authors/:id(\\d+)/edit', name: 'author-edit', component: () => import('@/views/AuthorFormView.vue'), props: true, meta: { layout: 'app', requiresAuth: true } },

  { path: '/publishers', name: 'publishers', component: () => import('@/views/PublishersListView.vue'), meta: { layout: 'app', requiresAuth: true } },
  { path: '/publishers/new', name: 'publisher-new', component: () => import('@/views/PublisherFormView.vue'), props: true, meta: { layout: 'app', requiresAuth: true } },
  { path: '/publishers/:id(\\d+)/edit', name: 'publisher-edit', component: () => import('@/views/PublisherFormView.vue'), props: true, meta: { layout: 'app', requiresAuth: true } },

  { path: '/members', name: 'members', component: () => import('@/views/MembersView.vue'), meta: { layout: 'app', requiresAuth: true } },

  { path: '/categories', name: 'categories', component: () => import('@/views/CategoriesListView.vue'), meta: { layout: 'app', requiresAuth: true } },

  { path: '/:pathMatch(.*)*', name: 'not-found', component: () => import('@/views/NotFoundView.vue'), meta: { layout: 'public' } },
]

const router = createRouter({
  history: createWebHistory(),
  routes,
  scrollBehavior: (to, from, saved) => saved || { top: 0 },
})

/*
این قسمت قلب سیستم کنترل دسترسی است.

Vue Router قابلیتی به نام Navigation Guard دارد.
Navigation Guard یعنی قبل از اینکه کاربر وارد یک صفحه شود، می‌توانیم شرایطی را بررسی کنیم.

مثلاً:
- آیا کاربر وارد سیستم شده؟
- آیا اجازه دسترسی دارد؟
- آیا باید به صفحه دیگری هدایت شود؟
 */


// یعنی قبل از ورود به هر Route این تابع اجرا شود.
router.beforeEach(async (to) => {
  // Store احراز هویت را دریافت می‌کنیم.
  const auth = useAuthStore()
  await auth.init()

  // آیا این صفحه به احراز هویت نیاز دارد؟
  // آیا کاربر لاگین کرده است؟

  if (to.meta.requiresAuth && !auth.isAuthenticated) {
    return { name: 'login', query: { redirect: to.fullPath } }
  }

  if (to.meta.guestOnly && auth.isAuthenticated) {
    return { name: 'books' }
  }
})

export default router