
// 🔧 MODIFICAÇÃO DE PERFORMANCE/SEGURANÇA
import { Suspense, lazy } from 'react';
import { Toaster } from "@/components/ui/sonner";
import { TooltipProvider } from "@/components/ui/tooltip";
import { QueryClient, QueryClientProvider } from "@tanstack/react-query";
import { BrowserRouter, Routes, Route, Outlet } from "react-router-dom";
import Layout from './components/layout/Layout';
import SuperAdminPage from './pages/SuperAdminPage';
import AdminPage from './pages/AdminPage';
import LoginPage from './pages/LoginPage';
import { AuthProvider } from './hooks/useAuth';
import ErrorBoundary from './components/ui/ErrorBoundary';
import LazyLoadingFallback from './components/ui/LazyLoadingFallback';

// Lazy load otimizado com chunks específicos
const Marketing = lazy(() => 
  import('./pages/Marketing').then(module => ({ default: module.default }))
);
const Index = lazy(() => 
  import('./pages/Index').then(module => ({ default: module.default }))
);
const Produtora = lazy(() => 
  import('./pages/Produtora').then(module => ({ default: module.default }))
);
const BuildingStore = lazy(() => 
  import('./pages/BuildingStore').then(module => ({ default: module.default }))
);
const PaineisPublicitarios = lazy(() => 
  import('./pages/PaineisPublicitarios').then(module => ({ default: module.default }))
);
const SouSindico = lazy(() => 
  import('./pages/SouSindico').then(module => ({ default: module.default }))
);
const PanelStore = lazy(() => 
  import('./pages/PanelStore').then(module => ({ default: module.default }))
);
const PainelStore = lazy(() => 
  import('./pages/PainelStore').then(module => ({ default: module.default }))
);

// QueryClient otimizado para performance
const queryClient = new QueryClient({
  defaultOptions: {
    queries: {
      staleTime: 5 * 60 * 1000, // 5 minutos
      gcTime: 10 * 60 * 1000, // 10 minutos
      retry: (failureCount, error: any) => {
        if (error?.message?.includes('does not exist')) {
          return false;
        }
        return failureCount < 2;
      },
      refetchOnWindowFocus: false, // Evitar refetch desnecessário
      refetchOnMount: false, // Evitar refetch desnecessário
    },
  },
});

const LayoutWrapper = () => {
  return (
    <ErrorBoundary>
      <Layout>
        <Outlet />
      </Layout>
    </ErrorBoundary>
  );
};

// Wrapper otimizado para páginas lazy
const LazyPageWrapper = ({ 
  children, 
  fallbackVariant = 'skeleton' 
}: { 
  children: React.ReactNode;
  fallbackVariant?: 'spinner' | 'skeleton' | 'hero';
}) => (
  <ErrorBoundary>
    <Suspense fallback={<LazyLoadingFallback variant={fallbackVariant} />}>
      {children}
    </Suspense>
  </ErrorBoundary>
);

function App() {
  // Log apenas em desenvolvimento
  if (import.meta.env.DEV) {
    console.log('🚀 App: Inicializando aplicação...');
  }
  
  return (
    <ErrorBoundary onError={(error, errorInfo) => {
      if (import.meta.env.DEV) {
        console.error('🚨 App: Erro global capturado:', { error, errorInfo });
      }
    }}>
      <QueryClientProvider client={queryClient}>
        <AuthProvider>
          <TooltipProvider>
            <Toaster />
            <BrowserRouter>
              <Routes>
                {/* Rotas com Layout */}
                <Route path="/" element={<LayoutWrapper />}>
                  <Route index element={
                    <LazyPageWrapper fallbackVariant="hero">
                      <Index />
                    </LazyPageWrapper>
                  } />
                  <Route path="marketing" element={
                    <LazyPageWrapper fallbackVariant="hero">
                      <Marketing />
                    </LazyPageWrapper>
                  } />
                  <Route path="produtora" element={
                    <LazyPageWrapper fallbackVariant="hero">
                      <Produtora />
                    </LazyPageWrapper>
                  } />
                  <Route path="loja" element={
                    <LazyPageWrapper>
                      <BuildingStore />
                    </LazyPageWrapper>
                  } />
                  <Route path="paineis-publicitarios" element={
                    <LazyPageWrapper fallbackVariant="hero">
                      <PaineisPublicitarios />
                    </LazyPageWrapper>
                  } />
                  <Route path="sou-sindico" element={
                    <LazyPageWrapper fallbackVariant="hero">
                      <SouSindico />
                    </LazyPageWrapper>
                  } />
                  <Route path="panel-store" element={
                    <LazyPageWrapper>
                      <PanelStore />
                    </LazyPageWrapper>
                  } />
                  <Route path="painel-store" element={
                    <LazyPageWrapper>
                      <PainelStore />
                    </LazyPageWrapper>
                  } />
                </Route>

                {/* Rotas sem Layout */}
                <Route path="/login" element={
                  <ErrorBoundary>
                    <LoginPage />
                  </ErrorBoundary>
                } />
                <Route path="/super_admin/*" element={
                  <ErrorBoundary>
                    <SuperAdminPage />
                  </ErrorBoundary>
                } />
                <Route path="/admin/*" element={
                  <ErrorBoundary>
                    <AdminPage />
                  </ErrorBoundary>
                } />
              </Routes>
            </BrowserRouter>
          </TooltipProvider>
        </AuthProvider>
      </QueryClientProvider>
    </ErrorBoundary>
  );
}

export default App;
