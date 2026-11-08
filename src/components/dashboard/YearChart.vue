<script setup>
import { computed } from 'vue'
import BaseCard from '@/components/ui/BaseCard.vue'
import BaseSelect from '@/components/ui/BaseSelect.vue'
import BaseSpinner from '@/components/ui/BaseSpinner.vue'
import { useDashboardFiltersStore } from '@/stores/dashboardFilters'
import { toFa, toFaDigits } from '@/utils/format'

const props = defineProps({
  data: { type: Object, default: null }, // خروجی books_by_year
  loading: Boolean,
  bucket: { type: [Number, String], required: true }, // v-model
})
const emit = defineEmits(['update:bucket'])

const filters = useDashboardFiltersStore()
const bucketOptions = [
  { value: '1', label: 'سالانه' },
  { value: '10', label: 'ده‌ساله' },
]

const items = computed(() => props.data?.items || [])
const maxCount = computed(() => Math.max(1, ...items.value.map((i) => i.count)))
function isActive(item) {
  return filters.yearFrom === item.from && filters.yearTo === item.to
}
</script>

<template>
  <BaseCard title="روند انتشار بر اساس سال" description="روی هر ستون کلیک کنید تا بقیه‌ی کارت‌ها به همان بازه‌ی سال فیلتر شوند.">
    <template #actions>
      <BaseSelect :model-value="String(bucket)" :options="bucketOptions" aria-label="گروه‌بندی سال" @update:model-value="emit('update:bucket', Number($event))" />
    </template>

    <div class="transition-opacity duration-200" :class="{ 'opacity-55': loading && items.length }">
      <div v-if="loading && !items.length" class="grid place-items-center py-8"><BaseSpinner /></div>
      <p v-else-if="!items.length" class="py-4 text-sm text-[color:var(--color-text-muted)]">داده‌ای برای نمایش نیست.</p>

      <!-- اگر ستون‌ها زیاد باشند، افقی اسکرول می‌شود (مخصوصاً در موبایل) -->
      <div v-else class="flex items-end gap-2 h-40 sm:h-44 pt-5 overflow-x-auto">
        <button
            v-for="item in items"
            :key="item.label"
            type="button"
            class="group flex flex-col items-center justify-end flex-[1_0_2.25rem] h-full min-w-[2.25rem] p-0 bg-transparent border-0 rounded-sm"
            :title="`${item.label}: ${toFa(item.count)} کتاب`"
            @click="filters.toggleYearRange(item.from, item.to)"
        >
          <span class="mb-1 text-xs text-[color:var(--color-text-muted)]">{{ toFa(item.count) }}</span>
          <span
              class="w-full max-w-[1.5rem] rounded-t-sm transition-[height,background-color] duration-200"
              :class="isActive(item)
                ? 'bg-[var(--color-primary-active,var(--color-primary))] shadow-[0_0_0_2px_var(--color-primary-soft)]'
                : 'bg-[var(--color-primary)] group-hover:bg-[var(--color-primary-hover)]'"
              :style="{ height: `${Math.max(4, (item.count / maxCount) * 100)}%` }"
          />
          <span class="mt-2 text-xs whitespace-nowrap text-[color:var(--color-text-muted)]">{{ toFaDigits(item.label) }}</span>
        </button>
      </div>

      <p v-if="data && data.unknown" class="mt-3 text-xs text-[color:var(--color-text-muted)]">
        {{ toFa(data.unknown) }} کتاب بدون سال انتشار ثبت‌شده (در نمودار نیامده‌اند).
      </p>
    </div>
  </BaseCard>
</template>