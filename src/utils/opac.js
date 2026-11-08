import { normalizeDigits } from '@/utils/format'

/**
 * کمکی‌های کتابخانه‌ی ملی: تبدیل متن‌های خامِ فهرست‌نویسی به مقدارهای فرم.
 */

/** یکسان‌سازی حروف عربی/فارسی، نیم‌فاصله و فاصله‌های اضافی */
export function normalizeText(value) {
  return String(value ?? '')
    .replace(/[\u200e\u200f\u202a-\u202e]/g, '')
    .replace(/ي/g, 'ی')
    .replace(/ك/g, 'ک')
    .replace(/\u200c/g, ' ')
    .replace(/\s+/g, ' ')
    .trim()
}

/** برای مقایسه‌ی نام‌ها: همان normalizeText + حروف کوچک + حذف نشانه‌گذاری */
export function nameKey(value) {
  return normalizeText(value).toLowerCase().replace(/[.,،؛;:\-–—]/g, ' ').replace(/\s+/g, ' ').trim()
}

/** «۱۷۰ ص.: مصور» → 170  |  «[۱۲]، ۲۱۰ ص.» → 210 */
export function parsePageCount(physical) {
  const text = normalizeDigits(normalizeText(physical))
  const m = text.match(/(\d+)\s*ص/)
  return m ? Number(m[1]) : null
}

/** «بوکان : زانکو، ۱۳۹۹.» → { publisher: 'زانکو', year: 1399 } */
export function parsePublication(publication) {
  const text = normalizeDigits(normalizeText(publication)).replace(/[.\s]+$/, '')
  if (!text) return { publisher: '', year: null }

  const year = (text.match(/(1[2-5]\d{2}|20\d{2})(?!\d)/) || [])[1] || null

  // بخش قبل از آخرین «،» = «شهر : ناشر»
  const lastComma = text.lastIndexOf('،')
  const head = lastComma >= 0 ? text.slice(0, lastComma) : text.replace(/\d+/g, '')
  const publisher = head.split(':').pop().replace(/[\[\]]/g, '').trim()

  return { publisher, year: year ? Number(year) : null }
}

/** «ناصر کهریزه، علی رضایی» → ['ناصر کهریزه', 'علی رضایی'] */
export function splitAuthors(author) {
  const seen = new Set()
  return normalizeText(author)
    .split(/[،;؛]/)
    .map((x) => x.replace(/[.\s]+$/, '').trim())
    .filter((x) => {
      const k = nameKey(x)
      if (!k || seen.has(k)) return false
      seen.add(k)
      return true
    })
}

/**
 * موضوع‌ها در فهرست ملی «فارسی + معادل انگلیسی» پشت سر هم می‌آیند:
 *   «سه تار -- آموزش Setar (...) -- Instruction and study تار -- آموزش Tar ...»
 * هر موضوع جدید جایی شروع می‌شود که بعد از متن لاتین دوباره حروف فارسی بیاید.
 * فقط بخش فارسی هر موضوع نگه داشته می‌شود.
 */
export function splitSubjects(subjects) {
  const text = normalizeText(subjects)
  if (!text) return []
  const seen = new Set()
  const result = []
  for (const part of text.split(/(?<=[A-Za-z0-9)\].,])\s+(?=[\u0600-\u06FF])/)) {
    const latin = part.search(/[A-Za-z]/)
    const persian = (latin >= 0 ? part.slice(0, latin) : part).replace(/[\s\-–—]+$/, '').trim().slice(0, 100)
    const k = nameKey(persian)
    if (persian && !seen.has(k)) {
      seen.add(k)
      result.push(persian)
    }
  }
  return result
}

/** خروجی جزئیات کتابخانه‌ی ملی → مقدارهای آماده‌ی فرم */
export function mapOpacDetail(d) {
  const { publisher, year } = parsePublication(d.publication)
  return {
    title: normalizeText(d.title),
    authors: splitAuthors(d.author),
    publisher,
    publish_year: year,
    page_count: parsePageCount(d.physical_description),
    isbn: normalizeDigits(normalizeText(d.isbn)),
    // موضوع: یک فیلد متنی جداگانه و جدا از دسته‌بندی (که کاربر خودش انتخاب می‌کند)
    subject: splitSubjects(d.subjects).join('، '),
    dewey_classification: normalizeDigits(normalizeText(d.dewey)),
    national_bibliography_number: normalizeDigits(normalizeText(d.national_bibliography_number)),
  }
}

/**
 * نام‌های مشابه از بین گزینه‌های موجود.
 * امتیاز = تعداد کلمه‌های مشترک (نام‌ها ممکن است جابه‌جا نوشته شده باشند: «ناصر کهریزه» ↔ «کهریزه، ناصر»).
 * خروجی: [{ item, score, exact }] مرتب از بیشترین شباهت.
 */
export function rankSimilar(name, candidates, getLabel = (x) => x.name, limit = 5) {
  const key = nameKey(name)
  const tokens = key.split(' ').filter((t) => t.length > 1)
  if (!key) return []

  const sorted = (s) => s.split(' ').sort().join(' ')
  const scored = []
  for (const item of candidates) {
    const label = nameKey(getLabel(item))
    if (!label) continue
    const exact = label === key || sorted(label) === sorted(key)
    const shared = tokens.filter((t) => label.includes(t)).length
    const score = exact ? 100 : shared
    if (score > 0) scored.push({ item, score, exact })
  }
  return scored.sort((a, b) => b.score - a.score).slice(0, limit)
}

/** کلمه‌های جستجو برای سرور: بلندترین‌ها اول، حداکثر ۳ تا */
export function searchTokens(name) {
  const words = nameKey(name).split(' ').filter((t) => t.length > 1)
  const uniq = [...new Set(words)].sort((a, b) => b.length - a.length).slice(0, 3)
  return uniq.length ? uniq : [nameKey(name)].filter(Boolean)
}