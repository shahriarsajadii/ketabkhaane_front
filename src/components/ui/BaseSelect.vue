<script setup>
import { computed } from 'vue'
import { ChevronDown } from 'lucide-vue-next'

defineOptions({ inheritAttrs: false })

const props = defineProps({
  modelValue: { type: [String, Number], default: '' },
  options: { type: Array, default: () => [] }, // [{ value, label }]
  placeholder: { type: String, default: undefined }, // گزینه‌ی خالی ("همه …")
  invalid: Boolean,
})
const emit = defineEmits(['update:modelValue'])

// همه‌ی مقدارها رشته‌اند تا v-model روی select درست کار کند
const inner = computed({
  get: () => String(props.modelValue ?? ''),
  set: (v) => emit('update:modelValue', v),
})
</script>

<template>
  <div class="select" :class="{ 'is-invalid': invalid }">
    <select v-model="inner" class="select__control" v-bind="$attrs">
      <option v-if="placeholder !== undefined" value="">{{ placeholder }}</option>
      <option v-for="o in options" :key="o.value" :value="String(o.value)">{{ o.label }}</option>
    </select>
    <ChevronDown class="select__icon" aria-hidden="true" />
  </div>
</template>

<style scoped>
.select { position: relative; }
.select__control {
  width: 100%;
  height: var(--control-height);
  padding-inline: var(--space-3) var(--space-8);
  appearance: none;
  background: var(--color-surface);
  border: 1px solid var(--color-border-strong);
  border-radius: var(--input-radius);
  font-size: var(--text-base);
  transition: border-color var(--transition), box-shadow var(--transition);
}
.select__control:focus { outline: 0; border-color: var(--color-primary); box-shadow: 0 0 0 3px var(--color-focus-ring); }
.select.is-invalid .select__control { border-color: var(--color-danger); }
.select__icon {
  position: absolute;
  inset-block: 0;
  inset-inline-end: var(--space-3);
  margin-block: auto;
  width: 1rem;
  height: 1rem;
  color: var(--color-text-subtle);
  pointer-events: none;
}
</style>
