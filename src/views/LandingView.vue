<script setup>
import { ArrowLeft, FileSpreadsheet, Layers, MapPin, NotebookPen, Search, ShieldCheck } from 'lucide-vue-next'
import BaseButton from '@/components/ui/BaseButton.vue'
import BaseBadge from '@/components/ui/BaseBadge.vue'
import BookCover from '@/components/books/BookCover.vue'
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

const sample = [
  { title: 'شازده کوچولو', author: 'آنتوان دو سنت‌اگزوپری', count: '۳', place: 'A20' },
  { title: 'کیمیاگر', author: 'پائولو کوئیلو', count: '۴', place: 'B14' },
  { title: 'دنیای سوفی', author: 'یوستین گوردر', count: '۲', place: 'C17' },
]
</script>

<template>
  <div>
    <section class="hero container">
      <div class="hero__text">
        <BaseBadge>سامانه‌ی مدیریت کتابخانه‌ی شخصی</BaseBadge>
        <h1 class="hero__title">همه‌ی کتاب‌هایت را بشناس،<br />هر نسخه را سر جایش پیدا کن.</h1>
        <p class="hero__lead">
          فهرست کتاب‌ها، تعداد نسخه‌ها و جای دقیق هر نسخه را در یک‌جا نگه دارید؛ با جستجوی سریع،
          یادداشت، تصویر جلد و ورود و خروجی اکسل.
        </p>
        <div class="hero__cta">
          <BaseButton variant="primary" size="lg" :to="auth.isAuthenticated ? '/books' : '/login'">
            <template #icon><ArrowLeft /></template>
            {{ auth.isAuthenticated ? 'ورود به کتابخانه' : 'ورود به حساب' }}
          </BaseButton>
          <BaseButton size="lg" @click="scrollToFeatures">امکانات</BaseButton>
        </div>
      </div>

      <div class="hero__preview" aria-hidden="true">
        <div class="preview">
          <div class="preview__bar"><span /><span /><span /></div>
          <div v-for="b in sample" :key="b.title" class="preview__row">
            <BookCover size="sm" />
            <div class="preview__text">
              <strong>{{ b.title }}</strong>
              <span>{{ b.author }}</span>
            </div>
            <BaseBadge>{{ b.count }} نسخه</BaseBadge>
            <BaseBadge tone="success"><span class="bidi">{{ b.place }}</span></BaseBadge>
          </div>
        </div>
      </div>
    </section>

    <section id="features" class="features container">
      <h2 class="features__title">هر چه برای نگهداری کتابخانه لازم است</h2>
      <div class="features__grid">
        <article v-for="f in features" :key="f.title" class="feature">
          <span class="feature__icon"><component :is="f.icon" /></span>
          <h3 class="feature__title">{{ f.title }}</h3>
          <p class="feature__text">{{ f.text }}</p>
        </article>
      </div>
    </section>

    <section class="cta container">
      <div class="cta__box">
        <h2 class="cta__title">آماده‌اید کتابخانه را منظم کنید؟</h2>
        <BaseButton variant="primary" size="lg" :to="auth.isAuthenticated ? '/books' : '/login'">
          {{ auth.isAuthenticated ? 'ورود به کتابخانه' : 'ورود به حساب' }}
        </BaseButton>
      </div>
    </section>
  </div>
</template>

<style scoped>
.hero { display: grid; grid-template-columns: 1.1fr 0.9fr; align-items: center; gap: var(--space-12); padding-block: var(--space-24) var(--space-16); }
.hero__text { display: flex; flex-direction: column; align-items: flex-start; gap: var(--space-5); }
.hero__title { font-size: var(--text-4xl); line-height: 1.3; }
.hero__lead { max-width: 34rem; font-size: var(--text-md); color: var(--color-text-muted); }
.hero__cta { display: flex; flex-wrap: wrap; gap: var(--space-3); margin-top: var(--space-2); }

.preview { padding: var(--space-4); background: var(--color-surface); border: 1px solid var(--color-border); border-radius: var(--radius-xl); box-shadow: var(--shadow-md); }
.preview__bar { display: flex; gap: var(--space-1); margin-bottom: var(--space-3); }
.preview__bar span { width: 0.6rem; height: 0.6rem; background: var(--color-border-strong); border-radius: var(--radius-full); }
.preview__row { display: flex; align-items: center; gap: var(--space-3); padding: var(--space-3); border-top: 1px solid var(--color-border); }
.preview__text { display: flex; flex: 1; flex-direction: column; min-width: 0; font-size: var(--text-sm); }
.preview__text span { font-size: var(--text-xs); color: var(--color-text-muted); }

.features { padding-block: var(--space-16); }
.features__title { margin-bottom: var(--space-8); text-align: center; font-size: var(--text-2xl); }
.features__grid { display: grid; grid-template-columns: repeat(3, 1fr); gap: var(--space-5); }
.feature { padding: var(--space-6); background: var(--color-surface); border: 1px solid var(--color-border); border-radius: var(--card-radius); }
.feature__icon { display: grid; place-items: center; width: 2.5rem; height: 2.5rem; margin-bottom: var(--space-4); background: var(--color-primary-soft); border-radius: var(--radius-md); }
.feature__icon :deep(svg) { width: 1.2rem; height: 1.2rem; }
.feature__title { font-size: var(--text-md); }
.feature__text { margin-top: var(--space-2); font-size: var(--text-sm); color: var(--color-text-muted); }

.cta { padding-block: var(--space-8) var(--space-16); }
.cta__box { display: flex; flex-direction: column; align-items: center; gap: var(--space-5); padding: var(--space-12) var(--space-6); text-align: center; background: var(--color-primary); color: var(--color-on-primary); border-radius: var(--radius-xl); }
.cta__title { font-size: var(--text-xl); }
.cta__box :deep(.btn--primary) { background: var(--color-surface); color: var(--color-primary); }

@media (max-width: 900px) {
  .hero { grid-template-columns: 1fr; padding-block: var(--space-12); }
  .hero__title { font-size: var(--text-3xl); }
  .features__grid { grid-template-columns: 1fr; }
}
@media (min-width: 901px) and (max-width: 1100px) {
  .features__grid { grid-template-columns: repeat(2, 1fr); }
}
</style>
