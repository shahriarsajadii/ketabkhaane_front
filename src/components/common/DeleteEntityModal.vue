<script setup>
/**
 * مودال تأیید حذف برای موجودیت‌های ساده (ناشر، نویسنده، ...) — هم‌شکل DeleteBookModal
 */
import { computed } from 'vue'
import { Info, Trash2 } from 'lucide-vue-next'
import BaseModal from '@/components/ui/BaseModal.vue'
import BaseButton from '@/components/ui/BaseButton.vue'
import BookCover from '@/components/books/BookCover.vue'
import { toFa } from '@/utils/format'

const props = defineProps({
  modelValue: Boolean,
  items: { type: Array, default: () => [] }, // [{ id, name, image, books_count }]
  noun: { type: String, required: true },        // «ناشر»
  nounPlural: { type: String, required: true },  // «ناشران»
  icon: { type: [Object, Function], default: null },
  warning: { type: String, default: '' },
  loading: Boolean,
})
defineEmits(['update:modelValue', 'confirm'])

const single = computed(() => (props.items.length === 1 ? props.items[0] : null))
const preview = computed(() => props.items.slice(0, 5))
</script>

<template>
  <BaseModal :model-value="modelValue" size="sm" :closable="!loading" @update:model-value="$emit('update:modelValue', $event)">
    <template #header>
      <span class="icon"><Trash2 /></span>
      <h2 class="title">{{ single ? `${noun} حذف شود؟` : `${nounPlural} انتخاب‌شده حذف شوند؟` }}</h2>
      <p v-if="single" class="desc">آیا از حذف «{{ single.name }}» مطمئن هستید؟</p>
      <p v-else class="desc">آیا از حذف {{ toFa(items.length) }} {{ noun }} انتخاب‌شده مطمئن هستید؟</p>
    </template>

    <div v-if="single" class="card">
      <BookCover :src="single.image" :alt="single.name" size="sm" :icon="icon" />
      <div class="card__text">
        <strong>{{ single.name }}</strong>
        <span>{{ toFa(single.books_count || 0) }} کتاب</span>
      </div>
    </div>
    <ul v-else class="list">
      <li v-for="item in preview" :key="item.id">{{ item.name }}</li>
      <li v-if="items.length > preview.length" class="list__more">و {{ toFa(items.length - preview.length) }} مورد دیگر</li>
    </ul>

    <p class="warn">
      <Info />
      <span>{{ warning ? `${warning} ` : '' }}این عملیات قابل بازگشت نیست.</span>
    </p>

    <template #footer>
      <BaseButton :disabled="loading" @click="$emit('update:modelValue', false)">انصراف</BaseButton>
      <BaseButton variant="primary" :loading="loading" @click="$emit('confirm')">
        <template #icon><Trash2 /></template>
        {{ single ? `بله، حذف ${noun}` : `بله، حذف ${nounPlural}` }}
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

.card { display: flex; align-items: center; gap: var(--space-3); padding: var(--space-3); border: 1px solid var(--color-border); border-radius: var(--radius-md); }
.card__text { display: flex; flex-direction: column; min-width: 0; font-size: var(--text-sm); }
.card__text span { color: var(--color-text-muted); }

.list { margin: 0; padding: var(--space-3) var(--space-5); border: 1px solid var(--color-border); border-radius: var(--radius-md); font-size: var(--text-sm); }
.list__more { list-style: none; margin-inline-start: calc(var(--space-5) * -1); color: var(--color-text-muted); }

.warn { display: flex; gap: var(--space-2); margin-top: var(--space-4); font-size: var(--text-xs); color: var(--color-text-muted); }
.warn :deep(svg) { flex-shrink: 0; width: 1rem; height: 1rem; margin-top: 2px; }
</style>
