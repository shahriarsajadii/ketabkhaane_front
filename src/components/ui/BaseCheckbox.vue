<script setup>
defineProps({
  modelValue: Boolean,
  indeterminate: Boolean,
  label: String,
})
defineEmits(['update:modelValue'])
</script>

<template>
  <label class="check">
    <input
      type="checkbox"
      class="check__box"
      :checked="modelValue"
      :indeterminate="indeterminate"
      @change="$emit('update:modelValue', $event.target.checked)"
    />
    <span v-if="label || $slots.default" class="check__label"><slot>{{ label }}</slot></span>
  </label>
</template>

<style scoped>
.check { display: inline-flex; align-items: center; gap: var(--space-2); cursor: pointer; }
.check__box {
  width: 1.05rem;
  height: 1.05rem;
  margin: 0;
  accent-color: var(--color-primary);
  cursor: pointer;
}
.check__label { font-size: var(--text-sm); color: var(--color-text); }
</style>
