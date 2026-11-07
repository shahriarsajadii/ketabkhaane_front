<script setup>
import { BookOpen } from 'lucide-vue-next'
import { APP_NAME } from '@/config/app'

defineProps({ to: { type: [String, Object], default: '/' } })
</script>

<template>
  <RouterLink :to="to" class="brand">
    <span class="brand__name">{{ APP_NAME }}</span>
    <BookOpen class="brand__icon" aria-hidden="true" />
  </RouterLink>
</template>

<style scoped>
.brand { display: inline-flex; align-items: center; gap: var(--space-2); font-size: var(--text-xl); font-weight: var(--weight-bold); }
.brand__icon { width: 1.6rem; height: 1.6rem; }
</style>
