<script setup>
import { onMounted, ref, watch } from 'vue'
import PageHeader from '@/components/layout/PageHeader.vue'
import FilterBar from '@/components/dashboard/FilterBar.vue'
import SummaryCards from '@/components/dashboard/SummaryCards.vue'
import BarListChart from '@/components/dashboard/BarListChart.vue'
import YearChart from '@/components/dashboard/YearChart.vue'
import ShelfHeatmap from '@/components/dashboard/ShelfHeatmap.vue'
import SeriesOverviewTable from '@/components/dashboard/SeriesOverviewTable.vue'
import { dashboardApi } from '@/api/dashboard'
import { useDashboardFiltersStore } from '@/stores/dashboardFilters'
import { useToastStore } from '@/stores/toast'
import { parseApiError } from '@/utils/errors'

const filters = useDashboardFiltersStore()
const toast = useToastStore()

const loading = ref(false)
const summary = ref(null)
const byAuthor = ref(null)
const byCategory = ref(null)
const byPublisher = ref(null)
const byBook = ref(null)
const byShelf = ref(null)
const byYear = ref(null)
const seriesData = ref(null)

// تنظیمات هر نمودار مستقل از فیلتر سراسری است (مثل «Top N» در Power BI)
const authorLimit = ref(10)
const categoryLimit = ref(10)
const publisherLimit = ref(10)
const bookLimit = ref(10)
const seriesLimit = ref(10)
const yearBucket = ref(1)

let requestToken = 0
async function fetchAll() {
  const token = ++requestToken
  loading.value = true
  const p = filters.params
  try {
    const [s, ba, bc, bp, cb, cs, by, se] = await Promise.all([
      dashboardApi.summary(p),
      dashboardApi.booksByAuthor(p, authorLimit.value),
      dashboardApi.booksByCategory(p, categoryLimit.value),
      dashboardApi.booksByPublisher(p, publisherLimit.value),
      dashboardApi.copiesByBook(p, bookLimit.value),
      dashboardApi.copiesByShelf(p),
      dashboardApi.booksByYear(p, yearBucket.value),
      dashboardApi.series(p, seriesLimit.value),
    ])
    if (token !== requestToken) return // پاسخ قدیمی‌تر از یک درخواست جدیدتر؛ نادیده گرفته می‌شود
    summary.value = s
    byAuthor.value = ba
    byCategory.value = bc
    byPublisher.value = bp
    byBook.value = cb
    byShelf.value = cs
    byYear.value = by
    seriesData.value = se
  } catch (e) {
    if (token === requestToken) toast.error(parseApiError(e).message)
  } finally {
    if (token === requestToken) loading.value = false
  }
}

onMounted(fetchAll)
watch(
    () => [filters.params, authorLimit.value, categoryLimit.value, publisherLimit.value, bookLimit.value, seriesLimit.value, yearBucket.value],
    fetchAll,
    { deep: true },
)
</script>

<template>
  <div>
    <PageHeader
        title="پیشخوان"
        description="نمای کلی کتابخانه. با کلیک روی هر میله یا کارت، بقیه‌ی نمودارها هم فیلتر می‌شوند."
    />

    <FilterBar />

    <SummaryCards :data="summary" :loading="loading" />

    <!-- موبایل: یک ستون | از ۹۰۰px به بالا: دو ستون. min-w-0 جلوی سرریز نمودارهای اسکرولی را می‌گیرد -->
    <div class="grid grid-cols-1 gap-4 min-[900px]:grid-cols-2 [&>*]:min-w-0">
      <BarListChart
          title="کتاب بر اساس نویسنده"
          v-model:limit="authorLimit"
          :data="byAuthor"
          :loading="loading"
          :active-ids="filters.authors"
          @bar-click="(item) => filters.toggleAuthor(item.id)"
      />
      <BarListChart
          title="کتاب بر اساس دسته‌بندی"
          v-model:limit="categoryLimit"
          :data="byCategory"
          :loading="loading"
          :active-ids="filters.categories"
          @bar-click="(item) => filters.toggleCategory(item.id)"
      />
      <BarListChart
          title="کتاب بر اساس ناشر"
          :description="byPublisher && byPublisher.books_without_publisher ? `${byPublisher.books_without_publisher} کتاب بدون ناشر` : undefined"
          v-model:limit="publisherLimit"
          :data="byPublisher"
          :loading="loading"
          :active-ids="filters.publishers"
          @bar-click="(item) => filters.togglePublisher(item.id)"
      />
      <BarListChart
          title="تعداد نسخه به ازای هر کتاب"
          description="برای دیدن/ویرایش کتاب روی آن کلیک کنید."
          v-model:limit="bookLimit"
          :data="byBook"
          :loading="loading"
          :link-to="(item) => `/books/${item.id}/edit`"
          :extra-label="(item) => (item.volume_number ? `جلد ${item.volume_number}` : '')"
      />

      <YearChart v-model:bucket="yearBucket" :data="byYear" :loading="loading" />
      <ShelfHeatmap :data="byShelf" :loading="loading" />

      <SeriesOverviewTable
          class="min-[900px]:col-span-2"
          v-model:limit="seriesLimit"
          :data="seriesData"
          :loading="loading"
          :active-ids="filters.series"
          @row-click="(s) => filters.toggleSeries(s.id)"
      />
    </div>
  </div>
</template>