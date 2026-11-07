<script setup>
/**
 * لیست قابل‌جستجو (combobox) با افزودنِ درجا؛ مثل CategoryMultiSelect ولی:
 *  - جستجو سمت سرور است (برای هزاران ناشر/نویسنده)، با «نمایش بیشتر»
 *  - اگر نامِ تایپ‌شده در لیست نبود، گزینه‌ی «افزودن …» ظاهر می‌شود و همان‌جا ساخته و انتخاب می‌شود
 *
 * مقدار (v-model) آبجکت‌های { id, name } است، نه فقط id؛ تا برچسب گزینه‌های انتخاب‌شده
 * حتی وقتی در صفحه‌ی فعلیِ نتایج نیستند هم نمایش داده شود.
 *   multiple=false → v-model = { id, name } | null
 *   multiple=true  → v-model = [{ id, name }, ...]
 */
import { computed, nextTick, onBeforeUnmount, onMounted, ref, watch } from 'vue'
import { Check, ChevronDown, Plus, Search, X } from 'lucide-vue-next'
import BaseSpinner from '@/components/ui/BaseSpinner.vue'
import { COMBOBOX_PAGE_SIZE, SEARCH_DEBOUNCE_MS } from '@/config/app'
import { useToastStore } from '@/stores/toast'
import { firstMessage, parseApiError } from '@/utils/errors'

defineOptions({ inheritAttrs: false })

const props = defineProps({
  modelValue: { type: [Array, Object], default: null },
  multiple: Boolean,
  // ({ search, page, page_size }) => Promise<{ items, pagination }>
  fetcher: { type: Function, required: true },
  // (name) => Promise<{ id, name }>؛ اگر ندهی گزینه‌ی افزودن نمایش داده نمی‌شود (مثلاً در فیلترها)
  creator: { type: Function, default: null },
  placeholder: { type: String, default: 'انتخاب کنید' },
  searchPlaceholder: { type: String, default: 'جستجو…' },
  noun: { type: String, default: 'مورد' }, // «ناشر» / «نویسنده» برای متن‌ها
  invalid: Boolean,
  clearable: { type: Boolean, default: true },
})
const emit = defineEmits(['update:modelValue', 'created'])

const toast = useToastStore()

const root = ref(null)
const trigger = ref(null)
const searchInput = ref(null)
const listEl = ref(null)

const open = ref(false)
const search = ref('')
const items = ref([])
const page = ref(1)
const hasNext = ref(false)
const loading = ref(false)
const loadingMore = ref(false)
const loadError = ref('')
const creating = ref(false)
const active = ref(-1) // ردیف فعال با کیبورد

let timer = null
let requestId = 0
let lastQuery = null

// ---------- derived ----------
const selected = computed(() => {
  if (props.multiple) return Array.isArray(props.modelValue) ? props.modelValue : []
  return props.modelValue && !Array.isArray(props.modelValue) ? [props.modelValue] : []
})
const isSelected = (item) => selected.value.some((s) => s.id === item.id)

const trimmed = computed(() => search.value.trim())
const exactMatch = computed(() => {
  const q = trimmed.value.toLowerCase()
  const same = (x) => (x.name || '').trim().toLowerCase() === q
  return items.value.some(same) || selected.value.some(same)
})
const canCreate = computed(() => !!props.creator && !!trimmed.value && !exactMatch.value)
const rowCount = computed(() => items.value.length + (canCreate.value ? 1 : 0))
const hasValue = computed(() => selected.value.length > 0)

// ---------- fetching ----------
async function load(reset = true) {
  const id = ++requestId
  lastQuery = trimmed.value
  loadError.value = ''
  if (reset) {
    loading.value = true
    loadingMore.value = false
    active.value = -1
  } else {
    loadingMore.value = true
  }
  try {
    const nextPage = reset ? 1 : page.value + 1
    const res = await props.fetcher({ search: trimmed.value, page: nextPage, page_size: COMBOBOX_PAGE_SIZE })
    if (id !== requestId) return
    items.value = reset ? res.items : [...items.value, ...res.items]
    page.value = nextPage
    hasNext.value = !!res.pagination?.has_next
  } catch {
    if (id !== requestId) return
    loadError.value = 'دریافت فهرست ناموفق بود.'
  } finally {
    if (id === requestId) {
      loading.value = false
      loadingMore.value = false
    }
  }
}

watch(search, () => {
  if (!open.value || trimmed.value === lastQuery) return
  clearTimeout(timer)
  timer = setTimeout(() => load(true), SEARCH_DEBOUNCE_MS)
})

// ---------- open / close ----------
async function openPanel() {
  if (open.value) return
  search.value = ''
  items.value = []
  hasNext.value = false
  open.value = true
  load(true)
  await nextTick()
  searchInput.value?.focus()
}
function closePanel() {
  open.value = false
  clearTimeout(timer)
}
function toggle() {
  if (open.value) closePanel()
  else openPanel()
}

// ---------- selecting ----------
function pick(item) {
  if (props.multiple) {
    const next = isSelected(item) ? selected.value.filter((s) => s.id !== item.id) : [...selected.value, item]
    emit('update:modelValue', next)
  } else {
    emit('update:modelValue', item)
    closePanel()
    nextTick(() => trigger.value?.focus())
  }
}
function remove(item) {
  emit('update:modelValue', selected.value.filter((s) => s.id !== item.id))
}
function clear() {
  emit('update:modelValue', props.multiple ? [] : null)
}

async function create() {
  if (!canCreate.value || creating.value) return
  creating.value = true
  try {
    const item = await props.creator(trimmed.value)
    emit('created', item)
    if (props.multiple) {
      emit('update:modelValue', [...selected.value, item])
      search.value = '' // watcher، لیست را دوباره می‌خواند تا مورد جدید هم دیده شود
    } else {
      emit('update:modelValue', item)
      closePanel()
    }
  } catch (e) {
    const err = parseApiError(e)
    toast.error(firstMessage(err.fields.name) || err.message)
  } finally {
    creating.value = false
  }
}

// ---------- keyboard ----------
function onSearchKeydown(e) {
  if (e.key === 'ArrowDown') {
    e.preventDefault()
    active.value = Math.min(active.value + 1, rowCount.value - 1)
  } else if (e.key === 'ArrowUp') {
    e.preventDefault()
    active.value = Math.max(active.value - 1, 0)
  } else if (e.key === 'Enter') {
    e.preventDefault() // جلوگیری از submit شدن فرمِ دربرگیرنده
    if (active.value >= 0 && active.value < items.value.length) pick(items.value[active.value])
    else if (canCreate.value) create()
    else if (items.value.length === 1) pick(items.value[0])
  } else if (e.key === 'Escape') {
    e.preventDefault()
    closePanel()
    trigger.value?.focus()
  }
}
function onTriggerKeydown(e) {
  if (e.target !== e.currentTarget) return // کلید روی دکمه‌ی ✕ چیپ‌ها را خودشان مدیریت می‌کنند
  if (e.key === 'Enter' || e.key === ' ' || e.key === 'ArrowDown') {
    e.preventDefault()
    openPanel()
  }
}
watch(active, async () => {
  await nextTick()
  listEl.value?.querySelector('.is-active')?.scrollIntoView({ block: 'nearest' })
})

// ---------- click outside ----------
// composedPath() لحظه‌ی کلیک را نگه می‌دارد؛ contains(e.target) وقتی دکمه‌ی ✕ چیپ حذف می‌شود (و از DOM درمی‌آید) اشتباه می‌کند
function onDocClick(e) {
  if (!open.value || !root.value) return
  if (!e.composedPath().includes(root.value)) closePanel()
}
onMounted(() => document.addEventListener('click', onDocClick))
onBeforeUnmount(() => {
  document.removeEventListener('click', onDocClick)
  clearTimeout(timer)
})
</script>

<template>
  <div ref="root" class="combo">
    <div
      ref="trigger"
      v-bind="$attrs"
      class="combo__btn"
      :class="{ 'is-invalid': invalid, 'is-open': open }"
      role="combobox"
      tabindex="0"
      aria-haspopup="listbox"
      :aria-expanded="open"
      @click="toggle"
      @keydown="onTriggerKeydown"
    >
      <div class="combo__value">
        <template v-if="hasValue">
          <template v-if="multiple">
            <span v-for="s in selected" :key="s.id" class="chip">
              <span class="chip__text">{{ s.name }}</span>
              <button type="button" class="chip__x" :aria-label="`حذف ${s.name}`" @click.stop="remove(s)"><X /></button>
            </span>
          </template>
          <span v-else class="combo__text">{{ selected[0].name }}</span>
        </template>
        <span v-else class="combo__placeholder">{{ placeholder }}</span>
      </div>

      <button
        v-if="!multiple && hasValue && clearable"
        type="button"
        class="combo__clear"
        aria-label="پاک کردن انتخاب"
        @click.stop="clear"
      ><X /></button>
      <ChevronDown class="combo__icon" aria-hidden="true" />
    </div>

    <div v-if="open" class="panel">
      <div class="panel__search">
        <Search aria-hidden="true" />
        <input
          ref="searchInput"
          v-model="search"
          class="panel__input"
          type="text"
          :placeholder="searchPlaceholder"
          autocomplete="off"
          @keydown="onSearchKeydown"
        />
        <BaseSpinner v-if="loading" size="sm" />
      </div>

      <ul ref="listEl" class="panel__list" role="listbox" :aria-multiselectable="multiple || undefined">
        <li v-for="(item, i) in items" :key="item.id" role="option" :aria-selected="isSelected(item)">
          <button
            type="button"
            class="panel__item"
            :class="{ 'is-active': i === active }"
            @click="pick(item)"
            @mousemove="active = i"
          >
            <span v-if="multiple" class="panel__check" :class="{ 'is-on': isSelected(item) }"><Check v-if="isSelected(item)" /></span>
            <span class="panel__name">{{ item.name }}</span>
            <Check v-if="!multiple && isSelected(item)" class="panel__tick" />
          </button>
        </li>

        <li v-if="canCreate">
          <button
            type="button"
            class="panel__item panel__item--create"
            :class="{ 'is-active': active === items.length }"
            :disabled="creating"
            @click="create"
            @mousemove="active = items.length"
          >
            <span class="panel__plus"><BaseSpinner v-if="creating" size="sm" /><Plus v-else /></span>
            <span class="panel__name">افزودن {{ noun }} «{{ trimmed }}»</span>
          </button>
        </li>
      </ul>

      <p v-if="loadError" class="panel__msg panel__msg--error" role="alert">
        {{ loadError }}
        <button type="button" class="panel__link" @click="load(true)">تلاش دوباره</button>
      </p>
      <p v-else-if="!loading && !items.length && !canCreate" class="panel__msg">
        {{ trimmed ? `${noun}ی با این نام پیدا نشد.` : `هنوز ${noun}ی ثبت نشده است.` }}
      </p>

      <button v-if="hasNext" type="button" class="panel__more" :disabled="loadingMore" @click="load(false)">
        <BaseSpinner v-if="loadingMore" size="sm" />
        نمایش بیشتر
      </button>
    </div>
  </div>
</template>

<style scoped>
.combo { position: relative; }
.combo__btn {
  display: flex;
  align-items: center;
  justify-content: space-between;
  gap: var(--space-2);
  width: 100%;
  min-height: var(--control-height);
  padding: var(--space-1) var(--space-3);
  background: var(--color-surface);
  border: 1px solid var(--color-border-strong);
  border-radius: var(--input-radius);
  font-size: var(--text-base);
  text-align: start;
  cursor: pointer;
  transition: border-color var(--transition), box-shadow var(--transition);
}
.combo__btn:focus-visible, .combo__btn.is-open { border-color: var(--color-primary); box-shadow: 0 0 0 3px var(--color-focus-ring); outline: 0; }
.combo__btn.is-invalid { border-color: var(--color-danger); }

.combo__value { display: flex; flex: 1; flex-wrap: wrap; align-items: center; gap: var(--space-1); min-width: 0; }
.combo__text { overflow: hidden; text-overflow: ellipsis; white-space: nowrap; }
.combo__placeholder { color: var(--color-text-subtle); }
.combo__icon { flex-shrink: 0; width: 1rem; height: 1rem; color: var(--color-text-subtle); }
.combo__clear { display: grid; place-items: center; flex-shrink: 0; width: 1.4rem; height: 1.4rem; padding: 0; background: transparent; border: 0; border-radius: var(--radius-sm); color: var(--color-text-subtle); }
.combo__clear:hover { background: var(--color-surface-muted); color: var(--color-text); }
.combo__clear :deep(svg) { width: 0.9rem; height: 0.9rem; }

.chip { display: inline-flex; align-items: center; gap: var(--space-1); max-width: 100%; padding: 2px var(--space-1) 2px var(--space-2); background: var(--color-primary-soft); border: 1px solid var(--color-border); border-radius: var(--radius-full); font-size: var(--text-sm); }
.chip__text { overflow: hidden; text-overflow: ellipsis; white-space: nowrap; }
.chip__x { display: grid; place-items: center; width: 1.1rem; height: 1.1rem; padding: 0; background: transparent; border: 0; border-radius: var(--radius-full); color: var(--color-text-muted); }
.chip__x:hover { background: var(--color-surface-muted); color: var(--color-text); }
.chip__x :deep(svg) { width: 0.8rem; height: 0.8rem; }

.panel {
  position: absolute;
  inset-inline: 0;
  inset-block-start: calc(100% + var(--space-1));
  z-index: var(--z-dropdown);
  background: var(--color-surface);
  border: 1px solid var(--color-border);
  border-radius: var(--radius-md);
  box-shadow: var(--shadow-md);
}
.panel__search { display: flex; align-items: center; gap: var(--space-2); padding: var(--space-2) var(--space-3); border-bottom: 1px solid var(--color-border); color: var(--color-text-subtle); }
.panel__search :deep(svg) { flex-shrink: 0; width: 1rem; height: 1rem; }
.panel__input { flex: 1; min-width: 0; height: var(--control-height-sm); padding: 0; background: transparent; border: 0; outline: 0; font-size: var(--text-sm); color: var(--color-text); }
.panel__input::placeholder { color: var(--color-text-subtle); }

.panel__list { max-height: 240px; margin: 0; padding: var(--space-1); overflow-y: auto; list-style: none; }
.panel__item { display: flex; align-items: center; gap: var(--space-2); width: 100%; padding: var(--space-2); background: transparent; border: 0; border-radius: var(--radius-sm); text-align: start; font-size: var(--text-sm); }
.panel__item:hover, .panel__item.is-active { background: var(--color-surface-muted); }
.panel__item:disabled { opacity: 0.6; }
.panel__name { flex: 1; min-width: 0; overflow: hidden; text-overflow: ellipsis; white-space: nowrap; }
.panel__tick { flex-shrink: 0; width: 1rem; height: 1rem; color: var(--color-primary); }
.panel__check { display: grid; place-items: center; flex-shrink: 0; width: 1.05rem; height: 1.05rem; border: 1px solid var(--color-border-strong); border-radius: var(--radius-sm); }
.panel__check.is-on { background: var(--color-primary); border-color: var(--color-primary); color: var(--color-on-primary); }
.panel__check :deep(svg) { width: 0.75rem; height: 0.75rem; }
.panel__item--create { color: var(--color-primary); font-weight: var(--weight-medium); }
.panel__plus { display: grid; place-items: center; flex-shrink: 0; width: 1.05rem; height: 1.05rem; }
.panel__plus :deep(svg) { width: 1rem; height: 1rem; }

.panel__msg { padding: var(--space-3); font-size: var(--text-sm); color: var(--color-text-muted); }
.panel__msg--error { color: var(--color-danger); }
.panel__link { margin-inline-start: var(--space-2); padding: 0; background: transparent; border: 0; color: var(--color-primary); text-decoration: underline; font-size: inherit; }
.panel__more { display: flex; align-items: center; justify-content: center; gap: var(--space-2); width: 100%; padding: var(--space-2); background: transparent; border: 0; border-top: 1px solid var(--color-border); font-size: var(--text-sm); color: var(--color-text-muted); }
.panel__more:hover:not(:disabled) { background: var(--color-surface-muted); color: var(--color-text); }
</style>
