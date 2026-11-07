import axios from 'axios'

/**
 * کلاینت مشترک API.
 *  - توکن‌ها در cookie ی HttpOnly هستند → withCredentials
 *  - اگر پاسخ 401 بیاید، یک‌بار با refresh توکن تمدید و درخواست تکرار می‌شود
 *    (cookie ی access بعد از ۳۰ دقیقه از مرورگر حذف می‌شود، پس هر 401 ای شانس تمدید دارد)
 */
const http = axios.create({
  baseURL: 'http://localhost:8022/api',
  withCredentials: true,
  timeout: 30000,
  headers: {Accept: 'application/json'},
})


// یو آر ال هایی که نیاز به رفرش توکمن ندارن
const AUTH_URLS = ['/users/login/', '/users/logout/', '/users/token/refresh/']

let refreshPromise = null


let onUnauthorized = () => {
}

export function setUnauthorizedHandler(fn) {
  onUnauthorized = fn
}

http.interceptors.response.use(
  // اگر درخواست موفق بود
  (response) => response,

  // اگر درخواست خطا داد
  async (error) => {
    const {response, config} = error

    // آیا این یک درخواست آتنتیکیشنی عه
    const isAuthCall = config && AUTH_URLS.some((u) => config.url?.includes(u))


    /*
    آیا خطا 401 عه
    آیا تنظیمات درخواست موجوده
    قبلا رفرش برای این درخواست ارسال نشده
    درخواست مربوط به آتنتیکیشن نیست
     */
    if (response?.status === 401
      &&
      config
      &&
      // برای جلوگیری از حلقه بی‌نهایت
      /*
      فرض کن Refresh موفق می‌شود، اما درخواست اصلی همچنان 401 برمی‌گرداند.
اگر این شرط را نداشته باشیم، درخواست مرتباً تکرار می‌شود.
       */
      !config._retried
      &&
      !isAuthCall
    ) {
      // یعنی این درخواست یک بار وارد فرآیند Refresh شده است.
      config._retried = true
      try {
        // ارسال درخواست رفرش
        // اگر refreshPromise وجود نداشته باشد، Refresh جدید ارسال کن.
        // اگر وجود داشته باشد، از همان Promise استفاده کن.
        refreshPromise =
          refreshPromise ||
          http.post('/users/token/refresh/').finally(() => {
            refreshPromise = null
          })
        // ابتدا منتظر می‌مانیم تا Refresh تمام شود.
        await refreshPromise
        // اگر موفقیت‌آمیز بود، درخواست اولیه را مجدداً ارسال می‌کنیم.
        return http(config)


      } catch {
        // اگه رفرش شکست خورد
        // یعنی احتمالاً Refresh Token هم منقضی شده یا دیگر معتبر نیست.
        // تابع onUnauthorized را اجرا می‌کنیم.
        if (!config.skipAuthRedirect) onUnauthorized()

      }
    }
    // خطا را به کدی که درخواست را ارسال کرده برمی‌گردانیم.
    return Promise.reject(error)
  },
)

export default http
