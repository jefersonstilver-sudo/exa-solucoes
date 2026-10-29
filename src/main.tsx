import './lib/sessaoAparelho' // precisa vir antes de tudo (antes do Supabase ler a sessão)
import React, { useEffect, lazy, Suspense } from 'react'
import ReactDOM from 'react-dom/client'
import App from './App'
import './index.css'
import './styles/responsive-optimizations.css'
import './modules/monitoramento-ia/styles/theme.css'
import { ThemeProvider } from './components/ui/theme-provider'
import './utils/debugHelpers'
import { APP_VERSION } from './config/version'
import { HelmetProvider } from 'react-helmet-async'
// Páginas avulsas (fora do App): carregadas só quando o endereço pede, para não pesar o site inteiro
const VideoStylesPage = lazy(() => import('./pages/public/VideoStylesPage'))
const NandoPrevia = lazy(() => import('./pages/public/NandoPrevia'))
const NandoPainel = lazy(() => import('./pages/public/NandoPainel'))

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
    // tira a abertura com a marca EXA (index.html): no app da tela de início espera a animação terminar
    // na tela de entrar quem tira a abertura é o próprio Login, quando já sabe se mostra o formulário (sem 2ª animação por baixo)
    if (!/^\/login/i.test(window.location.pathname)) requestAnimationFrame(() => (window as any).__exaSplashFim?.());
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
          <Suspense fallback={null}>
          {window.location.pathname.replace(/\/$/, '') === '/estilos' ? <HelmetProvider><VideoStylesPage /></HelmetProvider> : window.location.pathname.startsWith('/nando/previa/') ? <NandoPrevia /> : (window.location.pathname.startsWith('/nando/predio/') || window.location.pathname.replace(/\/$/, '') === '/nando/painel' || window.location.pathname.replace(/\/$/, '').toLowerCase() === '/paineldosindico' || window.location.pathname.toLowerCase().startsWith('/paineldosindico/')) ? <NandoPainel /> : <App />}
          </Suspense>
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