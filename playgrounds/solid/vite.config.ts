import { defineConfig } from 'vite'
import solid from 'vite-plugin-solid'
import assetManager from '../../src/index'

export default defineConfig({
  plugins: [solid(), assetManager()],
  server: {
    open: true
  }
})
