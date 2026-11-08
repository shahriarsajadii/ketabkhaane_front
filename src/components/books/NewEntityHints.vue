<script setup>
/**
 * نام‌هایی که از کتابخانه‌ی ملی آمده‌اند ولی هنوز در دیتابیس ذخیره نشده‌اند
 * (نویسنده، ناشر، موضوع/دسته‌بندی).
 *
 * برای هر نام:
 *   - اگر دقیقاً همان در دیتابیس باشد، خودکار همان انتخاب می‌شود (autoPick)
 *   - در غیر این صورت نام‌های مشابهِ موجود نشان داده می‌شود تا کاربر بتواند یکی را انتخاب کند
 *   - اگر کاربر چیزی انتخاب نکند، همان نام جدید همراه ثبت کتاب ساخته می‌شود
 *
 * رویدادها:
 *   pick(name, item)  → کاربر (یا autoPick) یکی از موارد موجود را برگزید
 *   remove(name)      → کاربر این نامِ جدید را نمی‌خواهد
 */
import { onBeforeUnmount, reactive, watch } from 'vue'
import { Plus, X } from 'lucide-vue-next'
import BaseSpinner from '@/components/ui/BaseSpinner.vue'
import { nameKey, rankSimilar, searchTokens } from '@/utils/opac'

const props = defineProps({
  names: { type: Array, default: () => [] }, // نام‌های جدید (string)
  noun: { type: String, required: true },     // «نویسنده» / «ناشر» / «دسته‌بندی»
  // ({ search, page, page_size }) => Promise<{ items: [{ id, name }] }>
  fetcher: { type: Function, required: true },
  // true = fetcher همه‌ی گزینه‌ها را یکجا می‌دهد (مثل دسته‌بندی‌ها) و جستجوی سمت سرور ندارد
  local: Boolean,
  autoPick: { type: Boolean, default: true },
})
const emit = defineEmits(['pick', 'remove'])

// name → { loading, items: [{ item, exact }] }
const state = reactive({})
let alive = true
onBeforeUnmount(() => { alive = false })

async function candidatesFor(name) {
  const calls = props.local
    ? [props.fetcher({ search: '', page: 1, page_size: 1000 })]
    : searchTokens(name).map((t) => props.fetcher({ search: t, page: 1, page_size: 10 }))
  const responses = await Promise.allSettled(calls)

  const byId = new Map()
  for (const r of responses) {
    if (r.status !== 'fulfilled') continue
    for (const item of r.value?.items || []) byId.set(item.id, item)
  }
  return rankSimilar(name, [...byId.values()])
}

async function load(name) {
  const key = nameKey(name)
  if (!key || state[key]) return
  state[key] = { loading: true, items: [] }
  const ranked = await candidatesFor(name)
  if (!alive) return

  const exact = ranked.find((r) => r.exact)
  if (exact && props.autoPick && props.names.includes(name)) {
    delete state[key]
    emit('pick', name, exact.item)
    return
  }
  state[key] = { loading: false, items: ranked }
}

watch(
  () => props.names,
  (names) => names.forEach(load),
  { immediate: true, deep: true },
)

const info = (name) => state[nameKey(name)] || { loading: true, items: [] }
</script>

<template>
  <ul v-if="names.length" class="hints" aria-live="polite">
    <li v-for="name in names" :key="name" class="hint">
      <div class="hint__head">
        <span class="hint__new"><Plus aria-hidden="true" /> جدید</span>
        <span class="hint__name">{{ name }}</span>
        <button type="button" class="hint__x" :aria-label="`حذف ${name}`" @click="emit('remove', name)"><X /></button>
      </div>

      <div class="hint__body">
        <template v-if="info(name).loading">
          <BaseSpinner size="sm" />
          <span class="hint__text">در حال بررسی {{ noun }}های مشابه…</span>
        </template>
        <template v-else-if="info(name).items.length">
          <span class="hint__text">مشابه در دیتابیس (برای انتخاب کلیک کنید):</span>
          <button
            v-for="s in info(name).items"
            :key="s.item.id"
            type="button"
            class="hint__chip"
            @click="emit('pick', name, s.item)"
          >{{ s.item.name }}</button>
        </template>
        <span v-else class="hint__text">مشابهی در دیتابیس نیست؛ همراه ثبت کتاب ساخته می‌شود.</span>
      </div>
    </li>
  </ul>
</template>

<style scoped>
.hints { display: flex; flex-direction: column; gap: var(--space-2); margin: var(--space-2) 0 0; padding: 0; list-style: none; }
.hint { padding: var(--space-2) var(--space-3); background: var(--color-warning-soft); border: 1px solid var(--color-warning-border); border-radius: var(--radius-md); }

.hint__head { display: flex; align-items: center; gap: var(--space-2); }
.hint__new { display: inline-flex; align-items: center; gap: 2px; flex-shrink: 0; padding: 1px var(--space-2); background: var(--color-surface); border: 1px solid var(--color-warning-border); border-radius: var(--radius-full); font-size: var(--text-xs); color: var(--color-warning); }
.hint__new :deep(svg) { width: 0.75rem; height: 0.75rem; }
.hint__name { flex: 1; min-width: 0; overflow: hidden; text-overflow: ellipsis; white-space: nowrap; font-size: var(--text-sm); font-weight: var(--weight-medium); }
.hint__x { display: grid; place-items: center; flex-shrink: 0; width: 1.3rem; height: 1.3rem; padding: 0; background: transparent; border: 0; border-radius: var(--radius-full); color: var(--color-text-muted); }
.hint__x:hover { background: var(--color-surface); color: var(--color-text); }
.hint__x :deep(svg) { width: 0.85rem; height: 0.85rem; }

.hint__body { display: flex; flex-wrap: wrap; align-items: center; gap: var(--space-1) var(--space-2); margin-top: var(--space-2); }
.hint__text { font-size: var(--text-xs); color: var(--color-text-muted); }
.hint__chip { padding: 2px var(--space-3); background: var(--color-surface); border: 1px solid var(--color-border-strong); border-radius: var(--radius-full); font-size: var(--text-sm); }
.hint__chip:hover { border-color: var(--color-primary); background: var(--color-primary-soft); }
</style>
