<script setup>
/**
 * جستجو در کتابخانه‌ی ملی (opac.nlai.ir) با شابک یا عنوان.
 *  1) کاربر شابک/عنوان را وارد می‌کند → لیست نتایج
 *  2) روی یک نتیجه کلیک می‌کند → جزئیات کامل گرفته می‌شود
 *  3) رویداد  picked(detail)  با همان خروجی خامِ سرور emit می‌شود
 *     (تبدیل به فیلدهای فرم در BookFormView با mapOpacDetail انجام می‌شود)
 */
import { nextTick, ref, watch } from 'vue'
import { ChevronLeft, Search } from 'lucide-vue-next'
import BaseModal from '@/components/ui/BaseModal.vue'
import BaseButton from '@/components/ui/BaseButton.vue'
import BaseInput from '@/components/ui/BaseInput.vue'
import BaseSpinner from '@/components/ui/BaseSpinner.vue'
import { booksApi } from '@/api/books'
import { firstMessage, parseApiError } from '@/utils/errors'
import { normalizeDigits } from '@/utils/format'
import { normalizeText } from '@/utils/opac'

const props = defineProps({ modelValue: Boolean })
const emit = defineEmits(['update:modelValue', 'picked'])

const TYPES = [
  { value: 'shabak', label: 'شابک' },
  { value: 'title', label: 'عنوان' },
]

const type = ref('shabak')
const query = ref('')
const results = ref(null) // null = هنوز جستجو نشده | [] = نتیجه‌ای نبود
const searching = ref(false)
const loadingId = ref(null) // opac_id ی که جزئیاتش در حال دریافت است
const error = ref('')
const input = ref(null)

function reset() {
  type.value = 'shabak'
  query.value = ''
  results.value = null
  searching.value = false
  loadingId.value = null
  error.value = ''
}

watch(
  () => props.modelValue,
  async (open) => {
    if (!open) return
    reset()
    await nextTick()
    input.value?.$el?.querySelector('input')?.focus()
  },
)

function setType(value) {
  if (type.value === value) return
  type.value = value
  results.value = null
  error.value = ''
}

function close() {
  emit('update:modelValue', false)
}

async function search() {
  error.value = ''
  let value = normalizeText(query.value)
  // شابک را با ارقام لاتین می‌فرستیم (کاربر ممکن است فارسی تایپ کند)
  if (type.value === 'shabak') value = normalizeDigits(value)
  if (!value) {
    error.value = type.value === 'shabak' ? 'شابک کتاب را وارد کنید.' : 'عنوان کتاب را وارد کنید.'
    return
  }

  searching.value = true
  results.value = null
  try {
    results.value = await booksApi.searchOpac({ type: type.value, value })
  } catch (e) {
    const err = parseApiError(e)
    error.value = firstMessage(err.fields) || err.message
  } finally {
    searching.value = false
  }
}

async function pick(row) {
  if (loadingId.value || !row.opac_id) return
  error.value = ''
  loadingId.value = row.opac_id
  try {
    const detail = await booksApi.getOpacBook(row.opac_id)
    emit('picked', detail)
    close()
  } catch (e) {
    const err = parseApiError(e)
    error.value = err.status === 404 ? 'جزئیات این کتاب در کتابخانه‌ی ملی پیدا نشد.' : err.message
  } finally {
    loadingId.value = null
  }
}

// تاریخ نشر در داده‌ی ملی نشانه‌های جهت‌دهی دارد؛ فقط متن تمیز را نشان می‌دهیم
const clean = (v) => normalizeText(v).replace(/[.\s]+$/, '')
</script>

<template>
  <BaseModal
    :model-value="modelValue"
    title="ثبت کتاب از کتابخانه ملی"
    description="کتاب را با شابک یا عنوان جستجو و از میان نتایج انتخاب کنید."
    size="lg"
    @update:model-value="emit('update:modelValue', $event)"
  >
    <form class="search" novalidate @submit.prevent="search">
      <div class="seg" role="tablist" aria-label="نوع جستجو">
        <button
          v-for="t in TYPES"
          :key="t.value"
          type="button"
          role="tab"
          class="seg__btn"
          :class="{ 'is-active': type === t.value }"
          :aria-selected="type === t.value"
          @click="setType(t.value)"
        >{{ t.label }}</button>
      </div>

      <BaseInput
        ref="input"
        v-model="query"
        :class="{ bidi: type === 'shabak' }"
        :invalid="!!error && !results"
        :placeholder="type === 'shabak' ? 'مثلاً 978-600-993401-0' : 'عنوان کتاب را وارد کنید'"
        autocomplete="off"
      />

      <BaseButton type="submit" variant="primary" :loading="searching">
        <template #icon><Search /></template>
        جستجو
      </BaseButton>
    </form>

    <p v-if="error" class="msg msg--error" role="alert">{{ error }}</p>

    <div v-if="searching" class="state"><BaseSpinner size="lg" /><span>در حال جستجو در کتابخانه ملی…</span></div>

    <p v-else-if="results && !results.length" class="state">کتابی پیدا نشد. عبارت را تغییر دهید یا نوع جستجو را عوض کنید.</p>

    <ul v-else-if="results && results.length" class="list">
      <li v-for="(row, i) in results" :key="row.opac_id || i">
        <button type="button" class="row" :disabled="!!loadingId || !row.opac_id" @click="pick(row)">
          <span class="row__main">
            <span class="row__title">{{ clean(row.title) || 'بدون عنوان' }}</span>
            <span class="row__meta">
              <span v-if="clean(row.author)">{{ clean(row.author) }}</span>
              <span v-if="clean(row.publish_date)">سال نشر: {{ clean(row.publish_date) }}</span>
            </span>
          </span>
          <BaseSpinner v-if="loadingId === row.opac_id" size="sm" />
          <ChevronLeft v-else class="row__icon" aria-hidden="true" />
        </button>
      </li>
    </ul>

    <template #footer>
      <BaseButton :disabled="!!loadingId" @click="close">انصراف</BaseButton>
    </template>
  </BaseModal>
</template>

<style scoped>
.search { display: grid; grid-template-columns: auto minmax(0, 1fr) auto; align-items: center; gap: var(--space-3); }

.seg { display: inline-flex; padding: 2px; background: var(--color-surface-muted); border: 1px solid var(--color-border); border-radius: var(--btn-radius); }
.seg__btn { height: calc(var(--control-height) - 8px); padding-inline: var(--space-4); background: transparent; border: 0; border-radius: var(--radius-sm); font-size: var(--text-sm); color: var(--color-text-muted); }
.seg__btn.is-active { background: var(--color-surface); color: var(--color-text); font-weight: var(--weight-medium); box-shadow: var(--shadow-sm); }

.msg { margin-top: var(--space-3); font-size: var(--text-sm); }
.msg--error { color: var(--color-danger); }

.state { display: flex; flex-direction: column; align-items: center; gap: var(--space-3); padding: var(--space-10) var(--space-4); font-size: var(--text-sm); color: var(--color-text-muted); text-align: center; }

.list { max-height: 380px; margin: var(--space-4) 0 0; padding: 0; overflow-y: auto; list-style: none; border: 1px solid var(--color-border); border-radius: var(--radius-md); }
.list li + li { border-top: 1px solid var(--color-border); }
.row { display: flex; align-items: center; justify-content: space-between; gap: var(--space-3); width: 100%; padding: var(--space-3) var(--space-4); background: transparent; border: 0; text-align: start; }
.row:hover:not(:disabled) { background: var(--color-surface-hover); }
.row:disabled { opacity: 0.6; }
.row__main { display: flex; flex-direction: column; gap: var(--space-1); min-width: 0; }
.row__title { font-size: var(--text-base); font-weight: var(--weight-medium); }
.row__meta { display: flex; flex-wrap: wrap; gap: var(--space-1) var(--space-4); font-size: var(--text-xs); color: var(--color-text-muted); }
.row__icon { flex-shrink: 0; width: 1rem; height: 1rem; color: var(--color-text-subtle); }

@media (max-width: 560px) {
  .search { grid-template-columns: 1fr; }
  .seg { justify-self: start; }
}
</style>
