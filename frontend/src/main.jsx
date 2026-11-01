import { StrictMode } from 'react'
import { createRoot } from 'react-dom/client'
import App from './App.jsx'
import './styles/app.css'

// The service worker is registered by vite-plugin-pwa (see vite.config.js, Part 1).
createRoot(document.getElementById('root')).render(
  <StrictMode>
    <App />
  </StrictMode>
)
