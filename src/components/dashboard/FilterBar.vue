<script setup>
import { computed, onMounted, ref } from 'vue'
import { SlidersHorizontal, X } from 'lucide-vue-next'
import MultiSelectFilter from './MultiSelectFilter.vue'
import BaseInput from '@/components/ui/BaseInput.vue'
import BaseButton from '@/components/ui/BaseButton.vue'
import { categoriesApi } from '@/api/categories'
import { authorsApi } from '@/api/authors'
import { publishersApi } from '@/api/publishers'
import { seriesApi } from '@/api/series'
import { useDashboardFiltersStore } from '@/stores/dashboardFilters'
import { normalizeDigits, toFa } from '@/utils/format'

const filters = useDashboardFiltersStore()

const categoryOptions = ref([])
const authorOptions = ref([])
const publisherOptions = ref([])
const seriesOptions = ref([])

onMounted(async () => {
  try {
    const [cats, authors, publishers, seriesRes] = await Promise.all([
      categoriesApi.list(),
      authorsApi.list({ page_size: 1000, ordering: 'name' }),
      publishersApi.list({ page_size: 1000, ordering: 'name' }),
      seriesApi.list(),
    ])
    categoryOptions.value = cats.map((c) => ({ id: c.id, label: c.title }))
    authorOptions.value = authors.items.map((a) => ({ id: a.id, label: a.name }))
    publisherOptions.value = publishers.items.map((p) => ({ id: p.id, label: p.name }))
    seriesOptions.value = seriesRes.items.map((s) => ({ id: s.id, label: s.title }))
  } catch {
    // اگر گزینه‌ها لود نشوند، فیلتر همچنان با chip های فعال کار می‌کند؛ فقط لیست دراپ‌داون خالی می‌ماند
  }
})

const optionsByKey = { categories: categoryOptions, authors: authorOptions, publishers: publisherOptions, series: seriesOptions }
function labelFor(key, id) {
  return optionsByKey[key].value.find((o) => o.id === id)?.label || `#${toFa(id)}`
}

// چیپ‌های فیلترهای فعال، برای نمایش و حذف تکی (مثل Power BI)
const chips = computed(() => {
  const list = []
  for (const key of ['categories', 'authors', 'publishers', 'series']) {
    for (const id of filters[key]) list.push({ key, id, label: labelFor(key, id) })
  }
  if (filters.yearFrom !== null || filters.yearTo !== null) {
    list.push({ key: 'year', id: null, label: `سال ${filters.yearFrom ?? '…'} تا ${filters.yearTo ?? '…'}` })
  }
  if (filters.isLoaned !== null) {
    list.push({ key: 'loaned', id: null, label: filters.isLoaned ? 'فقط امانت‌داده‌شده' : 'فقط موجود' })
  }
  return list
})

function removeChip(chip) {
  if (chip.key === 'year') filters.setYearRange(null, null)
  else if (chip.key === 'loaned') filters.isLoaned = null
  else filters.toggleByKey(chip.key, chip.id)
}

const yearFromInput = computed({
  get: () => (filters.yearFrom === null ? '' : String(filters.yearFrom)),
  set: (v) => { filters.yearFrom = v === '' ? null : Number(normalizeDigits(v)) || null },
})
const yearToInput = computed({
  get: () => (filters.yearTo === null ? '' : String(filters.yearTo)),
  set: (v) => { filters.yearTo = v === '' ? null : Number(normalizeDigits(v)) || null },
})

// کلاس دکمه‌های تاگل امانت (رشته‌ی کامل تا Tailwind همه را اسکن کند)
const loanBtnBase = 'flex-1 sm:flex-none h-9 px-3 text-xs whitespace-nowrap border-0 border-s border-[color:var(--color-border-strong)] first:border-s-0'
const loanBtnOn = 'bg-ui-primary text-ui-on-primary'
const loanBtnOff = 'bg-[var(--color-surface)]'
</script>

<template>
  <div class="flex flex-col gap-3 p-3 sm:p-4 mb-5 bg-[var(--color-surface)] border border-[color:var(--color-border)] rounded-[var(--card-radius)]">
    <div class="flex flex-wrap items-center gap-2">
      <span class="hidden sm:grid place-items-center w-8 h-9 shrink-0 text-[color:var(--color-text-muted)] [&_svg]:w-[1.05rem] [&_svg]:h-[1.05rem]" aria-hidden="true">
        <SlidersHorizontal />
      </span>

      <!-- موبایل: دو ستون | sm به بالا: کنار هم و wrap -->
      <div class="grid grid-cols-2 gap-2 w-full sm:flex sm:flex-wrap sm:items-center sm:w-auto">
        <MultiSelectFilter class="w-full sm:w-auto" v-model="filters.categories" :options="categoryOptions" placeholder="دسته‌بندی" search-placeholder="جستجوی دسته‌بندی" />
        <MultiSelectFilter class="w-full sm:w-auto" v-model="filters.authors" :options="authorOptions" placeholder="نویسنده" search-placeholder="جستجوی نویسنده" />
        <MultiSelectFilter class="w-full sm:w-auto" v-model="filters.publishers" :options="publisherOptions" placeholder="ناشر" search-placeholder="جستجوی ناشر" />
        <MultiSelectFilter class="w-full sm:w-auto" v-model="filters.series" :options="seriesOptions" placeholder="مجموعه" search-placeholder="جستجوی مجموعه" />
      </div>

      <div class="flex items-center gap-1 w-full sm:w-[13rem]">
        <div class="flex-1 min-w-0 [&>*]:min-w-0 [&>*]:w-full [&_input]:min-w-0 [&_input]:w-full [&_input]:h-9">
          <BaseInput v-model="yearFromInput" numeric placeholder="سال از" maxlength="4" aria-label="سال انتشار از" />
        </div>
        <span class="shrink-0 text-xs text-[color:var(--color-text-muted)]">تا</span>
        <div class="flex-1 min-w-0 [&>*]:min-w-0 [&>*]:w-full [&_input]:min-w-0 [&_input]:w-full [&_input]:h-9">
          <BaseInput v-model="yearToInput" numeric placeholder="سال تا" maxlength="4" aria-label="سال انتشار تا" />
        </div>
      </div>

      <div class="inline-flex w-full sm:w-auto overflow-hidden border border-[color:var(--color-border-strong)] rounded-[var(--radius-md)]" role="group" aria-label="وضعیت امانت">
        <button type="button" :class="[loanBtnBase, filters.isLoaned === null ? loanBtnOn : loanBtnOff]" @click="filters.isLoaned = null">همه</button>
        <button type="button" :class="[loanBtnBase, filters.isLoaned === true ? loanBtnOn : loanBtnOff]" @click="filters.toggleLoaned(true)">امانت‌داده‌شده</button>
        <button type="button" :class="[loanBtnBase, filters.isLoaned === false ? loanBtnOn : loanBtnOff]" @click="filters.toggleLoaned(false)">موجود</button>
      </div>

      <BaseButton v-if="filters.hasFilters" variant="ghost" size="sm" class="w-full sm:w-auto sm:ms-auto" @click="filters.clearAll">
        <template #icon><X /></template>
        پاک‌کردن فیلترها ({{ toFa(filters.activeCount) }})
      </BaseButton>
    </div>

    <div v-if="chips.length" class="flex flex-wrap gap-2 pt-1 border-t border-dashed border-[color:var(--color-border)]">
      <button
          v-for="chip in chips"
          :key="`${chip.key}-${chip.id}`"
          type="button"
          class="inline-flex items-center gap-1 px-2 py-[3px] max-w-full bg-[var(--color-primary-soft)] border border-[color:var(--color-primary)] rounded-[var(--chip-radius)] text-[color:var(--color-primary)] text-xs"
          @click="removeChip(chip)"
      >
        <span class="truncate">{{ chip.label }}</span>
        <X class="w-3 h-3 shrink-0" aria-hidden="true" />
      </button>
    </div>
  </div>
</template>