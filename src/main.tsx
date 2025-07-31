
import React from 'react'
import ReactDOM from 'react-dom/client'
import App from './App'
import './index.css'
import { ThemeProvider } from './components/ui/theme-provider'

console.log('Starting application...');

try {
  const rootElement = document.getElementById('root');
  console.log('Root element found:', !!rootElement);
  
  if (!rootElement) {
    throw new Error('Root element not found');
  }

  ReactDOM.createRoot(rootElement).render(
    <React.StrictMode>
      <ThemeProvider defaultTheme="light">
        <App />
      </ThemeProvider>
    </React.StrictMode>,
  );
  
  console.log('App rendered successfully');
} catch (error) {
  console.error('Failed to render app:', error);
}
