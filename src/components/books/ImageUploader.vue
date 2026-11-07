<script setup>
import { ref } from 'vue'
import { ImagePlus, Upload } from 'lucide-vue-next'
import BaseButton from '@/components/ui/BaseButton.vue'
import BookCover from './BookCover.vue'
import { IMAGE_MAX_MB } from '@/config/app'
import { toFa } from '@/utils/format'

defineProps({
  src: String,       // آدرس تصویر فعلی یا پیش‌نمایش
  error: String,
  alt: { type: String, default: 'تصویر جلد' },
  dropTitle: { type: String, default: 'تصویر جلد را اینجا بکشید' },
  icon: { type: [Object, Function], default: null }, // آیکن حالت بدون عکس (پیش‌فرض: کتاب)
})
const emit = defineEmits(['select', 'remove'])

const input = ref(null)
const dragging = ref(false)

function onChange(e) {
  const f = e.target.files?.[0]
  if (f) emit('select', f)
  e.target.value = ''
}
function onDrop(e) {
  dragging.value = false
  const f = e.dataTransfer?.files?.[0]
  if (f) emit('select', f)
}
</script>

<template>
  <div>
    <div v-if="src" class="preview">
      <BookCover :src="src" :alt="alt" size="lg" :icon="icon" />
      <div class="preview__actions">
        <BaseButton size="sm" @click="emit('remove')">حذف</BaseButton>
        <BaseButton size="sm" @click="input.click()">
          <template #icon><Upload /></template>
          تغییر تصویر
        </BaseButton>
      </div>
    </div>

    <div
      v-else
      class="drop"
      :class="{ 'is-dragging': dragging, 'is-invalid': !!error }"
      @dragover.prevent="dragging = true"
      @dragleave.prevent="dragging = false"
      @drop.prevent="onDrop"
    >
      <span class="drop__icon"><ImagePlus /></span>
      <p class="drop__title">{{ dropTitle }}</p>
      <p class="drop__hint">یا از دستگاه خود انتخاب کنید</p>
      <BaseButton size="sm" @click="input.click()">
        <template #icon><Upload /></template>
        انتخاب تصویر
      </BaseButton>
    </div>

    <p class="hint">حداکثر {{ toFa(IMAGE_MAX_MB) }} مگابایت، PNG یا JPG</p>
    <p v-if="error" class="error" role="alert">{{ error }}</p>
    <input ref="input" type="file" accept="image/png,image/jpeg" class="sr-only" tabindex="-1" @change="onChange" />
  </div>
</template>

<style scoped>
.preview { display: flex; flex-direction: column; gap: var(--space-3); padding: var(--space-4); background: var(--color-surface-hover); border: 1px solid var(--color-border); border-radius: var(--radius-md); }
.preview__actions { display: flex; justify-content: center; gap: var(--space-2); }

.drop {
  display: flex;
  flex-direction: column;
  align-items: center;
  gap: var(--space-1);
  padding: var(--space-10) var(--space-4);
  text-align: center;
  border: 1.5px dashed var(--color-border-strong);
  border-radius: var(--radius-md);
  transition: border-color var(--transition), background var(--transition);
}
.drop.is-dragging { border-color: var(--color-primary); background: var(--color-primary-soft); }
.drop.is-invalid { border-color: var(--color-danger); }
.drop__icon { display: grid; place-items: center; width: 2.5rem; height: 2.5rem; margin-bottom: var(--space-2); background: var(--color-surface-muted); border-radius: var(--radius-md); color: var(--color-text-muted); }
.drop__icon :deep(svg) { width: 1.2rem; height: 1.2rem; }
.drop__title { font-size: var(--text-sm); font-weight: var(--weight-medium); }
.drop__hint { margin-bottom: var(--space-3); font-size: var(--text-xs); color: var(--color-text-muted); }

.hint { margin-top: var(--space-3); text-align: center; font-size: var(--text-xs); color: var(--color-text-subtle); }
.error { margin-top: var(--space-1); text-align: center; font-size: var(--text-xs); color: var(--color-danger); }
</style>
