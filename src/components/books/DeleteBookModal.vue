<script setup>
import { computed } from 'vue'
import { Info, Trash2 } from 'lucide-vue-next'
import BaseModal from '@/components/ui/BaseModal.vue'
import BaseButton from '@/components/ui/BaseButton.vue'
import BookCover from './BookCover.vue'
import { toFa } from '@/utils/format'

const props = defineProps({
  modelValue: Boolean,
  books: { type: Array, default: () => [] },
  loading: Boolean,
})
defineEmits(['update:modelValue', 'confirm'])

const single = computed(() => (props.books.length === 1 ? props.books[0] : null))
const totalCopies = computed(() => props.books.reduce((sum, b) => sum + (b.count || 0), 0))
const preview = computed(() => props.books.slice(0, 5))
</script>

<template>
  <BaseModal :model-value="modelValue" size="sm" :closable="!loading" @update:model-value="$emit('update:modelValue', $event)">
    <template #header>
      <span class="icon"><Trash2 /></span>
      <h2 class="title">{{ single ? 'کتاب حذف شود؟' : 'کتاب‌های انتخاب‌شده حذف شوند؟' }}</h2>
      <p class="desc" v-if="single">آیا از حذف «{{ single.title }}» از فهرست کتاب‌ها مطمئن هستید؟</p>
      <p class="desc" v-else>آیا از حذف {{ toFa(books.length) }} کتاب انتخاب‌شده مطمئن هستید؟</p>
    </template>

    <div v-if="single" class="book-card">
      <BookCover :src="single.image" :alt="single.title" size="sm" />
      <div class="book-card__text">
        <strong>{{ single.title }}</strong>
        <span>{{ (single.authors || []).map((a) => a.name).join('، ') }} · {{ toFa(single.count) }} نسخه</span>
      </div>
    </div>
    <ul v-else class="list">
      <li v-for="b in preview" :key="b.id">{{ b.title }}</li>
      <li v-if="books.length > preview.length" class="list__more">و {{ toFa(books.length - preview.length) }} کتاب دیگر</li>
    </ul>

    <p class="warn">
      <Info />
      <span>اطلاعات کتاب و آدرس {{ totalCopies === 1 ? 'نسخه‌ی آن' : `هر ${toFa(totalCopies)} نسخه` }} حذف می‌شود. این عملیات قابل بازگشت نیست.</span>
    </p>

    <template #footer>
      <BaseButton :disabled="loading" @click="$emit('update:modelValue', false)">انصراف</BaseButton>
      <BaseButton variant="primary" :loading="loading" @click="$emit('confirm')">
        <template #icon><Trash2 /></template>
        {{ single ? 'بله، حذف کتاب' : 'بله، حذف کتاب‌ها' }}
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

.book-card {
  display: flex;
  align-items: center;
  gap: var(--space-3);
  padding: var(--space-3);
  border: 1px solid var(--color-border);
  border-radius: var(--radius-md);
}
.book-card__text { display: flex; flex-direction: column; min-width: 0; font-size: var(--text-sm); }
.book-card__text span { color: var(--color-text-muted); }

.list { margin: 0; padding: var(--space-3) var(--space-5); border: 1px solid var(--color-border); border-radius: var(--radius-md); font-size: var(--text-sm); }
.list__more { list-style: none; margin-inline-start: calc(var(--space-5) * -1); color: var(--color-text-muted); }

.warn { display: flex; gap: var(--space-2); margin-top: var(--space-4); font-size: var(--text-xs); color: var(--color-text-muted); }
.warn :deep(svg) { flex-shrink: 0; width: 1rem; height: 1rem; margin-top: 2px; }
</style>
