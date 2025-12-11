import React from 'react'
import ReactDOM from 'react-dom/client'
import App from './App'
import './index.css'
import './styles/responsive-optimizations.css'
import './modules/monitoramento-ia/styles/theme.css'
import { ThemeProvider } from './components/ui/theme-provider'
import './utils/debugHelpers'
import { APP_VERSION } from './config/version'

console.log(`🚀 Starting application v${APP_VERSION}...`);

// Cache clearing now handled by useForceCacheClear hook inside App
// This ensures React is mounted before any reload happens

try {
  const rootElement = document.getElementById('root');
  if (!rootElement) {
    throw new Error('Root element not found');
  }
  
  console.log('✅ Root element found, initializing React...');
  
  ReactDOM.createRoot(rootElement).render(
    <React.StrictMode>
      <ThemeProvider defaultTheme="light">
        <App />
      </ThemeProvider>
    </React.StrictMode>,
  );
  
  console.log(`✅ React app v${APP_VERSION} rendered successfully`);
} catch (error) {
  console.error('❌ Critical error initializing app:', error);
  
  // Emergency fallback
  document.body.innerHTML = `
    <div style="min-height: 100vh; display: flex; align-items: center; justify-content: center; background: white; font-family: system-ui;">
      <div style="text-align: center; max-width: 400px; padding: 20px;">
        <h1 style="color: #dc2626; margin-bottom: 16px;">Erro de Inicialização</h1>
        <p style="color: #374151; margin-bottom: 20px;">A aplicação não pôde ser carregada. Tente recarregar a página.</p>
        <button onclick="window.location.reload()" style="background: #3730a3; color: white; border: none; padding: 12px 24px; border-radius: 6px; cursor: pointer;">
          Recarregar Página
        </button>
      </div>
    </div>
  `;
}
