<script setup>
import { X } from 'lucide-vue-next'
import { useToastStore } from '@/stores/toast'

const toast = useToastStore()
</script>

<template>
  <div class="toasts" aria-live="polite">
    <TransitionGroup name="toast">
      <div v-for="t in toast.items" :key="t.id" class="toast" :class="`toast--${t.type}`" role="status">
        <span class="toast__msg">{{ t.message }}</span>
        <button type="button" class="toast__close" aria-label="بستن" @click="toast.dismiss(t.id)"><X /></button>
      </div>
    </TransitionGroup>
  </div>
</template>

<style scoped>
.toasts {
  position: fixed;
  inset-block-end: var(--space-6);
  inset-inline-start: var(--space-6);
  z-index: var(--z-toast);
  display: flex;
  flex-direction: column;
  gap: var(--space-2);
  width: min(380px, calc(100vw - 2rem));
}
.toast {
  display: flex;
  align-items: center;
  gap: var(--space-3);
  padding: var(--space-3) var(--space-4);
  background: var(--color-primary);
  color: var(--color-on-primary);
  border-radius: var(--radius-md);
  box-shadow: var(--shadow-md);
  font-size: var(--text-sm);
}
.toast--success { background: var(--color-success); }
.toast--error { background: var(--color-danger); }
.toast--warning { background: var(--color-warning); }
.toast__msg { flex: 1; }
.toast__close { display: grid; place-items: center; padding: 0; background: transparent; border: 0; color: inherit; opacity: 0.8; }
.toast__close:hover { opacity: 1; }
.toast__close :deep(svg) { width: 1rem; height: 1rem; }

.toast-enter-active, .toast-leave-active { transition: all var(--transition); }
.toast-enter-from, .toast-leave-to { opacity: 0; transform: translateY(8px); }
</style>
