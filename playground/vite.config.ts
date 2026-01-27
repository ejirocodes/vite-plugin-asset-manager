import { defineConfig } from 'vite'
import react from '@vitejs/plugin-react'
import assetManager from '../src/index'

export default defineConfig({
  plugins: [
    react(),
    assetManager()
  ],
  server: {
    open: true
  }
})
