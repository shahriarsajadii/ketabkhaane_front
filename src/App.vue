<script setup>
import { computed } from 'vue'
import { useRoute } from 'vue-router'
import AppLayout from '@/components/layout/AppLayout.vue'
import PublicLayout from '@/components/layout/PublicLayout.vue'
import ToastHost from '@/components/ui/ToastHost.vue'

const route = useRoute()
// landing: صفحه‌ی اصلی هدر و فوتر خودش را دارد و داخل لایه‌ی عمومی قرار نمی‌گیرد
const isLanding = computed(() => route.meta.layout === 'landing')
const layout = computed(() => (route.meta.layout === 'app' ? AppLayout : PublicLayout))
</script>

<template>
  <RouterView v-if="isLanding" />
  <component :is="layout" v-else>
    <RouterView />
  </component>
  <ToastHost />
</template>
