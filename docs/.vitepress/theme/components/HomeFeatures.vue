<script setup lang="ts">
const features = [
  {
    label: 'Scan',
    detail: 'Discovers images, fonts, videos, audio, documents, and data files across your configured directories. Updates in real time.',
  },
  {
    label: 'Preview',
    detail: 'Sharp-powered thumbnails with memory + disk caching. Grid view with search, sort, and advanced size/date/extension filters.',
  },
  {
    label: 'Track',
    detail: 'Detects ES imports, dynamic imports, require, CSS url(), and HTML src/href. Surfaces unused assets. Click to open at the exact line.',
  },
  {
    label: 'Dedupe',
    detail: 'MD5 content hashing finds byte-identical files even with different names. See duplicates count on every card.',
  },
  {
    label: 'Act',
    detail: 'Multi-select with Shift/Ctrl+click. Bulk copy paths, download as ZIP, delete. Full keyboard nav with vim-style j/k.',
  },
]
</script>

<template>
  <section class="feat">
    <div class="feat-inner">
      <div class="feat-list">
        <div v-for="(f, i) in features" :key="f.label" class="feat-item">
          <div class="feat-num">{{ String(i + 1).padStart(2, '0') }}</div>
          <div class="feat-content">
            <h3 class="feat-label">{{ f.label }}</h3>
            <p class="feat-detail">{{ f.detail }}</p>
          </div>
        </div>
      </div>
    </div>
  </section>
</template>

<style scoped>
.feat {
  padding: 48px 24px;
  border-top: 1px solid var(--vp-c-divider);
}

@media (min-width: 960px) {
  .feat {
    padding: 72px 48px;
  }
}

.feat-inner {
  max-width: 720px;
  margin: 0 auto;
}

.feat-list {
  display: flex;
  flex-direction: column;
}

.feat-item {
  display: flex;
  gap: 20px;
  padding: 24px 0;
  border-bottom: 1px solid var(--vp-c-divider);
}

.feat-item:first-child {
  padding-top: 0;
}

.feat-item:last-child {
  border-bottom: none;
  padding-bottom: 0;
}

.feat-num {
  font-family: var(--vp-font-family-mono);
  font-size: 12px;
  color: var(--vp-c-text-3);
  padding-top: 3px;
  flex-shrink: 0;
  width: 28px;
}

.feat-content {
  flex: 1;
  min-width: 0;
}

.feat-label {
  font-family: var(--font-display);
  font-size: 22px;
  font-weight: 600;
  color: var(--vp-c-text-1);
  margin-bottom: 6px;
}

@media (min-width: 768px) {
  .feat-label {
    font-size: 26px;
  }
}

.feat-detail {
  font-size: 14px;
  line-height: 1.6;
  color: var(--vp-c-text-2);
}

@media (min-width: 768px) {
  .feat-detail {
    font-size: 15px;
  }
}
</style>
