<script setup>
import { BookCopy, BookOpen, Building2, Layers, Tag, Users } from 'lucide-vue-next'
import { useDashboardFiltersStore } from '@/stores/dashboardFilters'
import { toFa } from '@/utils/format'

const props = defineProps({
  data: { type: Object, default: null },
  loading: Boolean,
})
const filters = useDashboardFiltersStore()

const cards = [
  { key: 'books', label: 'کتاب', icon: BookOpen },
  { key: 'copies', label: 'نسخه', icon: Layers },
  { key: 'authors', label: 'نویسنده', icon: Users },
  { key: 'categories', label: 'دسته‌بندی', icon: Tag },
  { key: 'series', label: 'مجموعه', icon: Layers },
  { key: 'publishers', label: 'ناشر', icon: Building2 },
]

// رشته‌های کامل تا Tailwind همه‌ی کلاس‌ها را اسکن کند
const cardBase = 'flex items-center gap-3 min-w-0 p-3 sm:p-4 border rounded-[var(--card-radius)] text-start'
const cardIdle = 'border-[color:var(--color-border)] bg-[var(--color-surface)]'
const cardActive = 'border-[color:var(--color-primary)] bg-[var(--color-primary-soft)]'
const cardClickable = 'cursor-pointer transition-colors duration-200 hover:bg-[var(--color-surface-muted)]'

const iconBase = 'grid place-items-center w-10 h-10 shrink-0 rounded-full [&_svg]:w-[1.1rem] [&_svg]:h-[1.1rem]'
const iconNeutral = 'bg-[var(--color-surface-muted)] text-[color:var(--color-text-muted)]'
const iconWarning = 'bg-[var(--color-warning-soft)] text-[color:var(--color-warning)]'
const iconSuccess = 'bg-[var(--color-success-soft)] text-[color:var(--color-success)]'

function clickableClass(active) {
  return [cardBase, 'transition-colors duration-200 cursor-pointer', active ? cardActive : `${cardIdle} hover:bg-[var(--color-surface-muted)]`]
}
</script>

<template>
  <!-- موبایل: ۲ ستون | md به بالا: ۴ ستون (۸ کارت = ۲ ردیف کامل) -->
  <div class="grid grid-cols-2 gap-2 sm:gap-3 mb-5 md:grid-cols-4">
    <div v-for="c in cards" :key="c.key" :class="[cardBase, cardIdle]">
      <span :class="[iconBase, iconNeutral]"><component :is="c.icon" /></span>
      <div class="flex flex-col min-w-0">
        <span class="text-lg font-bold leading-snug">{{ loading && !data ? '…' : toFa(data?.[c.key] ?? 0) }}</span>
        <span class="text-xs text-[color:var(--color-text-muted)] truncate">{{ c.label }}</span>
      </div>
    </div>

    <!-- کارت‌های قابل‌کلیک امانت: مثل یک Slicer روی وضعیت نسخه‌ها عمل می‌کنند -->
    <button type="button" :class="clickableClass(filters.isLoaned === true)" @click="filters.toggleLoaned(true)">
      <span :class="[iconBase, iconWarning]"><BookCopy /></span>
      <div class="flex flex-col min-w-0">
        <span class="text-lg font-bold leading-snug">{{ loading && !data ? '…' : toFa(data?.loaned_copies ?? 0) }}</span>
        <span class="text-xs text-[color:var(--color-text-muted)] truncate">امانت داده‌شده</span>
      </div>
    </button>
    <button type="button" :class="clickableClass(filters.isLoaned === false)" @click="filters.toggleLoaned(false)">
      <span :class="[iconBase, iconSuccess]"><BookCopy /></span>
      <div class="flex flex-col min-w-0">
        <span class="text-lg font-bold leading-snug">{{ loading && !data ? '…' : toFa(data?.available_copies ?? 0) }}</span>
        <span class="text-xs text-[color:var(--color-text-muted)] truncate">موجود در قفسه</span>
      </div>
    </button>
  </div>
</template>