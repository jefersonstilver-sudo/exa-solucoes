import React, { useEffect } from 'react'
import ReactDOM from 'react-dom/client'
import App from './App'
import './index.css'
import './styles/responsive-optimizations.css'
import './modules/monitoramento-ia/styles/theme.css'
import { ThemeProvider } from './components/ui/theme-provider'
import './utils/debugHelpers'
import { APP_VERSION } from './config/version'

console.log(`🚀 Starting application v${APP_VERSION}...`);

// Safety guard: if React hasn't rendered in 15s, show emergency fallback
let renderTimeoutId: ReturnType<typeof setTimeout> | null = null;

renderTimeoutId = setTimeout(() => {
  const root = document.getElementById('root');
  if (root && !root.hasChildNodes()) {
    console.error('⏰ React failed to render within 15s');
    root.innerHTML = `
      <div style="min-height:100vh;display:flex;align-items:center;justify-content:center;background:white;font-family:system-ui">
        <div style="text-align:center;max-width:400px;padding:20px">
          <h1 style="color:#dc2626;margin-bottom:16px">Carregamento Lento</h1>
          <p style="color:#374151;margin-bottom:20px">A aplicação está demorando para carregar. Tente recarregar.</p>
          <button onclick="window.location.reload()" style="background:#3730a3;color:white;border:none;padding:12px 24px;border-radius:6px;cursor:pointer">Recarregar</button>
        </div>
      </div>`;
  }
}, 15000);

// Expose for cleanup from inside React
(window as any).__clearRenderTimeout = () => {
  if (renderTimeoutId) {
    clearTimeout(renderTimeoutId);
    renderTimeoutId = null;
  }
};

/** Wrapper that clears the safety timeout once React actually mounts */
function BootGuard({ children }: { children: React.ReactNode }) {
  useEffect(() => {
    (window as any).__clearRenderTimeout?.();
    console.log(`✅ React app v${APP_VERSION} mounted successfully`);
  }, []);
  return <>{children}</>;
}

try {
  const rootElement = document.getElementById('root');
  if (!rootElement) {
    throw new Error('Root element not found');
  }
  
  console.log('✅ Root element found, initializing React...');
  
  ReactDOM.createRoot(rootElement).render(
    <React.StrictMode>
      <ThemeProvider defaultTheme="light">
        <BootGuard>
          <App />
        </BootGuard>
      </ThemeProvider>
    </React.StrictMode>,
  );
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