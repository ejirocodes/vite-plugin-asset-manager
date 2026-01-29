import { defineConfig } from 'vite'
import react from '@vitejs/plugin-react'
import AssetManager from '../../src/index'

// https://vite.dev/config/
export default defineConfig({
  plugins: [react(), AssetManager()],
  server: {
    open: true
  }
})
