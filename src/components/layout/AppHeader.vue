<script setup>
import { ref, watch } from 'vue'
import { useRoute, useRouter } from 'vue-router'
import { LogOut, Menu, X } from 'lucide-vue-next'
import BrandLogo from './BrandLogo.vue'
import { NAV_ITEMS } from '@/config/nav'
import { useAuthStore } from '@/stores/auth'

const auth = useAuthStore()
const route = useRoute()
const router = useRouter()

const menuOpen = ref(false)
// با تغییر صفحه، منوی موبایل بسته شود
watch(() => route.fullPath, () => { menuOpen.value = false })

async function logout() {
  menuOpen.value = false
  await auth.logout()
  router.push({ name: 'login' })
}
</script>

<template>
  <header class="header">
    <div class="header__inner container">
      <BrandLogo to="/books" />
      <span class="header__divider header__desktop" aria-hidden="true" />

      <nav class="nav header__desktop" aria-label="منوی اصلی">
        <template v-for="item in NAV_ITEMS" :key="item.label">
          <RouterLink v-if="item.to" :to="item.to" class="nav__link" active-class="is-active">
            {{ item.label }}
          </RouterLink>
          <span v-else class="nav__link nav__link--disabled" title="به‌زودی" aria-disabled="true">
            {{ item.label }}
          </span>
        </template>
      </nav>

      <div class="header__spacer" />

      <!-- دسکتاپ: خوش‌آمدگویی و خروج در یک ردیفِ هم‌تراز -->
      <div class="user header__desktop">
        <span class="user__welcome">خوش اومدی {{ auth.displayName }} :)</span>
        <button type="button" class="user__logout" @click="logout">
          <LogOut aria-hidden="true" />
          خروج از حساب
        </button>
      </div>

      <!-- موبایل: دکمه‌ی منو -->
      <button
          type="button"
          class="burger"
          :aria-expanded="menuOpen"
          aria-controls="mobile-menu"
          :aria-label="menuOpen ? 'بستن منو' : 'باز کردن منو'"
          @click="menuOpen = !menuOpen"
      >
        <X v-if="menuOpen" />
        <Menu v-else />
      </button>
    </div>

    <!-- موبایل: پنل منو -->
    <div v-if="menuOpen" id="mobile-menu" class="panel">
      <nav class="panel__nav container" aria-label="منوی اصلی">
        <template v-for="item in NAV_ITEMS" :key="item.label">
          <RouterLink v-if="item.to" :to="item.to" class="panel__link" active-class="is-active">
            {{ item.label }}
          </RouterLink>
          <span v-else class="panel__link panel__link--disabled" aria-disabled="true">
            {{ item.label }} <small>(به‌زودی)</small>
          </span>
        </template>
      </nav>
      <div class="panel__user container">
        <span class="user__welcome">خوش اومدی {{ auth.displayName }} :)</span>
        <button type="button" class="user__logout" @click="logout">
          <LogOut aria-hidden="true" />
          خروج از حساب
        </button>
      </div>
    </div>
  </header>
</template>

<style scoped>
.header {
  position: sticky;
  top: 0;
  z-index: var(--z-header);
  background: var(--color-surface);
  border-bottom: 1px solid var(--color-border);
}
.header__inner {
  display: flex;
  align-items: center;
  gap: var(--space-4);
  height: var(--header-height);
}
.header__spacer { flex: 1; }
.header__divider { width: 1px; height: 1.5rem; background: var(--color-border); }

.nav { display: flex; align-self: stretch; gap: var(--space-6); margin-inline-start: var(--space-4); }
.nav__link {
  position: relative;
  display: flex;
  align-items: center;
  font-size: var(--text-base);
  color: var(--color-text-muted);
  transition: color var(--transition);
}
.nav__link:hover { color: var(--color-text); }
.nav__link.is-active { font-weight: var(--weight-bold); color: var(--color-text); }
.nav__link.is-active::after {
  content: '';
  position: absolute;
  inset-inline: 0;
  bottom: -1px;
  height: 2px;
  background: var(--color-primary);
}
.nav__link--disabled { cursor: default; opacity: 0.65; }

/* خوش‌آمدگویی + خروج: هم‌تراز و وسط‌چین عمودی */
.user { display: flex; align-items: center; gap: var(--space-3); }
.user__welcome { font-size: var(--text-base); white-space: nowrap; }
.user__logout {
  display: inline-flex;
  align-items: center;
  gap: var(--space-2);
  height: var(--control-height-sm);
  padding-inline: var(--space-3);
  background: transparent;
  border: 1px solid var(--color-border-strong);
  border-radius: var(--radius-md);
  font-size: var(--text-sm);
  color: var(--color-text-muted);
  white-space: nowrap;
  transition: background var(--transition), color var(--transition);
}
.user__logout:hover { background: var(--color-surface-muted); color: var(--color-text); }
.user__logout :deep(svg) { width: 1rem; height: 1rem; }

.burger {
  display: none;
  place-items: center;
  width: var(--control-height);
  height: var(--control-height);
  padding: 0;
  background: transparent;
  border: 1px solid var(--color-border-strong);
  border-radius: var(--radius-md);
}
.burger :deep(svg) { width: 1.2rem; height: 1.2rem; }

.panel { border-top: 1px solid var(--color-border); background: var(--color-surface); box-shadow: var(--shadow-md); }
.panel__nav { display: flex; flex-direction: column; padding-block: var(--space-2); }
.panel__link {
  padding: var(--space-3) var(--space-2);
  border-bottom: 1px solid var(--color-border);
  color: var(--color-text-muted);
}
.panel__link.is-active { font-weight: var(--weight-bold); color: var(--color-text); }
.panel__link--disabled { opacity: 0.6; }
.panel__user {
  display: flex;
  flex-wrap: wrap;
  align-items: center;
  justify-content: space-between;
  gap: var(--space-3);
  padding-block: var(--space-4);
}

@media (max-width: 860px) {
  .header__desktop { display: none; }
  .burger { display: grid; }
}
</style>