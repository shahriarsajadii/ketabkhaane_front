<script setup>
import { ref, watch } from 'vue'
import { Download, FileSpreadsheet, Upload } from 'lucide-vue-next'
import BaseModal from '@/components/ui/BaseModal.vue'
import BaseButton from '@/components/ui/BaseButton.vue'
import BaseCheckbox from '@/components/ui/BaseCheckbox.vue'
import { booksApi } from '@/api/books'
import { EXCEL_MAX_MB } from '@/config/app'
import { FIELD_LABELS } from '@/config/options'
import { downloadBlob } from '@/utils/download'
import { firstMessage, parseApiError } from '@/utils/errors'
import { formatFileSize, toFa } from '@/utils/format'
import { useToastStore } from '@/stores/toast'

const props = defineProps({ modelValue: Boolean })
const emit = defineEmits(['update:modelValue', 'imported'])

const toast = useToastStore()
const fileInput = ref(null)
const file = ref(null)
const fileError = ref('')
const dragging = ref(false)
const uploading = ref(false)
const downloading = ref(false)
const skipInvalid = ref(false)
const result = ref(null)   // { message, created, failed[] }
const failure = ref(null)  // { message, rows[] }

function reset() {
  file.value = null
  fileError.value = ''
  dragging.value = false
  skipInvalid.value = false
  result.value = null
  failure.value = null
}
watch(() => props.modelValue, (open) => open && reset())

function pick(f) {
  fileError.value = ''
  failure.value = null
  if (!f) return
  if (!/\.xlsx$/i.test(f.name)) {
    fileError.value = 'فقط فایل با فرمت xlsx پذیرفته می‌شود.'
    return
  }
  if (f.size > EXCEL_MAX_MB * 1024 * 1024) {
    fileError.value = `حجم فایل نباید بیشتر از ${toFa(EXCEL_MAX_MB)} مگابایت باشد.`
    return
  }
  file.value = f
}
function onDrop(e) {
  dragging.value = false
  pick(e.dataTransfer?.files?.[0])
}
function onChange(e) {
  pick(e.target.files?.[0])
  e.target.value = ''
}

async function downloadTemplate() {
  downloading.value = true
  try {
    downloadBlob(await booksApi.downloadTemplate(), 'books-template.xlsx')
  } catch {
    toast.error('دریافت قالب ناموفق بود.')
  } finally {
    downloading.value = false
  }
}

async function submit() {
  if (!file.value) return
  uploading.value = true
  failure.value = null
  try {
    const res = await booksApi.importExcel(file.value, { skipInvalid: skipInvalid.value })
    result.value = { message: res.message, created: res.data.created, failed: res.data.failed || [] }
    emit('imported')
  } catch (e) {
    const err = parseApiError(e)
    const rows = Array.isArray(err.fields.rows) ? err.fields.rows : []
    failure.value = { message: firstMessage(err.fields.file) || err.message, rows }
  } finally {
    uploading.value = false
  }
}

function rowMessage(row) {
  return Object.entries(row.errors || {})
    .map(([field, value]) => `${FIELD_LABELS[field] || field}: ${firstMessage(value)}`)
    .join(' — ')
}
</script>

<template>
  <BaseModal
    :model-value="modelValue"
    title="آپلود فایل اکسل"
    description="کتاب‌ها را به‌صورت گروهی به کتابخانه اضافه کنید."
    size="md"
    :closable="!uploading"
    @update:model-value="$emit('update:modelValue', $event)"
  >
    <!-- نتیجه‌ی موفق -->
    <div v-if="result" class="result">
      <p class="result__title">{{ result.message }}</p>
      <template v-if="result.failed.length">
        <p class="result__sub">ردیف‌های زیر ثبت نشدند:</p>
        <ul class="rows">
          <li v-for="r in result.failed" :key="r.row"><strong>ردیف {{ toFa(r.row) }}</strong> <span v-if="r.title">({{ r.title }})</span> — {{ rowMessage(r) }}</li>
        </ul>
      </template>
    </div>

    <template v-else>
      <div
        class="drop"
        :class="{ 'is-dragging': dragging, 'has-file': !!file }"
        @dragover.prevent="dragging = true"
        @dragleave.prevent="dragging = false"
        @drop.prevent="onDrop"
      >
        <span class="drop__icon"><FileSpreadsheet /></span>
        <template v-if="file">
          <p class="drop__title bidi">{{ file.name }}</p>
          <p class="drop__hint">{{ formatFileSize(file.size) }}</p>
        </template>
        <p v-else class="drop__title">فایل اکسل را اینجا بکشید و رها کنید</p>

        <BaseButton size="sm" @click="fileInput.click()">{{ file ? 'تغییر فایل' : 'انتخاب فایل' }}</BaseButton>
        <p class="drop__hint">فرمت مجاز: XLSX · حداکثر حجم {{ toFa(EXCEL_MAX_MB) }} مگابایت</p>
        <input ref="fileInput" type="file" accept=".xlsx" class="sr-only" tabindex="-1" @change="onChange" />
      </div>
      <p v-if="fileError" class="error" role="alert">{{ fileError }}</p>

      <div class="template">
        <FileSpreadsheet class="template__icon" aria-hidden="true" />
        <div class="template__text">
          <strong>از قالب استاندارد استفاده کنید</strong>
          <span>ستون‌ها را مطابق نمونه تکمیل کنید.</span>
        </div>
        <BaseButton size="sm" :loading="downloading" @click="downloadTemplate">
          <template #icon><Download /></template>
          دریافت قالب
        </BaseButton>
      </div>

      <p class="note">
        نام کتاب، نویسنده و آدرس نسخه‌ها الزامی است. برای هر نسخه، یک محل نگهداری در ستون «آدرس‌ها» بنویسید
        (با <span class="bidi">|</span> از هم جدا کنید).
      </p>

      <BaseCheckbox v-model="skipInvalid" label="ردیف‌های سالم ثبت شوند و ردیف‌های دارای خطا نادیده گرفته شوند" />

      <div v-if="failure" class="failure" role="alert">
        <p>{{ failure.message }}</p>
        <ul v-if="failure.rows.length" class="rows">
          <li v-for="r in failure.rows" :key="r.row"><strong>ردیف {{ toFa(r.row) }}</strong> <span v-if="r.title">({{ r.title }})</span> — {{ rowMessage(r) }}</li>
        </ul>
      </div>
    </template>

    <template #footer>
      <template v-if="result">
        <BaseButton variant="primary" @click="$emit('update:modelValue', false)">بستن</BaseButton>
      </template>
      <template v-else>
        <BaseButton :disabled="uploading" @click="$emit('update:modelValue', false)">انصراف</BaseButton>
        <BaseButton variant="primary" :disabled="!file" :loading="uploading" @click="submit">
          <template #icon><Upload /></template>
          آپلود و بررسی فایل
        </BaseButton>
      </template>
    </template>
  </BaseModal>
</template>

<style scoped>
.drop {
  display: flex;
  flex-direction: column;
  align-items: center;
  gap: var(--space-2);
  padding: var(--space-8) var(--space-4);
  text-align: center;
  background: var(--color-surface-hover);
  border: 1.5px dashed var(--color-border-strong);
  border-radius: var(--radius-lg);
  transition: border-color var(--transition), background var(--transition);
}
.drop.is-dragging { border-color: var(--color-primary); background: var(--color-primary-soft); }
.drop__icon { display: grid; place-items: center; width: 2.5rem; height: 2.5rem; background: var(--color-surface); border: 1px solid var(--color-border); border-radius: var(--radius-md); }
.drop__icon :deep(svg) { width: 1.2rem; height: 1.2rem; }
.drop__title { font-size: var(--text-sm); font-weight: var(--weight-medium); }
.drop__hint { font-size: var(--text-xs); color: var(--color-text-muted); }

.error { margin-top: var(--space-2); font-size: var(--text-xs); color: var(--color-danger); }

.template {
  display: flex;
  align-items: center;
  gap: var(--space-3);
  margin-block: var(--space-4);
  padding: var(--space-3) var(--space-4);
  border: 1px solid var(--color-border);
  border-radius: var(--radius-md);
}
.template__icon { width: 1.4rem; height: 1.4rem; color: var(--color-text-muted); }
.template__text { display: flex; flex: 1; flex-direction: column; font-size: var(--text-sm); }
.template__text span { font-size: var(--text-xs); color: var(--color-text-muted); }

.note { margin-bottom: var(--space-4); font-size: var(--text-xs); color: var(--color-text-muted); }

.failure {
  margin-top: var(--space-4);
  padding: var(--space-3) var(--space-4);
  background: var(--color-danger-soft);
  border: 1px solid var(--color-danger-border);
  border-radius: var(--radius-md);
  font-size: var(--text-sm);
  color: var(--color-danger);
}
.rows { max-height: 220px; margin: var(--space-2) 0 0; padding-inline-start: var(--space-5); overflow-y: auto; font-size: var(--text-xs); line-height: 1.9; }

.result__title { font-weight: var(--weight-bold); color: var(--color-success); }
.result__sub { margin-top: var(--space-4); font-size: var(--text-sm); }
</style>
