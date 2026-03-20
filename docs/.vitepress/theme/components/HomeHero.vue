<script setup lang="ts">
import { useData } from 'vitepress'

const { isDark } = useData()
</script>

<template>
  <section class="hero-section">
    <div class="hero-bg">
      <div class="hero-glow hero-glow-1" />
      <div class="hero-glow hero-glow-2" />
    </div>

    <div class="hero-content">
      <div class="hero-badge">
        <span class="badge-dot" />
        Open Source Vite Plugin
      </div>

      <h1 class="hero-title">
        <span class="title-line">Visual Asset</span>
        <span class="title-line title-gradient">Management</span>
        <span class="title-line">for Vite</span>
      </h1>

      <p class="hero-description">
        Discover, catalogue, and manage all media assets in your Vite projects.
        Real-time dashboard with thumbnail generation, duplicate detection, and
        framework-agnostic integration.
      </p>

      <div class="hero-actions">
        <a href="/guide/getting-started" class="action-btn action-primary">
          Get Started
          <svg
            xmlns="http://www.w3.org/2000/svg"
            width="16"
            height="16"
            viewBox="0 0 24 24"
            fill="none"
            stroke="currentColor"
            stroke-width="2"
            stroke-linecap="round"
            stroke-linejoin="round"
          >
            <path d="M5 12h14" />
            <path d="m12 5 7 7-7 7" />
          </svg>
        </a>
        <a
          href="https://github.com/ejirocodes/vite-plugin-asset-manager"
          class="action-btn action-secondary"
          target="_blank"
          rel="noopener"
        >
          <svg
            xmlns="http://www.w3.org/2000/svg"
            width="18"
            height="18"
            viewBox="0 0 24 24"
            fill="currentColor"
          >
            <path
              d="M12 0c-6.626 0-12 5.373-12 12 0 5.302 3.438 9.8 8.207 11.387.599.111.793-.261.793-.577v-2.234c-3.338.726-4.033-1.416-4.033-1.416-.546-1.387-1.333-1.756-1.333-1.756-1.089-.745.083-.729.083-.729 1.205.084 1.839 1.237 1.839 1.237 1.07 1.834 2.807 1.304 3.492.997.107-.775.418-1.305.762-1.604-2.665-.305-5.467-1.334-5.467-5.931 0-1.311.469-2.381 1.236-3.221-.124-.303-.535-1.524.117-3.176 0 0 1.008-.322 3.301 1.23.957-.266 1.983-.399 3.003-.404 1.02.005 2.047.138 3.006.404 2.291-1.552 3.297-1.23 3.297-1.23.653 1.653.242 2.874.118 3.176.77.84 1.235 1.911 1.235 3.221 0 4.609-2.807 5.624-5.479 5.921.43.372.823 1.102.823 2.222v3.293c0 .319.192.694.801.576 4.765-1.589 8.199-6.086 8.199-11.386 0-6.627-5.373-12-12-12z"
            />
          </svg>
          GitHub
        </a>
      </div>

      <div class="hero-install">
        <div class="install-label">Quick Install</div>
        <div class="install-code">
          <code>npm install -D vite-plugin-asset-manager</code>
          <button class="copy-btn" @click="copyInstall" :title="copied ? 'Copied!' : 'Copy'">
            <svg
              v-if="!copied"
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
              <rect width="14" height="14" x="8" y="8" rx="2" ry="2" />
              <path d="M4 16c-1.1 0-2-.9-2-2V4c0-1.1.9-2 2-2h10c1.1 0 2 .9 2 2" />
            </svg>
            <svg
              v-else
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
              <polyline points="20 6 9 17 4 12" />
            </svg>
          </button>
        </div>
      </div>
    </div>
  </section>
</template>

<script lang="ts">
import { ref } from 'vue'

const copied = ref(false)

function copyInstall() {
  navigator.clipboard.writeText('npm install -D vite-plugin-asset-manager')
  copied.value = true
  setTimeout(() => (copied.value = false), 2000)
}
</script>

<style scoped>
.hero-section {
  position: relative;
  padding: 80px 24px 48px;
  text-align: center;
  overflow: hidden;
}

@media (min-width: 768px) {
  .hero-section {
    padding: 120px 48px 64px;
  }
}

.hero-bg {
  position: absolute;
  inset: 0;
  pointer-events: none;
  overflow: hidden;
}

.hero-glow {
  position: absolute;
  border-radius: 50%;
  filter: blur(100px);
  opacity: 0.3;
}

.dark .hero-glow {
  opacity: 0.15;
}

.hero-glow-1 {
  width: 600px;
  height: 600px;
  background: var(--vp-c-brand-1);
  top: -200px;
  left: 50%;
  transform: translateX(-70%);
}

.hero-glow-2 {
  width: 400px;
  height: 400px;
  background: #42b883;
  top: -100px;
  left: 50%;
  transform: translateX(30%);
}

.hero-content {
  position: relative;
  max-width: 720px;
  margin: 0 auto;
}

.hero-badge {
  display: inline-flex;
  align-items: center;
  gap: 8px;
  padding: 6px 16px;
  border-radius: 9999px;
  font-size: 13px;
  font-weight: 500;
  color: var(--vp-c-brand-1);
  background: var(--vp-c-brand-soft);
  margin-bottom: 24px;
  animation: fadeInUp 0.6s ease-out;
}

.badge-dot {
  width: 6px;
  height: 6px;
  border-radius: 50%;
  background: var(--vp-c-brand-1);
  animation: pulse 2s infinite;
}

.hero-title {
  font-size: 40px;
  font-weight: 800;
  line-height: 1.1;
  letter-spacing: -0.02em;
  margin-bottom: 20px;
  animation: fadeInUp 0.6s ease-out 0.1s both;
}

@media (min-width: 768px) {
  .hero-title {
    font-size: 56px;
  }
}

@media (min-width: 1024px) {
  .hero-title {
    font-size: 68px;
  }
}

.title-line {
  display: block;
}

.title-gradient {
  background: linear-gradient(120deg, var(--vp-c-brand-1) 30%, #42b883);
  -webkit-background-clip: text;
  -webkit-text-fill-color: transparent;
  background-clip: text;
}

.hero-description {
  font-size: 18px;
  line-height: 1.6;
  color: var(--vp-c-text-2);
  max-width: 560px;
  margin: 0 auto 32px;
  animation: fadeInUp 0.6s ease-out 0.2s both;
}

@media (min-width: 768px) {
  .hero-description {
    font-size: 20px;
  }
}

.hero-actions {
  display: flex;
  gap: 12px;
  justify-content: center;
  flex-wrap: wrap;
  margin-bottom: 32px;
  animation: fadeInUp 0.6s ease-out 0.3s both;
}

.action-btn {
  display: inline-flex;
  align-items: center;
  gap: 8px;
  padding: 12px 24px;
  border-radius: 12px;
  font-size: 15px;
  font-weight: 600;
  text-decoration: none;
  transition: all 0.2s ease;
}

.action-primary {
  background: var(--vp-c-brand-1);
  color: #fff;
}

.action-primary:hover {
  background: var(--vp-c-brand-2);
  transform: translateY(-1px);
  box-shadow: 0 4px 16px rgba(100, 108, 255, 0.3);
}

.action-secondary {
  background: var(--vp-c-bg-soft);
  color: var(--vp-c-text-1);
  border: 1px solid var(--vp-c-divider);
}

.action-secondary:hover {
  border-color: var(--vp-c-brand-1);
  color: var(--vp-c-brand-1);
  transform: translateY(-1px);
}

.hero-install {
  animation: fadeInUp 0.6s ease-out 0.4s both;
}

.install-label {
  font-size: 12px;
  font-weight: 600;
  text-transform: uppercase;
  letter-spacing: 0.05em;
  color: var(--vp-c-text-3);
  margin-bottom: 8px;
}

.install-code {
  display: inline-flex;
  align-items: center;
  gap: 12px;
  padding: 10px 16px;
  background: var(--vp-c-bg-soft);
  border: 1px solid var(--vp-c-divider);
  border-radius: 10px;
  font-family: var(--vp-font-family-mono);
  font-size: 14px;
  color: var(--vp-c-text-1);
}

.copy-btn {
  display: flex;
  align-items: center;
  justify-content: center;
  padding: 4px;
  border: none;
  background: none;
  color: var(--vp-c-text-3);
  cursor: pointer;
  border-radius: 4px;
  transition: color 0.2s;
}

.copy-btn:hover {
  color: var(--vp-c-brand-1);
}

@keyframes fadeInUp {
  from {
    opacity: 0;
    transform: translateY(20px);
  }
  to {
    opacity: 1;
    transform: translateY(0);
  }
}

@keyframes pulse {
  0%,
  100% {
    opacity: 1;
  }
  50% {
    opacity: 0.5;
  }
}
</style>
