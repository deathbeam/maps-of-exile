import { StrictMode } from 'react'
import { createRoot } from 'react-dom/client'
import App from './App'
import createState, { AppState } from './state.js'
import { options } from 'preact'

options.debounceRendering = requestAnimationFrame

const root = createRoot(document.getElementById('root'))
root.render(
  <StrictMode>
    <AppState.Provider value={createState()}>
      <App />
    </AppState.Provider>
  </StrictMode>
)
