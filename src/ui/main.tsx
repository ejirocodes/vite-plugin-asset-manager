import React from 'react'
import ReactDOM from 'react-dom/client'
import App from './App'
import { ThemeProvider } from '@/ui/providers/theme-provider'
import { Toaster } from '@/ui/components/ui/sonner'
import './styles/globals.css'

ReactDOM.createRoot(document.getElementById('root')!).render(
  <React.StrictMode>
    <ThemeProvider defaultTheme="dark">
      <App />
      <Toaster position="bottom-right" />
    </ThemeProvider>
  </React.StrictMode>
)
