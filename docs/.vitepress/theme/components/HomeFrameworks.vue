<script setup lang="ts">
const frameworks = [
  { name: 'Vue', href: '/frameworks/vue' },
  { name: 'React', href: '/frameworks/react' },
  { name: 'Svelte', href: '/frameworks/svelte' },
  { name: 'Solid', href: '/frameworks/solid' },
  { name: 'Lit', href: '/frameworks/lit' },
  { name: 'Preact', href: '/frameworks/preact' },
  { name: 'Qwik', href: '/frameworks/qwik' },
  { name: 'Vanilla', href: '/frameworks/vanilla' },
]

const official = [
  { name: 'Nuxt', pkg: '@vite-asset-manager/nuxt', href: '/ssr/nuxt' },
  { name: 'Next.js', pkg: 'nextjs-asset-manager', href: '/ssr/nextjs' },
]
</script>

<template>
  <section class="compat">
    <div class="compat-inner">
      <div class="compat-head">
        <h2 class="compat-title">Compatibility</h2>
        <p class="compat-sub">
          Works with any Vite-powered framework.<br />
          Official modules for Nuxt and Next.js.
        </p>
      </div>

      <div class="compat-grid">
        <div class="compat-col">
          <div class="col-label">Vite frameworks</div>
          <div class="fw-list">
            <a
              v-for="fw in frameworks"
              :key="fw.name"
              :href="fw.href"
              class="fw-link"
            >
              {{ fw.name }}
            </a>
          </div>
        </div>

        <div class="compat-col">
          <div class="col-label">Official packages</div>
          <div class="pkg-list">
            <a
              v-for="o in official"
              :key="o.name"
              :href="o.href"
              class="pkg-card"
            >
              <span class="pkg-name">{{ o.name }}</span>
              <code class="pkg-id">{{ o.pkg }}</code>
            </a>
          </div>
        </div>
      </div>
    </div>
  </section>
</template>

<style scoped>
.compat {
  padding: 48px 24px 80px;
  border-top: 1px solid var(--vp-c-divider);
}

@media (min-width: 960px) {
  .compat {
    padding: 72px 48px 100px;
  }
}

.compat-inner {
  max-width: 720px;
  margin: 0 auto;
}

.compat-head {
  margin-bottom: 36px;
}

.compat-title {
  font-family: var(--font-display);
  font-size: 26px;
  font-weight: 400;
  margin-bottom: 8px;
}

@media (min-width: 768px) {
  .compat-title {
    font-size: 32px;
  }
}

.compat-sub {
  font-size: 15px;
  line-height: 1.6;
  color: var(--vp-c-text-2);
}

.compat-grid {
  display: grid;
  grid-template-columns: 1fr;
  gap: 32px;
}

@media (min-width: 640px) {
  .compat-grid {
    grid-template-columns: 1fr 1fr;
    gap: 48px;
  }
}

.col-label {
  font-size: 11px;
  font-weight: 600;
  text-transform: uppercase;
  letter-spacing: 0.08em;
  color: var(--vp-c-text-3);
  margin-bottom: 12px;
}

.fw-list {
  display: flex;
  flex-wrap: wrap;
  gap: 6px;
}

.fw-link {
  padding: 6px 14px;
  border-radius: 5px;
  font-size: 13px;
  font-weight: 500;
  color: var(--vp-c-text-1);
  background: var(--vp-c-bg-soft);
  border: 1px solid var(--vp-c-divider);
  text-decoration: none;
  transition: border-color 0.15s;
}

.fw-link:hover {
  border-color: var(--vp-c-text-3);
}

.pkg-list {
  display: flex;
  flex-direction: column;
  gap: 8px;
}

.pkg-card {
  display: flex;
  flex-direction: column;
  gap: 4px;
  padding: 12px 14px;
  border-radius: 6px;
  background: var(--vp-c-bg-soft);
  border: 1px solid var(--vp-c-divider);
  text-decoration: none;
  transition: border-color 0.15s;
}

.pkg-card:hover {
  border-color: var(--vp-c-brand-1);
}

.pkg-name {
  font-size: 14px;
  font-weight: 600;
  color: var(--vp-c-text-1);
}

.pkg-id {
  font-family: var(--vp-font-family-mono);
  font-size: 12px;
  color: var(--vp-c-text-3);
}
</style>
