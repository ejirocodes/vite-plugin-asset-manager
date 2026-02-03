<script setup lang="ts">
import sampleImage from '~/assets/images/sample.svg'
</script>

<template>
  <div class="container">
    <h1>Nuxt + Asset Manager</h1>
    <p>This playground demonstrates the @vite-asset-manager/nuxt module.</p>

    <div class="features">
      <h2>Features</h2>
      <ul>
        <li>Automatic floating icon injection (no manual setup)</li>
        <li>Nuxt DevTools integration</li>
        <li>Nuxt 3 & 4 compatible</li>
        <li>Auto-detection of directory structure</li>
      </ul>
    </div>

    <div class="demo">
      <h2>Sample Asset</h2>
      <img :src="sampleImage" alt="Sample" width="100" height="100" />
      <p class="path">{{ sampleImage }}</p>
    </div>

    <div class="instructions">
      <h2>Try It Out</h2>
      <ul>
        <li>Press <kbd>⌥</kbd> + <kbd>⇧</kbd> + <kbd>A</kbd> to toggle Asset Manager</li>
        <li>Click the floating icon in the corner</li>
        <li>Open Nuxt DevTools and check the "Asset Manager" tab</li>
        <li>Visit <a href="/__asset_manager__" target="_blank">/__asset_manager__</a> directly</li>
      </ul>
    </div>
  </div>
</template>

<style scoped>
.container {
  max-width: 800px;
  margin: 0 auto;
  padding: 2rem;
}

h1 {
  color: #00dc82;
  margin-bottom: 0.5rem;
}

h2 {
  color: #6366f1;
  border-bottom: 1px solid #333;
  padding-bottom: 0.5rem;
  margin-top: 2rem;
}

ul {
  list-style: none;
  padding: 0;
}

li {
  padding: 0.5rem 0;
  padding-left: 1.5rem;
  position: relative;
}

li::before {
  content: '→';
  position: absolute;
  left: 0;
  color: #00dc82;
}

.demo {
  background: #1a1a1a;
  padding: 1rem;
  border-radius: 8px;
  text-align: center;
}

.demo img {
  margin: 1rem 0;
}

.path {
  font-family: monospace;
  font-size: 0.875rem;
  color: #888;
}

kbd {
  background: #333;
  border: 1px solid #555;
  border-radius: 4px;
  padding: 0.25rem 0.5rem;
  font-family: monospace;
  font-size: 0.875rem;
}

a {
  color: #00dc82;
}
</style>
