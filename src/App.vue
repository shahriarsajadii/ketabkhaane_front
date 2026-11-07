<script setup>
import { computed } from 'vue'
import { useRoute } from 'vue-router'
import AppLayout from '@/components/layout/AppLayout.vue'
import PublicLayout from '@/components/layout/PublicLayout.vue'
import ToastHost from '@/components/ui/ToastHost.vue'

const route = useRoute()
const layout = computed(() => (route.meta.layout === 'app' ? AppLayout : PublicLayout))
</script>

<template>
  <component :is="layout">
    <RouterView />
  </component>
  <ToastHost />
</template>
