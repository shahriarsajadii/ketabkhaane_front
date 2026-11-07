<script setup>
import { normalizeDigits, toFaDigits } from '@/utils/format'

defineOptions({ inheritAttrs: false })

const props = defineProps({
  modelValue: { type: [String, Number], default: '' },
  type: { type: String, default: 'text' },
  invalid: Boolean,
  disabled: Boolean,
  // فقط رقم؛ در ورودی فارسی نمایش داده می‌شود ولی لاتین emit می‌شود
  numeric: Boolean,
})
const emit = defineEmits(['update:modelValue'])

function onInput(e) {
  if (props.numeric) {
    const latin = normalizeDigits(e.target.value).replace(/\D/g, '')
    e.target.value = toFaDigits(latin)
    emit('update:modelValue', latin)
  } else {
    emit('update:modelValue', e.target.value)
  }
}
</script>

<template>
  <div class="input" :class="{ 'is-invalid': invalid, 'is-disabled': disabled }">
    <span v-if="$slots.prefix" class="input__affix"><slot name="prefix" /></span>
    <input
      v-bind="$attrs"
      class="input__control"
      :type="type"
      :value="numeric ? toFaDigits(modelValue) : modelValue"
      :disabled="disabled"
      :inputmode="numeric ? 'numeric' : undefined"
      @input="onInput"
    />
    <span v-if="$slots.suffix" class="input__affix"><slot name="suffix" /></span>
  </div>
</template>

<style scoped>
.input {
  display: flex;
  align-items: center;
  gap: var(--space-2);
  height: var(--control-height);
  padding-inline: var(--space-3);
  background: var(--color-surface);
  border: 1px solid var(--color-border-strong);
  border-radius: var(--input-radius);
  transition: border-color var(--transition), box-shadow var(--transition);
}
.input:focus-within { border-color: var(--color-primary); box-shadow: 0 0 0 3px var(--color-focus-ring); }
.input.is-invalid { border-color: var(--color-danger); }
.input.is-disabled { background: var(--color-surface-muted); }
.input__control {
  flex: 1;
  min-width: 0;
  height: 100%;
  padding: 0;
  border: 0;
  outline: 0;
  background: transparent;
  font-size: var(--text-base);
}
.input__control::placeholder { color: var(--color-text-subtle); }
.input__affix { display: inline-flex; align-items: center; color: var(--color-text-subtle); }
.input__affix :deep(svg) { width: 1.1rem; height: 1.1rem; }
</style>
