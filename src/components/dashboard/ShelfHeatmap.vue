<script setup>
import { computed } from 'vue'
import BaseCard from '@/components/ui/BaseCard.vue'
import BaseSpinner from '@/components/ui/BaseSpinner.vue'
import { toFa, toFaDigits } from '@/utils/format'

// پراکندگی نسخه‌ها در قفسه‌ها: هیت‌مپ قفسه × ردیف (فقط نمایشی؛ آدرس در فیلترهای سراسری پشتیبانی نمی‌شود)
const props = defineProps({
  data: { type: Object, default: null }, // خروجی copies_by_shelf
  loading: Boolean,
})

const cellMap = computed(() => {
  const map = new Map()
  for (const cell of props.data?.heatmap?.cells || []) map.set(`${cell.shelf}-${cell.row}`, cell.count)
  return map
})
const maxShelf = computed(() => props.data?.heatmap?.max_shelf || 0)
const maxRow = computed(() => props.data?.heatmap?.max_row || 0)
const maxCount = computed(() => props.data?.heatmap?.max_count || 1)

// تعداد ستون‌ها پویاست، پس این یکی را inline می‌گذاریم (کلاس Tailwind پویا اسکن نمی‌شود)
const gridStyle = computed(() => ({
  gridTemplateColumns: `2.25rem repeat(${maxRow.value}, minmax(1.1rem, 1fr))`,
}))

function opacityFor(count) {
  if (!count) return 0
  return 0.15 + 0.85 * (count / maxCount.value)
}
const pad = (n) => String(n).padStart(2, '0')
</script>

<template>
  <BaseCard title="پراکندگی نسخه‌ها در قفسه‌ها" description="هر خانه یک «قفسه-ردیف» است؛ رنگ پررنگ‌تر یعنی نسخه‌ی بیشتر.">
    <div class="transition-opacity duration-200" :class="{ 'opacity-55': loading && data }">
      <div v-if="loading && !data" class="grid place-items-center py-8"><BaseSpinner /></div>
      <template v-else-if="data && maxShelf">
        <!-- روی صفحه‌ی کوچک، خود هیت‌مپ افقی اسکرول می‌شود و صفحه سرریز نمی‌کند -->
        <div class="overflow-x-auto pb-1">
          <div class="grid gap-[3px] min-w-max sm:min-w-0" :style="gridStyle">
            <div />
            <div v-for="row in maxRow" :key="`rh-${row}`" class="flex items-center justify-center text-[10px] text-[color:var(--color-text-subtle)]">
              {{ toFaDigits(pad(row)) }}
            </div>

            <template v-for="shelf in maxShelf" :key="`shelf-${shelf}`">
              <div class="flex items-center justify-end pe-1 text-[10px] text-[color:var(--color-text-subtle)]">
                {{ toFaDigits(pad(shelf)) }}
              </div>
              <div
                  v-for="row in maxRow"
                  :key="`c-${shelf}-${row}`"
                  class="aspect-square min-w-[1.1rem] rounded-[2px] border border-[color:var(--color-border)] bg-[var(--color-primary)]"
                  :style="{ opacity: opacityFor(cellMap.get(`${shelf}-${row}`)) }"
                  :title="`قفسه ${toFaDigits(pad(shelf))}، ردیف ${toFaDigits(pad(row))}: ${toFa(cellMap.get(`${shelf}-${row}`) || 0)} نسخه`"
              />
            </template>
          </div>
        </div>
        <p class="mt-4 text-xs text-[color:var(--color-text-muted)]">
          {{ toFa(data.total_copies) }} نسخه در {{ toFa(maxShelf) }} قفسه
          <span v-if="data.invalid_address_copies"> — {{ toFa(data.invalid_address_copies) }} نسخه آدرس نامعتبر دارند</span>
        </p>
      </template>
      <p v-else class="py-4 text-sm text-[color:var(--color-text-muted)]">هنوز نسخه‌ای ثبت نشده است.</p>
    </div>
  </BaseCard>
</template>