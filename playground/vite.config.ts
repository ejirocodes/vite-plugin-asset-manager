import { defineConfig, PluginOption } from 'vite'
import react from '@vitejs/plugin-react'
import Inspect from 'vite-plugin-inspect'
import assetManager from '../src/index'

export default defineConfig({
  plugins: [
    react(),
    Inspect(),
    assetManager() as PluginOption
  ],
  server: {
    open: true
  }
})
