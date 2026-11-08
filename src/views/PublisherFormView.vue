<script setup>
import { computed, nextTick, onBeforeUnmount, reactive, ref, watch } from 'vue'
import { useRouter } from 'vue-router'
import { ArrowRight, Check, Info, Building2 } from 'lucide-vue-next'
import PageHeader from '@/components/layout/PageHeader.vue'
import BaseButton from '@/components/ui/BaseButton.vue'
import BaseCard from '@/components/ui/BaseCard.vue'
import BaseField from '@/components/ui/BaseField.vue'
import BaseInput from '@/components/ui/BaseInput.vue'
import BaseSpinner from '@/components/ui/BaseSpinner.vue'
import ImageUploader from '@/components/books/ImageUploader.vue'
import { publishersApi } from '@/api/publishers'
import { IMAGE_MAX_MB } from '@/config/app'
import { useToastStore } from '@/stores/toast'
import { firstMessage, parseApiError } from '@/utils/errors'
import { formatDateTime, toFa, toFaDigits } from '@/utils/format'

const props = defineProps({ id: { type: String, default: null } })

const router = useRouter()
const toast = useToastStore()

const isEdit = computed(() => !!props.id)
const loading = ref(false)
const saving = ref(false)

const emptyForm = () => ({ name: '' })
const form = reactive(emptyForm())
const errors = reactive({})
const loaded = ref(null) // رکورد بارگذاری‌شده (حالت ویرایش)

const image = reactive({ url: null, file: null, preview: null, remove: false, error: '' })
const imageSrc = computed(() => image.preview || (image.remove ? null : image.url))

// ---------- init ----------
function resetState() {
  Object.assign(form, emptyForm())
  clearErrors()
  loaded.value = null
  revokePreview()
  Object.assign(image, { url: null, file: null, preview: null, remove: false, error: '' })
}

function fill(item) {
  loaded.value = item
  form.name = item.name || ''
  image.url = item.image || null
}

async function init() {
  resetState()
  if (!isEdit.value) return
  loading.value = true
  try {
    fill(await publishersApi.get(props.id))
  } catch (e) {
    const err = parseApiError(e)
    toast.error(err.status === 404 ? 'ناشر موردنظر پیدا نشد.' : err.message)
    router.replace({ name: 'publishers' })
  } finally {
    loading.value = false
  }
}
watch(() => props.id, init, { immediate: true })

// ---------- image ----------
function revokePreview() {
  if (image.preview) URL.revokeObjectURL(image.preview)
}
onBeforeUnmount(revokePreview)

function onImageSelect(file) {
  image.error = ''
  if (!['image/png', 'image/jpeg'].includes(file.type)) {
    image.error = 'فقط تصویر PNG یا JPG پذیرفته می‌شود.'
    return
  }
  if (file.size > IMAGE_MAX_MB * 1024 * 1024) {
    image.error = `حجم تصویر نباید بیشتر از ${toFa(IMAGE_MAX_MB)} مگابایت باشد.`
    return
  }
  revokePreview()
  image.file = file
  image.preview = URL.createObjectURL(file)
  image.remove = false
}
function onImageRemove() {
  revokePreview()
  image.file = null
  image.preview = null
  image.remove = !!image.url
  image.error = ''
}

// ---------- validation ----------
function clearErrors() {
  Object.keys(errors).forEach((k) => delete errors[k])
}

function validate() {
  clearErrors()
  if (!form.name.trim()) errors.name = 'نام ناشر الزامی است.'
  return !Object.keys(errors).length
}

function applyServerErrors(fields) {
  clearErrors()
  for (const [key, value] of Object.entries(fields)) errors[key] = firstMessage(value)
}

function scrollToFirstError() {
  nextTick(() => {
    document.querySelector('.has-error, .is-invalid')?.scrollIntoView({ behavior: 'smooth', block: 'center' })
  })
}

// ---------- submit ----------
function buildPayload() {
  return {
    name: form.name.trim(),
  }
}

async function syncImage(id) {
  try {
    if (image.file) await publishersApi.uploadImage(id, image.file)
    else if (image.remove && image.url) await publishersApi.deleteImage(id)
  } catch (e) {
    toast.warning(`اطلاعات ناشر ذخیره شد، اما ذخیره‌ی تصویر ناموفق بود: ${parseApiError(e).message}`)
  }
}

async function submit() {
  if (!validate()) {
    scrollToFirstError()
    return
  }
  saving.value = true
  try {
    const payload = buildPayload()
    const saved = isEdit.value ? await publishersApi.update(props.id, payload) : await publishersApi.create(payload)
    await syncImage(saved.id)
    toast.success(isEdit.value ? 'تغییرات ناشر ذخیره شد.' : 'ناشر با موفقیت ثبت شد.')
    router.push({ name: 'publishers' })
  } catch (e) {
    const err = parseApiError(e)
    if (err.status === 400 && Object.keys(err.fields).length) {
      applyServerErrors(err.fields)
      scrollToFirstError()
    }
    toast.error(err.message)
  } finally {
    saving.value = false
  }
}

// ---------- view helpers ----------
const pageTitle = computed(() => (isEdit.value ? 'ویرایش ناشر' : 'ثبت ناشر جدید'))
const pageDescription = computed(() =>
  isEdit.value
    ? `اطلاعات «${loaded.value?.name || ''}» را به‌روزرسانی کنید.`
    : 'نام و عکس (لوگوی) ناشر را وارد کنید.',
)
const breadcrumbs = computed(() => [
  { label: 'مدیریت کتابخانه' },
  { label: 'ناشران', to: '/publishers' },
  { label: isEdit.value ? 'ویرایش ناشر' : 'ثبت ناشر جدید' },
])
</script>

<template>
  <div>
    <PageHeader :title="pageTitle" :description="pageDescription" :breadcrumbs="breadcrumbs">
      <template #actions>
        <BaseButton to="/publishers">
          <template #icon><ArrowRight /></template>
          بازگشت به فهرست
        </BaseButton>
      </template>
    </PageHeader>

    <div v-if="loading" class="loading"><BaseSpinner size="lg" /></div>

    <form v-else class="form" novalidate @submit.prevent="submit">
      <div class="layout">
        <div class="layout__main">
          <BaseCard title="اطلاعات ناشر">
            <div class="stack">
              <BaseField label="نام ناشر" required for-id="name" :error="errors.name">
                <BaseInput id="name" v-model="form.name" :invalid="!!errors.name" placeholder="مثلاً نشر نی" maxlength="255" />
              </BaseField>
            </div>
          </BaseCard>
        </div>

        <aside class="layout__side">
          <BaseCard title="عکس ناشر">
            <ImageUploader :src="imageSrc" :error="image.error" alt="عکس ناشر" drop-title="لوگوی ناشر را اینجا بکشید" :icon="Building2" @select="onImageSelect" @remove="onImageRemove" />
          </BaseCard>

          <section class="guide">
            <h3 class="guide__title"><Info /> راهنمای ثبت اطلاعات</h3>
            <p>فقط نام ناشر الزامی است؛ عکس اختیاری است. بعد از ثبت، می‌توانید ناشر را هنگام ثبت کتاب انتخاب کنید.</p>
            <template v-if="isEdit && loaded">
              <hr class="divider" />
              <p class="guide__meta">کد ناشر: {{ toFaDigits(loaded.id) }}</p>
              <p class="guide__meta">تعداد کتاب: {{ toFa(loaded.books_count || 0) }}</p>
              <p class="guide__meta">آخرین ویرایش: {{ formatDateTime(loaded.updated_at) }}</p>
            </template>
          </section>
        </aside>
      </div>

      <div class="bar">
        <p class="bar__note">فیلدهای ستاره‌دار (*) الزامی هستند.</p>
        <div class="bar__actions">
          <BaseButton to="/publishers" :disabled="saving">انصراف</BaseButton>
          <BaseButton type="submit" variant="primary" :loading="saving">
            <template #icon><Check /></template>
            {{ isEdit ? 'ذخیره تغییرات' : 'ثبت ناشر' }}
          </BaseButton>
        </div>
      </div>
    </form>
  </div>
</template>

<style scoped>
.loading { display: flex; justify-content: center; padding-block: var(--space-24); }

.layout { display: grid; grid-template-columns: minmax(0, 1fr) 300px; align-items: start; gap: var(--space-6); }
.layout__main, .layout__side { display: flex; flex-direction: column; gap: var(--space-5); }
.layout__side { position: sticky; top: calc(var(--header-height) + var(--space-4)); }

.stack { display: flex; flex-direction: column; gap: var(--space-5); }
.divider { margin: var(--space-5) 0; border: 0; border-top: 1px solid var(--color-border); }

.guide { padding: var(--space-4) var(--space-5); background: var(--color-surface-hover); border: 1px solid var(--color-border); border-radius: var(--card-radius); font-size: var(--text-xs); color: var(--color-text-muted); }
.guide__title { display: flex; align-items: center; gap: var(--space-2); margin-bottom: var(--space-2); font-size: var(--text-sm); color: var(--color-text); }
.guide__title :deep(svg) { width: 1rem; height: 1rem; }
.guide .divider { margin: var(--space-3) 0; }
.guide__meta { color: var(--color-text-subtle); }

.bar { display: flex; flex-wrap: wrap; align-items: center; justify-content: space-between; gap: var(--space-4); margin-top: var(--space-6); padding-top: var(--space-5); border-top: 1px solid var(--color-border); }
.bar__note { font-size: var(--text-xs); color: var(--color-text-muted); }
.bar__actions { display: flex; gap: var(--space-3); }

@media (max-width: 960px) {
  .layout { grid-template-columns: 1fr; }
  .layout__side { position: static; order: -1; }
}
</style>
