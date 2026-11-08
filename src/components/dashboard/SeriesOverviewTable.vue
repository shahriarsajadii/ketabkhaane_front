<script setup>
import { ref } from 'vue'
import { ChevronDown } from 'lucide-vue-next'
import BaseCard from '@/components/ui/BaseCard.vue'
import BaseSelect from '@/components/ui/BaseSelect.vue'
import BaseSpinner from '@/components/ui/BaseSpinner.vue'
import { toFa, toFaDigits } from '@/utils/format'

const props = defineProps({
  data: { type: Object, default: null }, // خروجی series_overview
  loading: Boolean,
  activeIds: { type: Array, default: () => [] },
  limit: { type: [Number, String], required: true },
})
const emit = defineEmits(['update:limit', 'row-click'])

const limitOptions = [
  { value: '10', label: 'برتر ۱۰' },
  { value: '20', label: 'برتر ۲۰' },
  { value: 'all', label: 'همه' },
]

const expanded = ref(new Set())
function toggleExpand(id) {
  const next = new Set(expanded.value)
  next.has(id) ? next.delete(id) : next.add(id)
  expanded.value = next
}
</script>

<template>
  <BaseCard title="مجموعه‌ها" description="کتاب‌هایی که جلدهای یک مجموعه‌اند (مثلاً دهخدا)؛ روی نام مجموعه کلیک کنید تا فیلتر شود.">
    <template #actions>
      <BaseSelect
          :model-value="String(limit)"
          :options="limitOptions"
          aria-label="تعداد نمایش مجموعه‌ها"
          @update:model-value="emit('update:limit', $event === 'all' ? 'all' : Number($event))"
      />
    </template>

    <div class="transition-opacity duration-200" :class="{ 'opacity-55': loading && data?.items?.length }">
      <div v-if="loading && !data?.items?.length" class="grid place-items-center py-8"><BaseSpinner /></div>
      <p v-else-if="!data?.items?.length" class="py-4 text-sm text-[color:var(--color-text-muted)]">هنوز مجموعه‌ای ثبت نشده است.</p>

      <ul v-else class="flex flex-col gap-1 m-0 p-0 list-none">
        <li
            v-for="s in data.items"
            :key="s.id"
            class="border rounded-sm"
            :class="activeIds.includes(s.id) ? 'border-[color:var(--color-primary)] bg-[var(--color-primary-soft)]' : 'border-transparent'"
        >
          <div class="flex items-center gap-2 p-2">
            <button
                type="button"
                class="grid place-items-center w-6 h-6 shrink-0 bg-transparent border-0 text-[color:var(--color-text-subtle)]"
                :aria-expanded="expanded.has(s.id)"
                aria-label="نمایش جلدها"
                @click="toggleExpand(s.id)"
            >
              <ChevronDown class="w-4 h-4 transition-transform duration-200" :class="{ 'rotate-180': expanded.has(s.id) }" />
            </button>
            <button
                type="button"
                class="flex-1 min-w-0 truncate bg-transparent border-0 p-0 text-start text-sm font-medium cursor-pointer hover:underline"
                @click="emit('row-click', s)"
            >{{ s.title }}</button>
            <span class="shrink-0 whitespace-nowrap text-[11px] sm:text-xs text-[color:var(--color-text-muted)]">
              {{ toFa(s.books_count) }} جلد · {{ toFa(s.copies_count) }} نسخه
            </span>
          </div>

          <ul v-if="expanded.has(s.id)" class="flex flex-wrap gap-2 m-0 mb-2 pb-2 pe-2 ps-3 sm:ps-9 list-none">
            <li v-for="b in s.books" :key="b.id" class="max-w-full">
              <RouterLink
                  :to="`/books/${b.id}/edit`"
                  class="flex items-center gap-2 px-2 py-[3px] bg-[var(--color-surface-muted)] border border-[color:var(--color-border)] rounded-[var(--chip-radius)] text-xs hover:border-[color:var(--color-primary)]"
              >
                <span class="truncate">{{ b.volume_number ? `جلد ${toFaDigits(b.volume_number)}` : b.title }}</span>
                <span class="shrink-0 text-[color:var(--color-text-muted)]">{{ toFa(b.copies_count) }} نسخه</span>
              </RouterLink>
            </li>
          </ul>
        </li>
      </ul>
    </div>
  </BaseCard>
</template>