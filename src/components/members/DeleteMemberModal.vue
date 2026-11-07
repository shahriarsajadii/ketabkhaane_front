<script setup>
import { Info, Trash2 } from 'lucide-vue-next'
import BaseModal from '@/components/ui/BaseModal.vue'
import BaseButton from '@/components/ui/BaseButton.vue'
import { initials } from '@/utils/format'

const props = defineProps({
  modelValue: Boolean,
  member: { type: Object, default: null },
  loading: Boolean,
})
defineEmits(['update:modelValue', 'confirm'])
</script>

<template>
  <BaseModal :model-value="modelValue" size="sm" :closable="!loading" @update:model-value="$emit('update:modelValue', $event)">
    <template #header>
      <span class="icon"><Trash2 /></span>
      <h2 class="title">عضو حذف شود؟</h2>
      <p class="desc" v-if="member">آیا از حذف «{{ member.name }}» از فهرست اعضا مطمئن هستید؟</p>
    </template>

    <div v-if="member" class="member-card">
      <span class="avatar" aria-hidden="true">{{ initials(member.name || member.username) }}</span>
      <div class="member-card__text">
        <strong>{{ member.name }}</strong>
        <span class="bidi">{{ member.username }}</span>
      </div>
    </div>

    <p class="warn">
      <Info />
      <span>این عضو دیگر نمی‌تواند وارد سیستم شود. این عملیات قابل بازگشت نیست.</span>
    </p>

    <template #footer>
      <BaseButton :disabled="loading" @click="$emit('update:modelValue', false)">انصراف</BaseButton>
      <BaseButton variant="primary" :loading="loading" @click="$emit('confirm')">
        <template #icon><Trash2 /></template>
        بله، حذف عضو
      </BaseButton>
    </template>
  </BaseModal>
</template>

<style scoped>
.icon {
  display: grid;
  place-items: center;
  width: 2.5rem;
  height: 2.5rem;
  margin-bottom: var(--space-4);
  background: var(--color-surface-muted);
  border: 1px solid var(--color-border);
  border-radius: var(--radius-full);
}
.icon :deep(svg) { width: 1.1rem; height: 1.1rem; }
.title { font-size: var(--text-lg); }
.desc { margin-top: var(--space-1); font-size: var(--text-sm); color: var(--color-text-muted); }

.member-card {
  display: flex;
  align-items: center;
  gap: var(--space-3);
  padding: var(--space-3);
  border: 1px solid var(--color-border);
  border-radius: var(--radius-md);
}
.avatar {
  display: grid;
  place-items: center;
  width: 2.25rem;
  height: 2.25rem;
  flex-shrink: 0;
  background: var(--color-surface-muted);
  border: 1px solid var(--color-border);
  border-radius: var(--radius-full);
  font-size: var(--text-xs);
  font-weight: var(--weight-bold);
}
.member-card__text { display: flex; flex-direction: column; min-width: 0; font-size: var(--text-sm); }
.member-card__text span { color: var(--color-text-muted); }

.warn { display: flex; gap: var(--space-2); margin-top: var(--space-4); font-size: var(--text-xs); color: var(--color-text-muted); }
.warn :deep(svg) { flex-shrink: 0; width: 1rem; height: 1rem; margin-top: 2px; }
</style>
