<script setup>
import { computed } from 'vue'
import { Moon, Sun } from 'lucide-vue-next'
import { useThemeStore } from '@/stores/theme'

const theme = useThemeStore()
const label = computed(() => (theme.isDark ? 'تغییر به تم روشن' : 'تغییر به تم تیره'))
</script>

<template>
  <button
    type="button"
    class="grid size-8 shrink-0 cursor-pointer place-items-center rounded-md border border-ui-border-strong bg-transparent text-ui-fg-muted transition-colors hover:bg-ui-surface-muted hover:text-ui-fg [&_svg]:size-4"
    :aria-label="label"
    :title="label"
    @click="theme.toggle()"
  >
    <Sun v-if="theme.isDark" aria-hidden="true" />
    <Moon v-else aria-hidden="true" />
  </button>
</template>
