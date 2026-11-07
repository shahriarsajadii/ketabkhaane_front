<script setup>
defineProps({ tone: { type: String, default: 'neutral' } }) // neutral | success | danger | warning
</script>

<template>
  <span class="badge" :class="`badge--${tone}`"><slot /></span>
</template>

<style scoped>
.badge {
  display: inline-flex;
  align-items: center;
  padding: 2px var(--space-3);
  border-radius: var(--chip-radius);
  font-size: var(--text-xs);
  font-weight: var(--weight-medium);
  white-space: nowrap;
}
.badge--neutral { background: var(--color-surface-muted); color: var(--color-text-muted); border: 1px solid var(--color-border); }
.badge--success { background: var(--color-success-soft); color: var(--color-success); }
.badge--danger { background: var(--color-danger-soft); color: var(--color-danger); }
.badge--warning { background: var(--color-warning-soft); color: var(--color-warning); }
</style>
