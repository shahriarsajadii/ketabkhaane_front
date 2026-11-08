<script setup>
import { reactive, ref, watch } from 'vue'
import { Tag } from 'lucide-vue-next'
import BaseModal from '@/components/ui/BaseModal.vue'
import BaseButton from '@/components/ui/BaseButton.vue'
import BaseField from '@/components/ui/BaseField.vue'
import BaseInput from '@/components/ui/BaseInput.vue'
import { categoriesApi } from '@/api/categories'
import { useToastStore } from '@/stores/toast'
import { firstMessage, parseApiError } from '@/utils/errors'

const props = defineProps({
  modelValue: Boolean,
  category: { type: Object, default: null }, // null => ایجاد، در غیر این صورت ویرایش
})
const emit = defineEmits(['update:modelValue', 'saved'])

const toast = useToastStore()
const saving = ref(false)
const isEdit = ref(false)

const form = reactive({ title: '' })
const errors = reactive({})
function clearErrors() {
  for (const key of Object.keys(errors)) delete errors[key]
}

watch(
    () => props.modelValue,
    (open) => {
      if (!open) return
      clearErrors()
      isEdit.value = !!props.category
      form.title = props.category?.title || ''
    },
)

function validate() {
  clearErrors()
  if (!form.title.trim()) errors.title = 'عنوان دسته‌بندی الزامی است.'
  return !Object.keys(errors).length
}

async function submit() {
  if (!validate()) return
  saving.value = true
  try {
    if (isEdit.value) {
      await categoriesApi.update(props.category.id, form.title.trim())
      toast.success('دسته‌بندی ویرایش شد.')
    } else {
      await categoriesApi.create(form.title.trim())
      toast.success('دسته‌بندی جدید ثبت شد.')
    }
    emit('update:modelValue', false)
    emit('saved')
  } catch (e) {
    const err = parseApiError(e)
    if (err.fields.title) errors.title = firstMessage(err.fields.title)
    else toast.error(err.message)
  } finally {
    saving.value = false
  }
}
</script>

<template>
  <BaseModal :model-value="modelValue" size="sm" :closable="!saving" @update:model-value="$emit('update:modelValue', $event)">
    <template #header>
      <span class="icon"><Tag /></span>
      <h2 class="title">{{ isEdit ? 'ویرایش دسته‌بندی' : 'دسته‌بندی جدید' }}</h2>
    </template>

    <form class="form" @submit.prevent="submit">
      <BaseField label="عنوان دسته‌بندی" required for-id="category-title" :error="errors.title">
        <BaseInput id="category-title" v-model="form.title" :invalid="!!errors.title" placeholder="مثلاً رمان، تاریخ، کودک و نوجوان" maxlength="100" />
      </BaseField>
    </form>

    <template #footer>
      <BaseButton :disabled="saving" @click="$emit('update:modelValue', false)">انصراف</BaseButton>
      <BaseButton variant="primary" :loading="saving" @click="submit">
        <template #icon><Tag /></template>
        {{ isEdit ? 'ذخیره تغییرات' : 'ثبت دسته‌بندی' }}
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

.form { display: flex; flex-direction: column; gap: var(--space-4); }
</style>