<script setup>
import { computed } from 'vue'
import BaseCard from '@/components/ui/BaseCard.vue'
import BaseSelect from '@/components/ui/BaseSelect.vue'
import BaseSpinner from '@/components/ui/BaseSpinner.vue'
import { toFa } from '@/utils/format'

// نمودار میله‌ایِ افقیِ «N مورد برتر»، با قابلیت کلیک روی هر میله برای کراس‌فیلتر
const props = defineProps({
  title: { type: String, required: true },
  description: String,
  data: { type: Object, default: null }, // خروجی _top_n: { items, total_items, limit }
  loading: Boolean,
  activeIds: { type: Array, default: () => [] },
  limit: { type: [Number, String], required: true }, // v-model
  clickable: { type: Boolean, default: true },
  linkTo: { type: Function, default: null }, // (item) => route، اگر داده شود به‌جای کلیک برای فیلتر، لینک می‌شود
  emptyText: { type: String, default: 'داده‌ای برای نمایش نیست.' },
  extraLabel: { type: Function, default: null }, // (item) => string، برای جزئیات اضافه کنار نام
})
const emit = defineEmits(['update:limit', 'bar-click'])

const limitOptions = [
  { value: '10', label: 'برتر ۱۰' },
  { value: '20', label: 'برتر ۲۰' },
  { value: '50', label: 'برتر ۵۰' },
  { value: 'all', label: 'همه' },
]

const items = computed(() => props.data?.items || [])
const maxCount = computed(() => Math.max(1, ...items.value.map((i) => i.count)))

// رشته‌های کامل تا Tailwind همه‌ی کلاس‌ها را اسکن کند
const rowBase = 'grid grid-cols-[1fr_auto] gap-x-3 gap-y-1 w-full px-2 py-1 border rounded-sm text-start sm:grid-cols-[minmax(6rem,10rem)_1fr_auto] sm:items-center'
const rowActive = 'border-[color:var(--color-primary)] bg-[var(--color-primary-soft)]'
const rowIdle = 'border-transparent bg-transparent'
const rowHover = 'cursor-pointer hover:bg-[var(--color-surface-muted)]'

function rowClass(item) {
  if (props.activeIds.includes(item.id)) return [rowBase, rowActive, (props.clickable || props.linkTo) && 'cursor-pointer']
  return [rowBase, rowIdle, (props.clickable || props.linkTo) && rowHover]
}
</script>

<template>
  <BaseCard :title="title" :description="description">
    <template #actions>
      <BaseSelect
          :model-value="String(limit)"
          :options="limitOptions"
          aria-label="تعداد نمایش"
          @update:model-value="emit('update:limit', $event === 'all' ? 'all' : Number($event))"
      />
    </template>

    <div class="transition-opacity duration-200" :class="{ 'opacity-55': loading && items.length }">
      <div v-if="loading && !items.length" class="grid place-items-center py-8"><BaseSpinner /></div>
      <p v-else-if="!items.length" class="py-4 text-sm text-[color:var(--color-text-muted)]">{{ emptyText }}</p>

      <ul v-else class="flex flex-col gap-2 m-0 p-0 list-none">
        <li v-for="item in items" :key="item.id">
          <component
              :is="linkTo ? 'RouterLink' : (clickable ? 'button' : 'div')"
              :type="!linkTo && clickable ? 'button' : undefined"
              :to="linkTo ? linkTo(item) : undefined"
              :class="rowClass(item)"
              @click="!linkTo && clickable && emit('bar-click', item)"
          >
            <!-- موبایل: نام و عدد در یک خط، میله زیرشان | sm به بالا: هر سه در یک ردیف -->
            <span class="order-1 min-w-0 truncate text-sm">
              {{ item.name }}
              <span v-if="extraLabel && extraLabel(item)" class="ms-1 text-xs text-[color:var(--color-text-subtle)]">{{ extraLabel(item) }}</span>
            </span>
            <span class="order-3 col-span-2 relative h-[0.55rem] overflow-hidden rounded-full bg-[var(--color-surface-muted)] sm:order-2 sm:col-span-1">
              <span
                  class="absolute inset-y-0 start-0 rounded-full transition-[width] duration-200"
                  :class="activeIds.includes(item.id) ? 'bg-[var(--color-primary-active,var(--color-primary))]' : 'bg-[var(--color-primary)]'"
                  :style="{ width: `${(item.count / maxCount) * 100}%` }"
              />
            </span>
            <span class="order-2 min-w-[2.5rem] text-sm font-medium text-end sm:order-3">{{ toFa(item.count) }}</span>
          </component>
        </li>
      </ul>

      <p v-if="data && data.total_items > items.length" class="mt-3 text-xs text-[color:var(--color-text-muted)]">
        و {{ toFa(data.total_items - items.length) }} مورد دیگر — برای دیدن همه «همه» را انتخاب کنید.
      </p>
    </div>
  </BaseCard>
</template>