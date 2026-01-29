import { defineConfig } from 'vite'
import solid from 'vite-plugin-solid'
import AssetManager from '../../src/index'

export default defineConfig({
  plugins: [solid(), AssetManager()],
  server: {
    open: true
  }
})
