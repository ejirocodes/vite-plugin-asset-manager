import React from 'react'
import ReactDOM from 'react-dom/client'
import App from './App'
import { ThemeProvider } from '@/ui/providers/theme-provider'
import { IgnoredAssetsProvider } from '@/ui/providers/ignored-assets-provider'
import { Toaster } from '@/ui/components/ui/sonner'
import '@fontsource-variable/figtree'
import './styles/globals.css'

ReactDOM.createRoot(document.getElementById('root')!).render(
  <React.StrictMode>
    <ThemeProvider defaultTheme="dark">
      <IgnoredAssetsProvider>
        <App />
        <Toaster position="bottom-center" />
      </IgnoredAssetsProvider>
    </ThemeProvider>
  </React.StrictMode>
)
