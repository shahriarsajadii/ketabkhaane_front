<script setup>
import PublicHeader from './PublicHeader.vue'
import AppFooter from "@/components/layout/AppFooter.vue";

</script>

<template>
  <div class="public">
    <PublicHeader />
    <main class="public__main"><slot /></main>

    <AppFooter/>

  </div>
</template>

<style scoped>
.public { display: flex; flex-direction: column; min-height: 100vh; }
.public__main { flex: 1; display: flex; flex-direction: column; }
.public__footer { padding-block: var(--space-6); font-size: var(--text-xs); color: var(--color-text-muted); }
</style>
