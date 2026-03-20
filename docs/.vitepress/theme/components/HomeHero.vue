<script setup lang="ts">
import { ref } from 'vue'

const copied = ref(false)
const pm = ref<'pnpm' | 'npm' | 'yarn'>('pnpm')

const commands = {
  pnpm: 'pnpm add -D vite-plugin-asset-manager',
  npm: 'npm install -D vite-plugin-asset-manager',
  yarn: 'yarn add -D vite-plugin-asset-manager',
}

function copy() {
  navigator.clipboard.writeText(commands[pm.value])
  copied.value = true
  setTimeout(() => (copied.value = false), 1500)
}
</script>

<template>
  <section class="hero">
    <div class="hero-inner">
      <div class="hero-text">
        <h1 class="title">
          Your assets,<br />
          <em>understood.</em>
        </h1>
        <p class="lead">
          A visual dashboard that discovers every image, font, video,
          and file in your Vite project. See what's used, find duplicates,
          manage everything - in real time.
        </p>
        <div class="actions">
          <a href="/guide/getting-started" class="btn-primary">
            Read the docs
          </a>
          <a
            href="https://github.com/ejirocodes/vite-plugin-asset-manager"
            class="btn-ghost"
            target="_blank"
            rel="noopener"
          >
            GitHub
            <svg width="12" height="12" viewBox="0 0 12 12" fill="none" stroke="currentColor" stroke-width="1.5">
              <path d="M2.5 9.5L9.5 2.5M9.5 2.5H4M9.5 2.5V8" />
            </svg>
          </a>
        </div>
      </div>

      <div class="hero-code">
        <div class="code-header">
          <div class="pm-tabs">
            <button
              v-for="p in (['pnpm', 'npm', 'yarn'] as const)"
              :key="p"
              :class="['pm-tab', { active: pm === p }]"
              @click="pm = p"
            >{{ p }}</button>
          </div>
          <button class="copy-btn" @click="copy">
            <span v-if="copied" class="copied-text">copied</span>
            <svg v-else width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round">
              <rect width="14" height="14" x="8" y="8" rx="2" ry="2" />
              <path d="M4 16c-1.1 0-2-.9-2-2V4c0-1.1.9-2 2-2h10c1.1 0 2 .9 2 2" />
            </svg>
          </button>
        </div>
        <div class="code-body">
          <span class="prompt">~</span>
          <code>{{ commands[pm] }}</code>
        </div>
        <div class="code-config">
          <div class="config-line">
            <span class="dim">// vite.config.ts</span>
          </div>
          <div class="config-line">
            <span class="kw">import</span> assetManager <span class="kw">from</span> <span class="str">'vite-plugin-asset-manager'</span>
          </div>
          <div class="config-line empty">&nbsp;</div>
          <div class="config-line">
            <span class="dim">plugins: [</span> assetManager() <span class="dim">]</span>
          </div>
        </div>
      </div>
    </div>
  </section>
</template>

<style scoped>
.hero {
  padding: 56px 24px 32px;
}

@media (min-width: 960px) {
  .hero {
    padding: 88px 48px 48px;
  }
}

.hero-inner {
  max-width: 1080px;
  margin: 0 auto;
  display: grid;
  grid-template-columns: 1fr;
  gap: 48px;
  align-items: center;
}

@media (min-width: 960px) {
  .hero-inner {
    grid-template-columns: 1fr 1fr;
    gap: 64px;
  }
}

.hero-text {
  max-width: 520px;
}

@media (max-width: 959px) {
  .hero-text {
    text-align: center;
    max-width: 560px;
    margin: 0 auto;
  }
}

.title {
  font-family: var(--font-display);
  font-size: 42px;
  font-weight: 700;
  line-height: 1.1;
  letter-spacing: -0.03em;
  color: var(--vp-c-text-1);
  margin-bottom: 20px;
}

.title em {
  font-style: normal;
  font-weight: 700;
  color: var(--vp-c-brand-1);
}

@media (min-width: 768px) {
  .title {
    font-size: 54px;
  }
}

@media (min-width: 1024px) {
  .title {
    font-size: 62px;
  }
}

.lead {
  font-size: 16px;
  line-height: 1.65;
  color: var(--vp-c-text-2);
  margin-bottom: 32px;
}

@media (min-width: 768px) {
  .lead {
    font-size: 17px;
  }
}

.actions {
  display: flex;
  gap: 16px;
  align-items: center;
  flex-wrap: wrap;
}

@media (max-width: 959px) {
  .actions {
    justify-content: center;
  }
}

.btn-primary {
  padding: 10px 24px;
  background: var(--vp-c-brand-1);
  color: #fff;
  border-radius: 6px;
  font-size: 14px;
  font-weight: 600;
  text-decoration: none;
  transition: background 0.15s;
}

.btn-primary:hover {
  background: var(--vp-c-brand-2);
}

.btn-ghost {
  display: inline-flex;
  align-items: center;
  gap: 4px;
  padding: 10px 4px;
  font-size: 14px;
  font-weight: 500;
  color: var(--vp-c-text-2);
  text-decoration: none;
  transition: color 0.15s;
}

.btn-ghost:hover {
  color: var(--vp-c-text-1);
}

/* Code block */
.hero-code {
  border: 1px solid var(--vp-c-divider);
  border-radius: 10px;
  overflow: hidden;
  background: var(--vp-c-bg-soft);
  font-family: var(--vp-font-family-mono);
  font-size: 13px;
}

.code-header {
  display: flex;
  align-items: center;
  justify-content: space-between;
  padding: 8px 12px;
  border-bottom: 1px solid var(--vp-c-divider);
}

.pm-tabs {
  display: flex;
  gap: 2px;
}

.pm-tab {
  padding: 4px 10px;
  border: none;
  background: none;
  color: var(--vp-c-text-3);
  font-size: 12px;
  font-family: var(--vp-font-family-mono);
  cursor: pointer;
  border-radius: 4px;
  transition: color 0.15s, background 0.15s;
}

.pm-tab:hover {
  color: var(--vp-c-text-2);
}

.pm-tab.active {
  color: var(--vp-c-text-1);
  background: var(--vp-c-bg);
}

.copy-btn {
  display: flex;
  align-items: center;
  padding: 4px 8px;
  border: none;
  background: none;
  color: var(--vp-c-text-3);
  cursor: pointer;
  border-radius: 4px;
  font-family: var(--vp-font-family-mono);
  font-size: 11px;
  transition: color 0.15s;
}

.copy-btn:hover {
  color: var(--vp-c-text-1);
}

.copied-text {
  color: var(--vp-c-brand-1);
}

.code-body {
  padding: 12px 16px;
  display: flex;
  gap: 10px;
  border-bottom: 1px solid var(--vp-c-divider);
  color: var(--vp-c-text-1);
}

.prompt {
  color: var(--vp-c-brand-1);
  user-select: none;
}

.code-config {
  padding: 12px 16px;
}

.config-line {
  line-height: 1.7;
  color: var(--vp-c-text-1);
}

.config-line.empty {
  height: 8px;
}

.dim { color: var(--vp-c-text-3); }
.kw { color: var(--vp-c-brand-1); }
.str { color: #3a9e75; }

.dark .str { color: #6bc49f; }
</style>
