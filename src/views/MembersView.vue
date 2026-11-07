<script setup>
import { computed, onBeforeUnmount, ref, watch } from 'vue'
import { useRoute, useRouter } from 'vue-router'
import { Pencil, Plus, RotateCcw, Search, ShieldCheck, Trash2 } from 'lucide-vue-next'
import PageHeader from '@/components/layout/PageHeader.vue'
import BaseButton from '@/components/ui/BaseButton.vue'
import BaseBadge from '@/components/ui/BaseBadge.vue'
import BaseCard from '@/components/ui/BaseCard.vue'
import BaseInput from '@/components/ui/BaseInput.vue'
import BasePagination from '@/components/ui/BasePagination.vue'
import BaseSpinner from '@/components/ui/BaseSpinner.vue'
import DeleteMemberModal from '@/components/members/DeleteMemberModal.vue'
import MemberFormModal from '@/components/members/MemberFormModal.vue'
import { usersApi } from '@/api/users'
import { useAuthStore } from '@/stores/auth'
import { PAGE_SIZE, SEARCH_DEBOUNCE_MS } from '@/config/app'
import { useToastStore } from '@/stores/toast'
import { parseApiError } from '@/utils/errors'
import { initials, toFa } from '@/utils/format'

const route = useRoute()
const router = useRouter()
const toast = useToastStore()
const auth = useAuthStore()

const items = ref([])
const pagination = ref(null)
const loading = ref(false)

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

let requestId = 0
async function fetchMembers() {
  const id = ++requestId
  loading.value = true
  try {
    const res = await usersApi.list({ page: page.value, page_size: PAGE_SIZE, search: search.value })
    if (id !== requestId) return
    items.value = res.items
    pagination.value = res.pagination
  } catch (e) {
    if (id !== requestId) return
    const err = parseApiError(e)
    if (err.status === 404 && page.value > 1) {
      setQuery({ page: undefined })
      return
    }
    toast.error(err.message)
  } finally {
    if (id === requestId) loading.value = false
  }
}
watch(() => route.query, fetchMembers, { immediate: true })

// ---------- create / edit ----------
const showForm = ref(false)
const editingMember = ref(null)
function askCreate() {
  editingMember.value = null
  showForm.value = true
}
function askEdit(member) {
  editingMember.value = member
  showForm.value = true
}

// ---------- delete ----------
const showDelete = ref(false)
const deleteTarget = ref(null)
const deleting = ref(false)
function askDelete(member) {
  deleteTarget.value = member
  showDelete.value = true
}
async function confirmDelete() {
  deleting.value = true
  try {
    await usersApi.remove(deleteTarget.value.id)
    toast.success('عضو حذف شد.')
    showDelete.value = false
    if (items.value.length === 1 && page.value > 1) setQuery({ page: page.value - 1 })
    else fetchMembers()
  } catch (e) {
    toast.error(parseApiError(e).message)
  } finally {
    deleting.value = false
  }
}

const rangeText = computed(() => {
  const p = pagination.value
  if (!p || !p.total_items) return ''
  const from = (p.current_page - 1) * PAGE_SIZE + 1
  const to = from + p.items_per_pages - 1
  return `نمایش ${toFa(from)} تا ${toFa(to)} از ${toFa(p.total_items)} عضو`
})
</script>

<template>
  <div>
    <PageHeader
      title="اعضا"
      description="کاربرانی که به کتابخانه دسترسی دارند را مدیریت کنید."
      :breadcrumbs="[{ label: 'مدیریت کتابخانه' }, { label: 'اعضا' }]"
    >
      <template #actions>
        <BaseButton variant="primary" @click="askCreate">
          <template #icon><Plus /></template>
          ثبت عضو جدید
        </BaseButton>
      </template>
    </PageHeader>

    <BaseCard flush>
      <div class="filters">
        <div class="filters__search">
          <BaseInput v-model="searchText" placeholder="جستجوی نام یا نام کاربری..." aria-label="جستجو">
            <template #suffix><Search /></template>
          </BaseInput>
        </div>
        <BaseButton variant="ghost" :disabled="!hasFilters" @click="clearFilters">
          <template #icon><RotateCcw /></template>
          پاک کردن
        </BaseButton>
      </div>

      <div class="table-wrap" :class="{ 'is-loading': loading }">
        <table class="table">
          <thead>
            <tr>
              <th>عضو</th>
              <th>نام کاربری</th>
              <th>وضعیت</th>
              <th class="col-actions">عملیات</th>
            </tr>
          </thead>
          <tbody>
            <tr v-for="m in items" :key="m.id">
              <td>
                <div class="member">
                  <span class="avatar" aria-hidden="true">{{ initials(m.name || m.username) }}</span>
                  <span class="member__name">{{ m.name }}</span>
                </div>
              </td>
              <td class="bidi text-right">{{ m.username }}</td>
              <td>
                <BaseBadge v-if="m.is_active" tone="success">فعال</BaseBadge>
                <span v-else class="muted">غیرفعال</span>
              </td>
              <td class="col-actions">
                <div class="actions">
                  <BaseButton variant="ghost" size="sm" @click="askEdit(m)">
                    <template #icon><Pencil /></template>
                    ویرایش
                  </BaseButton>
                  <BaseButton v-if="m.id !== auth.user?.id" variant="ghost" size="sm" @click="askDelete(m)">
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
          <p class="state__title">{{ hasFilters ? 'عضوی با این جستجو پیدا نشد.' : 'هنوز عضوی ثبت نشده است.' }}</p>
          <BaseButton v-if="hasFilters" @click="clearFilters">پاک کردن جستجو</BaseButton>
          <BaseButton v-else variant="primary" @click="askCreate">ثبت اولین عضو</BaseButton>
        </div>
      </div>

      <div v-if="pagination && pagination.total_items" class="footer">
        <span class="footer__range">{{ rangeText }}</span>
        <BasePagination :page="pagination.current_page" :total-pages="pagination.total_pages" @update:page="setQuery({ page: $event > 1 ? $event : undefined })" />
      </div>
    </BaseCard>

    <MemberFormModal v-model="showForm" :member="editingMember" @saved="fetchMembers" />
    <DeleteMemberModal v-model="showDelete" :member="deleteTarget" :loading="deleting" @confirm="confirmDelete" />
  </div>
</template>

<style scoped>
.filters { display: flex; align-items: center; gap: var(--space-3); padding: var(--space-4) var(--space-5); }
.filters__search { flex: 1; max-width: 360px; }

.table-wrap { position: relative; overflow-x: auto; border-top: 1px solid var(--color-border); transition: opacity var(--transition); }
.table-wrap.is-loading { opacity: 0.6; }
.table { min-width: 680px; width: 100%; }
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
.col-actions { width: 1%; white-space: nowrap; }
.muted { color: var(--color-text-subtle); }

.member { display: flex; align-items: center; gap: var(--space-3); }
.member__name { font-weight: var(--weight-bold); }
.avatar {
  display: grid;
  place-items: center;
  width: 2rem;
  height: 2rem;
  flex-shrink: 0;
  background: var(--color-surface-muted);
  border: 1px solid var(--color-border);
  border-radius: var(--radius-full);
  font-size: var(--text-xs);
  font-weight: var(--weight-bold);
}
.actions { display: flex; gap: var(--space-1); }

.state { display: flex; flex-direction: column; align-items: center; gap: var(--space-4); padding: var(--space-16) var(--space-4); }
.state__title { color: var(--color-text-muted); }

.footer { display: flex; flex-wrap: wrap; align-items: center; justify-content: space-between; gap: var(--space-3); padding: var(--space-4) var(--space-5); border-top: 1px solid var(--color-border); }
.footer__range { font-size: var(--text-sm); color: var(--color-text-muted); }
</style>
