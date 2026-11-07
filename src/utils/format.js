const FA_DIGITS = '۰۱۲۳۴۵۶۷۸۹'

/** اعداد لاتین → فارسی، بدون جداکننده‌ی هزارگان (کد کتاب، سال) */
export function toFaDigits(value) {
  if (value === null || value === undefined) return ''
  return String(value).replace(/\d/g, (d) => FA_DIGITS[d])
}

const grouped = new Intl.NumberFormat('fa-IR')
/** عدد فارسی با جداکننده‌ی هزارگان (تعداد کتاب‌ها) */
export function toFa(value) {
  if (value === null || value === undefined || value === '' || Number.isNaN(Number(value))) return ''
  return grouped.format(Number(value))
}

/** ارقام فارسی/عربی → لاتین (برای ارسال به سرور) */
export function normalizeDigits(value) {
  return String(value ?? '')
    .replace(/[۰-۹]/g, (d) => String(d.charCodeAt(0) - 0x06f0))
    .replace(/[٠-٩]/g, (d) => String(d.charCodeAt(0) - 0x0660))
}

const dateFmt = new Intl.DateTimeFormat('fa-IR-u-ca-persian', { year: 'numeric', month: 'long', day: 'numeric' })
const timeFmt = new Intl.DateTimeFormat('fa-IR', { hour: '2-digit', minute: '2-digit', hour12: false })

export const formatDate = (iso) => (iso ? dateFmt.format(new Date(iso)) : '')
export const formatTime = (iso) => (iso ? timeFmt.format(new Date(iso)) : '')

/** ۲۴ مهر ۱۴۰۳، ساعت ۱۰:۴۵ */
export function formatDateTime(iso) {
  return iso ? `${formatDate(iso)}، ساعت ${formatTime(iso)}` : ''
}

/** امروز، ۱۰:۴۵  یا  ۲۴ مهر ۱۴۰۳، ۱۰:۴۵ */
export function formatLastUpdate(iso) {
  if (!iso) return ''
  const isToday = new Date(iso).toDateString() === new Date().toDateString()
  return `${isToday ? 'امروز' : formatDate(iso)}، ${formatTime(iso)}`
}

export function formatFileSize(bytes) {
  if (bytes < 1024 * 1024) return `${toFa(Math.max(1, Math.round(bytes / 1024)))} کیلوبایت`
  return `${toFa(Math.round((bytes / 1024 / 1024) * 10) / 10)} مگابایت`
}

/** «م ا» از «مریم احمدی» */
export function initials(name) {
  return (name || '').trim().split(/\s+/).slice(0, 2).map((w) => w[0]).join(' ')
}
