<script lang="ts">
  import { onMount } from 'svelte'

  // 1. ES Module Import (static) - most common pattern
  import svelteLogo from './assets/svelte.svg'
  import viteLogo from '/vite.svg'
  import Counter from './lib/Counter.svelte'

  // 2. ES Module Import for images
  import bannerImage from './assets/banner.png'

  // 3. ES Module Import for webp images
  import webpImage from './assets/5.webp'

  // 4. Static JSON import (Vite handles JSON imports)
  import sampleData from './assets/sample4.json'

  // 5. Import as URL string (using ?url suffix)
  import pdfUrl from './assets/preview.pdf?url'

  // 6. Import as raw string (for text-based files)
  import svgRaw from './assets/svelte.svg?raw'

  // Variables for dynamic imports
  let dynamicData: unknown = null
  let dynamicImageUrl: string | null = null

  onMount(async () => {
    // 7. Dynamic import - loads module at runtime
    const module = await import('./assets/sample4.json')
    dynamicData = module.default

    // 8. Dynamic import with URL for images
    const imgModule = await import('./assets/Google-logo.png')
    dynamicImageUrl = imgModule.default
  })

  // Helper to display JSON
  $: jsonPreview = sampleData ? JSON.stringify(sampleData, null, 2).slice(0, 100) + '...' : ''
</script>

<main>
  <div>
    <a href="https://vite.dev" target="_blank" rel="noreferrer">
      <img src={viteLogo} class="logo" alt="Vite Logo" />
    </a>
    <a href="https://svelte.dev" target="_blank" rel="noreferrer">
      <img src={svelteLogo} class="logo svelte" alt="Svelte Logo" />
    </a>
  </div>
  <h1>Vite + Svelte</h1>

  <div class="card">
    <Counter />
  </div>

  <!-- Asset Import Examples Section -->
  <section class="asset-examples">
    <h2>Asset Import Examples</h2>

    <!-- 1. ES Module Import (banner.png) -->
    <div class="example">
      <h3>1. ES Module Import</h3>
      <img src={bannerImage} alt="Banner" class="example-img" />
      <code>import bannerImage from './assets/banner.png'</code>
    </div>

    <!-- 2. WebP Image Import -->
    <div class="example">
      <h3>2. WebP Image Import</h3>
      <img src={webpImage} alt="WebP Example" class="example-img" />
      <code>import webpImage from './assets/5.webp'</code>
    </div>

    <!-- 3. JSON Import -->
    <div class="example">
      <h3>3. Static JSON Import</h3>
      <pre class="json-preview">{jsonPreview}</pre>
      <code>import sampleData from './assets/sample4.json'</code>
    </div>

    <!-- 4. PDF as URL -->
    <div class="example">
      <h3>4. PDF Import as URL</h3>
      <a href={pdfUrl} target="_blank" rel="noreferrer" class="pdf-link">
        📄 Open PDF Document
      </a>
      <code>import pdfUrl from './assets/preview.pdf?url'</code>
    </div>

    <!-- 5. SVG as Raw String -->
    <div class="example">
      <h3>5. SVG as Raw String</h3>
      <div class="raw-svg">
        {@html svgRaw}
      </div>
      <code>import svgRaw from './assets/svelte.svg?raw'</code>
    </div>

    <!-- 6. Dynamic Import (Google Logo) -->
    <div class="example">
      <h3>6. Dynamic Import (runtime)</h3>
      {#if dynamicImageUrl}
        <img src={dynamicImageUrl} alt="Google Logo" class="example-img" />
      {:else}
        <p>Loading...</p>
      {/if}
      <code>const module = await import('./assets/Google-logo.png')</code>
    </div>

    <!-- 7. CSS url() in style - Font face -->
    <div class="example">
      <h3>7. CSS @font-face Import</h3>
      <p class="japanese-text">こんにちは世界 - Hello World</p>
      <code>@font-face with url('./assets/Japanese.ttf')</code>
    </div>

    <!-- 8. CSS url() for background -->
    <div class="example">
      <h3>8. CSS url() Background</h3>
      <div class="bg-image"></div>
      <code>background-image: url('./assets/banner.png')</code>
    </div>
  </section>

  <p>
    Check out <a href="https://github.com/sveltejs/kit#readme" target="_blank" rel="noreferrer">SvelteKit</a>, the official Svelte app framework powered by Vite!
  </p>

  <p class="read-the-docs">
    Click on the Vite and Svelte logos to learn more
  </p>
</main>

<style>
  /* 9. CSS @font-face - imports font file */
  @font-face {
    font-family: 'JapaneseFont';
    src: url('./assets/Japanese.ttf') format('truetype');
    font-weight: normal;
    font-style: normal;
  }

  .logo {
    height: 6em;
    padding: 1.5em;
    will-change: filter;
    transition: filter 300ms;
  }
  .logo:hover {
    filter: drop-shadow(0 0 2em #646cffaa);
  }
  .logo.svelte:hover {
    filter: drop-shadow(0 0 2em #ff3e00aa);
  }
  .read-the-docs {
    color: #888;
  }

  /* Asset Examples Styles */
  .asset-examples {
    text-align: left;
    max-width: 800px;
    margin: 2rem auto;
    padding: 1rem;
  }

  .asset-examples h2 {
    text-align: center;
    margin-bottom: 2rem;
    color: #ff3e00;
  }

  .example {
    margin-bottom: 2rem;
    padding: 1rem;
    border: 1px solid #333;
    border-radius: 8px;
    background: #1a1a1a;
  }

  .example h3 {
    margin-top: 0;
    color: #888;
    font-size: 0.9rem;
  }

  .example-img {
    max-width: 200px;
    max-height: 100px;
    object-fit: contain;
    display: block;
    margin: 0.5rem 0;
  }

  .example code {
    display: block;
    margin-top: 0.5rem;
    padding: 0.5rem;
    background: #0d0d0d;
    border-radius: 4px;
    font-size: 0.8rem;
    color: #888;
    overflow-x: auto;
  }

  .json-preview {
    background: #0d0d0d;
    padding: 0.5rem;
    border-radius: 4px;
    font-size: 0.7rem;
    max-height: 80px;
    overflow: auto;
    margin: 0.5rem 0;
  }

  .pdf-link {
    display: inline-block;
    padding: 0.5rem 1rem;
    background: #ff3e00;
    color: white;
    text-decoration: none;
    border-radius: 4px;
    margin: 0.5rem 0;
  }

  .pdf-link:hover {
    background: #ff5722;
  }

  .raw-svg {
    width: 50px;
    height: 50px;
    margin: 0.5rem 0;
  }

  .raw-svg :global(svg) {
    width: 100%;
    height: 100%;
  }

  .japanese-text {
    font-family: 'JapaneseFont', sans-serif;
    font-size: 1.5rem;
    margin: 0.5rem 0;
  }

  /* 10. CSS url() for background image */
  .bg-image {
    width: 200px;
    height: 60px;
    background-image: url('./assets/banner.png');
    background-size: cover;
    background-position: center;
    border-radius: 4px;
    margin: 0.5rem 0;
  }
</style>
