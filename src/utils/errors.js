/** اولین پیام متنیِ داخل رشته / آرایه / آبجکت تودرتو */
export function firstMessage(value) {
  if (value === null || value === undefined) return ''
  if (typeof value === 'string') return value
  if (Array.isArray(value)) {
    for (const item of value) {
      const m = firstMessage(item)
      if (m) return m
    }
    return ''
  }
  if (typeof value === 'object') return firstMessage(Object.values(value))
  return String(value)
}

/** خطای axios → { message, fields, status } مطابق قالب پاسخ DRF این پروژه */
export function parseApiError(error) {
  const res = error?.response
  if (!res) {
    return {
      message: 'ارتباط با سرور برقرار نشد. اتصال اینترنت یا اجرای سرور را بررسی کنید.',
      fields: {},
      status: 0,
    }
  }
  const data = res.data && typeof res.data === 'object' && !(res.data instanceof Blob) ? res.data : {}
  return {
    message: data.message || 'خطایی رخ داد. دوباره تلاش کنید.',
    fields: data.errors && typeof data.errors === 'object' ? data.errors : {},
    status: res.status,
  }
}
