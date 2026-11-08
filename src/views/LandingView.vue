<script setup>
import { ArrowLeft, FileSpreadsheet, Layers, MapPin, NotebookPen, Search, ShieldCheck } from 'lucide-vue-next'
import BaseButton from '@/components/ui/BaseButton.vue'
import BrandLogo from '@/components/layout/BrandLogo.vue'
import AppFooter from '@/components/layout/AppFooter.vue'
import poemArt from '@/assets/landing-poem.webp'
import { useAuthStore } from '@/stores/auth'

const auth = useAuthStore()

function scrollToFeatures() {
  document.getElementById('features')?.scrollIntoView({ behavior: 'smooth' })
}

const features = [
  { icon: Layers, title: 'چند نسخه از هر کتاب', text: 'تعداد نسخه‌ها را ثبت کنید؛ برای هر نسخه یک عنوان جداگانه لازم نیست.' },
  { icon: MapPin, title: 'آدرس دقیق هر نسخه', text: 'مثلاً «قفسه ۲، سمت دیوار». هر نسخه آدرس خودش را دارد تا هیچ کتابی گم نشود.' },
  { icon: Search, title: 'جستجوی سریع', text: 'بر اساس نام، نویسنده، مترجم، دسته‌بندی، زبان، سال انتشار و حتی آدرس قفسه.' },
  { icon: NotebookPen, title: 'تصویر جلد و یادداشت', text: 'برای هر کتاب عکس جلد، خلاصه و یادداشت شخصی نگه دارید.' },
  { icon: FileSpreadsheet, title: 'ورود و خروجی اکسل', text: 'فهرست قدیمی را یک‌جا آپلود کنید و هر وقت خواستید خروجی اکسل بگیرید.' },
  { icon: ShieldCheck, title: 'فقط برای اعضای مجاز', text: 'کتابخانه خصوصی است؛ فقط کسانی که مدیر تعریف کرده وارد می‌شوند.' },
]

const poemAlt = 'ای آن که کتاب خوامی از من، گر من ندهم تو را بد آید، معشوقه‌ی عارفان کتابست، «معشوقه به عاریت نشاید»'
</script>

<template>
  <div class="landing">
    <header class="landing__top container">
      <BrandLogo to="/" />
      <BaseButton :to="auth.isAuthenticated ? '/books' : '/login'">
        {{ auth.isAuthenticated ? 'ورود به کتابخانه' : 'ورود' }}
      </BaseButton>
    </header>

    <section class="stage">
      <figure class="stage__art">
        <img :src="poemArt" :alt="poemAlt" width="1672" height="941" fetchpriority="high" />
      </figure>

      <div class="stage__text">
        <h1 class="stage__title">همه‌ی کتاب‌هایت را بشناس، هر نسخه را سر جایش پیدا کن.</h1>
        <div class="stage__cta">
          <BaseButton variant="primary" size="lg" :to="auth.isAuthenticated ? '/books' : '/login'">
            <template #icon><ArrowLeft /></template>
            {{ auth.isAuthenticated ? 'ورود به کتابخانه' : 'ورود به حساب' }}
          </BaseButton>
<!--          <BaseButton size="lg" @click="scrollToFeatures"></BaseButton>-->
        </div>
      </div>
    </section>

<!--    <section id="features" class="features container">-->
<!--      <div class="ornament" aria-hidden="true"><span /></div>-->
<!--      <h2 class="features__title">هر چه برای نگهداری کتابخانه لازم است</h2>-->
<!--      <ul class="features__grid">-->
<!--        <li v-for="f in features" :key="f.title" class="feature">-->
<!--          <component :is="f.icon" class="feature__icon" aria-hidden="true" />-->
<!--          <h3 class="feature__title">{{ f.title }}</h3>-->
<!--          <p class="feature__text">{{ f.text }}</p>-->
<!--        </li>-->
<!--      </ul>-->
<!--    </section>-->

<!--    <section class="closing container">-->
<!--      <p class="closing__text">کتابخانه منتظر شماست.</p>-->
<!--      <BaseButton variant="primary" size="lg" :to="auth.isAuthenticated ? '/books' : '/login'">-->
<!--        {{ auth.isAuthenticated ? 'ورود به کتابخانه' : 'ورود به حساب' }}-->
<!--      </BaseButton>-->
<!--    </section>-->

    <AppFooter />
  </div>
</template>

<style scoped>
/* پالت تیره و طلایی، برگرفته از خود تصویر. فقط داخل همین صفحه اعمال می‌شود. */
.landing {
  --ink: #07101a;
  --gold: #d6ac5e;
  --gold-soft: rgba(214, 172, 94, 0.28);

  --color-primary: #d6ac5e;
  --color-primary-hover: #e4be78;
  --color-primary-active: #bf953f;
  --color-on-primary: #1a1204;
  --color-surface: transparent;
  --color-surface-hover: rgba(214, 172, 94, 0.1);
  --color-border-strong: rgba(214, 172, 94, 0.5);
  --color-text-subtle: #8f8d84;
  --color-text: #efe6d0;
  --color-text-muted: #a9a79d;

  position: relative;
  min-height: 100vh;
  background: var(--ink);
  color: var(--color-text);
}

.landing__top {
  position: absolute;
  inset-block-start: 0;
  inset-inline: 0;
  z-index: 2;
  display: flex;
  align-items: center;
  justify-content: space-between;
  height: calc(var(--header-height) + var(--space-4));
}
.landing__top :deep(.brand) { color: var(--gold); }

/* ---------- صحنه‌ی اصلی: شعر خوشنویسی‌شده ---------- */
.stage { display: flex; flex-direction: column; align-items: center; }

.stage__art {
  display: grid;
  justify-items: center;
  width: 100%;
  margin: 0;
  overflow: hidden;
  animation: reveal 1.6s ease-out both;
}
.stage__art img {
  width: min(100%, calc((100svh - 200px) * 1.777));
  min-width: 0;
  height: auto;
  /* لبه‌های تصویر در پس‌زمینه حل می‌شوند */
  -webkit-mask-image:
    linear-gradient(to right, transparent, #000 14%, #000 86%, transparent),
    linear-gradient(to bottom, transparent, #000 5%, #000 94%, transparent);
  -webkit-mask-composite: source-in;
  mask-image:
    linear-gradient(to right, transparent, #000 14%, #000 86%, transparent),
    linear-gradient(to bottom, transparent, #000 5%, #000 94%, transparent);
  mask-composite: intersect;
}

.stage__text {
  display: flex;
  flex-direction: column;
  align-items: center;
  gap: var(--space-4);
  padding: var(--space-2) var(--space-6) var(--space-8);
  text-align: center;
  animation: rise 1s ease-out 0.9s both;
}
.stage__title { font-size: var(--text-xl); font-weight: var(--weight-medium); color: var(--color-text); }
.stage__cta { display: flex; flex-wrap: wrap; justify-content: center; gap: var(--space-3); }

/* ----------  ---------- */
.features { padding-block: var(--space-16); }
.features__title { margin-block: var(--space-6) var(--space-10); text-align: center; font-size: var(--text-2xl); }
.features__grid {
  display: grid;
  grid-template-columns: repeat(3, 1fr);
  gap: var(--space-10) var(--space-12);
  margin: 0;
  padding: 0;
  list-style: none;
}
.feature { padding-top: var(--space-5); border-top: 1px solid var(--gold-soft); }
.feature__icon { width: 1.4rem; height: 1.4rem; margin-bottom: var(--space-3); color: var(--gold); }
.feature__title { font-size: var(--text-md); }
.feature__text { max-width: 24rem; margin-top: var(--space-2); font-size: var(--text-sm); color: var(--color-text-muted); }

/* نقش لوزی و خط، هم‌خوان با تزیین تصویر */
.ornament { display: flex; align-items: center; justify-content: center; gap: var(--space-3); }
.ornament::before,
.ornament::after { content: ''; width: min(14rem, 30%); height: 1px; background: linear-gradient(to right, transparent, var(--gold)); }
.ornament::after { transform: scaleX(-1); }
.ornament span { width: 0.55rem; height: 0.55rem; background: var(--gold); transform: rotate(45deg); }

/* ---------- پایان صفحه ---------- */
.closing {
  display: flex;
  flex-direction: column;
  align-items: center;
  gap: var(--space-4);
  padding-block: var(--space-8) var(--space-16);
  text-align: center;
}
.closing__text { font-size: var(--text-lg); color: var(--color-text-muted); }

@keyframes reveal { from { opacity: 0; transform: scale(1.02); } to { opacity: 1; transform: none; } }
@keyframes rise { from { opacity: 0; transform: translateY(10px); } to { opacity: 1; transform: none; } }

@media (prefers-reduced-motion: reduce) {
  .stage__art, .stage__text { animation: none; }
}

@media (max-width: 900px) {
  .features__grid { grid-template-columns: repeat(2, 1fr); gap: var(--space-8); }
}
@media (max-width: 720px) {
  /* در موبایل تصویر بزرگ‌تر می‌شود تا شعر خوانا بماند؛ حاشیه‌ی کتابخانه بریده می‌شود */
  .stage { padding-top: var(--space-12); }
  .stage__art img { width: 150%; max-width: none; }
  .stage__title { font-size: var(--text-lg); }
  .features__grid { grid-template-columns: 1fr; }
}
</style>

<style>
/* رنگ پس‌زمینه‌ی کل صفحه هنگام اسکرول/کشیدن بیش از حد هم تیره بماند */
body:has(.landing) { background: #07101a; }
</style>
