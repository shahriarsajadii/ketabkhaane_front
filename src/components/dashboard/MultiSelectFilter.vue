<script setup>
import { computed, onBeforeUnmount, onMounted, ref, watch } from 'vue'
import { Check, ChevronDown, X } from 'lucide-vue-next'

// یک slicer چندانتخابی عمومی (دسته‌بندی/نویسنده/ناشر/مجموعه در نوار فیلتر داشبورد)
const props = defineProps({
  modelValue: { type: Array, default: () => [] }, // آرایه‌ی id
  options: { type: Array, default: () => [] },     // [{ id, label }]
  placeholder: { type: String, default: 'انتخاب کنید' },
  searchPlaceholder: { type: String, default: 'جستجو...' },
})
const emit = defineEmits(['update:modelValue'])

const root = ref(null)
const open = ref(false)
const query = ref('')

const hasValue = computed(() => props.modelValue.length > 0)

const filteredOptions = computed(() => {
  const q = query.value.trim().toLowerCase()
  if (!q) return props.options
  return props.options.filter((o) => o.label.toLowerCase().includes(q))
})

const label = computed(() => {
  if (!props.modelValue.length) return props.placeholder
  if (props.modelValue.length === 1) {
    const found = props.options.find((o) => o.id === props.modelValue[0])
    return found ? found.label : props.placeholder
  }
  return `${toFaCount(props.modelValue.length)} مورد انتخاب‌شده`
})
function toFaCount(n) { return new Intl.NumberFormat('fa-IR').format(n) }

function toggle(id) {
  const next = props.modelValue.includes(id) ? props.modelValue.filter((x) => x !== id) : [...props.modelValue, id]
  emit('update:modelValue', next)
}

// حذف همه‌ی انتخاب‌ها (دکمه‌ی ✕ روی خود فیلتر و دکمه‌ی داخل پنل)
function clearAll() {
  emit('update:modelValue', [])
}

function close() {
  open.value = false
}

// با بسته‌شدن پنل، عبارت جستجو پاک می‌شود
watch(open, (v) => { if (!v) query.value = '' })

function onDocClick(e) {
  if (root.value && !root.value.contains(e.target)) open.value = false
}
onMounted(() => document.addEventListener('click', onDocClick))
onBeforeUnmount(() => document.removeEventListener('click', onDocClick))

// رشته‌های کامل تا Tailwind همه‌ی کلاس‌ها را اسکن کند
const btnBase = 'flex items-center justify-between gap-2 w-full h-9 px-3 border rounded-[var(--radius-md)] text-sm text-start'
const btnIdle = 'bg-[var(--color-surface)] border-[color:var(--color-border-strong)]'
const btnActive = 'bg-[var(--color-primary-soft)] border-[color:var(--color-primary)] pe-9'
const checkBase = 'grid place-items-center shrink-0 w-[1.05rem] h-[1.05rem] border rounded-sm [&_svg]:w-3 [&_svg]:h-3'
const checkOn = 'bg-[var(--color-primary)] border-[color:var(--color-primary)] text-white'
const checkOff = 'border-[color:var(--color-border-strong)]'
</script>

<template>
  <div ref="root" class="relative w-full min-w-0 sm:min-w-[11rem]" @keydown.esc="close">
    <div class="relative">
      <button
          type="button"
          :class="[btnBase, hasValue ? btnActive : btnIdle]"
          :aria-expanded="open"
          @click="open = !open"
      >
        <span class="truncate" :class="{ 'text-[color:var(--color-text-subtle)]': !hasValue }">{{ label }}</span>
        <ChevronDown v-if="!hasValue" class="w-[0.9rem] h-[0.9rem] shrink-0 text-[color:var(--color-text-subtle)]" aria-hidden="true" />
      </button>

      <!-- ✕ جدا از دکمه‌ی اصلی است (دکمه داخل دکمه نامعتبر است) -->
      <button
          v-if="hasValue"
          type="button"
          class="absolute inset-y-0 end-0 grid place-items-center w-9 bg-transparent border-0 rounded-[var(--radius-md)] text-[color:var(--color-text-muted)] hover:text-[color:var(--color-primary)]"
          aria-label="پاک‌کردن انتخاب‌ها"
          title="پاک‌کردن انتخاب‌ها"
          @click.stop="clearAll"
      >
        <X class="w-4 h-4" aria-hidden="true" />
      </button>
    </div>

    <!-- موبایل: پس‌زمینه‌ی تیره + پنل پایین صفحه | sm به بالا: دراپ‌داون معمولی -->
    <div v-if="open" class="fixed inset-0 z-40 bg-black/40 sm:hidden" @click="close" />

    <div
        v-if="open"
        class="z-50 flex flex-col fixed inset-x-3 bottom-3 bg-[var(--color-surface)] border border-[color:var(--color-border)] rounded-[var(--radius-md)] shadow-[var(--shadow-md)] sm:absolute sm:inset-x-auto sm:bottom-auto sm:start-0 sm:top-[calc(100%+0.25rem)] sm:w-max sm:min-w-full sm:max-w-[18rem]"
    >
      <input
          v-model="query"
          class="w-full h-[2.1rem] px-3 bg-transparent border-0 border-b border-[color:var(--color-border)] text-sm focus:outline-none"
          :placeholder="searchPlaceholder"
      />

      <ul v-if="filteredOptions.length" class="m-0 p-1 max-h-[50vh] sm:max-h-[220px] overflow-y-auto list-none">
        <li v-for="o in filteredOptions" :key="o.id">
          <button
              type="button"
              class="flex items-center gap-2 w-full p-2 bg-transparent border-0 rounded-sm text-sm text-start hover:bg-[var(--color-surface-muted)]"
              @click="toggle(o.id)"
          >
            <span :class="[checkBase, modelValue.includes(o.id) ? checkOn : checkOff]">
              <Check v-if="modelValue.includes(o.id)" />
            </span>
            <span class="truncate">{{ o.label }}</span>
          </button>
        </li>
      </ul>
      <p v-else class="p-3 text-sm text-[color:var(--color-text-muted)]">موردی پیدا نشد.</p>

      <!-- نوار پایین پنل: حذف همه‌ی انتخاب‌ها + بستن -->
      <div class="flex items-center justify-between gap-2 p-2 border-t border-[color:var(--color-border)]">
        <button
            type="button"
            class="px-2 py-1 bg-transparent border-0 rounded-sm text-xs text-[color:var(--color-primary)] disabled:opacity-40 disabled:cursor-not-allowed hover:bg-[var(--color-surface-muted)]"
            :disabled="!hasValue"
            @click="clearAll"
        >
          پاک‌کردن انتخاب‌ها{{ hasValue ? ` (${toFaCount(modelValue.length)})` : '' }}
        </button>
        <button
            type="button"
            class="px-3 py-1 bg-transparent border border-[color:var(--color-border-strong)] rounded-sm text-xs hover:bg-[var(--color-surface-muted)]"
            @click="close"
        >
          بستن
        </button>
      </div>
    </div>
  </div>
</template>