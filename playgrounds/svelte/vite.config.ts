import { defineConfig } from 'vite'
import { svelte } from '@sveltejs/vite-plugin-svelte'
import AssetManager from '../../src/index'

// https://vite.dev/config/
export default defineConfig({
  plugins: [svelte(), AssetManager()],
  server: {
    open: true
  }
})
