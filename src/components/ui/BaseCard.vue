<script setup>
defineProps({
  title: String,
  description: String,
  flush: Boolean, // بدون padding داخلی (برای جدول)
})
</script>

<template>
  <section class="card">
    <header v-if="title || $slots.actions" class="card__head">
      <div>
        <h2 v-if="title" class="card__title">{{ title }}</h2>
        <p v-if="description" class="card__desc">{{ description }}</p>
      </div>
      <div v-if="$slots.actions" class="card__actions"><slot name="actions" /></div>
    </header>
    <div class="card__body" :class="{ 'card__body--flush': flush }"><slot /></div>
  </section>
</template>

<style scoped>
.card {
  background: var(--color-surface);
  border: 1px solid var(--color-border);
  border-radius: var(--card-radius);
}
.card__head {
  display: flex;
  align-items: flex-start;
  justify-content: space-between;
  gap: var(--space-4);
  padding: var(--space-5) var(--space-6) 0;
}
.card__title { font-size: var(--text-md); }
.card__desc { margin-top: var(--space-1); font-size: var(--text-sm); color: var(--color-text-muted); }
.card__body { padding: var(--space-5) var(--space-6) var(--space-6); }
.card__body--flush { padding: 0; }
</style>
