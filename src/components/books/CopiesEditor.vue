<script setup>
import { computed } from 'vue'
import { Minus, Plus } from 'lucide-vue-next'
import BaseCard from '@/components/ui/BaseCard.vue'
import BaseSelect from '@/components/ui/BaseSelect.vue'
import { ROW_MAX, SHELF_MAX } from '@/config/app'
import { normalizeDigits, toFa, toFaDigits } from '@/utils/format'

const props = defineProps({
  modelValue: { type: Array, required: true }, // آدرس‌ها: یک رشته برای هر نسخه
  errors: { type: Object, default: () => ({}) }, // { [index]: message }
  listError: String,
  max: { type: Number, default: 100 },
})
const emit = defineEmits(['update:modelValue'])

const count = computed(() => props.modelValue.length)

// آدرس هر نسخه «قفسه-ردیف» است، مثلاً 01-05. مقدار ناقص (فقط قفسه یا فقط ردیف) هم نگه داشته می‌شود: «01-» یا «-05»
const pad = (n) => String(n).padStart(2, '0')
const range = (max) => Array.from({ length: max }, (_, i) => ({ value: pad(i + 1), label: toFaDigits(pad(i + 1)) }))
const shelfOptions = range(SHELF_MAX)
const rowOptions = range(ROW_MAX)

function parse(address) {
  const m = /^(\d{1,2})?-(\d{1,2})?$/.exec(normalizeDigits(address).trim())
  if (!m) return { shelf: '', row: '', legacy: (address || '').trim() } // آدرس متنیِ قدیمی
  return { shelf: m[1] ? pad(m[1]) : '', row: m[2] ? pad(m[2]) : '', legacy: '' }
}
const parsed = computed(() => props.modelValue.map(parse))

function setPart(index, part, value) {
  const cur = parsed.value[index]
  const next = { shelf: cur.shelf, row: cur.row, [part]: value }
  setAt(index, next.shelf || next.row ? `${next.shelf}-${next.row}` : '')
}

function resize(n) {
  const size = Math.min(Math.max(n, 1), props.max)
  const list = props.modelValue.slice(0, size)
  while (list.length < size) list.push('')
  emit('update:modelValue', list)
}
function setAt(index, value) {
  const list = [...props.modelValue]
  list[index] = value
  emit('update:modelValue', list)
}
</script>

<template>
  <BaseCard>
    <div class="top">
      <div class="head">
        <h2 class="head__title">نسخه‌ها و محل نگهداری</h2>
        <p class="head__desc">
          برای هر نسخه، شماره‌ی قفسه و ردیف را (هرکدام از ۱ تا {{ toFa(SHELF_MAX) }}) انتخاب کنید. برای {{ toFa(count) }} نسخه، {{ toFa(count) }} آدرس لازم است.
        </p>
      </div>

      <div class="stepper-wrap">
        <span class="stepper-label">تعداد نسخه <span aria-hidden="true">*</span></span>
        <div class="stepper">
          <button type="button" class="stepper__btn" :disabled="count <= 1" aria-label="کم کردن نسخه" @click="resize(count - 1)"><Minus /></button>
          <output class="stepper__value" aria-live="polite">{{ toFa(count) }}</output>
          <button type="button" class="stepper__btn" :disabled="count >= max" aria-label="اضافه کردن نسخه" @click="resize(count + 1)"><Plus /></button>
        </div>
      </div>
    </div>

    <p v-if="listError" class="list-error" role="alert">{{ listError }}</p>

    <div class="rows">
      <div v-for="(address, i) in modelValue" :key="i" class="row">
        <span class="row__label">نسخه {{ toFa(i + 1) }} <span aria-hidden="true">*</span></span>
        <div class="row__field">
          <div class="pair">
            <BaseSelect
              :model-value="parsed[i].shelf"
              :options="shelfOptions"
              placeholder="قفسه"
              :invalid="!!errors[i]"
              :aria-label="`قفسه نسخه ${toFa(i + 1)}`"
              @update:model-value="setPart(i, 'shelf', $event)"
            />
            <BaseSelect
              :model-value="parsed[i].row"
              :options="rowOptions"
              placeholder="ردیف"
              :invalid="!!errors[i]"
              :aria-label="`ردیف نسخه ${toFa(i + 1)}`"
              @update:model-value="setPart(i, 'row', $event)"
            />
          </div>
          <p v-if="parsed[i].legacy" class="row__hint">آدرس قبلی: «{{ parsed[i].legacy }}» — قفسه و ردیف را انتخاب کنید.</p>
          <p v-else-if="parsed[i].shelf && parsed[i].row" class="row__hint">قفسه {{ toFaDigits(parsed[i].shelf) }}، ردیف {{ toFaDigits(parsed[i].row) }}</p>
          <p v-if="errors[i]" class="row__error" role="alert">{{ errors[i] }}</p>
        </div>
      </div>
    </div>
  </BaseCard>
</template>

<style scoped>
.top { display: flex; align-items: flex-start; justify-content: space-between; flex-wrap: wrap; gap: var(--space-4); margin-bottom: var(--space-5); }
.head__title { font-size: var(--text-md); }
.head__desc { margin-top: var(--space-1); font-size: var(--text-sm); color: var(--color-text-muted); }

.stepper-wrap { display: flex; flex-direction: column; gap: var(--space-2); }
.stepper-label { font-size: var(--text-sm); font-weight: var(--weight-medium); }
.stepper { display: inline-flex; align-items: center; overflow: hidden; border: 1px solid var(--color-border-strong); border-radius: var(--radius-md); }
.stepper__btn { display: grid; place-items: center; width: 2.5rem; height: var(--control-height); padding: 0; background: var(--color-surface); border: 0; }
.stepper__btn:hover:not(:disabled) { background: var(--color-surface-muted); }
.stepper__btn:disabled { opacity: 0.4; }
.stepper__btn :deep(svg) { width: 1rem; height: 1rem; }
.stepper__value { min-width: 3rem; text-align: center; font-weight: var(--weight-bold); border-inline: 1px solid var(--color-border); line-height: var(--control-height); }

.list-error { margin-bottom: var(--space-3); font-size: var(--text-xs); color: var(--color-danger); }
.rows { display: flex; flex-direction: column; gap: var(--space-4); }
.row { display: grid; grid-template-columns: 120px 1fr; align-items: start; gap: var(--space-4); }
.pair { display: grid; grid-template-columns: 1fr 1fr; gap: var(--space-3); max-width: 24rem; }
.row__hint { margin-top: var(--space-1); font-size: var(--text-xs); color: var(--color-text-muted); }
.row__label { padding-top: var(--space-2); font-size: var(--text-sm); font-weight: var(--weight-medium); }
.row__error { margin-top: var(--space-1); font-size: var(--text-xs); color: var(--color-danger); }

@media (max-width: 560px) {
  .row { grid-template-columns: 1fr; gap: var(--space-1); }
  .row__label { padding-top: 0; }
}
</style>
