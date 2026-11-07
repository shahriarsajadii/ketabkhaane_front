<script setup>
import { nextTick, onBeforeUnmount, ref, watch } from 'vue'
import { X } from 'lucide-vue-next'

const props = defineProps({
  modelValue: Boolean,
  title: String,
  description: String,
  size: { type: String, default: 'md' }, // sm | md | lg
  closable: { type: Boolean, default: true },
})
const emit = defineEmits(['update:modelValue', 'close'])

const dialog = ref(null)

function close() {
  if (!props.closable) return
  emit('update:modelValue', false)
  emit('close')
}
function onKey(e) {
  if (e.key === 'Escape') close()
}

watch(
  () => props.modelValue,
  async (open) => {
    if (open) {
      document.addEventListener('keydown', onKey)
      document.body.style.overflow = 'hidden'
      await nextTick()
      dialog.value?.focus()
    } else {
      document.removeEventListener('keydown', onKey)
      document.body.style.overflow = ''
    }
  },
  { immediate: true },
)

onBeforeUnmount(() => {
  document.removeEventListener('keydown', onKey)
  document.body.style.overflow = ''
})
</script>

<template>
  <Teleport to="body">
    <Transition name="modal">
      <div v-if="modelValue" class="backdrop" @mousedown.self="close">
        <div
          ref="dialog"
          class="modal"
          :class="`modal--${size}`"
          role="dialog"
          aria-modal="true"
          :aria-label="title"
          tabindex="-1"
        >
          <button v-if="closable" type="button" class="modal__close" aria-label="بستن" @click="close">
            <X />
          </button>

          <header v-if="$slots.header || title" class="modal__header">
            <slot name="header">
              <h2 class="modal__title">{{ title }}</h2>
              <p v-if="description" class="modal__desc">{{ description }}</p>
            </slot>
          </header>

          <div class="modal__body"><slot /></div>

          <footer v-if="$slots.footer" class="modal__footer"><slot name="footer" /></footer>
        </div>
      </div>
    </Transition>
  </Teleport>
</template>

<style scoped>
.backdrop {
  position: fixed;
  inset: 0;
  z-index: var(--z-modal);
  display: flex;
  align-items: center;
  justify-content: center;
  padding: var(--space-4);
  overflow-y: auto;
  background: var(--color-overlay);
}
.modal {
  position: relative;
  width: 100%;
  max-height: calc(100vh - 2rem);
  display: flex;
  flex-direction: column;
  background: var(--color-surface);
  border-radius: var(--modal-radius);
  box-shadow: var(--shadow-lg);
  outline: 0;
}
.modal--sm { max-width: 440px; }
.modal--md { max-width: 560px; }
.modal--lg { max-width: 720px; }

.modal__close {
  position: absolute;
  inset-block-start: var(--space-4);
  inset-inline-end: var(--space-4);
  display: grid;
  place-items: center;
  width: 2rem;
  height: 2rem;
  padding: 0;
  background: transparent;
  border: 0;
  border-radius: var(--radius-md);
  color: var(--color-text-muted);
}
.modal__close:hover { background: var(--color-surface-muted); color: var(--color-text); }
.modal__close :deep(svg) { width: 1.1rem; height: 1.1rem; }

.modal__header { padding: var(--space-6) var(--space-6) 0; padding-inline-end: var(--space-12); }
.modal__title { font-size: var(--text-lg); }
.modal__desc { margin-top: var(--space-1); font-size: var(--text-sm); color: var(--color-text-muted); }
.modal__body { padding: var(--space-5) var(--space-6); overflow-y: auto; }
.modal__footer {
  display: flex;
  justify-content: flex-end;
  gap: var(--space-3);
  padding: var(--space-4) var(--space-6);
  border-top: 1px solid var(--color-border);
}

.modal-enter-active, .modal-leave-active { transition: opacity var(--transition); }
.modal-enter-active .modal, .modal-leave-active .modal { transition: transform var(--transition); }
.modal-enter-from, .modal-leave-to { opacity: 0; }
.modal-enter-from .modal, .modal-leave-to .modal { transform: translateY(8px) scale(0.98); }
</style>
