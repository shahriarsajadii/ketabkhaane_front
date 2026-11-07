<script setup>
import { computed, onBeforeUnmount, ref, watch } from 'vue'
import { useRoute, useRouter } from 'vue-router'
import { Pencil, Plus, RotateCcw, Search, Trash2, Building2 } from 'lucide-vue-next'
import PageHeader from '@/components/layout/PageHeader.vue'
import BaseButton from '@/components/ui/BaseButton.vue'
import BaseCard from '@/components/ui/BaseCard.vue'
import BaseCheckbox from '@/components/ui/BaseCheckbox.vue'
import BaseInput from '@/components/ui/BaseInput.vue'
import BasePagination from '@/components/ui/BasePagination.vue'
import BaseSpinner from '@/components/ui/BaseSpinner.vue'
import BookCover from '@/components/books/BookCover.vue'
import DeleteEntityModal from '@/components/common/DeleteEntityModal.vue'
import { publishersApi } from '@/api/publishers'
import { PAGE_SIZE, SEARCH_DEBOUNCE_MS } from '@/config/app'
import { useToastStore } from '@/stores/toast'
import { firstMessage, parseApiError } from '@/utils/errors'
import { toFa, toFaDigits } from '@/utils/format'

const route = useRoute()
const router = useRouter()
const toast = useToastStore()

// ---------- data ----------
const items = ref([])
const pagination = ref(null)
const loading = ref(false)
const selected = ref(new Set())

// ---------- filters (منبع حقیقت = query string آدرس) ----------
const page = computed(() => Number(route.query.page) || 1)
const search = computed(() => route.query.search || '')
const hasFilters = computed(() => !!search.value)

const searchText = ref(search.value)
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

// ---------- fetching ----------
let requestId = 0
async function fetchItems() {
  if (route.name !== 'publishers') return
  const id = ++requestId
  loading.value = true
  try {
    const res = await publishersApi.list({ page: page.value, page_size: PAGE_SIZE, search: search.value })
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
watch(() => route.query, fetchItems, { immediate: true })

// ---------- selection ----------
const allSelected = computed(() => items.value.length > 0 && items.value.every((x) => selected.value.has(x.id)))
const someSelected = computed(() => selected.value.size > 0 && !allSelected.value)
function toggleAll(on) {
  selected.value = on ? new Set(items.value.map((x) => x.id)) : new Set()
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

function askDelete(list) {
  deleteTargets.value = list
  showDelete.value = true
}
async function confirmDelete() {
  const targets = deleteTargets.value
  deleting.value = true
  try {
    if (targets.length === 1) await publishersApi.remove(targets[0].id)
    else await publishersApi.bulkRemove(targets.map((x) => x.id))
    toast.success(targets.length === 1 ? 'ناشران حذف شد.' : `${toFa(targets.length)} ناشران حذف شد.`)
    showDelete.value = false
    if (items.value.length === targets.length && page.value > 1) setQuery({ page: page.value - 1 })
    else fetchItems()
  } catch (e) {
    const err = parseApiError(e)
    toast.error(firstMessage(err.fields.items) || err.message)
  } finally {
    deleting.value = false
  }
}

// ---------- view helpers ----------
const rangeText = computed(() => {
  const p = pagination.value
  if (!p || !p.total_items) return ''
  const from = (p.current_page - 1) * PAGE_SIZE + 1
  const to = from + p.items_per_pages - 1
  return `نمایش ${toFa(from)} تا ${toFa(to)} از ${toFa(p.total_items)} ناشران`
})
</script>

<template>
  <div>
    <PageHeader
      title="فهرست ناشران"
      description="ناشران کتاب‌ها را جستجو، ثبت و مدیریت کنید."
      :breadcrumbs="[{ label: 'مدیریت کتابخانه' }, { label: 'ناشران' }]"
    >
      <template #actions>
        <BaseButton variant="primary" to="/publishers/new">
          <template #icon><Plus /></template>
          ثبت ناشر جدید
        </BaseButton>
      </template>
    </PageHeader>

    <div class="stats">
      <div class="stats__counts">
        <span><strong>{{ toFa(pagination?.total_items ?? 0) }}</strong> ناشران</span>
      </div>
    </div>

    <BaseCard flush>
      <div class="filters">
        <div class="filters__search">
          <BaseInput v-model="searchText" placeholder="جستجوی نام ناشر..." aria-label="جستجو">
            <template #suffix><Search /></template>
          </BaseInput>
        </div>
        <BaseButton variant="ghost" :disabled="!hasFilters" @click="clearFilters">
          <template #icon><RotateCcw /></template>
          پاک کردن
        </BaseButton>
      </div>

      <div v-if="selected.size" class="bulk">
        <span>{{ toFa(selected.size) }} ناشران انتخاب شده</span>
        <BaseButton size="sm" @click="askDelete(items.filter((x) => selected.has(x.id)))">
          <template #icon><Trash2 /></template>
          حذف انتخاب‌شده‌ها
        </BaseButton>
      </div>

      <div class="table-wrap" :class="{ 'is-loading': loading }">
        <table class="table">
          <thead>
            <tr>
              <th class="col-check"><BaseCheckbox :model-value="allSelected" :indeterminate="someSelected" aria-label="انتخاب همه" @update:model-value="toggleAll" /></th>
              <th>ناشر</th>
              <th class="col-num">تعداد کتاب</th>
              <th class="col-actions">عملیات</th>
            </tr>
          </thead>
          <tbody>
            <tr v-for="x in items" :key="x.id">
              <td class="col-check"><BaseCheckbox :model-value="selected.has(x.id)" :aria-label="`انتخاب ${x.name}`" @update:model-value="toggleOne(x.id, $event)" /></td>
              <td>
                <div class="entity">
                  <BookCover :src="x.image" :alt="x.name" size="sm" :icon="Building2" />
                  <div class="entity__text">
                    <RouterLink :to="`/publishers/${x.id}/edit`" class="entity__title">{{ x.name }}</RouterLink>
                    <span class="entity__code">کد ناشر: {{ toFaDigits(x.id) }}</span>
                  </div>
                </div>
              </td>
              <td class="col-num">
                <RouterLink v-if="x.books_count" :to="{ path: '/books', query: { publisher: x.id } }" class="link">{{ toFa(x.books_count) }}</RouterLink>
                <span v-else class="muted">۰</span>
              </td>
              <td class="col-actions">
                <div class="actions">
                  <BaseButton variant="ghost" size="sm" :to="`/publishers/${x.id}/edit`">
                    <template #icon><Pencil /></template>
                    ویرایش
                  </BaseButton>
                  <BaseButton variant="ghost" size="sm" @click="askDelete([x])">
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
          <p class="state__title">{{ hasFilters ? 'ناشری با این جستجو پیدا نشد.' : 'هنوز ناشری ثبت نشده است.' }}</p>
          <BaseButton v-if="hasFilters" @click="clearFilters">پاک کردن فیلترها</BaseButton>
          <BaseButton v-else variant="primary" to="/publishers/new">ثبت اولین ناشر</BaseButton>
        </div>
      </div>

      <div v-if="pagination && pagination.total_items" class="footer">
        <span class="footer__range">{{ rangeText }}</span>
        <BasePagination :page="pagination.current_page" :total-pages="pagination.total_pages" @update:page="setQuery({ page: $event > 1 ? $event : undefined })" />
      </div>
    </BaseCard>

    <DeleteEntityModal
      v-model="showDelete"
      :items="deleteTargets"
      noun="ناشر"
      noun-plural="ناشران"
      :icon="Building2"
      warning="کتاب‌های این ناشر حذف نمی‌شوند؛ فقط ناشرِ آن‌ها خالی می‌شود."
      :loading="deleting"
      @confirm="confirmDelete"
    />
  </div>
</template>

<style scoped>
.stats { display: flex; flex-wrap: wrap; align-items: center; justify-content: space-between; gap: var(--space-3); margin-bottom: var(--space-4); font-size: var(--text-sm); }
.stats__counts { display: flex; align-items: center; gap: var(--space-4); }

.filters { display: grid; grid-template-columns: minmax(220px, 1fr) auto; align-items: center; gap: var(--space-3); padding: var(--space-4) var(--space-5); }
.bulk { display: flex; align-items: center; justify-content: space-between; padding: var(--space-2) var(--space-5); background: var(--color-primary-soft); border-block: 1px solid var(--color-border); font-size: var(--text-sm); }

.table-wrap { position: relative; overflow-x: auto; border-top: 1px solid var(--color-border); transition: opacity var(--transition); }
.table-wrap.is-loading { opacity: 0.6; }
.table { min-width: 640px; }
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
.muted { color: var(--color-text-subtle); }
.link { font-weight: var(--weight-medium); }
.link:hover { text-decoration: underline; }
.desc { max-width: 28rem; overflow: hidden; text-overflow: ellipsis; white-space: nowrap; color: var(--color-text-muted); }

.entity { display: flex; align-items: center; gap: var(--space-3); }
.entity__text { display: flex; flex-direction: column; min-width: 0; }
.entity__title { font-weight: var(--weight-bold); }
.entity__title:hover { text-decoration: underline; }
.entity__code { font-size: var(--text-xs); color: var(--color-text-subtle); }
.actions { display: flex; gap: var(--space-1); }

.state { display: flex; flex-direction: column; align-items: center; gap: var(--space-4); padding: var(--space-16) var(--space-4); }
.state__title { color: var(--color-text-muted); }

.footer { display: flex; flex-wrap: wrap; align-items: center; justify-content: space-between; gap: var(--space-3); padding: var(--space-4) var(--space-5); border-top: 1px solid var(--color-border); }
.footer__range { font-size: var(--text-sm); color: var(--color-text-muted); }

@media (max-width: 900px) {
  .filters { grid-template-columns: 1fr auto; }
}
</style>
