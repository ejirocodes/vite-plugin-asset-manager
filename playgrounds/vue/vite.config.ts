import { defineConfig } from 'vite'
import vue from '@vitejs/plugin-vue'
import assetManager from '../../src/index'

// https://vite.dev/config/
export default defineConfig({
  plugins: [vue(), assetManager()],
  server: {
    open: true
  }
})
