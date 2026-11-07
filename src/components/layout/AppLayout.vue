<script setup>
import AppHeader from './AppHeader.vue'
import { APP_NAME, APP_TAGLINE } from '@/config/app'
import AppFooter from "@/components/layout/AppFooter.vue";
</script>

<template>
  <div class="shell">
    <AppHeader />
    <main class="shell__main container"><slot /></main>
    <AppFooter/>
  </div>
</template>

<style scoped>
.shell { display: flex; flex-direction: column; min-height: 100vh; }
.shell__main { flex: 1; padding-block: var(--space-8) var(--space-10); }
.shell__footer { padding-block: var(--space-6); font-size: var(--text-xs); color: var(--color-text-muted); }
</style>
