<script setup lang="ts">
const primaryFeatures = [
  {
    title: 'Find every asset, instantly',
    description:
      'Scans your project and catalogues all media assets — images, videos, audio, fonts, documents, and data files. Real-time updates via SSE when files change.',
    icon: 'scan',
  },
  {
    title: 'Know what\'s used and what\'s not',
    description:
      'Tracks which source files import each asset. Surfaces unused assets you can safely remove. Detects duplicates by content hash.',
    icon: 'track',
  },
]

const secondaryFeatures = [
  {
    title: 'Thumbnail previews',
    description: 'Sharp-powered image previews with dual-tier caching.',
    icon: 'preview',
  },
  {
    title: 'Bulk operations',
    description: 'Multi-select to copy paths, download as ZIP, or delete.',
    icon: 'bulk',
  },
  {
    title: 'Keyboard-first',
    description: 'Arrow keys, vim-style j/k, and shortcuts for everything.',
    icon: 'keyboard',
  },
  {
    title: 'Advanced filters',
    description: 'Filter by size, date, extension. Combine with search.',
    icon: 'filter',
  },
  {
    title: 'Open in editor',
    description: 'Click any importer to jump to the exact line in VS Code.',
    icon: 'editor',
  },
  {
    title: 'Works everywhere',
    description: 'Vue, React, Svelte, Nuxt, Next.js — any Vite framework.',
    icon: 'framework',
  },
]
</script>

<template>
  <section class="features-section">
    <div class="features-container">
      <h2 class="features-title">Built for real projects</h2>
      <p class="features-subtitle">
        Not a toy. A tool that handles the messy reality of production asset management.
      </p>

      <!-- Two primary features, larger -->
      <div class="primary-grid">
        <div v-for="feature in primaryFeatures" :key="feature.title" class="primary-card">
          <div class="card-icon" :data-icon="feature.icon">
            <!-- Scan icon -->
            <svg v-if="feature.icon === 'scan'" xmlns="http://www.w3.org/2000/svg" width="22" height="22" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1.5" stroke-linecap="round" stroke-linejoin="round">
              <path d="M3 7V5a2 2 0 0 1 2-2h2" /><path d="M17 3h2a2 2 0 0 1 2 2v2" />
              <path d="M21 17v2a2 2 0 0 1-2 2h-2" /><path d="M7 21H5a2 2 0 0 1-2-2v-2" />
              <circle cx="12" cy="12" r="4" />
            </svg>
            <!-- Track icon -->
            <svg v-if="feature.icon === 'track'" xmlns="http://www.w3.org/2000/svg" width="22" height="22" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1.5" stroke-linecap="round" stroke-linejoin="round">
              <path d="M14.5 2H6a2 2 0 0 0-2 2v16a2 2 0 0 0 2 2h12a2 2 0 0 0 2-2V7.5L14.5 2z" />
              <polyline points="14 2 14 8 20 8" />
              <path d="m9 15 2 2 4-4" />
            </svg>
          </div>
          <h3 class="primary-title">{{ feature.title }}</h3>
          <p class="primary-description">{{ feature.description }}</p>
        </div>
      </div>

      <!-- Six secondary features, compact -->
      <div class="secondary-grid">
        <div v-for="feature in secondaryFeatures" :key="feature.title" class="secondary-card">
          <div class="secondary-icon" :data-icon="feature.icon">
            <svg v-if="feature.icon === 'preview'" xmlns="http://www.w3.org/2000/svg" width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1.5" stroke-linecap="round" stroke-linejoin="round">
              <rect width="18" height="18" x="3" y="3" rx="2" ry="2" />
              <circle cx="9" cy="9" r="2" />
              <path d="m21 15-3.086-3.086a2 2 0 0 0-2.828 0L6 21" />
            </svg>
            <svg v-if="feature.icon === 'bulk'" xmlns="http://www.w3.org/2000/svg" width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1.5" stroke-linecap="round" stroke-linejoin="round">
              <rect width="8" height="4" x="8" y="2" rx="1" ry="1" />
              <path d="M16 4h2a2 2 0 0 1 2 2v14a2 2 0 0 1-2 2H6a2 2 0 0 1-2-2V6a2 2 0 0 1 2-2h2" />
              <path d="m9 14 2 2 4-4" />
            </svg>
            <svg v-if="feature.icon === 'keyboard'" xmlns="http://www.w3.org/2000/svg" width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1.5" stroke-linecap="round" stroke-linejoin="round">
              <rect width="20" height="16" x="2" y="4" rx="2" ry="2" />
              <path d="M6 8h.001" /><path d="M10 8h.001" /><path d="M14 8h.001" /><path d="M18 8h.001" />
              <path d="M8 12h.001" /><path d="M12 12h.001" /><path d="M16 12h.001" />
              <path d="M7 16h10" />
            </svg>
            <svg v-if="feature.icon === 'filter'" xmlns="http://www.w3.org/2000/svg" width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1.5" stroke-linecap="round" stroke-linejoin="round">
              <polygon points="22 3 2 3 10 12.46 10 19 14 21 14 12.46 22 3" />
            </svg>
            <svg v-if="feature.icon === 'editor'" xmlns="http://www.w3.org/2000/svg" width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1.5" stroke-linecap="round" stroke-linejoin="round">
              <path d="m18 13-1.5-7.5L2 2l3.5 14.5L13 18l5-5z" /><path d="m2 2 7.586 7.586" />
              <circle cx="11" cy="11" r="2" />
            </svg>
            <svg v-if="feature.icon === 'framework'" xmlns="http://www.w3.org/2000/svg" width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1.5" stroke-linecap="round" stroke-linejoin="round">
              <path d="m7 11 2-2-2-2" /><path d="M11 13h4" />
              <rect width="18" height="18" x="3" y="3" rx="2" ry="2" />
            </svg>
          </div>
          <div>
            <h3 class="secondary-title">{{ feature.title }}</h3>
            <p class="secondary-description">{{ feature.description }}</p>
          </div>
        </div>
      </div>
    </div>
  </section>
</template>

<style scoped>
.features-section {
  padding: 56px 24px;
}

@media (min-width: 768px) {
  .features-section {
    padding: 72px 48px;
  }
}

.features-container {
  max-width: 960px;
  margin: 0 auto;
}

.features-title {
  font-size: 26px;
  font-weight: 700;
  text-align: center;
  margin-bottom: 6px;
}

@media (min-width: 768px) {
  .features-title {
    font-size: 32px;
  }
}

.features-subtitle {
  font-size: 16px;
  color: var(--vp-c-text-2);
  text-align: center;
  margin-bottom: 40px;
}

/* Primary features — 2 larger cards */
.primary-grid {
  display: grid;
  grid-template-columns: 1fr;
  gap: 16px;
  margin-bottom: 16px;
}

@media (min-width: 640px) {
  .primary-grid {
    grid-template-columns: repeat(2, 1fr);
  }
}

.primary-card {
  padding: 28px 24px;
  border-radius: 12px;
  background: var(--vp-c-bg-soft);
  border: 1px solid var(--vp-c-divider);
}

.card-icon {
  width: 40px;
  height: 40px;
  display: flex;
  align-items: center;
  justify-content: center;
  border-radius: 10px;
  background: var(--vp-c-brand-soft);
  color: var(--vp-c-brand-1);
  margin-bottom: 16px;
}

.primary-title {
  font-size: 17px;
  font-weight: 600;
  margin-bottom: 6px;
}

.primary-description {
  font-size: 14px;
  line-height: 1.6;
  color: var(--vp-c-text-2);
}

/* Secondary features — 6 compact cards */
.secondary-grid {
  display: grid;
  grid-template-columns: 1fr;
  gap: 12px;
}

@media (min-width: 640px) {
  .secondary-grid {
    grid-template-columns: repeat(2, 1fr);
  }
}

@media (min-width: 960px) {
  .secondary-grid {
    grid-template-columns: repeat(3, 1fr);
  }
}

.secondary-card {
  display: flex;
  align-items: flex-start;
  gap: 14px;
  padding: 18px 16px;
  border-radius: 10px;
  border: 1px solid var(--vp-c-divider);
  transition: border-color 0.15s;
}

.secondary-card:hover {
  border-color: var(--vp-c-text-3);
}

.secondary-icon {
  width: 34px;
  height: 34px;
  display: flex;
  align-items: center;
  justify-content: center;
  border-radius: 8px;
  background: var(--vp-c-bg-soft);
  color: var(--vp-c-text-2);
  flex-shrink: 0;
}

.secondary-title {
  font-size: 14px;
  font-weight: 600;
  margin-bottom: 2px;
}

.secondary-description {
  font-size: 13px;
  line-height: 1.45;
  color: var(--vp-c-text-3);
}
</style>
