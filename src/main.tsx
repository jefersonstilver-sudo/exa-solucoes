
import React from 'react'
import ReactDOM from 'react-dom/client'
import App from './App'
import './index.css'
import { ThemeProvider } from './components/ui/theme-provider'

console.log('Starting application...');

ReactDOM.createRoot(document.getElementById('root') as HTMLElement).render(
  <React.StrictMode>
    <ThemeProvider defaultTheme="light">
      <App />
    </ThemeProvider>
  </React.StrictMode>,
)
