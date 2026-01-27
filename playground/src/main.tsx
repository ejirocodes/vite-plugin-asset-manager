import React from 'react'
import ReactDOM from 'react-dom/client'

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
      <img src="/favicon.svg" alt="favicon" />
    </div>
  )
}

ReactDOM.createRoot(document.getElementById('root')!).render(
  <React.StrictMode>
    <App />
  </React.StrictMode>
)
