
import { Suspense, lazy } from 'react';
import { Toaster } from "@/components/ui/sonner";
import { TooltipProvider } from "@/components/ui/tooltip";
import { QueryClient, QueryClientProvider } from "@tanstack/react-query";
import { BrowserRouter, Routes, Route } from "react-router-dom";
import SuperAdminPage from './pages/SuperAdminPage';
import AdminPage from './pages/AdminPage';
import LoginPage from './pages/LoginPage';
import Cadastro from './pages/Cadastro';
import { AuthProvider } from './hooks/useAuth';
import ErrorBoundary from './components/ui/ErrorBoundary';
import LazyLoadingFallback from './components/ui/LazyLoadingFallback';

// Lazy load das páginas com error boundaries individuais
const Marketing = lazy(() => import('./pages/Marketing'));
const Index = lazy(() => import('./pages/Index'));
const Produtora = lazy(() => import('./pages/Produtora'));
const BuildingStore = lazy(() => import('./pages/BuildingStore'));
const PaineisPublicitarios = lazy(() => import('./pages/PaineisPublicitarios'));
const SouSindico = lazy(() => import('./pages/SouSindico'));
const PanelStore = lazy(() => import('./pages/PanelStore'));
const PainelStore = lazy(() => import('./pages/PainelStore'));

// Lazy load das páginas de checkout - ORDEM CORRETA
const PlanSelection = lazy(() => import('./pages/PlanSelection'));
const CheckoutCoupon = lazy(() => import('./pages/CheckoutCoupon'));
const CheckoutSummary = lazy(() => import('./pages/CheckoutSummary'));
const Checkout = lazy(() => import('./pages/Checkout'));
const CheckoutFinish = lazy(() => import('./pages/CheckoutFinish'));

// Lazy load das páginas do anunciante
const AdvertiserDashboard = lazy(() => import('./pages/advertiser/AdvertiserDashboard'));
const AdvertiserOrders = lazy(() => import('./pages/advertiser/AdvertiserOrders'));
const MyCampaigns = lazy(() => import('./pages/advertiser/MyCampaigns'));
const MyVideos = lazy(() => import('./pages/advertiser/MyVideos'));
const AdvertiserReports = lazy(() => import('./pages/advertiser/AdvertiserReports'));
const CampaignDetails = lazy(() => import('./pages/advertiser/CampaignDetails'));

const queryClient = new QueryClient({
  defaultOptions: {
    queries: {
      staleTime: 60 * 1000, // 1 minute
      retry: (failureCount, error: any) => {
        // Não retry para erros de tabela não encontrada
        if (error?.message?.includes('does not exist')) {
          return false;
        }
        return failureCount < 2;
      },
    },
  },
});

// Wrapper para páginas lazy com ErrorBoundary
const LazyPageWrapper = ({ children }: { children: React.ReactNode }) => (
  <ErrorBoundary>
    <Suspense fallback={<LazyLoadingFallback />}>
      {children}
    </Suspense>
  </ErrorBoundary>
);

function App() {
  console.log('🚀 App: Inicializando aplicação SEM Layout duplo...');
  
  return (
    <ErrorBoundary onError={(error, errorInfo) => {
      console.error('🚨 App: Erro global capturado:', { error, errorInfo });
    }}>
      <QueryClientProvider client={queryClient}>
        <AuthProvider>
          <TooltipProvider>
            <Toaster />
            <BrowserRouter>
              <Routes>
                {/* Rotas principais - cada página tem seu próprio Layout */}
                <Route path="/" element={
                  <LazyPageWrapper>
                    <Index />
                  </LazyPageWrapper>
                } />
                <Route path="/marketing" element={
                  <LazyPageWrapper>
                    <Marketing />
                  </LazyPageWrapper>
                } />
                <Route path="/produtora" element={
                  <LazyPageWrapper>
                    <Produtora />
                  </LazyPageWrapper>
                } />
                <Route path="/loja" element={
                  <LazyPageWrapper>
                    <BuildingStore />
                  </LazyPageWrapper>
                } />
                <Route path="/paineis-digitais/loja" element={
                  <LazyPageWrapper>
                    <BuildingStore />
                  </LazyPageWrapper>
                } />
                <Route path="/paineis-publicitarios" element={
                  <LazyPageWrapper>
                    <PaineisPublicitarios />
                  </LazyPageWrapper>
                } />
                <Route path="/sou-sindico" element={
                  <LazyPageWrapper>
                    <SouSindico />
                  </LazyPageWrapper>
                } />
                <Route path="/panel-store" element={
                  <LazyPageWrapper>
                    <PanelStore />
                  </LazyPageWrapper>
                } />
                <Route path="/painel-store" element={
                  <LazyPageWrapper>
                    <PainelStore />
                  </LazyPageWrapper>
                } />

                {/* Rotas de checkout - FLUXO CORRETO */}
                <Route path="/checkout/plano" element={
                  <LazyPageWrapper>
                    <PlanSelection />
                  </LazyPageWrapper>
                } />
                <Route path="/checkout/cupom" element={
                  <LazyPageWrapper>
                    <CheckoutCoupon />
                  </LazyPageWrapper>
                } />
                <Route path="/checkout/resumo" element={
                  <LazyPageWrapper>
                    <CheckoutSummary />
                  </LazyPageWrapper>
                } />
                <Route path="/checkout" element={
                  <LazyPageWrapper>
                    <Checkout />
                  </LazyPageWrapper>
                } />
                <Route path="/checkout/finalizar" element={
                  <LazyPageWrapper>
                    <CheckoutFinish />
                  </LazyPageWrapper>
                } />

                {/* Rotas do anunciante */}
                <Route path="/anunciante" element={
                  <LazyPageWrapper>
                    <AdvertiserDashboard />
                  </LazyPageWrapper>
                } />
                <Route path="/anunciante/checkout" element={
                  <LazyPageWrapper>
                    <Checkout />
                  </LazyPageWrapper>
                } />
                <Route path="/anunciante/pedidos" element={
                  <LazyPageWrapper>
                    <AdvertiserOrders />
                  </LazyPageWrapper>
                } />
                <Route path="/anunciante/campanhas" element={
                  <LazyPageWrapper>
                    <MyCampaigns />
                  </LazyPageWrapper>
                } />
                <Route path="/anunciante/campanhas/:id" element={
                  <LazyPageWrapper>
                    <CampaignDetails />
                  </LazyPageWrapper>
                } />
                <Route path="/anunciante/videos" element={
                  <LazyPageWrapper>
                    <MyVideos />
                  </LazyPageWrapper>
                } />
                <Route path="/anunciante/relatorios" element={
                  <LazyPageWrapper>
                    <AdvertiserReports />
                  </LazyPageWrapper>
                } />

                {/* Rotas de autenticação */}
                <Route path="/login" element={
                  <ErrorBoundary>
                    <LoginPage />
                  </ErrorBoundary>
                } />
                <Route path="/cadastro" element={
                  <ErrorBoundary>
                    <Cadastro />
                  </ErrorBoundary>
                } />

                {/* Rotas administrativas */}
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
