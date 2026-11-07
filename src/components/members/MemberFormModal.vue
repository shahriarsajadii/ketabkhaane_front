<script setup>
import { reactive, ref, watch } from 'vue'
import { UserPlus } from 'lucide-vue-next'
import BaseModal from '@/components/ui/BaseModal.vue'
import BaseButton from '@/components/ui/BaseButton.vue'
import BaseField from '@/components/ui/BaseField.vue'
import BaseInput from '@/components/ui/BaseInput.vue'
import BaseCheckbox from '@/components/ui/BaseCheckbox.vue'
import { usersApi } from '@/api/users'
import { useToastStore } from '@/stores/toast'
import { parseApiError, firstMessage } from '@/utils/errors'

const props = defineProps({
  modelValue: Boolean,
  member: { type: Object, default: null }, // null => ایجاد، در غیر این صورت ویرایش
})
const emit = defineEmits(['update:modelValue', 'saved'])

const toast = useToastStore()
const saving = ref(false)
const isEdit = ref(false)

const form = reactive({
  name: '',
  username: '',
  password: '',
  confirm_password: '',
  is_staff: false,
})
const errors = reactive({})

function clearErrors() {
  for (const key of Object.keys(errors)) delete errors[key]
}

watch(
  () => props.modelValue,
  (open) => {
    if (!open) return
    clearErrors()
    isEdit.value = !!props.member
    form.name = props.member?.name || ''
    form.username = props.member?.username || ''
    form.password = ''
    form.confirm_password = ''
    form.is_staff = !!props.member?.is_staff
  },
)

function validate() {
  clearErrors()
  if (!form.name.trim()) errors.name = 'نام الزامی است.'
  if (!form.username.trim()) errors.username = 'نام کاربری الزامی است.'
  if (!isEdit.value) {
    if (!form.password) errors.password = 'رمز عبور الزامی است.'
    if (form.password && form.password !== form.confirm_password) {
      errors.confirm_password = 'رمز عبور و تکرار آن یکسان نیستند.'
    }
  } else if (form.password && form.password !== form.confirm_password) {
    errors.confirm_password = 'رمز عبور و تکرار آن یکسان نیستند.'
  }
  return !Object.keys(errors).length
}

function applyServerErrors(fields) {
  clearErrors()
  for (const [key, value] of Object.entries(fields || {})) {
    errors[key] = firstMessage(value)
  }
}

async function submit() {
  if (!validate()) return
  saving.value = true
  try {
    if (isEdit.value) {
      const payload = { name: form.name.trim(), is_staff: form.is_staff }
      if (form.password) payload.password = form.password
      await usersApi.update(props.member.id, payload)
      toast.success('اطلاعات عضو ذخیره شد.')
    } else {
      await usersApi.create({
        name: form.name.trim(),
        username: form.username.trim(),
        password: form.password,
        confirm_password: form.confirm_password,
        is_staff: form.is_staff,
      })
      toast.success('عضو جدید ثبت شد.')
    }
    emit('update:modelValue', false)
    emit('saved')
  } catch (e) {
    const err = parseApiError(e)
    if (Object.keys(err.fields).length) applyServerErrors(err.fields)
    else toast.error(err.message)
  } finally {
    saving.value = false
  }
}
</script>

<template>
  <BaseModal :model-value="modelValue" size="sm" :closable="!saving" @update:model-value="$emit('update:modelValue', $event)">
    <template #header>
      <span class="icon"><UserPlus /></span>
      <h2 class="title">{{ isEdit ? 'ویرایش عضو' : 'ثبت عضو جدید' }}</h2>
    </template>

    <form class="form" @submit.prevent="submit">
      <BaseField label="نام" required for-id="member-name" :error="errors.name">
        <BaseInput id="member-name" v-model="form.name" :invalid="!!errors.name" placeholder="مثلاً علی رضایی" maxlength="100" />
      </BaseField>

      <BaseField label="نام کاربری" required for-id="member-username" :error="errors.username" :hint="isEdit ? 'نام کاربری بعد از ثبت قابل تغییر نیست.' : ''">
        <BaseInput
          id="member-username"
          v-model="form.username"
          class="bidi"
          :invalid="!!errors.username"
          :disabled="isEdit"
          placeholder="مثلاً ali.rezaei"
          maxlength="50"
          autocomplete="off"
        />
      </BaseField>

      <BaseField :label="isEdit ? 'رمز عبور جدید' : 'رمز عبور'" :required="!isEdit" for-id="member-password" :error="errors.password" :hint="isEdit ? 'اگر خالی بماند، رمز عبور تغییر نمی‌کند.' : ''">
        <BaseInput id="member-password" v-model="form.password" type="password" :invalid="!!errors.password" placeholder="••••••••" autocomplete="new-password" />
      </BaseField>

      <BaseField label="تکرار رمز عبور" :required="!isEdit" for-id="member-confirm-password" :error="errors.confirm_password">
        <BaseInput id="member-confirm-password" v-model="form.confirm_password" type="password" :invalid="!!errors.confirm_password" placeholder="••••••••" autocomplete="new-password" />
      </BaseField>
    </form>

    <template #footer>
      <BaseButton :disabled="saving" @click="$emit('update:modelValue', false)">انصراف</BaseButton>
      <BaseButton variant="primary" :loading="saving" @click="submit">
        <template #icon><UserPlus /></template>
        {{ isEdit ? 'ذخیره تغییرات' : 'ثبت عضو' }}
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
