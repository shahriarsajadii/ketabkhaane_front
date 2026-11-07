<script setup>
import { computed } from 'vue'
import { ChevronLeft, ChevronRight } from 'lucide-vue-next'
import { toFa } from '@/utils/format'

const props = defineProps({
  page: { type: Number, default: 1 },
  totalPages: { type: Number, default: 1 },
})
const emit = defineEmits(['update:page'])

const pages = computed(() => {
  const total = props.totalPages
  const cur = props.page
  if (total <= 7) return Array.from({ length: total }, (_, i) => i + 1)
  const out = [1]
  const start = Math.max(2, cur - 1)
  const end = Math.min(total - 1, cur + 1)
  if (start > 2) out.push('…')
  for (let i = start; i <= end; i++) out.push(i)
  if (end < total - 1) out.push('…')
  out.push(total)
  return out
})

function go(p) {
  if (p < 1 || p > props.totalPages || p === props.page) return
  emit('update:page', p)
}
</script>

<template>
  <nav v-if="totalPages > 1" class="pagination" aria-label="صفحه‌بندی">
    <button type="button" class="pagination__btn" :disabled="page <= 1" aria-label="صفحه‌ی قبل" @click="go(page - 1)">
      <ChevronRight />
    </button>

    <template v-for="(p, i) in pages" :key="`${p}-${i}`">
      <span v-if="p === '…'" class="pagination__gap">…</span>
      <button
        v-else
        type="button"
        class="pagination__btn"
        :class="{ 'is-active': p === page }"
        :aria-current="p === page ? 'page' : undefined"
        @click="go(p)"
      >
        {{ toFa(p) }}
      </button>
    </template>

    <button type="button" class="pagination__btn" :disabled="page >= totalPages" aria-label="صفحه‌ی بعد" @click="go(page + 1)">
      <ChevronLeft />
    </button>
  </nav>
</template>

<style scoped>
.pagination { display: flex; align-items: center; gap: var(--space-2); }
.pagination__btn {
  display: grid;
  place-items: center;
  min-width: 2rem;
  height: 2rem;
  padding-inline: var(--space-2);
  background: var(--color-surface);
  border: 1px solid var(--color-border-strong);
  border-radius: var(--radius-md);
  font-size: var(--text-sm);
  transition: background var(--transition);
}
.pagination__btn:hover:not(:disabled):not(.is-active) { background: var(--color-surface-muted); }
.pagination__btn:disabled { opacity: 0.45; }
.pagination__btn.is-active { background: var(--color-primary); border-color: var(--color-primary); color: var(--color-on-primary); }
.pagination__btn :deep(svg) { width: 1rem; height: 1rem; }
.pagination__gap { padding-inline: var(--space-1); color: var(--color-text-subtle); }
</style>
