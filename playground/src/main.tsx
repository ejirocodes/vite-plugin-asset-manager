import React from 'react'
import ReactDOM from 'react-dom/client'
import logoSvg from './assets/logo.svg'
import iconSvg from './assets/icon.svg'

function App() {
  return (
    <div style={{ padding: '2rem', fontFamily: 'system-ui', color: 'white' }}>
      <h1 style={{ color: 'white' }}>Vite Plugin Asset Manager - Playground</h1>
      <p>
        Visit{' '}
        <a href="/__asset_manager__" target="_blank" rel="noopener noreferrer">
          /__asset_manager__
        </a>{' '}
        to see the asset manager UI.
      </p>
      <div style={{ display: 'flex', gap: '1rem', marginTop: '1rem' }}>
        <img src={logoSvg} alt="logo" width={48} height={48} />
        <img src={iconSvg} alt="icon" width={48} height={48} />
        <img src="/favicon.svg" alt="favicon" width={48} height={48} />
      </div>
    </div>
  )
}

ReactDOM.createRoot(document.getElementById('root')!).render(
  <React.StrictMode>
    <App />
  </React.StrictMode>
)
