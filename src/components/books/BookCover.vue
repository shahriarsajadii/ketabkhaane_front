<script setup>
import { BookOpen } from 'lucide-vue-next'

defineProps({
  src: String,
  alt: { type: String, default: '' },
  size: { type: String, default: 'md' }, // sm | md | lg
  // آیکن جایگزین وقتی عکس نیست (مثلاً برای ناشر/نویسنده). پیش‌فرض: کتاب
  // (عمداً default: BookOpen نیست؛ ویو تابعِ default را «factory» حساب می‌کند و آیکن lucide خودش تابع است)
  icon: { type: [Object, Function], default: null },
})
</script>

<template>
  <div class="cover" :class="`cover--${size}`">
    <img v-if="src" :src="src" :alt="alt" loading="lazy" />
    <component :is="icon || BookOpen" v-else class="cover__icon" aria-hidden="true" />
  </div>
</template>

<style scoped>
.cover {
  display: grid;
  place-items: center;
  flex-shrink: 0;
  overflow: hidden;
  background: var(--color-surface-muted);
  border: 1px solid var(--color-border);
  border-radius: var(--cover-radius);
  color: var(--color-text-subtle);
}
.cover img { width: 100%; height: 100%; object-fit: cover; }
.cover--sm { width: 2.5rem; height: 3.25rem; }
.cover--md { width: 3.5rem; height: 4.5rem; }
.cover--lg { width: 100%; aspect-ratio: 3 / 4; }
.cover__icon { width: 40%; height: 40%; }
</style>
