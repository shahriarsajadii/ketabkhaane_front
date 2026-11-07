<script setup>
defineProps({
  modelValue: { type: String, default: '' },
  rows: { type: Number, default: 4 },
  invalid: Boolean,
})
defineEmits(['update:modelValue'])
</script>

<template>
  <textarea
    class="textarea"
    :class="{ 'is-invalid': invalid }"
    :rows="rows"
    :value="modelValue"
    @input="$emit('update:modelValue', $event.target.value)"
  />
</template>

<style scoped>
.textarea {
  width: 100%;
  padding: var(--space-3);
  resize: vertical;
  background: var(--color-surface);
  border: 1px solid var(--color-border-strong);
  border-radius: var(--input-radius);
  font-size: var(--text-base);
  line-height: var(--leading-normal);
  transition: border-color var(--transition), box-shadow var(--transition);
}
.textarea::placeholder { color: var(--color-text-subtle); }
.textarea:focus { outline: 0; border-color: var(--color-primary); box-shadow: 0 0 0 3px var(--color-focus-ring); }
.textarea.is-invalid { border-color: var(--color-danger); }
</style>
