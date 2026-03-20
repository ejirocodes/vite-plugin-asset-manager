<script setup lang="ts">
import { ref } from 'vue'

const copied = ref(false)

function copyInstall() {
  navigator.clipboard.writeText('pnpm add -D vite-plugin-asset-manager')
  copied.value = true
  setTimeout(() => (copied.value = false), 2000)
}
</script>

<template>
  <section class="hero-section">
    <div class="hero-content">
      <p class="hero-eyebrow">Open-source Vite plugin</p>

      <h1 class="hero-title">
        See every asset<br />
        in your project
      </h1>

      <p class="hero-description">
        A real-time dashboard that discovers, catalogues, and previews all media
        assets across your Vite project — images, fonts, videos, and more.
      </p>

      <div class="hero-actions">
        <a href="/guide/getting-started" class="action-btn action-primary">
          Get Started
          <svg xmlns="http://www.w3.org/2000/svg" width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round">
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
          <svg xmlns="http://www.w3.org/2000/svg" width="18" height="18" viewBox="0 0 24 24" fill="currentColor">
            <path d="M12 0c-6.626 0-12 5.373-12 12 0 5.302 3.438 9.8 8.207 11.387.599.111.793-.261.793-.577v-2.234c-3.338.726-4.033-1.416-4.033-1.416-.546-1.387-1.333-1.756-1.333-1.756-1.089-.745.083-.729.083-.729 1.205.084 1.839 1.237 1.839 1.237 1.07 1.834 2.807 1.304 3.492.997.107-.775.418-1.305.762-1.604-2.665-.305-5.467-1.334-5.467-5.931 0-1.311.469-2.381 1.236-3.221-.124-.303-.535-1.524.117-3.176 0 0 1.008-.322 3.301 1.23.957-.266 1.983-.399 3.003-.404 1.02.005 2.047.138 3.006.404 2.291-1.552 3.297-1.23 3.297-1.23.653 1.653.242 2.874.118 3.176.77.84 1.235 1.911 1.235 3.221 0 4.609-2.807 5.624-5.479 5.921.43.372.823 1.102.823 2.222v3.293c0 .319.192.694.801.576 4.765-1.589 8.199-6.086 8.199-11.386 0-6.627-5.373-12-12-12z" />
          </svg>
          GitHub
        </a>
      </div>

      <div class="hero-install">
        <div class="install-code">
          <span class="install-prompt">$</span>
          <code>pnpm add -D vite-plugin-asset-manager</code>
          <button class="copy-btn" @click="copyInstall" :title="copied ? 'Copied!' : 'Copy to clipboard'">
            <svg v-if="!copied" xmlns="http://www.w3.org/2000/svg" width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round">
              <rect width="14" height="14" x="8" y="8" rx="2" ry="2" />
              <path d="M4 16c-1.1 0-2-.9-2-2V4c0-1.1.9-2 2-2h10c1.1 0 2 .9 2 2" />
            </svg>
            <svg v-else xmlns="http://www.w3.org/2000/svg" width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round">
              <polyline points="20 6 9 17 4 12" />
            </svg>
          </button>
        </div>
      </div>
    </div>
  </section>
</template>

<style scoped>
.hero-section {
  padding: 72px 24px 40px;
  text-align: center;
}

@media (min-width: 768px) {
  .hero-section {
    padding: 100px 48px 56px;
  }
}

.hero-content {
  max-width: 680px;
  margin: 0 auto;
}

.hero-eyebrow {
  font-size: 13px;
  font-weight: 600;
  letter-spacing: 0.08em;
  text-transform: uppercase;
  color: var(--vp-c-brand-1);
  margin-bottom: 16px;
}

.hero-title {
  font-size: 36px;
  font-weight: 800;
  line-height: 1.15;
  letter-spacing: -0.03em;
  color: var(--vp-c-text-1);
  margin-bottom: 16px;
}

@media (min-width: 768px) {
  .hero-title {
    font-size: 52px;
  }
}

@media (min-width: 1024px) {
  .hero-title {
    font-size: 60px;
  }
}

.hero-description {
  font-size: 17px;
  line-height: 1.6;
  color: var(--vp-c-text-2);
  max-width: 520px;
  margin: 0 auto 28px;
}

@media (min-width: 768px) {
  .hero-description {
    font-size: 19px;
  }
}

.hero-actions {
  display: flex;
  gap: 12px;
  justify-content: center;
  flex-wrap: wrap;
  margin-bottom: 28px;
}

.action-btn {
  display: inline-flex;
  align-items: center;
  gap: 8px;
  padding: 11px 22px;
  border-radius: 8px;
  font-size: 15px;
  font-weight: 600;
  text-decoration: none;
  transition: background 0.15s, border-color 0.15s;
}

.action-primary {
  background: var(--vp-c-brand-1);
  color: #fff;
}

.action-primary:hover {
  background: var(--vp-c-brand-2);
}

.action-secondary {
  background: var(--vp-c-bg-soft);
  color: var(--vp-c-text-1);
  border: 1px solid var(--vp-c-divider);
}

.action-secondary:hover {
  border-color: var(--vp-c-text-3);
}

.hero-install {
  display: inline-block;
}

.install-code {
  display: inline-flex;
  align-items: center;
  gap: 10px;
  padding: 9px 14px;
  background: var(--vp-c-bg-soft);
  border: 1px solid var(--vp-c-divider);
  border-radius: 8px;
  font-family: var(--vp-font-family-mono);
  font-size: 13px;
  color: var(--vp-c-text-1);
}

.install-prompt {
  color: var(--vp-c-text-3);
  user-select: none;
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
  transition: color 0.15s;
}

.copy-btn:hover {
  color: var(--vp-c-brand-1);
}
</style>
