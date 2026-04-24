import React from 'react'
import ReactDOM from 'react-dom/client'
import { BrowserRouter } from 'react-router-dom'
import { AppProvider } from './context/AppContext'
import App from './App.jsx'
import './index.css'

// Versión del schema. Incrementar cuando cambie la estructura del estado.
const SCHEMA_VERSION = 'v3'
const savedVersion = localStorage.getItem('vetcare_schema_version')
if (savedVersion !== SCHEMA_VERSION) {
  localStorage.removeItem('vetcare_state')
  localStorage.setItem('vetcare_schema_version', SCHEMA_VERSION)
}

ReactDOM.createRoot(document.getElementById('root')).render(
  <React.StrictMode>
    <BrowserRouter>
      <AppProvider>
        <App />
      </AppProvider>
    </BrowserRouter>
  </React.StrictMode>,
)
