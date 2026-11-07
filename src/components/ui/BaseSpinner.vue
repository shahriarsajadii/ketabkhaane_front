<script setup>
defineProps({ size: { type: String, default: 'md' } })
</script>

<template>
  <span class="spinner" :class="`spinner--${size}`" role="status" aria-label="در حال بارگذاری" />
</template>

<style scoped>
.spinner {
  display: inline-block;
  width: 1.5rem;
  height: 1.5rem;
  border: 2px solid var(--color-border-strong);
  border-top-color: var(--color-primary);
  border-radius: var(--radius-full);
  animation: spin 0.7s linear infinite;
}
.spinner--sm { width: 1rem; height: 1rem; }
.spinner--lg { width: 2.25rem; height: 2.25rem; border-width: 3px; }
@keyframes spin { to { transform: rotate(360deg); } }
</style>
