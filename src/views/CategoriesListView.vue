<script setup>
import { computed, ref } from 'vue'
import { Pencil, Plus, Tag, Trash2 } from 'lucide-vue-next'
import PageHeader from '@/components/layout/PageHeader.vue'
import BaseButton from '@/components/ui/BaseButton.vue'
import BaseCard from '@/components/ui/BaseCard.vue'
import BaseCheckbox from '@/components/ui/BaseCheckbox.vue'
import BaseInput from '@/components/ui/BaseInput.vue'
import BaseSpinner from '@/components/ui/BaseSpinner.vue'
import DeleteEntityModal from '@/components/common/DeleteEntityModal.vue'
import CategoryFormModal from '@/components/categories/CategoryFormModal.vue'
import { categoriesApi } from '@/api/categories'
import { useToastStore } from '@/stores/toast'
import { firstMessage, parseApiError } from '@/utils/errors'
import { toFa } from '@/utils/format'

const toast = useToastStore()

const items = ref([])
const loading = ref(false)
const selected = ref(new Set())
const searchText = ref('')

const filtered = computed(() => {
  const q = searchText.value.trim().toLowerCase()
  if (!q) return items.value
  return items.value.filter((c) => c.title.toLowerCase().includes(q))
})

async function fetchItems() {
  loading.value = true
  try {
    items.value = await categoriesApi.list()
    selected.value = new Set()
  } catch (e) {
    toast.error(parseApiError(e).message)
  } finally {
    loading.value = false
  }
}
fetchItems()

// ---------- selection ----------
const allSelected = computed(() => filtered.value.length > 0 && filtered.value.every((x) => selected.value.has(x.id)))
const someSelected = computed(() => selected.value.size > 0 && !allSelected.value)
function toggleAll(on) {
  selected.value = on ? new Set(filtered.value.map((x) => x.id)) : new Set()
}
function toggleOne(id, on) {
  const next = new Set(selected.value)
  if (on) next.add(id)
  else next.delete(id)
  selected.value = next
}

// ---------- create / edit ----------
const showForm = ref(false)
const editingCategory = ref(null)
function askCreate() {
  editingCategory.value = null
  showForm.value = true
}
function askEdit(category) {
  editingCategory.value = category
  showForm.value = true
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
    if (targets.length === 1) await categoriesApi.remove(targets[0].id)
    else await categoriesApi.bulkRemove(targets.map((x) => x.id))
    toast.success(targets.length === 1 ? 'دسته‌بندی حذف شد.' : `${toFa(targets.length)} دسته‌بندی حذف شد.`)
    showDelete.value = false
    fetchItems()
  } catch (e) {
    const err = parseApiError(e)
    toast.error(firstMessage(err.fields.items) || err.message)
  } finally {
    deleting.value = false
  }
}

// برای DeleteEntityModal: { id, name, books_count }
const deleteTargetsMapped = computed(() => deleteTargets.value.map((c) => ({ id: c.id, name: c.title, books_count: c.books_count })))
</script>

<template>
  <div>
    <PageHeader
        title="دسته‌بندی‌ها"
        description="دسته‌بندی‌هایی که هنگام ثبت کتاب قابل انتخابند را مدیریت کنید."
        :breadcrumbs="[{ label: 'مدیریت کتابخانه' }, { label: 'دسته‌بندی‌ها' }]"
    >
      <template #actions>
        <BaseButton variant="primary" @click="askCreate">
          <template #icon><Plus /></template>
          دسته‌بندی جدید
        </BaseButton>
      </template>
    </PageHeader>

    <div class="stats">
      <span><strong>{{ toFa(items.length) }}</strong> دسته‌بندی</span>
    </div>

    <BaseCard flush>
      <div class="filters">
        <BaseInput v-model="searchText" placeholder="جستجوی عنوان دسته‌بندی..." aria-label="جستجو" />
      </div>

      <div v-if="selected.size" class="bulk">
        <span>{{ toFa(selected.size) }} دسته‌بندی انتخاب شده</span>
        <BaseButton size="sm" @click="askDelete(filtered.filter((x) => selected.has(x.id)))">
          <template #icon><Trash2 /></template>
          حذف انتخاب‌شده‌ها
        </BaseButton>
      </div>

      <div class="table-wrap" :class="{ 'is-loading': loading }">
        <table class="table">
          <thead>
          <tr>
            <th class="col-check"><BaseCheckbox :model-value="allSelected" :indeterminate="someSelected" aria-label="انتخاب همه" @update:model-value="toggleAll" /></th>
            <th>دسته‌بندی</th>
            <th class="col-num">تعداد کتاب</th>
            <th class="col-actions">عملیات</th>
          </tr>
          </thead>
          <tbody>
          <tr v-for="c in filtered" :key="c.id">
            <td class="col-check"><BaseCheckbox :model-value="selected.has(c.id)" :aria-label="`انتخاب ${c.title}`" @update:model-value="toggleOne(c.id, $event)" /></td>
            <td>
              <div class="entity">
                <span class="entity__icon"><Tag /></span>
                <button type="button" class="entity__title" @click="askEdit(c)">{{ c.title }}</button>
              </div>
            </td>
            <td class="col-num">
              <RouterLink v-if="c.books_count" :to="{ path: '/books', query: { category: c.id } }" class="link">{{ toFa(c.books_count) }}</RouterLink>
              <span v-else class="muted">۰</span>
            </td>
            <td class="col-actions">
              <div class="actions">
                <BaseButton variant="ghost" size="sm" @click="askEdit(c)">
                  <template #icon><Pencil /></template>
                  ویرایش
                </BaseButton>
                <BaseButton variant="ghost" size="sm" @click="askDelete([c])">
                  <template #icon><Trash2 /></template>
                  حذف
                </BaseButton>
              </div>
            </td>
          </tr>
          </tbody>
        </table>

        <div v-if="!filtered.length && loading" class="state"><BaseSpinner size="lg" /></div>
        <div v-else-if="!filtered.length" class="state">
          <p class="state__title">{{ searchText ? 'دسته‌بندی‌ای با این جستجو پیدا نشد.' : 'هنوز دسته‌بندی‌ای ثبت نشده است.' }}</p>
          <BaseButton v-if="searchText" @click="searchText = ''">پاک کردن جستجو</BaseButton>
          <BaseButton v-else variant="primary" @click="askCreate">ثبت اولین دسته‌بندی</BaseButton>
        </div>
      </div>
    </BaseCard>

    <CategoryFormModal v-model="showForm" :category="editingCategory" @saved="fetchItems" />
    <DeleteEntityModal
        v-model="showDelete"
        :items="deleteTargetsMapped"
        noun="دسته‌بندی"
        noun-plural="دسته‌بندی‌ها"
        :icon="Tag"
        warning="کتاب‌هایی که این دسته‌بندی را دارند حذف نمی‌شوند؛ فقط این دسته از آن‌ها برداشته می‌شود."
        :loading="deleting"
        @confirm="confirmDelete"
    />
  </div>
</template>

<style scoped>
.stats { display: flex; align-items: center; gap: var(--space-4); margin-bottom: var(--space-4); font-size: var(--text-sm); }

.filters { padding: var(--space-4) var(--space-5); max-width: 360px; }
.bulk { display: flex; align-items: center; justify-content: space-between; padding: var(--space-2) var(--space-5); background: var(--color-primary-soft); border-block: 1px solid var(--color-border); font-size: var(--text-sm); }

.table-wrap { position: relative; overflow-x: auto; border-top: 1px solid var(--color-border); transition: opacity var(--transition); }
.table-wrap.is-loading { opacity: 0.6; }
.table { min-width: 480px; width: 100%; }
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

.entity { display: flex; align-items: center; gap: var(--space-3); }
.entity__icon { display: grid; place-items: center; width: 2rem; height: 2rem; flex-shrink: 0; background: var(--color-surface-muted); border: 1px solid var(--color-border); border-radius: var(--radius-full); }
.entity__icon :deep(svg) { width: 1rem; height: 1rem; }
.entity__title { background: transparent; border: 0; padding: 0; font-weight: var(--weight-bold); font-size: var(--text-sm); cursor: pointer; }
.entity__title:hover { text-decoration: underline; }
.actions { display: flex; gap: var(--space-1); }

.state { display: flex; flex-direction: column; align-items: center; gap: var(--space-4); padding: var(--space-16) var(--space-4); }
.state__title { color: var(--color-text-muted); }
</style>