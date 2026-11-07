<script setup>
import { onBeforeUnmount, onMounted, ref } from 'vue'
import { useRouter } from 'vue-router'
import { Bell, ChevronDown, LogOut } from 'lucide-vue-next'
import BrandLogo from './BrandLogo.vue'
import { NAV_ITEMS } from '@/config/nav'
import { useAuthStore } from '@/stores/auth'

const auth = useAuthStore()
const router = useRouter()

async function logout() {
  await auth.logout()
  router.push({ name: 'login' })
}
</script>

<template>
  <header
      class="sticky top-0 z-[var(--z-header)] border-b border-[var(--color-border)] bg-[var(--color-surface)]"
  >
    <div
        class="container flex h-[var(--header-height)] items-center gap-[var(--space-4)]"
    >
      <BrandLogo to="/books" />
      <span
          class="h-6 w-px bg-[var(--color-border)] max-[860px]:hidden"
          aria-hidden="true"
      />

      <nav
          class="ms-[var(--space-4)] flex gap-[var(--space-6)] self-stretch max-[860px]:hidden"
          aria-label="منوی اصلی"
      >
        <template v-for="item in NAV_ITEMS" :key="item.label">
          <RouterLink
              v-if="item.to"
              :to="item.to"
              class="relative flex items-center text-[length:var(--text-base)] text-[var(--color-text-muted)] transition-colors duration-[var(--transition)] hover:text-[var(--color-text)]"
              active-class="is-active !font-[var(--weight-bold)] !text-[var(--color-text)] after:absolute after:inset-x-0 after:-bottom-px after:h-0.5 after:bg-[var(--color-primary)] after:content-['']"
          >
            {{ item.label }}
          </RouterLink>
          <span
              v-else
              class="relative flex cursor-default items-center text-[length:var(--text-base)] text-[var(--color-text-muted)] opacity-65"
              title="به‌زودی"
              aria-disabled="true"
          >
            {{ item.label }}
          </span>
        </template>
      </nav>

      <div class="flex-1" />


      <span
          class="h-6 w-px bg-[var(--color-border)] max-[860px]:hidden"
          aria-hidden="true"
      />


      <div class="relative flex ">
             <span class="w-100">
            خوش اومدی {{ auth.displayName }} :)
          </span>
        <button
            type="button"
            class="flex w-full items-center gap-[var(--space-2)] rounded-[var(--radius-md)] border-0 bg-transparent px-[var(--space-3)] py-[var(--space-2)] text-start hover:bg-[var(--color-surface-muted)] [&_svg]:size-4 [&_svg]:text-[var(--color-text-muted)]"
            role="menuitem"
            @click="logout"
        >
          <LogOut /> خروج از حساب
        </button>

      </div>
    </div>
  </header>
</template>