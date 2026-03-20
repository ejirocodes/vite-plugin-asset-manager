import DefaultTheme from 'vitepress/theme'
import type { Theme } from 'vitepress'
import HomeLayout from './components/HomeLayout.vue'
import './custom.css'

export default {
  extends: DefaultTheme,
  enhanceApp({ app }) {
    app.component('HomeLayout', HomeLayout)
  },
} satisfies Theme
