<script setup lang="ts">
import { ref, computed, onMounted } from 'vue'

const isLoaded = ref(false)
const showDemo = ref(false)
const isDev = ref(false)

const demoSrc = computed(() => {
  if (!showDemo.value) return 'about:blank'
  if (isDev.value) return '/__asset_manager__/'
  return 'about:blank'
})

onMounted(() => {
  isDev.value = import.meta.env.DEV

  const observer = new IntersectionObserver(
    (entries) => {
      if (entries[0].isIntersecting) {
        showDemo.value = true
        observer.disconnect()
      }
    },
    { threshold: 0.05 }
  )

  const el = document.querySelector('.demo')
  if (el) observer.observe(el)
})
</script>

<template>
  <section class="demo">
    <div class="demo-inner">
      <div class="demo-frame">
        <div class="frame-bar">
          <div class="bar-dots">
            <span /><span /><span />
          </div>
          <div class="bar-url">
            localhost:5173/__asset_manager__/
          </div>
          <div class="bar-spacer" />
        </div>

        <div class="frame-body">
          <template v-if="isDev && showDemo">
            <div v-if="!isLoaded" class="frame-loading">
              <div class="spinner" />
            </div>
            <iframe
              class="frame-iframe"
              :class="{ loaded: isLoaded }"
              :src="demoSrc"
              title="Asset Manager"
              @load="isLoaded = true"
            />
          </template>

          <template v-else>
            <div class="frame-placeholder">
              <div class="ph-side">
                <div class="ph-bar active" />
                <div class="ph-bar" />
                <div class="ph-bar" />
                <div class="ph-bar" />
                <div class="ph-sep" />
                <div class="ph-bar w70" />
                <div class="ph-bar w70" />
              </div>
              <div class="ph-main">
                <div class="ph-search-row">
                  <div class="ph-search" />
                </div>
                <div class="ph-grid">
                  <div v-for="i in 12" :key="i" class="ph-card">
                    <div class="ph-img" />
                    <div class="ph-line" />
                    <div class="ph-line w60" />
                  </div>
                </div>
              </div>
            </div>
            <div class="frame-overlay">
              <a href="/guide/getting-started" class="overlay-link">
                Try the live dashboard &rarr;
              </a>
            </div>
          </template>
        </div>
      </div>

      <p class="demo-caption">
        The real plugin, running on this site.
        <kbd>⌥⇧A</kbd> toggles it in your app.
      </p>
    </div>
  </section>
</template>

<style scoped>
.demo {
  padding: 24px 24px 48px;
}

@media (min-width: 960px) {
  .demo {
    padding: 32px 48px 64px;
  }
}

.demo-inner {
  max-width: 1080px;
  margin: 0 auto;
}

.demo-frame {
  border: 1px solid var(--vp-c-divider);
  border-radius: 12px;
  overflow: hidden;
  background: var(--vp-c-bg);
}

.frame-bar {
  display: flex;
  align-items: center;
  gap: 12px;
  padding: 10px 14px;
  background: var(--vp-c-bg-soft);
  border-bottom: 1px solid var(--vp-c-divider);
}

.bar-dots {
  display: flex;
  gap: 5px;
}

.bar-dots span {
  width: 9px;
  height: 9px;
  border-radius: 50%;
  background: var(--vp-c-divider);
}

.bar-url {
  flex: 1;
  text-align: center;
  font-family: var(--vp-font-family-mono);
  font-size: 11px;
  color: var(--vp-c-text-3);
}

.bar-spacer {
  width: 39px;
}

.frame-body {
  position: relative;
  min-height: 380px;
}

@media (min-width: 768px) {
  .frame-body {
    min-height: 480px;
  }
}

/* Live iframe */
.frame-loading {
  position: absolute;
  inset: 0;
  display: flex;
  align-items: center;
  justify-content: center;
  z-index: 1;
}

.spinner {
  width: 20px;
  height: 20px;
  border: 2px solid var(--vp-c-divider);
  border-top-color: var(--vp-c-brand-1);
  border-radius: 50%;
  animation: spin 0.7s linear infinite;
}

.frame-iframe {
  width: 100%;
  height: 480px;
  border: none;
  opacity: 0;
  transition: opacity 0.3s;
}

.frame-iframe.loaded {
  opacity: 1;
}

/* Placeholder */
.frame-placeholder {
  display: flex;
  height: 480px;
}

.ph-side {
  width: 180px;
  padding: 14px 10px;
  border-right: 1px solid var(--vp-c-divider);
  background: var(--vp-c-bg-soft);
  display: none;
}

@media (min-width: 768px) {
  .ph-side { display: block; }
}

.ph-bar {
  height: 28px;
  border-radius: 5px;
  background: var(--vp-c-divider);
  margin-bottom: 5px;
  opacity: 0.4;
}

.ph-bar.active {
  opacity: 0.7;
  background: var(--vp-c-brand-soft);
}

.ph-bar.w70 { width: 70%; }

.ph-sep {
  height: 1px;
  background: var(--vp-c-divider);
  margin: 10px 0;
}

.ph-main {
  flex: 1;
  padding: 14px;
  overflow: hidden;
}

.ph-search-row {
  margin-bottom: 14px;
}

.ph-search {
  height: 32px;
  border-radius: 6px;
  background: var(--vp-c-bg-soft);
  border: 1px solid var(--vp-c-divider);
}

.ph-grid {
  display: grid;
  grid-template-columns: repeat(2, 1fr);
  gap: 10px;
}

@media (min-width: 640px) {
  .ph-grid { grid-template-columns: repeat(3, 1fr); }
}

@media (min-width: 960px) {
  .ph-grid { grid-template-columns: repeat(4, 1fr); }
}

.ph-card {
  padding: 8px;
  border-radius: 6px;
  background: var(--vp-c-bg-soft);
}

.ph-img {
  aspect-ratio: 1;
  border-radius: 4px;
  background: var(--vp-c-divider);
  margin-bottom: 6px;
  opacity: 0.5;
}

.ph-line {
  height: 6px;
  border-radius: 3px;
  background: var(--vp-c-divider);
  margin-bottom: 4px;
  opacity: 0.4;
}

.ph-line.w60 { width: 60%; }

.frame-overlay {
  position: absolute;
  inset: 0;
  display: flex;
  align-items: center;
  justify-content: center;
  background: linear-gradient(
    to bottom,
    transparent 20%,
    color-mix(in srgb, var(--vp-c-bg) 90%, transparent) 70%
  );
}

.overlay-link {
  padding: 10px 20px;
  border-radius: 6px;
  font-size: 14px;
  font-weight: 500;
  color: var(--vp-c-brand-1);
  background: var(--vp-c-bg);
  border: 1px solid var(--vp-c-brand-soft);
  text-decoration: none;
  transition: border-color 0.15s;
}

.overlay-link:hover {
  border-color: var(--vp-c-brand-1);
}

.demo-caption {
  margin-top: 12px;
  text-align: center;
  font-size: 13px;
  color: var(--vp-c-text-3);
}

.demo-caption kbd {
  padding: 1px 5px;
  border-radius: 3px;
  font-size: 11px;
  font-family: var(--vp-font-family-mono);
  background: var(--vp-c-bg-soft);
  border: 1px solid var(--vp-c-divider);
}

@keyframes spin {
  to { transform: rotate(360deg); }
}
</style>
