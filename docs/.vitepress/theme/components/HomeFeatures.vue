<script setup lang="ts">
import { ref, onMounted } from 'vue'

interface Feature {
  icon: string
  title: string
  description: string
  color: string
}

const features: Feature[] = [
  {
    icon: '🔍',
    title: 'Auto-Discovery',
    description:
      'Scans and catalogues all media assets — images, videos, audio, fonts, documents, and data files.',
    color: '#646cff',
  },
  {
    icon: '🖼️',
    title: 'Thumbnail Previews',
    description:
      'Sharp-powered thumbnail generation with dual-tier caching for instant image previews.',
    color: '#42b883',
  },
  {
    icon: '⚡',
    title: 'Real-Time Updates',
    description:
      'File changes reflected instantly via SSE. Add, modify, or delete assets — no refresh needed.',
    color: '#f59e0b',
  },
  {
    icon: '🔄',
    title: 'Duplicate Detection',
    description:
      'Content-based MD5 hashing finds identical files across your project to reduce bundle size.',
    color: '#ef4444',
  },
  {
    icon: '📦',
    title: 'Bulk Operations',
    description:
      'Multi-select with Shift/Ctrl+click. Copy paths, download as ZIP, or bulk delete.',
    color: '#8b5cf6',
  },
  {
    icon: '⌨️',
    title: 'Keyboard Navigation',
    description:
      'Arrow keys, vim-style j/k, and shortcuts for every action. Fully keyboard accessible.',
    color: '#06b6d4',
  },
  {
    icon: '🎯',
    title: 'Import Tracking',
    description:
      'See which files import each asset. Find unused assets. Click to open in your editor.',
    color: '#ec4899',
  },
  {
    icon: '🔌',
    title: 'Framework Agnostic',
    description:
      'Vue, React, Svelte, Solid, Nuxt, Next.js — works with every Vite-powered framework.',
    color: '#10b981',
  },
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
    { threshold: 0.1 }
  )

  const el = document.querySelector('.features-section')
  if (el) observer.observe(el)
})
</script>

<template>
  <section class="features-section">
    <div class="features-container">
      <div class="features-header">
        <h2 class="features-title">Everything you need</h2>
        <p class="features-subtitle">
          A complete asset management toolkit for your Vite development workflow
        </p>
      </div>

      <div class="features-grid" :class="{ visible }">
        <div
          v-for="(feature, index) in features"
          :key="feature.title"
          class="feature-card"
          :style="{ '--delay': `${index * 0.08}s`, '--accent': feature.color }"
        >
          <div class="feature-icon">
            {{ feature.icon }}
          </div>
          <h3 class="feature-title">{{ feature.title }}</h3>
          <p class="feature-description">{{ feature.description }}</p>
        </div>
      </div>
    </div>
  </section>
</template>

<style scoped>
.features-section {
  padding: 64px 24px;
}

@media (min-width: 768px) {
  .features-section {
    padding: 80px 48px;
  }
}

.features-container {
  max-width: 1152px;
  margin: 0 auto;
}

.features-header {
  text-align: center;
  margin-bottom: 48px;
}

.features-title {
  font-size: 28px;
  font-weight: 700;
  margin-bottom: 8px;
}

@media (min-width: 768px) {
  .features-title {
    font-size: 36px;
  }
}

.features-subtitle {
  font-size: 16px;
  color: var(--vp-c-text-2);
}

.features-grid {
  display: grid;
  grid-template-columns: 1fr;
  gap: 16px;
}

@media (min-width: 640px) {
  .features-grid {
    grid-template-columns: repeat(2, 1fr);
  }
}

@media (min-width: 960px) {
  .features-grid {
    grid-template-columns: repeat(4, 1fr);
  }
}

.feature-card {
  padding: 24px;
  border-radius: 16px;
  background: var(--vp-c-bg-soft);
  border: 1px solid var(--vp-c-divider);
  transition: all 0.3s ease;
  opacity: 0;
  transform: translateY(20px);
}

.features-grid.visible .feature-card {
  animation: cardIn 0.5s ease-out var(--delay) both;
}

.feature-card:hover {
  border-color: var(--accent);
  transform: translateY(-4px);
  box-shadow: 0 8px 24px -8px color-mix(in srgb, var(--accent) 20%, transparent);
}

.feature-icon {
  font-size: 28px;
  margin-bottom: 12px;
  width: 48px;
  height: 48px;
  display: flex;
  align-items: center;
  justify-content: center;
  border-radius: 12px;
  background: color-mix(in srgb, var(--accent) 10%, transparent);
}

.feature-title {
  font-size: 16px;
  font-weight: 600;
  margin-bottom: 6px;
}

.feature-description {
  font-size: 14px;
  line-height: 1.5;
  color: var(--vp-c-text-2);
}

@keyframes cardIn {
  from {
    opacity: 0;
    transform: translateY(20px);
  }
  to {
    opacity: 1;
    transform: translateY(0);
  }
}
</style>
