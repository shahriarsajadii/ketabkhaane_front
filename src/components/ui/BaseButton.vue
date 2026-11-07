<script setup>
import { computed } from 'vue'
import { RouterLink } from 'vue-router'
import BaseSpinner from './BaseSpinner.vue'

const props = defineProps({
  variant: { type: String, default: 'secondary' }, // primary | secondary | ghost | danger
  size: { type: String, default: 'md' },           // sm | md | lg
  to: { type: [String, Object], default: null },
  type: { type: String, default: 'button' },
  loading: Boolean,
  disabled: Boolean,
  block: Boolean,
})

const tag = computed(() => (props.to ? RouterLink : 'button'))
const attrs = computed(() =>
  props.to ? { to: props.to } : { type: props.type, disabled: props.disabled || props.loading },
)
</script>

<template>
  <component
    :is="tag"
    v-bind="attrs"
    class="btn"
    :class="[`btn--${variant}`, `btn--${size}`, { 'btn--block': block }]"
  >
    <BaseSpinner v-if="loading" size="sm" />
    <slot v-else name="icon" />
    <span v-if="$slots.default" class="btn__label"><slot /></span>
  </component>
</template>

<style scoped>
.btn {
  display: inline-flex;
  align-items: center;
  justify-content: center;
  gap: var(--space-2);
  height: var(--control-height);
  padding-inline: var(--space-4);
  border: 1px solid transparent;
  border-radius: var(--btn-radius);
  font-size: var(--text-base);
  font-weight: var(--weight-medium);
  line-height: 1;
  white-space: nowrap;
  transition: background var(--transition), border-color var(--transition), color var(--transition), box-shadow var(--transition);
}
.btn :deep(svg) { width: 1.1em; height: 1.1em; flex-shrink: 0; }
.btn--block { display: flex; width: 100%; }

.btn--sm { height: var(--control-height-sm); padding-inline: var(--space-3); font-size: var(--text-sm); }
.btn--lg { height: var(--control-height-lg); padding-inline: var(--space-6); font-size: var(--text-md); }

.btn--primary { background: var(--color-primary); color: var(--color-on-primary); }
.btn--primary:hover:not(:disabled) { background: var(--color-primary-hover); }
.btn--primary:active:not(:disabled) { background: var(--color-primary-active); }

.btn--secondary { background: var(--color-surface); color: var(--color-text); border-color: var(--color-border-strong); }
.btn--secondary:hover:not(:disabled) { background: var(--color-surface-hover); border-color: var(--color-text-subtle); }

.btn--ghost { background: transparent; color: var(--color-text-muted); padding-inline: var(--space-2); }
.btn--ghost:hover:not(:disabled) { background: var(--color-surface-muted); color: var(--color-text); }

.btn--danger { background: var(--color-danger); color: #fff; }
.btn--danger:hover:not(:disabled) { filter: brightness(0.92); }

.btn:disabled { opacity: 0.5; }
</style>
