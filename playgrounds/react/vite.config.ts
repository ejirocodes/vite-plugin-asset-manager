import { defineConfig } from 'vite'
import type { Plugin } from 'vite'
import react from '@vitejs/plugin-react'
import assetManager from '../../src/index'

// https://vite.dev/config/
export default defineConfig({
  plugins: [react(), 
    assetManager() as Plugin
  ],
    server: {
    open: true
  }
})
