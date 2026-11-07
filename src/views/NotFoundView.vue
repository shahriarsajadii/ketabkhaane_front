<script setup>
import BaseButton from '@/components/ui/BaseButton.vue'
</script>

<template>
  <section class="nf container">
    <p class="nf__code">۴۰۴</p>
    <h1 class="nf__title">صفحه‌ای که دنبالش بودید پیدا نشد</h1>
    <BaseButton variant="primary" to="/">بازگشت به صفحه‌ی اصلی</BaseButton>
  </section>
</template>

<style scoped>
.nf { display: flex; flex: 1; flex-direction: column; align-items: center; justify-content: center; gap: var(--space-4); padding-block: var(--space-24); text-align: center; }
.nf__code { font-size: var(--text-4xl); font-weight: var(--weight-bold); color: var(--color-text-subtle); }
.nf__title { font-size: var(--text-xl); }
</style>
