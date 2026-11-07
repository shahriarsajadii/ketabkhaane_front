<script setup>
import { computed, onBeforeUnmount, onMounted, ref, watch } from 'vue'
import { useRoute, useRouter } from 'vue-router'
import { Download, Pencil, Plus, RotateCcw, Search, Trash2, Upload } from 'lucide-vue-next'
import PageHeader from '@/components/layout/PageHeader.vue'
import BaseBadge from '@/components/ui/BaseBadge.vue'
import BaseButton from '@/components/ui/BaseButton.vue'
import BaseCard from '@/components/ui/BaseCard.vue'
import BaseCheckbox from '@/components/ui/BaseCheckbox.vue'
import BaseInput from '@/components/ui/BaseInput.vue'
import BasePagination from '@/components/ui/BasePagination.vue'
import BaseSelect from '@/components/ui/BaseSelect.vue'
import BaseSpinner from '@/components/ui/BaseSpinner.vue'
import SearchableSelect from '@/components/ui/SearchableSelect.vue'
import BookCover from '@/components/books/BookCover.vue'
import DeleteBookModal from '@/components/books/DeleteBookModal.vue'
import ExcelUploadModal from '@/components/books/ExcelUploadModal.vue'
import { booksApi } from '@/api/books'
import { authorsApi } from '@/api/authors'
import { categoriesApi } from '@/api/categories'
import { publishersApi } from '@/api/publishers'
import { PAGE_SIZE, SEARCH_DEBOUNCE_MS } from '@/config/app'
import { useToastStore } from '@/stores/toast'
import { downloadBlob } from '@/utils/download'
import { parseApiError } from '@/utils/errors'
import { formatLastUpdate, toFa, toFaDigits } from '@/utils/format'

const route = useRoute()
const router = useRouter()
const toast = useToastStore()

// ---------- data ----------
const items = ref([])
const pagination = ref(null)
const loading = ref(false)
const stats = ref(null)
const categories = ref([])
const selected = ref(new Set())

// ---------- filters (منبع حقیقت = query string آدرس) ----------
const page = computed(() => Number(route.query.page) || 1)
const filters = computed(() => ({
  search: route.query.search || '',
  category: route.query.category || '',
  publisher: route.query.publisher || '',
  author: route.query.author || '',
  year: route.query.year || '',
}))
const hasFilters = computed(() => Object.values(filters.value).some(Boolean))
const apiParams = computed(() => ({
  search: filters.value.search,
  category: filters.value.category,
  publisher: filters.value.publisher,
  author: filters.value.author,
  publish_year: filters.value.year,
}))

const searchText = ref(filters.value.search)
let searchTimer = null
watch(searchText, (value) => {
  clearTimeout(searchTimer)
  searchTimer = setTimeout(() => setQuery({ search: value.trim(), page: undefined }), SEARCH_DEBOUNCE_MS)
})
watch(
  () => route.query.search,
  (value) => {
    if ((value || '') !== searchText.value.trim()) searchText.value = value || ''
  },
)
onBeforeUnmount(() => clearTimeout(searchTimer))

function setQuery(patch) {
  const next = { ...route.query, ...patch }
  for (const key of Object.keys(next)) {
    if (next[key] === undefined || next[key] === null || next[key] === '') delete next[key]
  }
  router.replace({ query: next })
}
function clearFilters() {
  searchText.value = ''
  router.replace({ query: {} })
}

const categoryOptions = computed(() => categories.value.map((c) => ({ value: c.id, label: c.title })))

// فیلتر ناشر/نویسنده: لیست قابل‌جستجو. در آدرس فقط id است؛ برای نمایش نام، یک‌بار از سرور می‌خوانیم.
const fetchPublishers = (params) => publishersApi.list(params)
const fetchAuthors = (params) => authorsApi.list(params)
const publisherFilter = ref(null)
const authorFilter = ref(null)
function syncEntityFilter(target, id, api) {
  if (!id) {
    target.value = null
    return
  }
  if (target.value && String(target.value.id) === String(id)) return
  api.get(id).then((x) => { if (String(filters.value.publisher) === String(id) || String(filters.value.author) === String(id)) target.value = x }).catch(() => { target.value = { id, name: `#${id}` } })
}
watch(() => filters.value.publisher, (id) => syncEntityFilter(publisherFilter, id, publishersApi), { immediate: true })
watch(() => filters.value.author, (id) => syncEntityFilter(authorFilter, id, authorsApi), { immediate: true })
const yearOptions = computed(() => (stats.value?.years || []).map((y) => ({ value: y, label: toFaDigits(y) })))

// ---------- fetching ----------
let requestId = 0
async function fetchBooks() {
  if (route.name !== 'books') return
  const id = ++requestId
  loading.value = true
  try {
    const res = await booksApi.list({ page: page.value, page_size: PAGE_SIZE, ...apiParams.value })
    if (id !== requestId) return
    items.value = res.items
    pagination.value = res.pagination
    selected.value = new Set()
  } catch (e) {
    if (id !== requestId) return
    const err = parseApiError(e)
    if (err.status === 404 && page.value > 1) {
      setQuery({ page: undefined }) // صفحه‌ای که دیگر وجود ندارد
      return
    }
    toast.error(err.message)
  } finally {
    if (id === requestId) loading.value = false
  }
}
async function fetchStats() {
  try {
    stats.value = await booksApi.stats()
  } catch {
    /* آمار حیاتی نیست */
  }
}
async function fetchCategories() {
  try {
    categories.value = await categoriesApi.list()
  } catch {
    /* فیلتر دسته‌بندی خالی می‌ماند */
  }
}

watch(() => route.query, fetchBooks, { immediate: true })
onMounted(() => {
  fetchStats()
  fetchCategories()
})

// ---------- selection ----------
const allSelected = computed(() => items.value.length > 0 && items.value.every((b) => selected.value.has(b.id)))
const someSelected = computed(() => selected.value.size > 0 && !allSelected.value)
function toggleAll(on) {
  selected.value = on ? new Set(items.value.map((b) => b.id)) : new Set()
}
function toggleOne(id, on) {
  const next = new Set(selected.value)
  if (on) next.add(id)
  else next.delete(id)
  selected.value = next
}

// ---------- delete ----------
const showDelete = ref(false)
const deleteTargets = ref([])
const deleting = ref(false)

function askDelete(books) {
  deleteTargets.value = books
  showDelete.value = true
}
async function confirmDelete() {
  const targets = deleteTargets.value
  deleting.value = true
  try {
    if (targets.length === 1) await booksApi.remove(targets[0].id)
    else await booksApi.bulkRemove(targets.map((b) => b.id))
    toast.success(targets.length === 1 ? 'کتاب حذف شد.' : `${toFa(targets.length)} کتاب حذف شد.`)
    showDelete.value = false
    fetchStats()
    if (items.value.length === targets.length && page.value > 1) setQuery({ page: page.value - 1 })
    else fetchBooks()
  } catch (e) {
    toast.error(parseApiError(e).message)
  } finally {
    deleting.value = false
  }
}

// ---------- excel ----------
const showUpload = ref(false)
const exporting = ref(false)

async function exportExcel() {
  exporting.value = true
  try {
    downloadBlob(await booksApi.exportExcel(apiParams.value), 'books.xlsx')
  } catch {
    toast.error('دریافت خروجی اکسل ناموفق بود.')
  } finally {
    exporting.value = false
  }
}
function onImported() {
  fetchStats()
  fetchCategories()
  fetchBooks()
}

// ---------- view helpers ----------
const rangeText = computed(() => {
  const p = pagination.value
  if (!p || !p.total_items) return ''
  const from = (p.current_page - 1) * PAGE_SIZE + 1
  const to = from + p.items_per_pages - 1
  return `نمایش ${toFa(from)} تا ${toFa(to)} از ${toFa(p.total_items)} کتاب`
})
</script>

<template>
  <div>
    <PageHeader
      title="فهرست کتاب‌ها"
      description="کتاب‌های کتابخانه را جستجو، ثبت و مدیریت کنید."
      :breadcrumbs="[{ label: 'مدیریت کتابخانه' }, { label: 'کتاب‌ها' }]"
    >
      <template #actions>
        <BaseButton :loading="exporting" @click="exportExcel">
          <template #icon><Download /></template>
          خروجی اکسل
        </BaseButton>
        <BaseButton @click="showUpload = true">
          <template #icon><Upload /></template>
          آپلود اکسل
        </BaseButton>
        <BaseButton variant="primary" to="/books/new">
          <template #icon><Plus /></template>
          ثبت کتاب جدید
        </BaseButton>
      </template>
    </PageHeader>

    <div class="stats">
      <div class="stats__counts">
        <span><strong>{{ toFa(stats?.titles ?? 0) }}</strong> عنوان کتاب</span>
        <span class="stats__sep" aria-hidden="true" />
        <span class="stats__muted"><span class="stats__num">{{ toFa(stats?.copies ?? 0) }}</span> نسخه در کتابخانه</span>
      </div>
      <span v-if="stats?.last_updated" class="stats__muted stats__updated">آخرین به‌روزرسانی: {{ formatLastUpdate(stats.last_updated) }}</span>
    </div>

    <BaseCard flush>
      <div class="filters">
        <div class="filters__search">
          <BaseInput v-model="searchText" placeholder="جستجوی نام کتاب یا نویسنده..." aria-label="جستجو">
            <template #suffix><Search /></template>
          </BaseInput>
        </div>
        <BaseSelect :model-value="filters.category" :options="categoryOptions" placeholder="همه دسته‌بندی‌ها" aria-label="دسته‌بندی" @update:model-value="setQuery({ category: $event, page: undefined })" />
        <SearchableSelect :model-value="publisherFilter" noun="ناشر" placeholder="همه ناشران" search-placeholder="جستجوی ناشر…" aria-label="ناشر" :fetcher="fetchPublishers" @update:model-value="publisherFilter = $event; setQuery({ publisher: $event?.id, page: undefined })" />
        <SearchableSelect :model-value="authorFilter" noun="نویسنده" placeholder="همه نویسنده‌ها" search-placeholder="جستجوی نویسنده…" aria-label="نویسنده" :fetcher="fetchAuthors" @update:model-value="authorFilter = $event; setQuery({ author: $event?.id, page: undefined })" />
        <BaseSelect :model-value="filters.year" :options="yearOptions" placeholder="سال انتشار" aria-label="سال انتشار" @update:model-value="setQuery({ year: $event, page: undefined })" />
        <BaseButton variant="ghost" :disabled="!hasFilters" @click="clearFilters">
          <template #icon><RotateCcw /></template>
          پاک کردن
        </BaseButton>
      </div>

      <div v-if="selected.size" class="bulk">
        <span>{{ toFa(selected.size) }} کتاب انتخاب شده</span>
        <BaseButton size="sm" @click="askDelete(items.filter((b) => selected.has(b.id)))">
          <template #icon><Trash2 /></template>
          حذف انتخاب‌شده‌ها
        </BaseButton>
      </div>

      <div class="table-wrap" :class="{ 'is-loading': loading }">
        <table class="table">
          <thead>
            <tr>
              <th class="col-check"><BaseCheckbox :model-value="allSelected" :indeterminate="someSelected" aria-label="انتخاب همه" @update:model-value="toggleAll" /></th>
              <th>نام کتاب</th>
              <th>نویسنده</th>
              <th>ناشر</th>
              <th>دسته‌بندی</th>
              <th class="col-num">تعداد نسخه</th>
              <th class="col-actions">عملیات</th>
            </tr>
          </thead>
          <tbody>
            <tr v-for="b in items" :key="b.id">
              <td class="col-check"><BaseCheckbox :model-value="selected.has(b.id)" :aria-label="`انتخاب ${b.title}`" @update:model-value="toggleOne(b.id, $event)" /></td>
              <td>
                <div class="book">
                  <BookCover :src="b.image" :alt="b.title" size="sm" />
                  <div class="book__text">
                    <RouterLink :to="`/books/${b.id}/edit`" class="book__title">{{ b.title }}</RouterLink>
                    <span class="book__code">کد کتاب: {{ toFaDigits(b.id) }}</span>
                  </div>
                </div>
              </td>
              <td>{{ b.authors.map((a) => a.name).join('، ') || '—' }}</td>
              <td>{{ b.publisher?.name || '—' }}</td>
              <td>
                <div v-if="b.categories.length" class="chips">
                  <BaseBadge>{{ b.categories[0].title }}</BaseBadge>
                  <BaseBadge v-if="b.categories.length > 1">+{{ toFa(b.categories.length - 1) }}</BaseBadge>
                </div>
                <span v-else class="muted">—</span>
              </td>
              <td class="col-num">{{ toFa(b.count) }}</td>
              <td class="col-actions">
                <div class="actions">
                  <BaseButton variant="ghost" size="sm" :to="`/books/${b.id}/edit`">
                    <template #icon><Pencil /></template>
                    ویرایش
                  </BaseButton>
                  <BaseButton variant="ghost" size="sm" @click="askDelete([b])">
                    <template #icon><Trash2 /></template>
                    حذف
                  </BaseButton>
                </div>
              </td>
            </tr>
          </tbody>
        </table>

        <div v-if="!items.length && loading" class="state"><BaseSpinner size="lg" /></div>
        <div v-else-if="!items.length" class="state">
          <p class="state__title">{{ hasFilters ? 'کتابی با این فیلترها پیدا نشد.' : 'هنوز کتابی ثبت نشده است.' }}</p>
          <BaseButton v-if="hasFilters" @click="clearFilters">پاک کردن فیلترها</BaseButton>
          <BaseButton v-else variant="primary" to="/books/new">ثبت اولین کتاب</BaseButton>
        </div>
      </div>

      <div v-if="pagination && pagination.total_items" class="footer">
        <span class="footer__range">{{ rangeText }}</span>
        <BasePagination :page="pagination.current_page" :total-pages="pagination.total_pages" @update:page="setQuery({ page: $event > 1 ? $event : undefined })" />
      </div>
    </BaseCard>

    <DeleteBookModal v-model="showDelete" :books="deleteTargets" :loading="deleting" @confirm="confirmDelete" />
    <ExcelUploadModal v-model="showUpload" @imported="onImported" />
  </div>
</template>

<style scoped>
.stats { display: flex; flex-wrap: wrap; align-items: center; justify-content: space-between; gap: var(--space-3); margin-bottom: var(--space-4); font-size: var(--text-sm); }
.stats__counts { display: flex; align-items: center; gap: var(--space-4); }
.stats__sep { width: 1px; height: 1rem; background: var(--color-border-strong); }
.stats__muted { color: var(--color-text-muted); }
.stats__num { font-weight: var(--weight-medium); }

.filters { display: grid; grid-template-columns: minmax(200px, 1fr) repeat(4, 150px) auto; align-items: center; gap: var(--space-3); padding: var(--space-4) var(--space-5); }
.bulk { display: flex; align-items: center; justify-content: space-between; padding: var(--space-2) var(--space-5); background: var(--color-primary-soft); border-block: 1px solid var(--color-border); font-size: var(--text-sm); }

.table-wrap { position: relative; overflow-x: auto; border-top: 1px solid var(--color-border); transition: opacity var(--transition); }
.table-wrap.is-loading { opacity: 0.6; }
.table { min-width: 860px; }
.table th {
  padding: var(--space-3) var(--space-4);
  background: var(--table-head-bg);
  text-align: start;
  font-size: var(--text-sm);
  font-weight: var(--weight-medium);
  color: var(--color-text-muted);
  white-space: nowrap;
}
.table td { padding: var(--space-3) var(--space-4); border-top: 1px solid var(--color-border); vertical-align: middle; font-size: var(--text-sm); }
.table tbody tr:first-child td { border-top: 0; }
.table tbody tr:hover { background: var(--table-row-hover); }
.col-check { width: 3rem; }
.col-num { text-align: center !important; }
.col-actions { width: 1%; white-space: nowrap; }
.strong { font-weight: var(--weight-medium); }
.muted { color: var(--color-text-subtle); }

.book { display: flex; align-items: center; gap: var(--space-3); }
.book__text { display: flex; flex-direction: column; min-width: 0; }
.book__title { font-weight: var(--weight-bold); }
.book__title:hover { text-decoration: underline; }
.book__code { font-size: var(--text-xs); color: var(--color-text-subtle); }
.chips { display: flex; flex-wrap: wrap; gap: var(--space-1); }
.actions { display: flex; gap: var(--space-1); }

.state { display: flex; flex-direction: column; align-items: center; gap: var(--space-4); padding: var(--space-16) var(--space-4); }
.state__title { color: var(--color-text-muted); }

.footer { display: flex; flex-wrap: wrap; align-items: center; justify-content: space-between; gap: var(--space-3); padding: var(--space-4) var(--space-5); border-top: 1px solid var(--color-border); }
.footer__range { font-size: var(--text-sm); color: var(--color-text-muted); }

@media (max-width: 900px) {
  .filters { grid-template-columns: 1fr 1fr; }
  .filters__search { grid-column: 1 / -1; }
}
</style>
