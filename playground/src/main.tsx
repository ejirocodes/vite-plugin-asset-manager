import React from 'react'
import ReactDOM from 'react-dom/client'

function App() {
  return (
    <div style={{ padding: '2rem', fontFamily: 'system-ui' }}>
      <h1>Vite Plugin Asset Manager - Playground</h1>
      <p>
        Visit{' '}
        <a href="/__asset-manager" target="_blank" rel="noopener noreferrer">
          /__asset-manager
        </a>{' '}
        to see the asset manager UI.
      </p>
    </div>
  )
}

ReactDOM.createRoot(document.getElementById('root')!).render(
  <React.StrictMode>
    <App />
  </React.StrictMode>
)
