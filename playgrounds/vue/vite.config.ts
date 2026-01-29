import { defineConfig } from 'vite'
import vue from '@vitejs/plugin-vue'
import AssetManager from '../../src/index'
import VueDevTools from 'vite-plugin-vue-devtools'
 
// https://vite.dev/config/
export default defineConfig({
  plugins: [vue(), AssetManager(), VueDevTools()],
  server: {
    open: true
  }
})
