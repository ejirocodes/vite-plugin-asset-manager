import { defineConfig } from 'vite'
import { qwikVite } from '@builder.io/qwik/optimizer'
import AssetManager from '../../src/index'

// https://vite.dev/config/
export default defineConfig({
  plugins: [
    qwikVite({
      csr: true,
    }),
    AssetManager()
  ],
  server: {
    open: true
  }
})
