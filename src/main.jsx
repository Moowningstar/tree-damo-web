import React from 'react'
import ReactDOM from 'react-dom/client'
import App from './App'
import GestureDemo from './components/gesture-demo/GestureDemo'
import './index.css'

// Simple routing based on path
const path = window.location.pathname

ReactDOM.createRoot(document.getElementById('root')).render(
  <React.StrictMode>
    {path === '/gesture-demo' ? <GestureDemo /> : <App />}
  </React.StrictMode>,
)
