import { defineConfig } from 'vite'
import { qwikVite } from '@builder.io/qwik/optimizer'
import assetManager from '../../src/index'

// https://vite.dev/config/
export default defineConfig({
  plugins: [
    qwikVite({
      csr: true,
    }),
    assetManager()
  ],
  server: {
    open: true
  }
})
