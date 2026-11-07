<script setup>
defineProps({
  label: String,
  required: Boolean,
  error: String,
  hint: String,
  forId: String,
})
</script>

<template>
  <div class="field" :class="{ 'has-error': !!error }">
    <label v-if="label" class="field__label" :for="forId">
      {{ label }}<span v-if="required" class="field__req" aria-hidden="true"> *</span>
    </label>
    <slot />
    <p v-if="error" class="field__error" role="alert">{{ error }}</p>
    <p v-else-if="hint" class="field__hint">{{ hint }}</p>
  </div>
</template>

<style scoped>
.field { display: flex; flex-direction: column; gap: var(--space-2); min-width: 0; }
.field__label { font-size: var(--text-sm); font-weight: var(--weight-medium); color: var(--color-text); }
.field__req { color: var(--color-text-muted); }
.field__error { font-size: var(--text-xs); color: var(--color-danger); }
.field__hint { font-size: var(--text-xs); color: var(--color-text-muted); }
</style>
