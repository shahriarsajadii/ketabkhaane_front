<script setup>
defineProps({
  title: { type: String, required: true },
  description: String,
  breadcrumbs: { type: Array, default: () => [] }, // [{ label, to? }]
})
</script>

<template>
  <div class="page-header">
    <nav v-if="breadcrumbs.length" class="crumbs" aria-label="مسیر">
      <template v-for="(c, i) in breadcrumbs" :key="i">
        <RouterLink v-if="c.to" :to="c.to" class="crumbs__item crumbs__item--link">{{ c.label }}</RouterLink>
        <span v-else class="crumbs__item" :aria-current="i === breadcrumbs.length - 1 ? 'page' : undefined">{{ c.label }}</span>
        <span v-if="i < breadcrumbs.length - 1" class="crumbs__sep" aria-hidden="true">/</span>
      </template>
    </nav>

    <div class="page-header__row">
      <div class="page-header__text">
        <h1 class="page-header__title">{{ title }}</h1>
        <p v-if="description" class="page-header__desc">{{ description }}</p>
      </div>
      <div v-if="$slots.actions" class="page-header__actions"><slot name="actions" /></div>
    </div>
  </div>
</template>

<style scoped>
.page-header { margin-bottom: var(--space-6); }
.crumbs { display: flex; flex-wrap: wrap; align-items: center; gap: var(--space-2); margin-bottom: var(--space-5); font-size: var(--text-xs); color: var(--color-text-muted); }
.crumbs__item--link:hover { color: var(--color-text); }
.crumbs__item[aria-current='page'] { color: var(--color-text); }
.crumbs__sep { color: var(--color-text-subtle); }
.page-header__row { display: flex; flex-wrap: wrap; align-items: center; justify-content: space-between; gap: var(--space-4); }
.page-header__text { min-width: 0; }
.page-header__title { font-size: var(--text-2xl); }
.page-header__desc { margin-top: var(--space-2); color: var(--color-text-muted); }
.page-header__actions { display: flex; flex-wrap: wrap; gap: var(--space-3); }

@media (max-width: 640px) {
  .page-header { margin-bottom: var(--space-5); }
  .page-header__title { font-size: var(--text-xl); }
  .page-header__row { flex-direction: column; align-items: stretch; }
  /* دکمه‌ها زیر عنوان، دوتا-دوتا کنار هم و هم‌عرض */
  .page-header__actions > :deep(*) { flex: 1 1 calc(50% - var(--space-3)); }
}
</style>