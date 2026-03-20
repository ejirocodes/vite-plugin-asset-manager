<script setup lang="ts">
import { ref, computed, onMounted } from 'vue'
import { useData } from 'vitepress'

const { isDark } = useData()
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
    { threshold: 0.1 }
  )

  const el = document.querySelector('.demo-section')
  if (el) observer.observe(el)
})
</script>

<template>
  <section class="demo-section">
    <div class="demo-container">
      <div class="demo-header">
        <div class="demo-badge">
          <span class="badge-live" />
          Live Demo
        </div>
        <h2 class="demo-title">See it in action</h2>
        <p class="demo-subtitle">
          This is the real plugin running on this docs site — scanning its own assets in real time
        </p>
      </div>

      <div class="demo-window">
        <div class="window-chrome">
          <div class="window-dots">
            <span class="dot dot-red" />
            <span class="dot dot-yellow" />
            <span class="dot dot-green" />
          </div>
          <div class="window-url">
            <svg xmlns="http://www.w3.org/2000/svg" width="12" height="12" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round">
              <rect width="18" height="11" x="3" y="11" rx="2" ry="2" />
              <path d="M7 11V7a5 5 0 0 1 10 0v4" />
            </svg>
            <span class="url-text">localhost:5173/__asset_manager__/</span>
          </div>
        </div>

        <div class="window-content">
          <!-- Live demo in dev mode -->
          <template v-if="isDev && showDemo">
            <div v-if="!isLoaded" class="demo-loading">
              <div class="loading-spinner" />
              <span>Loading dashboard...</span>
            </div>
            <iframe
              class="demo-iframe"
              :class="{ loaded: isLoaded }"
              :src="demoSrc"
              title="Asset Manager Live Demo"
              @load="isLoaded = true"
            />
          </template>

          <!-- Static placeholder for production -->
          <template v-else>
            <div class="demo-placeholder">
              <div class="placeholder-sidebar">
                <div class="ph-sidebar-item active" />
                <div class="ph-sidebar-item" />
                <div class="ph-sidebar-item" />
                <div class="ph-sidebar-item" />
                <div class="ph-sidebar-item" />
                <div class="ph-sidebar-divider" />
                <div class="ph-sidebar-item short" />
                <div class="ph-sidebar-item short" />
              </div>
              <div class="placeholder-main">
                <div class="ph-toolbar">
                  <div class="ph-search" />
                  <div class="ph-controls">
                    <div class="ph-btn" />
                    <div class="ph-btn" />
                  </div>
                </div>
                <div class="placeholder-grid">
                  <div v-for="i in 12" :key="i" class="placeholder-card" :style="{ '--i': i }">
                    <div class="placeholder-thumb" :class="{ 'thumb-colored': i % 3 === 0 }" />
                    <div class="placeholder-meta">
                      <div class="placeholder-text" />
                      <div class="placeholder-text short" />
                    </div>
                  </div>
                </div>
              </div>
            </div>
            <div class="demo-overlay">
              <div class="overlay-content">
                <p class="overlay-text">Install the plugin to see the live dashboard</p>
                <a href="/guide/getting-started" class="overlay-btn">Get Started</a>
              </div>
            </div>
          </template>
        </div>
      </div>

      <p class="demo-note">
        <svg xmlns="http://www.w3.org/2000/svg" width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round">
          <circle cx="12" cy="12" r="10" />
          <path d="M12 16v-4" />
          <path d="M12 8h.01" />
        </svg>
        Press <kbd>⌥⇧A</kbd> in your app to toggle the asset manager panel
      </p>
    </div>
  </section>
</template>

<style scoped>
.demo-section {
  padding: 48px 24px 64px;
}

@media (min-width: 768px) {
  .demo-section {
    padding: 64px 48px 80px;
  }
}

.demo-container {
  max-width: 1024px;
  margin: 0 auto;
}

.demo-header {
  text-align: center;
  margin-bottom: 40px;
}

.demo-badge {
  display: inline-flex;
  align-items: center;
  gap: 6px;
  padding: 4px 12px;
  border-radius: 9999px;
  font-size: 12px;
  font-weight: 600;
  text-transform: uppercase;
  letter-spacing: 0.05em;
  color: #10b981;
  background: rgba(16, 185, 129, 0.1);
  margin-bottom: 16px;
}

.badge-live {
  width: 6px;
  height: 6px;
  border-radius: 50%;
  background: #10b981;
  animation: pulse 2s infinite;
}

.demo-title {
  font-size: 28px;
  font-weight: 700;
  margin-bottom: 8px;
}

@media (min-width: 768px) {
  .demo-title {
    font-size: 36px;
  }
}

.demo-subtitle {
  font-size: 16px;
  color: var(--vp-c-text-2);
  max-width: 520px;
  margin: 0 auto;
}

.demo-window {
  border-radius: 16px;
  overflow: hidden;
  border: 1px solid var(--vp-c-divider);
  box-shadow:
    0 4px 6px -1px rgba(0, 0, 0, 0.1),
    0 20px 60px -15px rgba(0, 0, 0, 0.15);
  animation: scaleIn 0.5s ease-out;
}

.dark .demo-window {
  box-shadow:
    0 4px 6px -1px rgba(0, 0, 0, 0.3),
    0 20px 60px -15px rgba(0, 0, 0, 0.5);
}

.window-chrome {
  display: flex;
  align-items: center;
  gap: 12px;
  padding: 12px 16px;
  background: var(--vp-c-bg-soft);
  border-bottom: 1px solid var(--vp-c-divider);
}

.window-dots {
  display: flex;
  gap: 6px;
  flex-shrink: 0;
}

.dot {
  width: 10px;
  height: 10px;
  border-radius: 50%;
}

.dot-red { background: #ff5f57; }
.dot-yellow { background: #febc2e; }
.dot-green { background: #28c840; }

.window-url {
  display: flex;
  align-items: center;
  gap: 6px;
  flex: 1;
  min-width: 0;
  padding: 6px 12px;
  background: var(--vp-c-bg);
  border-radius: 8px;
  font-size: 12px;
  font-family: var(--vp-font-family-mono);
  color: var(--vp-c-text-3);
}

.url-text {
  overflow: hidden;
  text-overflow: ellipsis;
  white-space: nowrap;
}

.window-content {
  background: var(--vp-c-bg);
  min-height: 420px;
  position: relative;
}

@media (min-width: 768px) {
  .window-content {
    min-height: 520px;
  }
}

/* Live demo iframe */
.demo-loading {
  position: absolute;
  inset: 0;
  display: flex;
  flex-direction: column;
  align-items: center;
  justify-content: center;
  gap: 12px;
  color: var(--vp-c-text-3);
  font-size: 14px;
  z-index: 1;
}

.loading-spinner {
  width: 24px;
  height: 24px;
  border: 2px solid var(--vp-c-divider);
  border-top-color: var(--vp-c-brand-1);
  border-radius: 50%;
  animation: spin 0.8s linear infinite;
}

.demo-iframe {
  width: 100%;
  height: 520px;
  border: none;
  opacity: 0;
  transition: opacity 0.4s ease;
}

.demo-iframe.loaded {
  opacity: 1;
}

/* Production placeholder - dashboard mockup */
.demo-placeholder {
  display: flex;
  height: 520px;
}

.placeholder-sidebar {
  width: 200px;
  padding: 16px 12px;
  border-right: 1px solid var(--vp-c-divider);
  background: var(--vp-c-bg-soft);
  display: none;
}

@media (min-width: 768px) {
  .placeholder-sidebar {
    display: block;
  }
}

.ph-sidebar-item {
  height: 32px;
  border-radius: 6px;
  background: var(--vp-c-divider);
  margin-bottom: 6px;
  opacity: 0.5;
}

.ph-sidebar-item.active {
  background: var(--vp-c-brand-soft);
  opacity: 1;
}

.ph-sidebar-item.short {
  width: 70%;
}

.ph-sidebar-divider {
  height: 1px;
  background: var(--vp-c-divider);
  margin: 12px 0;
}

.placeholder-main {
  flex: 1;
  padding: 16px;
  overflow: hidden;
}

.ph-toolbar {
  display: flex;
  align-items: center;
  gap: 12px;
  margin-bottom: 16px;
}

.ph-search {
  flex: 1;
  height: 36px;
  border-radius: 8px;
  background: var(--vp-c-bg-soft);
  border: 1px solid var(--vp-c-divider);
}

.ph-controls {
  display: flex;
  gap: 8px;
}

.ph-btn {
  width: 36px;
  height: 36px;
  border-radius: 8px;
  background: var(--vp-c-bg-soft);
  border: 1px solid var(--vp-c-divider);
}

.placeholder-grid {
  display: grid;
  grid-template-columns: repeat(2, 1fr);
  gap: 12px;
}

@media (min-width: 640px) {
  .placeholder-grid {
    grid-template-columns: repeat(3, 1fr);
  }
}

@media (min-width: 960px) {
  .placeholder-grid {
    grid-template-columns: repeat(4, 1fr);
  }
}

.placeholder-card {
  border-radius: 10px;
  padding: 10px;
  background: var(--vp-c-bg-soft);
  border: 1px solid var(--vp-c-divider);
  animation: shimmer 2.5s ease-in-out infinite;
  animation-delay: calc(var(--i) * 0.1s);
}

.placeholder-thumb {
  width: 100%;
  aspect-ratio: 1;
  border-radius: 6px;
  background: linear-gradient(135deg, var(--vp-c-divider) 0%, color-mix(in srgb, var(--vp-c-divider) 60%, transparent) 100%);
  margin-bottom: 8px;
}

.placeholder-thumb.thumb-colored {
  background: linear-gradient(135deg, var(--vp-c-brand-soft) 0%, color-mix(in srgb, var(--vp-c-brand-1) 15%, transparent) 100%);
}

.placeholder-meta {
  display: flex;
  flex-direction: column;
  gap: 4px;
}

.placeholder-text {
  height: 8px;
  border-radius: 4px;
  background: var(--vp-c-divider);
}

.placeholder-text.short {
  width: 55%;
}

/* Production overlay */
.demo-overlay {
  position: absolute;
  inset: 0;
  display: flex;
  align-items: center;
  justify-content: center;
  background: linear-gradient(to bottom, transparent 0%, color-mix(in srgb, var(--vp-c-bg) 80%, transparent) 40%, var(--vp-c-bg) 100%);
}

.overlay-content {
  text-align: center;
  padding: 24px;
}

.overlay-text {
  font-size: 15px;
  color: var(--vp-c-text-2);
  margin-bottom: 16px;
}

.overlay-btn {
  display: inline-flex;
  align-items: center;
  gap: 6px;
  padding: 10px 20px;
  border-radius: 10px;
  font-size: 14px;
  font-weight: 600;
  background: var(--vp-c-brand-1);
  color: #fff;
  text-decoration: none;
  transition: all 0.2s ease;
}

.overlay-btn:hover {
  background: var(--vp-c-brand-2);
  transform: translateY(-1px);
  box-shadow: 0 4px 16px rgba(100, 108, 255, 0.3);
}

/* Note */
.demo-note {
  display: flex;
  align-items: center;
  justify-content: center;
  gap: 6px;
  margin-top: 16px;
  font-size: 13px;
  color: var(--vp-c-text-3);
}

.demo-note kbd {
  padding: 2px 6px;
  border-radius: 4px;
  font-size: 12px;
  font-family: var(--vp-font-family-mono);
  background: var(--vp-c-bg-soft);
  border: 1px solid var(--vp-c-divider);
}

@keyframes scaleIn {
  from { opacity: 0; transform: scale(0.96); }
  to { opacity: 1; transform: scale(1); }
}

@keyframes shimmer {
  0%, 100% { opacity: 1; }
  50% { opacity: 0.5; }
}

@keyframes pulse {
  0%, 100% { opacity: 1; }
  50% { opacity: 0.4; }
}

@keyframes spin {
  to { transform: rotate(360deg); }
}
</style>
