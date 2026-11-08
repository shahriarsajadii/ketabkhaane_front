<script setup>
import { computed, nextTick, onBeforeUnmount, reactive, ref, watch } from 'vue'
import { useRoute, useRouter } from 'vue-router'
import { ArrowRight, Check, Info, Library } from 'lucide-vue-next'
import PageHeader from '@/components/layout/PageHeader.vue'
import BaseButton from '@/components/ui/BaseButton.vue'
import BaseCard from '@/components/ui/BaseCard.vue'
import BaseField from '@/components/ui/BaseField.vue'
import BaseInput from '@/components/ui/BaseInput.vue'
import BaseSpinner from '@/components/ui/BaseSpinner.vue'
import BaseTextarea from '@/components/ui/BaseTextarea.vue'
import CategoryMultiSelect from '@/components/books/CategoryMultiSelect.vue'
import CopiesEditor from '@/components/books/CopiesEditor.vue'
import SearchableSelect from '@/components/ui/SearchableSelect.vue'
import ImageUploader from '@/components/books/ImageUploader.vue'
import NewEntityHints from '@/components/books/NewEntityHints.vue'
import OpacSearchModal from '@/components/books/OpacSearchModal.vue'
import { booksApi } from '@/api/books'
import { authorsApi } from '@/api/authors'
import { categoriesApi } from '@/api/categories'
import { publishersApi } from '@/api/publishers'
import { seriesApi } from '@/api/series'
import { IMAGE_MAX_MB, MAX_COPIES_UI } from '@/config/app'
import { useToastStore } from '@/stores/toast'
import { firstMessage, parseApiError } from '@/utils/errors'
import { formatDateTime, normalizeDigits, toFa, toFaDigits } from '@/utils/format'
import { mapOpacDetail } from '@/utils/opac'

const props = defineProps({ id: { type: String, default: null } })

const route = useRoute()
const router = useRouter()
const toast = useToastStore()

const isEdit = computed(() => !!props.id)
const loading = ref(false)
const saving = ref(false)

const emptyForm = () => ({
  title: '', translator: '', publish_year: '', isbn: '', page_count: '', note: '',
  print_series: '', print_series_date: '', first_print_date: '', circulation: '',
  dewey_classification: '', national_bibliography_number: '',
  subject: '',        // موضوع: از کتابخانه‌ی ملی پر می‌شود، فیلد متنی و جدا از دسته‌بندی
  volume_number: '',  // شماره جلد (برای کتاب‌هایی که بخشی از یک مجموعه‌اند)
})
const form = reactive(emptyForm())
const categoryIds = ref([])
const authors = ref([])      // [{ id, name }]
const publisher = ref(null)  // { id, name } | null
const series = ref(null)     // { id, name } | null — مجموعه (مثلاً «دهخدا»)
const categoryOptions = ref([])

// نام‌های جدید از کتابخانه‌ی ملی: هنوز ذخیره نشده‌اند و همراه ثبت کتاب در دیتابیس ساخته می‌شوند
const newAuthors = ref([])      // [string]
const newPublisher = ref('')    // string
const newPublisherNames = computed(() => (newPublisher.value ? [newPublisher.value] : []))
const showOpac = ref(false)
const emptyCopy = () => ({ address: '', is_loaned: false, loaned_to: '' })
const copies = ref([emptyCopy()]) // هر نسخه: { address, is_loaned, loaned_to }
const errors = reactive({})
const addressErrors = ref({})
const loanErrors = ref({})
const loaded = ref(null) // کتاب بارگذاری‌شده (حالت ویرایش)

const image = reactive({ url: null, file: null, preview: null, remove: false, error: '' })
const imageSrc = computed(() => image.preview || (image.remove ? null : image.url))

// لیست قابل‌جستجوی ناشر/نویسنده (سمت سرور) + ساخت درجا
const fetchAuthors = (params) => authorsApi.list(params)
const fetchPublishers = (params) => publishersApi.list(params)
const createAuthor = (name) => authorsApi.create({ name })
const createPublisher = (name) => publishersApi.create({ name })
// مجموعه (مثلاً «دهخدا»): لیست کوچک است، جستجو سمت کلاینت انجام می‌شود
async function fetchSeries({ search = '' } = {}) {
  const res = await seriesApi.list()
  let items = res.items.map((s) => ({ id: s.id, name: s.title }))
  const q = search.trim().toLowerCase()
  if (q) items = items.filter((s) => s.name.toLowerCase().includes(q))
  return { items }
}
async function createSeries(name) {
  const s = await seriesApi.create({ title: name })
  return { id: s.id, name: s.title }
}
// دسته‌بندی‌ها از قبل کامل بارگذاری شده‌اند؛ برای پیشنهادِ «مشابه» از همان‌ها استفاده می‌کنیم

// ---------- init ----------
function resetState() {
  Object.assign(form, emptyForm())
  categoryIds.value = []
  authors.value = []
  publisher.value = null
  series.value = null
  newAuthors.value = []
  newPublisher.value = ''
  copies.value = [emptyCopy()]
  clearErrors()
  loaded.value = null
  revokePreview()
  Object.assign(image, { url: null, file: null, preview: null, remove: false, error: '' })
}

async function loadCategories() {
  try {
    categoryOptions.value = await categoriesApi.list()
  } catch {
    toast.error('دریافت دسته‌بندی‌ها ناموفق بود.')
  }
}

function fill(book) {
  loaded.value = book
  form.title = book.title || ''
  form.translator = book.translator || ''
  form.publish_year = book.publish_year ? String(book.publish_year) : ''
  form.isbn = book.isbn || ''
  form.page_count = book.page_count ? String(book.page_count) : ''
  form.note = book.note || ''
  form.print_series = book.print_series ? String(book.print_series) : ''
  form.print_series_date = book.print_series_date || ''
  form.first_print_date = book.first_print_date || ''
  form.circulation = book.circulation ? String(book.circulation) : ''
  form.dewey_classification = book.dewey_classification || ''
  form.national_bibliography_number = book.national_bibliography_number || ''
  form.subject = book.subject || ''
  form.volume_number = book.volume_number ? String(book.volume_number) : ''
  authors.value = book.authors ? [...book.authors] : []
  publisher.value = book.publisher || null
  series.value = book.series ? { id: book.series.id, name: book.series.title } : null
  categoryIds.value = (book.categories || []).map((c) => c.id)
  copies.value = book.copies?.length
      ? book.copies.map((c) => ({ address: c.address, is_loaned: !!c.is_loaned, loaned_to: c.loaned_to || '' }))
      : book.addresses?.length
          ? book.addresses.map((a) => ({ address: a, is_loaned: false, loaned_to: '' }))
          : [emptyCopy()]
  image.url = book.image || null
}

async function init() {
  resetState()
  loading.value = true
  try {
    if (isEdit.value) {
      const [book] = await Promise.all([booksApi.get(props.id), loadCategories()])
      fill(book)
    } else {
      await loadCategories()
      if (route.query.source === 'nlai') {
        showOpac.value = true
        router.replace({ query: {} }) // با refresh دوباره باز نشود
      }
    }
  } catch (e) {
    const err = parseApiError(e)
    toast.error(err.status === 404 ? 'کتاب موردنظر پیدا نشد.' : err.message)
    router.replace({ name: 'books' })
  } finally {
    loading.value = false
  }
}
watch(() => props.id, init, { immediate: true })

// ---------- کتابخانه‌ی ملی ----------
function applyOpac(detail) {
  const d = mapOpacDetail(detail)
  clearErrors()

  if (d.title) form.title = d.title
  if (d.isbn) form.isbn = d.isbn
  if (d.publish_year) form.publish_year = String(d.publish_year)
  if (d.page_count) form.page_count = String(d.page_count)
  if (d.dewey_classification) form.dewey_classification = d.dewey_classification
  if (d.national_bibliography_number) form.national_bibliography_number = d.national_bibliography_number
  // موضوع: فیلد متنی و جدا از دسته‌بندی؛ همان‌جا ذخیره می‌شود (نیازی به ساخت موجودیت جدید نیست)
  if (d.subject) form.subject = d.subject

  // نویسنده / ناشر: فقط پیش‌نویس می‌شوند (ذخیره نمی‌شوند) و NewEntityHints مشابه‌هایشان را پیدا می‌کند
  if (d.authors.length) {
    authors.value = []
    newAuthors.value = d.authors
  }
  if (d.publisher) {
    publisher.value = null
    newPublisher.value = d.publisher
  }
  // دسته‌بندی را کتابخانه‌ی ملی پر نمی‌کند؛ دسته‌بندی را خود کاربر از لیست بالا انتخاب می‌کند

  toast.success('اطلاعات از کتابخانه ملی دریافت شد. نویسنده و ناشرِ جدید پس از ثبت کتاب ذخیره می‌شوند.')
}

const dropName = (list, name) => list.value.filter((n) => n !== name)

function pickAuthor(name, item) {
  newAuthors.value = dropName(newAuthors, name)
  if (!authors.value.some((a) => a.id === item.id)) authors.value = [...authors.value, { id: item.id, name: item.name }]
}
const removeAuthor = (name) => { newAuthors.value = dropName(newAuthors, name) }

function pickPublisher(name, item) {
  newPublisher.value = ''
  publisher.value = { id: item.id, name: item.name }
}
const removePublisher = () => { newPublisher.value = '' }
// اگر کاربر خودش ناشری انتخاب کرد، نام پیش‌نویسِ ناشر دیگر لازم نیست
watch(publisher, (value) => { if (value) newPublisher.value = '' })

// ---------- image ----------
function revokePreview() {
  if (image.preview) URL.revokeObjectURL(image.preview)
}
onBeforeUnmount(revokePreview)

function onImageSelect(file) {
  image.error = ''
  if (!['image/png', 'image/jpeg'].includes(file.type)) {
    image.error = 'فقط تصویر PNG یا JPG پذیرفته می‌شود.'
    return
  }
  if (file.size > IMAGE_MAX_MB * 1024 * 1024) {
    image.error = `حجم تصویر نباید بیشتر از ${toFa(IMAGE_MAX_MB)} مگابایت باشد.`
    return
  }
  revokePreview()
  image.file = file
  image.preview = URL.createObjectURL(file)
  image.remove = false
}
function onImageRemove() {
  revokePreview()
  image.file = null
  image.preview = null
  image.remove = !!image.url
  image.error = ''
}

// ---------- validation ----------
function clearErrors() {
  Object.keys(errors).forEach((k) => delete errors[k])
  addressErrors.value = {}
  loanErrors.value = {}
}

function validate() {
  clearErrors()
  if (!form.title.trim()) errors.title = 'عنوان کتاب الزامی است.'
  if (!authors.value.length && !newAuthors.value.length) errors.authors = 'حداقل یک نویسنده انتخاب کنید.'

  const year = Number(normalizeDigits(form.publish_year))
  if (form.publish_year && (year < 1 || year > 2100)) errors.publish_year = 'سال انتشار معتبر نیست.'
  const printSeries = Number(normalizeDigits(form.print_series))
  if (form.print_series && (printSeries < 1 || printSeries > 32767)) errors.print_series = 'سری چاپ معتبر نیست.'
  const pageCount = Number(normalizeDigits(form.page_count))
  if (form.page_count && (pageCount < 1 || pageCount > 100000)) errors.page_count = 'تعداد صفحه معتبر نیست.'
  const circulation = Number(normalizeDigits(form.circulation))
  if (form.circulation && (circulation < 1 || circulation > 2147483647)) errors.circulation = 'شمارگان معتبر نیست.'
  const volumeNumber = Number(normalizeDigits(form.volume_number))
  if (form.volume_number && (volumeNumber < 1 || volumeNumber > 100000)) errors.volume_number = 'شماره جلد معتبر نیست.'

  const missingAddress = {}
  const missingLoan = {}
  copies.value.forEach((c, i) => {
    if (!/^\d{2}-\d{2}$/.test((c.address || '').trim())) missingAddress[i] = `قفسه و ردیف نسخه ${toFa(i + 1)} را انتخاب کنید.`
    if (c.is_loaned && !(c.loaned_to || '').trim()) missingLoan[i] = 'نام امانت‌گیرنده را وارد کنید.'
  })
  addressErrors.value = missingAddress
  loanErrors.value = missingLoan

  return !Object.keys(errors).length && !Object.keys(missingAddress).length && !Object.keys(missingLoan).length
}

function applyServerErrors(fields) {
  clearErrors()
  for (const [key, value] of Object.entries(fields)) {
    if ((key === 'addresses' || key === 'copies') && value && !Array.isArray(value) && typeof value === 'object') {
      const map = {}
      for (const [i, v] of Object.entries(value)) map[i] = firstMessage(v)
      addressErrors.value = map
    } else {
      errors[key] = firstMessage(value)
    }
  }
}

function scrollToFirstError() {
  nextTick(() => {
    document.querySelector('.has-error, .is-invalid, .list-error')?.scrollIntoView({ behavior: 'smooth', block: 'center' })
  })
}

// ---------- submit ----------
function buildPayload() {
  const num = (v) => (v ? Number(normalizeDigits(v)) : null)
  return {
    title: form.title.trim(),
    authors: authors.value.map((a) => a.id),
    translator: form.translator.trim(),
    publisher: publisher.value ? publisher.value.id : null,
    publish_year: num(form.publish_year),
    isbn: form.isbn.trim(),
    page_count: num(form.page_count),
    note: form.note.trim(),
    subject: form.subject.trim(),
    series: series.value ? series.value.id : null,
    volume_number: num(form.volume_number),
    print_series: num(form.print_series),
    print_series_date: form.print_series_date.trim(),
    first_print_date: form.first_print_date.trim(),
    circulation: num(form.circulation),
    dewey_classification: form.dewey_classification.trim(),
    national_bibliography_number: form.national_bibliography_number.trim(),
    categories: categoryIds.value,
    // نام‌های جدید؛ سرور همزمان با ساخت کتاب، نویسنده/ناشر جدید را هم می‌سازد
    new_authors: newAuthors.value,
    new_publisher: publisher.value ? '' : newPublisher.value,
    copies: copies.value.map((c) => ({
      address: c.address.trim(),
      is_loaned: !!c.is_loaned,
      loaned_to: c.is_loaned ? c.loaned_to.trim() : '',
    })),
  }
}

async function syncImage(bookId) {
  try {
    if (image.file) await booksApi.uploadImage(bookId, image.file)
    else if (image.remove && image.url) await booksApi.deleteImage(bookId)
  } catch (e) {
    toast.warning(`اطلاعات کتاب ذخیره شد، اما ذخیره‌ی تصویر ناموفق بود: ${parseApiError(e).message}`)
  }
}

async function submit() {
  if (!validate()) {
    scrollToFirstError()
    return
  }
  saving.value = true
  try {
    const payload = buildPayload()
    const saved = isEdit.value ? await booksApi.update(props.id, payload) : await booksApi.create(payload)
    await syncImage(saved.id)
    toast.success(isEdit.value ? 'تغییرات کتاب ذخیره شد.' : 'کتاب با موفقیت ثبت شد.')
    router.push({ name: 'books' })
  } catch (e) {
    const err = parseApiError(e)
    if (err.status === 400 && Object.keys(err.fields).length) {
      applyServerErrors(err.fields)
      scrollToFirstError()
    }
    toast.error(err.message)
  } finally {
    saving.value = false
  }
}

// ---------- view helpers ----------
const pageTitle = computed(() => (isEdit.value ? 'ویرایش کتاب' : 'ثبت کتاب جدید'))
const pageDescription = computed(() =>
    isEdit.value
        ? `اطلاعات و محل نگهداری نسخه‌های «${loaded.value?.title || ''}» را به‌روزرسانی کنید.`
        : 'اطلاعات کتاب و محل نگهداری هر نسخه را وارد کنید.',
)
const breadcrumbs = computed(() => [
  { label: 'مدیریت کتابخانه' },
  { label: 'کتاب‌ها', to: '/books' },
  { label: isEdit.value ? 'ویرایش کتاب' : 'ثبت کتاب جدید' },
])
</script>

<template>
  <div>
    <PageHeader :title="pageTitle" :description="pageDescription" :breadcrumbs="breadcrumbs">
      <template #actions>
        <BaseButton v-if="!isEdit" @click="showOpac = true">
          <template #icon><Library /></template>
          پر کردن از کتابخانه ملی
        </BaseButton>
        <BaseButton to="/books">
          <template #icon><ArrowRight /></template>
          بازگشت به فهرست
        </BaseButton>
      </template>
    </PageHeader>

    <div v-if="loading" class="loading"><BaseSpinner size="lg" /></div>

    <form v-else class="form" novalidate @submit.prevent="submit">
      <div class="layout">
        <div class="layout__main">
          <BaseCard title="اطلاعات اصلی کتاب">
            <div class="grid grid--2">
              <BaseField label="عنوان کتاب" required for-id="title" :error="errors.title">
                <BaseInput id="title" v-model="form.title" :invalid="!!errors.title" placeholder="عنوان کامل کتاب را وارد کنید" maxlength="255" />
              </BaseField>
              <BaseField label="مترجم" for-id="translator" :error="errors.translator">
                <BaseInput id="translator" v-model="form.translator" :invalid="!!errors.translator" placeholder="نام مترجم در صورت وجود" maxlength="255" />
              </BaseField>

              <!-- نویسنده + Hint: یک سطر کامل -->
              <BaseField class="grid__full" label="نویسنده" required :error="errors.authors">
                <SearchableSelect
                    v-model="authors"
                    multiple
                    noun="نویسنده"
                    placeholder="انتخاب نویسنده"
                    search-placeholder="جستجوی نویسنده یا نوشتن نام جدید…"
                    aria-label="نویسنده"
                    :fetcher="fetchAuthors"
                    :creator="createAuthor"
                    :invalid="!!errors.authors"
                />
                <NewEntityHints
                    :names="newAuthors"
                    noun="نویسنده"
                    :fetcher="fetchAuthors"
                    @pick="pickAuthor"
                    @remove="removeAuthor"
                />
              </BaseField>

              <!-- ناشر + Hint: یک سطر کامل -->
              <BaseField class="grid__full" label="ناشر" :error="errors.publisher || errors.new_publisher">
                <SearchableSelect
                    v-model="publisher"
                    noun="ناشر"
                    placeholder="انتخاب ناشر"
                    search-placeholder="جستجوی ناشر یا نوشتن نام جدید…"
                    aria-label="ناشر"
                    :fetcher="fetchPublishers"
                    :creator="createPublisher"
                    :invalid="!!errors.publisher"
                />
                <NewEntityHints
                    :names="newPublisherNames"
                    noun="ناشر"
                    :fetcher="fetchPublishers"
                    @pick="pickPublisher"
                    @remove="removePublisher"
                />
              </BaseField>

              <!-- دسته‌بندی: کاملاً دستی و با انتخاب/افزودن خود کاربر -->
              <BaseField class="grid__full" label="دسته‌بندی" :error="errors.categories">
                <CategoryMultiSelect v-model="categoryIds" :options="categoryOptions" :invalid="!!errors.categories" @created="categoryOptions.push($event)" />
              </BaseField>

              <!-- موضوع: فیلد متنی که از کتابخانه‌ی ملی پر می‌شود (جدا از دسته‌بندی) -->
              <BaseField class="grid__full" label="موضوع" for-id="subject" :error="errors.subject" hint="از کتابخانه‌ی ملی پر می‌شود؛ در صورت نیاز قابل ویرایش است.">
                <BaseTextarea id="subject" v-model="form.subject" :rows="2" :invalid="!!errors.subject" placeholder="مثلاً: زبان فارسی -- واژه‌نامه‌ها" />
              </BaseField>

              <!-- مجموعه: برای کتاب‌هایی که جلدهای یک مجموعه‌اند (مثلاً دهخدا) -->
              <BaseField label="مجموعه" :error="errors.series">
                <SearchableSelect
                    v-model="series"
                    noun="مجموعه"
                    placeholder="اگر بخشی از یک مجموعه است انتخاب کنید"
                    search-placeholder="جستجوی مجموعه یا نوشتن نام جدید…"
                    aria-label="مجموعه"
                    :fetcher="fetchSeries"
                    :creator="createSeries"
                    :invalid="!!errors.series"
                />
              </BaseField>
              <BaseField label="شماره جلد" for-id="volume_number" :error="errors.volume_number">
                <BaseInput id="volume_number" v-model="form.volume_number" numeric :invalid="!!errors.volume_number" placeholder="مثلاً ۱۸" maxlength="5" :disabled="!series" />
              </BaseField>

              <BaseField label="سال انتشار" for-id="year" :error="errors.publish_year">
                <BaseInput id="year" v-model="form.publish_year" numeric :invalid="!!errors.publish_year" placeholder="مثلاً ۱۳۹۹" maxlength="4" />
              </BaseField>
              <BaseField label="شابک" for-id="isbn" :error="errors.isbn">
                <BaseInput id="isbn" v-model="form.isbn" class="bidi" :invalid="!!errors.isbn" placeholder="مثلاً 978-600-..." maxlength="30" />
              </BaseField>
            </div>
          </BaseCard>

          <BaseCard title="اطلاعات چاپ و فهرست‌نویسی" description="همه‌ی این فیلدها اختیاری هستند.">
            <div class="grid grid--3">
              <BaseField label="سری چاپ" for-id="print_series" :error="errors.print_series">
                <BaseInput id="print_series" v-model="form.print_series" numeric :invalid="!!errors.print_series" placeholder="مثلاً ۳" maxlength="5" />
              </BaseField>
              <BaseField label="تاریخ سری چاپ" for-id="print_series_date" :error="errors.print_series_date">
                <BaseInput id="print_series_date" v-model="form.print_series_date" :invalid="!!errors.print_series_date" placeholder="مثلاً ۱۴۰۲/۰۵" maxlength="50" />
              </BaseField>
              <BaseField label="چاپ اول" for-id="first_print_date" :error="errors.first_print_date">
                <BaseInput id="first_print_date" v-model="form.first_print_date" :invalid="!!errors.first_print_date" placeholder="مثلاً ۱۳۹۰/۰۷" maxlength="50" />
              </BaseField>
              <BaseField label="شمارگان" for-id="circulation" :error="errors.circulation">
                <BaseInput id="circulation" v-model="form.circulation" numeric :invalid="!!errors.circulation" placeholder="مثلاً ۱۱۰۰" maxlength="10" />
              </BaseField>
              <BaseField label="تعداد صفحه" for-id="page_count" :error="errors.page_count">
                <BaseInput id="page_count" v-model="form.page_count" numeric :invalid="!!errors.page_count" placeholder="مثلاً ۲۵۰" maxlength="6" />
              </BaseField>
              <BaseField label="رده‌بندی دیویی" for-id="dewey" :error="errors.dewey_classification">
                <BaseInput id="dewey" v-model="form.dewey_classification" class="bidi" :invalid="!!errors.dewey_classification" placeholder="مثلاً 891.55" maxlength="50" />
              </BaseField>
              <BaseField label="شماره کتاب‌شناسی ملی" for-id="nbn" :error="errors.national_bibliography_number">
                <BaseInput id="nbn" v-model="form.national_bibliography_number" class="bidi" :invalid="!!errors.national_bibliography_number" maxlength="50" />
              </BaseField>
            </div>
          </BaseCard>

          <CopiesEditor v-model="copies" :errors="addressErrors" :loan-errors="loanErrors" :list-error="errors.addresses || errors.copies" :max="MAX_COPIES_UI" />

          <BaseCard title="درباره کتاب">
            <BaseField label="توضیحات" for-id="note" :error="errors.note">
              <BaseTextarea id="note" v-model="form.note" :rows="4" placeholder="توضیحات تکمیلی، وضعیت نسخه‌ها یا یادداشت‌های اختیاری را بنویسید..." />
            </BaseField>
          </BaseCard>
        </div>

        <aside class="layout__side">
          <BaseCard title="تصویر جلد">
            <ImageUploader :src="imageSrc" :error="image.error" @select="onImageSelect" @remove="onImageRemove" />
          </BaseCard>

          <section class="guide">
            <h3 class="guide__title"><Info /> راهنمای ثبت اطلاعات</h3>
            <p>عنوان، نویسنده، تعداد نسخه و محل نگهداری (قفسه و ردیف) هر نسخه الزامی است. اگر نویسنده یا ناشر در لیست نبود، نامش را تایپ کنید و «افزودن» را بزنید.</p>
            <hr class="divider" />
            <p v-if="!isEdit">با «پر کردن از کتابخانه ملی» می‌توانید اطلاعات کتاب را با شابک یا عنوان بگیرید. نویسنده و ناشرِ دریافت‌شده تا زمان ثبت کتاب ذخیره نمی‌شوند و می‌توانید به‌جای آن‌ها یکی از موارد مشابهِ موجود را انتخاب کنید. موضوع در فیلد جداگانه‌ای پر می‌شود و دسته‌بندی را خودتان انتخاب می‌کنید.</p>
            <hr v-if="!isEdit" class="divider" />
            <p>برای کتاب‌های ترجمه‌شده، نام مترجم را هم وارد کنید. سال انتشار را مطابق شناسنامه‌ی کتاب بنویسید.</p>
            <template v-if="isEdit && loaded">
              <hr class="divider" />
              <p class="guide__meta">کد کتاب: {{ toFaDigits(loaded.id) }}</p>
              <p class="guide__meta">آخرین ویرایش: {{ formatDateTime(loaded.updated_at) }}</p>
            </template>
          </section>
        </aside>
      </div>

      <div class="bar">
        <p class="bar__note">فیلدهای ستاره‌دار (*) الزامی هستند.</p>
        <div class="bar__actions">
          <BaseButton to="/books" :disabled="saving">انصراف</BaseButton>
          <BaseButton type="submit" variant="primary" :loading="saving">
            <template #icon><Check /></template>
            {{ isEdit ? 'ذخیره تغییرات' : 'ثبت کتاب' }}
          </BaseButton>
        </div>
      </div>
    </form>

    <OpacSearchModal v-model="showOpac" @picked="applyOpac" />
  </div>
</template>

<style scoped>
.loading { display: flex; justify-content: center; padding-block: var(--space-24); }

.layout { display: grid; grid-template-columns: minmax(0, 1fr) 300px; align-items: start; gap: var(--space-6); }
.layout__main, .layout__side { display: flex; flex-direction: column; gap: var(--space-5); }
.layout__side { position: sticky; top: calc(var(--header-height) + var(--space-4)); }

.grid { display: grid; gap: var(--space-4) var(--space-5); }
.grid--2 { grid-template-columns: repeat(2, minmax(0, 1fr)); }
.grid--3 { grid-template-columns: repeat(3, minmax(0, 1fr)); }
.grid__full { grid-column: 1 / -1; }
.stack { display: flex; flex-direction: column; gap: var(--space-5); }
.divider { margin: var(--space-5) 0; border: 0; border-top: 1px solid var(--color-border); }

.guide { padding: var(--space-4) var(--space-5); background: var(--color-surface-hover); border: 1px solid var(--color-border); border-radius: var(--card-radius); font-size: var(--text-xs); color: var(--color-text-muted); }
.guide__title { display: flex; align-items: center; gap: var(--space-2); margin-bottom: var(--space-2); font-size: var(--text-sm); color: var(--color-text); }
.guide__title :deep(svg) { width: 1rem; height: 1rem; }
.guide .divider { margin: var(--space-3) 0; }
.guide__meta { color: var(--color-text-subtle); }

.bar { display: flex; flex-wrap: wrap; align-items: center; justify-content: space-between; gap: var(--space-4); margin-top: var(--space-6); padding-top: var(--space-5); border-top: 1px solid var(--color-border); }
.bar__note { font-size: var(--text-xs); color: var(--color-text-muted); }
.bar__actions { display: flex; gap: var(--space-3); }

@media (max-width: 960px) {
  .layout { grid-template-columns: 1fr; }
  .layout__side { position: static; order: -1; }
  .grid--3 { grid-template-columns: repeat(2, minmax(0, 1fr)); }
}
@media (max-width: 560px) {
  .grid--2, .grid--3 { grid-template-columns: 1fr; }
  .bar { flex-direction: column; align-items: stretch; }
  .bar__actions { flex-direction: column-reverse; }
  .bar__actions > :deep(*) { width: 100%; }
}
</style>