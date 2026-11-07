import http from './http'

export const authApi = {
  login: (username, password) => http.post('/users/login/', {username, password}).then((r) => r.data.data),

  // skipAuthRedirect: برای صفحه‌های عمومی؛ 401 یعنی «وارد نشده»، نه «پرتاب به لاگین»
  me: () => http.get('/users/me/', {skipAuthRedirect: true}).then((r) => r.data.data),

  logout: () => http.post('/users/logout/'),
}
