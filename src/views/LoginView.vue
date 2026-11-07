<script setup>
import { computed, reactive, ref } from 'vue'
import { useRoute, useRouter } from 'vue-router'
import { Eye, EyeOff, Lock, User } from 'lucide-vue-next'
import BaseButton from '@/components/ui/BaseButton.vue'
import BaseCard from '@/components/ui/BaseCard.vue'
import BaseField from '@/components/ui/BaseField.vue'
import BaseInput from '@/components/ui/BaseInput.vue'
import { useAuthStore } from '@/stores/auth'
import { parseApiError } from '@/utils/errors'

const auth = useAuthStore()
const route = useRoute()
const router = useRouter()

const form = reactive({ username: '', password: '' })
const showPassword = ref(false)
const loading = ref(false)
const formError = ref('')
const fieldErrors = reactive({ username: '', password: '' })

// فقط مسیرهای داخلی؛ جلوی open-redirect را می‌گیرد
const redirectTo = computed(() => {
  const r = route.query.redirect
  return typeof r === 'string' && r.startsWith('/') && !r.startsWith('//') ? r : '/books'
})

async function submit() {
  formError.value = ''
  fieldErrors.username = form.username.trim() ? '' : 'نام کاربری را وارد کنید.'
  fieldErrors.password = form.password ? '' : 'رمز عبور را وارد کنید.'
  if (fieldErrors.username || fieldErrors.password) return

  loading.value = true
  try {
    await auth.login(form.username.trim(), form.password)
    router.replace(redirectTo.value)
  } catch (e) {
    formError.value = parseApiError(e).message
  } finally {
    loading.value = false
  }
}
</script>

<template>
  <section class="login container">
    <BaseCard class="login__card">
      <h1 class="login__title">ورود به کتابخانه</h1>
      <p class="login__desc">برای مدیریت کتاب‌ها، نام کاربری و رمز عبور خود را وارد کنید.</p>

      <form class="login__form" novalidate @submit.prevent="submit">
        <p v-if="formError" class="login__alert" role="alert">{{ formError }}</p>

        <BaseField label="نام کاربری" for-id="username" :error="fieldErrors.username">
          <BaseInput id="username" v-model="form.username" autocomplete="username" dir="ltr" :invalid="!!fieldErrors.username" placeholder="نام کاربری">
            <template #prefix><User /></template>
          </BaseInput>
        </BaseField>

        <BaseField label="رمز عبور" for-id="password" :error="fieldErrors.password">
          <BaseInput id="password" v-model="form.password" :type="showPassword ? 'text' : 'password'" autocomplete="current-password" dir="ltr" :invalid="!!fieldErrors.password" placeholder="••••••••">
            <template #prefix><Lock /></template>
            <template #suffix>
              <button type="button" class="login__eye" :aria-label="showPassword ? 'پنهان کردن رمز' : 'نمایش رمز'" @click="showPassword = !showPassword">
                <EyeOff v-if="showPassword" /><Eye v-else />
              </button>
            </template>
          </BaseInput>
        </BaseField>

        <BaseButton type="submit" variant="primary" size="lg" block :loading="loading">ورود</BaseButton>
      </form>

      <p class="login__foot">حساب کاربری ندارید؟ از مدیر کتابخانه بخواهید برایتان بسازد.</p>
    </BaseCard>
  </section>
</template>

<style scoped>
.login { display: flex; flex: 1; align-items: center; justify-content: center; padding-block: var(--space-12); }
.login__card { width: 100%; max-width: 420px; box-shadow: var(--shadow-md); }
.login__title { font-size: var(--text-xl); }
.login__desc { margin-top: var(--space-2); font-size: var(--text-sm); color: var(--color-text-muted); }
.login__form { display: flex; flex-direction: column; gap: var(--space-4); margin-top: var(--space-6); }
.login__alert { padding: var(--space-3); background: var(--color-danger-soft); border: 1px solid var(--color-danger-border); border-radius: var(--radius-md); font-size: var(--text-sm); color: var(--color-danger); }
.login__eye { display: grid; place-items: center; padding: 0; background: transparent; border: 0; color: inherit; }
.login__eye:hover { color: var(--color-text); }
.login__foot { margin-top: var(--space-6); text-align: center; font-size: var(--text-xs); color: var(--color-text-muted); }
</style>
