<script setup lang="ts">
import { ref, onMounted } from 'vue'
import { withBase } from 'vitepress'

const isLoaded = ref(false)
const showDemo = ref(false)

onMounted(() => {
  // Delay iframe load for better initial page performance
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
        <h2 class="demo-title">See it in action</h2>
        <p class="demo-subtitle">
          A real-time dashboard that discovers and catalogues all your project's assets
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
            <svg
              xmlns="http://www.w3.org/2000/svg"
              width="12"
              height="12"
              viewBox="0 0 24 24"
              fill="none"
              stroke="currentColor"
              stroke-width="2"
              stroke-linecap="round"
              stroke-linejoin="round"
            >
              <rect width="18" height="11" x="3" y="11" rx="2" ry="2" />
              <path d="M7 11V7a5 5 0 0 1 10 0v4" />
            </svg>
            localhost:5173/__asset_manager__/
          </div>
        </div>

        <div class="window-content">
          <div v-if="!showDemo" class="demo-placeholder">
            <div class="placeholder-grid">
              <div v-for="i in 8" :key="i" class="placeholder-card">
                <div class="placeholder-thumb" />
                <div class="placeholder-text" />
                <div class="placeholder-text short" />
              </div>
            </div>
          </div>

          <iframe
            v-if="showDemo"
            class="demo-iframe"
            :class="{ loaded: isLoaded }"
            src="about:blank"
            title="Asset Manager Demo"
            @load="isLoaded = true"
          />
        </div>
      </div>

      <p class="demo-note">
        <svg
          xmlns="http://www.w3.org/2000/svg"
          width="14"
          height="14"
          viewBox="0 0 24 24"
          fill="none"
          stroke="currentColor"
          stroke-width="2"
          stroke-linecap="round"
          stroke-linejoin="round"
        >
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
  max-width: 960px;
  margin: 0 auto;
}

.demo-header {
  text-align: center;
  margin-bottom: 40px;
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
}

.dot {
  width: 10px;
  height: 10px;
  border-radius: 50%;
}

.dot-red {
  background: #ff5f57;
}

.dot-yellow {
  background: #febc2e;
}

.dot-green {
  background: #28c840;
}

.window-url {
  display: flex;
  align-items: center;
  gap: 6px;
  flex: 1;
  padding: 6px 12px;
  background: var(--vp-c-bg);
  border-radius: 8px;
  font-size: 12px;
  font-family: var(--vp-font-family-mono);
  color: var(--vp-c-text-3);
}

.window-content {
  background: var(--vp-c-bg);
  min-height: 400px;
  position: relative;
}

@media (min-width: 768px) {
  .window-content {
    min-height: 500px;
  }
}

.demo-placeholder {
  padding: 24px;
}

.placeholder-grid {
  display: grid;
  grid-template-columns: repeat(4, 1fr);
  gap: 16px;
}

@media (max-width: 640px) {
  .placeholder-grid {
    grid-template-columns: repeat(2, 1fr);
  }
}

.placeholder-card {
  border-radius: 8px;
  padding: 12px;
  background: var(--vp-c-bg-soft);
  animation: shimmer 2s infinite;
}

.placeholder-thumb {
  width: 100%;
  aspect-ratio: 1;
  border-radius: 6px;
  background: var(--vp-c-divider);
  margin-bottom: 10px;
}

.placeholder-text {
  height: 10px;
  border-radius: 4px;
  background: var(--vp-c-divider);
  margin-bottom: 6px;
}

.placeholder-text.short {
  width: 60%;
}

.demo-iframe {
  width: 100%;
  height: 500px;
  border: none;
  opacity: 0;
  transition: opacity 0.3s ease;
}

.demo-iframe.loaded {
  opacity: 1;
}

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
  from {
    opacity: 0;
    transform: scale(0.96);
  }
  to {
    opacity: 1;
    transform: scale(1);
  }
}

@keyframes shimmer {
  0%,
  100% {
    opacity: 1;
  }
  50% {
    opacity: 0.6;
  }
}
</style>
