import { Suspense, lazy } from 'react';
import { BrowserRouter as Router, Routes, Route, Navigate } from 'react-router-dom';
import { QueryClient, QueryClientProvider } from '@tanstack/react-query';
import { TooltipProvider } from '@/components/ui/tooltip';
import { Toaster } from '@/components/ui/sonner';
import { AuthProvider } from '@/hooks/useAuth';
import { SimpleCartProvider } from '@/contexts/SimpleCartContext';
import LoadingSpinner from '@/components/ui/LoadingSpinner';
import MinimalLoader from '@/components/ui/MinimalLoader';
import ErrorBoundary from '@/components/ui/ErrorBoundary';
import { useDeveloperAuth } from '@/hooks/useDeveloperAuth';
import ComingSoonPage from '@/pages/ComingSoonPage';

// Importações diretas para páginas críticas
import Index from './pages/Index';
import BuildingStore from './pages/BuildingStore';
import PlanSelection from './pages/PlanSelection';
import CheckoutCoupon from './pages/CheckoutCoupon';
import CheckoutSummary from './pages/CheckoutSummary';
import CheckoutFinish from './pages/CheckoutFinish';
import Payment from './pages/Payment';
import PixPayment from './pages/PixPayment';
import Confirmacao from './pages/Confirmacao';
import LoginPage from './pages/LoginPage';
import Cadastro from './pages/Cadastro';
import TermosUso from './pages/TermosUso';
import PoliticaPrivacidade from './pages/PoliticaPrivacidade';
import NaoEncontrado from './pages/NaoEncontrado';
import SuperAdminPage from './pages/SuperAdminPage';
import AdminPage from './pages/AdminPage';

// Importações diretas para páginas principais (performance otimizada)
import Marketing from './pages/Marketing';
import Linkae from './pages/Linkae';
import Produtora from './pages/Produtora';
import PaineisPublicitarios from './pages/PaineisPublicitarios';
import Exa from './pages/Exa';

// Lazy load apenas para páginas menos usadas
const SouSindico = lazy(() => import('./pages/SouSindico'));
const PanelStore = lazy(() => import('./pages/PanelStore'));
const PainelStore = lazy(() => import('./pages/PainelStore'));
const EmailSent = lazy(() => import('./pages/EmailSent'));
const OrderConfirmation = lazy(() => import('./pages/OrderConfirmation'));

// Lazy load das páginas da área do anunciante
const AdvertiserDashboard = lazy(() => import('./pages/advertiser/AdvertiserDashboard'));
const AdvertiserOrders = lazy(() => import('./pages/advertiser/AdvertiserOrders'));
const OrderDetails = lazy(() => import('./pages/advertiser/OrderDetails'));
const MyCampaigns = lazy(() => import('./pages/advertiser/MyCampaigns'));
const MyVideos = lazy(() => import('./pages/advertiser/MyVideos'));
const AdvertiserSettings = lazy(() => import('./pages/advertiser/AdvertiserSettings'));
const CampaignDetails = lazy(() => import('./pages/advertiser/CampaignDetails'));
const CompleteResponsiveLayout = lazy(() => import('@/components/advertiser/layout/CompleteResponsiveLayout'));

console.log('⚙️ Initializing QueryClient...');
const queryClient = new QueryClient({
  defaultOptions: {
    queries: {
      staleTime: 10 * 60 * 1000, // 10 minutes cache
      gcTime: 30 * 60 * 1000, // 30 minutes garbage collection
      retry: 1, // Quick retry for better UX
      refetchOnWindowFocus: false,
      refetchOnReconnect: true,
    },
  },
});
console.log('✅ QueryClient initialized');

// Main App content wrapper with Coming Soon protection
const AppContent = () => {
  const { isAuthenticated } = useDeveloperAuth();
  
  console.log('🎯 AppContent - isAuthenticated:', isAuthenticated);

  // If not authenticated, show Coming Soon page
  if (!isAuthenticated) {
    console.log('🚫 Not authenticated, showing ComingSoonPage');
    return <ComingSoonPage />;
  }
  
  console.log('✅ Authenticated, showing main app');

  // If authenticated, show normal app routes
  return (
    <div className="min-h-screen bg-background">
      <Routes>
        {/* Rotas principais */}
        <Route path="/" element={<Index />} />
        
        {/* CORREÇÃO: Rotas da loja unificadas */}
        <Route path="/loja" element={<BuildingStore />} />
        <Route path="/paineis-digitais/loja" element={<BuildingStore />} />
        <Route path="/building-store" element={<BuildingStore />} />
        
        <Route path="/plano" element={<PlanSelection />} />
        <Route path="/planos" element={<PlanSelection />} />
        <Route path="/selecionar-plano" element={<PlanSelection />} />
        
        {/* CONFIRMAÇÕES - MOVIDA PARA CIMA PARA EVITAR CONFLITOS */}
        <Route path="/confirmacao" element={<Confirmacao />} />
        <Route path="/confirmacao/*" element={<Confirmacao />} />
        
        {/* CHECKOUT FLOW CORRIGIDO - REMOVIDA ROTA /checkout ANTIGA */}
        <Route path="/checkout/cupom" element={<CheckoutCoupon />} />
        <Route path="/checkout/resumo" element={<CheckoutSummary />} />
        <Route path="/checkout/finalizar" element={<CheckoutFinish />} />
        
        {/* PAGAMENTO - ROTAS CORRIGIDAS */}
        <Route path="/payment" element={<Payment />} />
        <Route path="/pix-payment" element={<PixPayment />} />
        <Route path="/pedido-confirmado" element={
          <Suspense fallback={<MinimalLoader />}>
            <OrderConfirmation />
          </Suspense>
        } />

        {/* Rotas com lazy loading */}
        {/* REDIRECTS 301 para novas URLs */}
        <Route path="/marketing" element={<Navigate to="/linkae" replace />} />
        <Route path="/paineis-publicitarios" element={<Navigate to="/exa" replace />} />
        
        {/* PÁGINAS PRINCIPAIS - SEM LAZY LOADING PARA PERFORMANCE */}
        <Route path="/linkae" element={<Linkae />} />
        <Route path="/exa" element={<Exa />} />
        <Route path="/produtora" element={<Produtora />} />
        <Route path="/sou-sindico" element={
          <Suspense fallback={<MinimalLoader />}>
            <SouSindico />
          </Suspense>
        } />
        <Route path="/panel-store" element={
          <Suspense fallback={<MinimalLoader />}>
            <PanelStore />
          </Suspense>
        } />
        <Route path="/painel-store" element={
          <Suspense fallback={<MinimalLoader />}>
            <PainelStore />
          </Suspense>
        } />
        <Route path="/email-enviado" element={
          <Suspense fallback={<MinimalLoader />}>
            <EmailSent />
          </Suspense>
        } />

        {/* ÁREA DO ANUNCIANTE */}
        <Route path="/anunciante/*" element={
          <ErrorBoundary>
            <Suspense fallback={<MinimalLoader />}>
              <CompleteResponsiveLayout />
            </Suspense>
          </ErrorBoundary>
        }>
          <Route index element={
            <Suspense fallback={<MinimalLoader />}>
              <AdvertiserDashboard />
            </Suspense>
          } />
          <Route path="pedidos" element={
            <Suspense fallback={<MinimalLoader />}>
              <AdvertiserOrders />
            </Suspense>
          } />
          <Route path="pedido/:id" element={
            <Suspense fallback={<MinimalLoader />}>
              <OrderDetails />
            </Suspense>
          } />
          <Route path="campanhas" element={
            <Suspense fallback={<MinimalLoader />}>
              <MyCampaigns />
            </Suspense>
          } />
          <Route path="campanhas/:id" element={
            <Suspense fallback={<MinimalLoader />}>
              <CampaignDetails />
            </Suspense>
          } />
          <Route path="videos" element={
            <Suspense fallback={<MinimalLoader />}>
              <MyVideos />
            </Suspense>
          } />
          <Route path="perfil" element={
            <Suspense fallback={<MinimalLoader />}>
              <AdvertiserSettings />
            </Suspense>
          } />
        </Route>

        {/* Rotas de autenticação */}
        <Route path="/login" element={<LoginPage />} />
        <Route path="/cadastro" element={<Cadastro />} />
        <Route path="/termos-uso" element={<TermosUso />} />
        <Route path="/politica-privacidade" element={<PoliticaPrivacidade />} />

        {/* Rotas administrativas */}
        <Route path="/super_admin/*" element={<SuperAdminPage />} />
        <Route path="/admin/*" element={<AdminPage />} />
        
        {/* Rota catch-all para páginas não encontradas */}
        <Route path="*" element={<NaoEncontrado />} />
      </Routes>
      <Toaster />
    </div>
  );
};

function App() {
  console.log('🎯 App component rendering...');
  
  return (
    <QueryClientProvider client={queryClient}>
      <TooltipProvider>
        <AuthProvider>
          <Router>
            <SimpleCartProvider>
              <ErrorBoundary>
                <AppContent />
              </ErrorBoundary>
            </SimpleCartProvider>
          </Router>
        </AuthProvider>
      </TooltipProvider>
    </QueryClientProvider>
  );
}

export default App;
