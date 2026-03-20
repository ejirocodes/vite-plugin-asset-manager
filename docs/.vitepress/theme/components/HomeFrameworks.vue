<script setup lang="ts">
import { ref, onMounted } from 'vue'

const frameworks = [
  { name: 'Vue', color: '#42b883' },
  { name: 'React', color: '#61dafb' },
  { name: 'Svelte', color: '#ff3e00' },
  { name: 'Solid', color: '#2c4f7c' },
  { name: 'Nuxt', color: '#00dc82' },
  { name: 'Next.js', color: '#000000' },
  { name: 'Lit', color: '#324fff' },
  { name: 'Preact', color: '#673ab8' },
  { name: 'Qwik', color: '#ac7ef4' },
]

const visible = ref(false)

onMounted(() => {
  const observer = new IntersectionObserver(
    (entries) => {
      if (entries[0].isIntersecting) {
        visible.value = true
        observer.disconnect()
      }
    },
    { threshold: 0.2 }
  )

  const el = document.querySelector('.frameworks-section')
  if (el) observer.observe(el)
})
</script>

<template>
  <section class="frameworks-section">
    <div class="frameworks-container">
      <h2 class="frameworks-title">Works with your stack</h2>
      <p class="frameworks-subtitle">
        First-class support for every Vite-powered framework
      </p>

      <div class="frameworks-grid" :class="{ visible }">
        <div
          v-for="(fw, index) in frameworks"
          :key="fw.name"
          class="framework-pill"
          :style="{ '--delay': `${index * 0.06}s`, '--fw-color': fw.color }"
        >
          <span class="fw-dot" :style="{ background: fw.color }" />
          {{ fw.name }}
        </div>
      </div>
    </div>
  </section>
</template>

<style scoped>
.frameworks-section {
  padding: 48px 24px 80px;
  text-align: center;
}

@media (min-width: 768px) {
  .frameworks-section {
    padding: 64px 48px 100px;
  }
}

.frameworks-container {
  max-width: 720px;
  margin: 0 auto;
}

.frameworks-title {
  font-size: 28px;
  font-weight: 700;
  margin-bottom: 8px;
}

@media (min-width: 768px) {
  .frameworks-title {
    font-size: 36px;
  }
}

.frameworks-subtitle {
  font-size: 16px;
  color: var(--vp-c-text-2);
  margin-bottom: 32px;
}

.frameworks-grid {
  display: flex;
  flex-wrap: wrap;
  justify-content: center;
  gap: 10px;
}

.framework-pill {
  display: inline-flex;
  align-items: center;
  gap: 8px;
  padding: 10px 20px;
  border-radius: 9999px;
  font-size: 14px;
  font-weight: 500;
  background: var(--vp-c-bg-soft);
  border: 1px solid var(--vp-c-divider);
  transition: all 0.2s ease;
  opacity: 0;
  transform: scale(0.9);
}

.frameworks-grid.visible .framework-pill {
  animation: pillIn 0.4s ease-out var(--delay) both;
}

.framework-pill:hover {
  border-color: var(--fw-color);
  background: color-mix(in srgb, var(--fw-color) 8%, var(--vp-c-bg-soft));
  transform: translateY(-2px);
}

.fw-dot {
  width: 8px;
  height: 8px;
  border-radius: 50%;
  flex-shrink: 0;
}

@keyframes pillIn {
  from {
    opacity: 0;
    transform: scale(0.9);
  }
  to {
    opacity: 1;
    transform: scale(1);
  }
}
</style>
