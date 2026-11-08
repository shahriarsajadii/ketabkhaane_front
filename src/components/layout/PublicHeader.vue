<script setup>
import BrandLogo from './BrandLogo.vue'
import BaseButton from '@/components/ui/BaseButton.vue'
import ThemeToggle from '@/components/ui/ThemeToggle.vue'
import { useAuthStore } from '@/stores/auth'

const auth = useAuthStore()
</script>

<template>
  <header class="public-header">
    <div class="public-header__inner container">
      <BrandLogo to="/" />
      <div class="public-header__spacer" />
      <ThemeToggle />
      <BaseButton v-if="auth.isAuthenticated" variant="primary" to="/books">ورود به کتابخانه</BaseButton>
      <BaseButton v-else variant="primary" to="/login">ورود</BaseButton>
    </div>
  </header>
</template>

<style scoped>
.public-header { background: var(--color-surface); border-bottom: 1px solid var(--color-border); }
.public-header__inner { display: flex; align-items: center; gap: var(--space-4); height: var(--header-height); }
.public-header__spacer { flex: 1; }
</style>
