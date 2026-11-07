<script setup>
import { computed, onBeforeUnmount, onMounted, ref } from 'vue'
import { Check, ChevronDown, Plus } from 'lucide-vue-next'
import { categoriesApi } from '@/api/categories'
import { firstMessage, parseApiError } from '@/utils/errors'
import { useToastStore } from '@/stores/toast'

const props = defineProps({
  modelValue: { type: Array, default: () => [] }, // آرایه‌ی id ها
  options: { type: Array, default: () => [] },    // [{ id, title }]
  invalid: Boolean,
})
const emit = defineEmits(['update:modelValue', 'created'])

const toast = useToastStore()
const root = ref(null)
const open = ref(false)
const newTitle = ref('')
const creating = ref(false)

const selected = computed(() => props.options.filter((o) => props.modelValue.includes(o.id)))
const label = computed(() => {
  if (!selected.value.length) return 'انتخاب دسته‌بندی'
  if (selected.value.length === 1) return selected.value[0].title
  return `${selected.value[0].title} و ${selected.value.length - 1} مورد دیگر`
})

function toggle(id) {
  const next = props.modelValue.includes(id) ? props.modelValue.filter((x) => x !== id) : [...props.modelValue, id]
  emit('update:modelValue', next)
}

async function create() {
  const title = newTitle.value.trim()
  if (!title || creating.value) return
  creating.value = true
  try {
    const category = await categoriesApi.create(title)
    emit('created', category)
    emit('update:modelValue', [...props.modelValue, category.id])
    newTitle.value = ''
  } catch (e) {
    const err = parseApiError(e)
    toast.error(firstMessage(err.fields.title) || err.message)
  } finally {
    creating.value = false
  }
}

function onDocClick(e) {
  if (root.value && !root.value.contains(e.target)) open.value = false
}
onMounted(() => document.addEventListener('click', onDocClick))
onBeforeUnmount(() => document.removeEventListener('click', onDocClick))
</script>

<template>
  <div ref="root" class="multi" @keydown.esc="open = false">
    <button type="button" class="multi__btn" :class="{ 'is-invalid': invalid, 'is-placeholder': !selected.length }" :aria-expanded="open" @click="open = !open">
      <span class="multi__label">{{ label }}</span>
      <ChevronDown class="multi__icon" aria-hidden="true" />
    </button>

    <div v-if="open" class="panel">
      <ul v-if="options.length" class="panel__list">
        <li v-for="o in options" :key="o.id">
          <button type="button" class="panel__item" @click="toggle(o.id)">
            <span class="panel__check" :class="{ 'is-on': modelValue.includes(o.id) }"><Check v-if="modelValue.includes(o.id)" /></span>
            {{ o.title }}
          </button>
        </li>
      </ul>
      <p v-else class="panel__empty">هنوز دسته‌بندی‌ای ساخته نشده است.</p>

      <div class="panel__new">
        <input v-model="newTitle" class="panel__input" placeholder="دسته‌بندی جدید…" maxlength="100" @keydown.enter.prevent="create" />
        <button type="button" class="panel__add" :disabled="!newTitle.trim() || creating" aria-label="افزودن دسته‌بندی" @click="create"><Plus /></button>
      </div>
    </div>
  </div>
</template>

<style scoped>
.multi { position: relative; }
.multi__btn {
  display: flex;
  align-items: center;
  justify-content: space-between;
  gap: var(--space-2);
  width: 100%;
  height: var(--control-height);
  padding-inline: var(--space-3);
  background: var(--color-surface);
  border: 1px solid var(--color-border-strong);
  border-radius: var(--input-radius);
  font-size: var(--text-base);
  text-align: start;
}
.multi__btn:focus-visible { border-color: var(--color-primary); box-shadow: 0 0 0 3px var(--color-focus-ring); outline: 0; }
.multi__btn.is-invalid { border-color: var(--color-danger); }
.multi__btn.is-placeholder .multi__label { color: var(--color-text-subtle); }
.multi__label { overflow: hidden; text-overflow: ellipsis; white-space: nowrap; }
.multi__icon { flex-shrink: 0; width: 1rem; height: 1rem; color: var(--color-text-subtle); }

.panel {
  position: absolute;
  inset-inline: 0;
  inset-block-start: calc(100% + var(--space-1));
  z-index: var(--z-dropdown);
  background: var(--color-surface);
  border: 1px solid var(--color-border);
  border-radius: var(--radius-md);
  box-shadow: var(--shadow-md);
}
.panel__list { max-height: 220px; margin: 0; padding: var(--space-1); overflow-y: auto; list-style: none; }
.panel__item { display: flex; align-items: center; gap: var(--space-2); width: 100%; padding: var(--space-2); background: transparent; border: 0; border-radius: var(--radius-sm); text-align: start; font-size: var(--text-sm); }
.panel__item:hover { background: var(--color-surface-muted); }
.panel__check { display: grid; place-items: center; flex-shrink: 0; width: 1.05rem; height: 1.05rem; border: 1px solid var(--color-border-strong); border-radius: var(--radius-sm); }
.panel__check.is-on { background: var(--color-primary); border-color: var(--color-primary); color: var(--color-on-primary); }
.panel__check :deep(svg) { width: 0.75rem; height: 0.75rem; }
.panel__empty { padding: var(--space-3); font-size: var(--text-sm); color: var(--color-text-muted); }
.panel__new { display: flex; gap: var(--space-2); padding: var(--space-2); border-top: 1px solid var(--color-border); }
.panel__input { flex: 1; min-width: 0; height: var(--control-height-sm); padding-inline: var(--space-2); border: 1px solid var(--color-border-strong); border-radius: var(--radius-sm); font-size: var(--text-sm); }
.panel__input:focus { outline: 0; border-color: var(--color-primary); }
.panel__add { display: grid; place-items: center; width: var(--control-height-sm); height: var(--control-height-sm); padding: 0; background: var(--color-primary); border: 0; border-radius: var(--radius-sm); color: var(--color-on-primary); }
.panel__add:disabled { opacity: 0.4; }
.panel__add :deep(svg) { width: 1rem; height: 1rem; }
</style>
