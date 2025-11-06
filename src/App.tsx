import { Suspense, lazy } from 'react';
import { BrowserRouter as Router, Routes, Route, Navigate } from 'react-router-dom';
import { QueryClient, QueryClientProvider } from '@tanstack/react-query';
import { HelmetProvider } from 'react-helmet-async';
import { TooltipProvider } from '@/components/ui/tooltip';
import { Toaster } from '@/components/ui/sonner';
import { AuthProvider } from '@/hooks/useAuth';
import { SimpleCartProvider } from '@/contexts/SimpleCartContext';
import { ResponsiveProvider } from '@/contexts/ResponsiveContext';
import GlobalLoadingPage from '@/components/loading/GlobalLoadingPage';
import PageTransitionLoader from '@/components/loading/PageTransitionLoader';
import ErrorBoundary from '@/components/ui/ErrorBoundary';
import { hasLaunchTimePassed, MAINTENANCE_MODE } from '@/config/comingSoonConfig';
import ComingSoonPage from '@/pages/ComingSoonPage';
import { useState, useEffect } from 'react';
import { usePageTransition } from '@/hooks/usePageTransition';
import { useLoadingState } from '@/hooks/useLoadingState';
import { GlobalActivityTracker } from '@/components/tracking/GlobalActivityTracker';
import { useActiveSession } from '@/hooks/useActiveSession';

// Importações diretas para páginas críticas
import BuildingStore from './pages/BuildingStore';
import PlanSelection from './pages/PlanSelection';
import CheckoutCoupon from './pages/CheckoutCoupon';
import CheckoutSummary from './pages/CheckoutSummary';
import CheckoutFinish from './pages/CheckoutFinish';
import Payment from './pages/Payment';
import PixPayment from './pages/PixPayment';
import Confirmacao from './pages/Confirmacao';
import ResetPassword from './pages/ResetPassword';
import LoginPage from './pages/LoginPage';
import Cadastro from './pages/Cadastro';
import TermosUso from './pages/TermosUso';
import PoliticaPrivacidade from './pages/PoliticaPrivacidade';
import NaoEncontrado from './pages/NaoEncontrado';
import SuperAdminPage from './pages/SuperAdminPage';
import AdminPage from './pages/AdminPage';
import ProviderBenefitChoice from './pages/ProviderBenefitChoice';

// Importações diretas para páginas principais (performance otimizada)
import PaineisPublicitarios from './pages/PaineisPublicitarios';
import Exa from './pages/Exa';

// Lazy load apenas para páginas menos usadas
const SouSindico = lazy(() => import('./pages/SouSindico'));
const Contato = lazy(() => import('./pages/Contato'));
const ComparativoOutdoor = lazy(() => import('./pages/ComparativoOutdoor'));
const QuemSomos = lazy(() => import('./pages/QuemSomos'));

// Blog pages
const BlogIndex = lazy(() => import('./pages/blog/Index'));
const PublicidadeElevadoresROI = lazy(() => import('./pages/blog/PublicidadeElevadoresROI'));
const CalcularROIElevadores = lazy(() => import('./pages/blog/CalcularROIElevadores'));
const MidiaIndoorVsOutdoor = lazy(() => import('./pages/blog/MidiaIndoorVsOutdoor'));
const ErrosAnunciarCondominios = lazy(() => import('./pages/blog/ErrosAnunciarCondominios'));
const CaseSucessoAcademia = lazy(() => import('./pages/blog/CaseSucessoAcademia'));
const PanelStore = lazy(() => import('./pages/PanelStore'));
const PainelStore = lazy(() => import('./pages/PainelStore'));
const EmailSent = lazy(() => import('./pages/EmailEnviado'));
const OrderConfirmation = lazy(() => import('./pages/OrderConfirmation'));
const ValidateOrder = lazy(() => import('./pages/public/ValidateOrder'));

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
  const [isMaintenanceMode, setIsMaintenanceMode] = useState(MAINTENANCE_MODE && !hasLaunchTimePassed());
  const isDevSession = typeof window !== 'undefined' && sessionStorage.getItem('exa_dev_session') === 'true';
  
  // Active session tracking for security monitoring
  useActiveSession();
  
  // Page transition hook
  const { isLoading: isTransitioning, loadingMessage } = usePageTransition({
    minLoadingTime: 300,
    transitionDelay: 50
  });
  
  // Global loading state
  const { isGlobalLoading, loadingMessage: globalMessage, loadingProgress, showProgress } = useLoadingState();

  useEffect(() => {
    // Only run the timer if MAINTENANCE_MODE is enabled
    if (!MAINTENANCE_MODE) {
      return;
    }

    // Check every second if launch time has passed
    const interval = setInterval(() => {
      const launchPassed = hasLaunchTimePassed();
      if (launchPassed && isMaintenanceMode) {
        console.log('🎉 Launch time reached! Disabling maintenance mode...');
        setIsMaintenanceMode(false);
        // Force page reload to ensure all states are reset
        setTimeout(() => {
          window.location.reload();
        }, 1000);
      }
    }, 1000);

    return () => clearInterval(interval);
  }, [isMaintenanceMode]);

  if (isMaintenanceMode && !isDevSession) {
    console.log('🚧 Maintenance mode ON - showing ComingSoonPage');
    return <ComingSoonPage />;
  }

  console.log('✅ Maintenance bypass or OFF - showing main app');

  // Show global loading if active
  if (isGlobalLoading) {
    return (
      <GlobalLoadingPage 
        message={globalMessage}
        showProgress={showProgress}
        progress={loadingProgress}
      />
    );
  }

  // Normal app routes with page transitions
  return (
    <PageTransitionLoader isLoading={isTransitioning} loadingMessage={loadingMessage}>
      <div className="min-h-screen bg-background">
        {/* Global Activity Tracker - tracks login/logout */}
        <GlobalActivityTracker />
        <Routes>
          {/* Rotas principais */}
          <Route path="/" element={<Exa />} />
          <Route path="/coming-soon" element={<ComingSoonPage />} />
          
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
          <Route path="/reset-password" element={
            <Suspense fallback={<GlobalLoadingPage message="Carregando redefinição de senha..." />}>
              <ResetPassword />
            </Suspense>
          } />
          
          {/* CHECKOUT FLOW CORRIGIDO - REMOVIDA ROTA /checkout ANTIGA */}
          <Route path="/checkout/cupom" element={<CheckoutCoupon />} />
          <Route path="/checkout/resumo" element={<CheckoutSummary />} />
          <Route path="/checkout/finalizar" element={<CheckoutFinish />} />
          
          {/* PAGAMENTO - ROTAS CORRIGIDAS */}
          <Route path="/payment" element={<Payment />} />
          <Route path="/pix-payment" element={<PixPayment />} />
          <Route path="/pedido-confirmado" element={
            <Suspense fallback={<GlobalLoadingPage message="Carregando confirmação..." />}>
              <OrderConfirmation />
            </Suspense>
          } />
          
          {/* VALIDAÇÃO PÚBLICA DE PEDIDOS */}
          <Route path="/validate-order" element={
            <Suspense fallback={<GlobalLoadingPage message="Carregando validação..." />}>
              <ValidateOrder />
            </Suspense>
          } />

          {/* Rotas com lazy loading */}
          {/* REDIRECTS 301 para novas URLs */}
          <Route path="/paineis-publicitarios" element={<Navigate to="/" replace />} />
          <Route path="/exa" element={<Navigate to="/" replace />} />
          
          {/* PÁGINAS PRINCIPAIS - SEM LAZY LOADING PARA PERFORMANCE */}
          <Route path="/sou-sindico" element={
            <Suspense fallback={<GlobalLoadingPage message="Carregando Sou Síndico..." />}>
              <SouSindico />
            </Suspense>
          } />
          <Route path="/quem-somos" element={
            <Suspense fallback={<GlobalLoadingPage message="Carregando Quem Somos..." />}>
              <QuemSomos />
            </Suspense>
          } />
          <Route path="/contato" element={
            <Suspense fallback={<GlobalLoadingPage message="Carregando contato..." />}>
              <Contato />
            </Suspense>
          } />
          <Route path="/comparativo-outdoor" element={
            <Suspense fallback={<GlobalLoadingPage message="Carregando comparativo..." />}>
              <ComparativoOutdoor />
            </Suspense>
          } />
          
          {/* BLOG ROUTES */}
          <Route path="/blog" element={
            <Suspense fallback={<GlobalLoadingPage message="Carregando blog..." />}>
              <BlogIndex />
            </Suspense>
          } />
          <Route path="/blog/publicidade-elevadores-roi" element={
            <Suspense fallback={<GlobalLoadingPage message="Carregando artigo..." />}>
              <PublicidadeElevadoresROI />
            </Suspense>
          } />
          <Route path="/blog/calcular-roi-elevadores" element={
            <Suspense fallback={<GlobalLoadingPage message="Carregando artigo..." />}>
              <CalcularROIElevadores />
            </Suspense>
          } />
          <Route path="/blog/midia-indoor-vs-outdoor" element={
            <Suspense fallback={<GlobalLoadingPage message="Carregando artigo..." />}>
              <MidiaIndoorVsOutdoor />
            </Suspense>
          } />
          <Route path="/blog/erros-anunciar-condominios" element={
            <Suspense fallback={<GlobalLoadingPage message="Carregando artigo..." />}>
              <ErrosAnunciarCondominios />
            </Suspense>
          } />
          <Route path="/blog/case-sucesso-academia" element={
            <Suspense fallback={<GlobalLoadingPage message="Carregando artigo..." />}>
              <CaseSucessoAcademia />
            </Suspense>
          } />
          <Route path="/panel-store" element={
            <Suspense fallback={<GlobalLoadingPage message="Carregando loja de painéis..." />}>
              <PanelStore />
            </Suspense>
          } />
          <Route path="/painel-store" element={
            <Suspense fallback={<GlobalLoadingPage message="Carregando loja de painéis..." />}>
              <PainelStore />
            </Suspense>
          } />
          <Route path="/email-enviado" element={
            <Suspense fallback={<GlobalLoadingPage message="Carregando confirmação..." />}>
              <EmailSent />
            </Suspense>
          } />

          {/* ÁREA DO ANUNCIANTE */}
          <Route path="/anunciante/*" element={
            <ErrorBoundary>
              <Suspense fallback={<GlobalLoadingPage message="Carregando área do anunciante..." />}>
                <CompleteResponsiveLayout />
              </Suspense>
            </ErrorBoundary>
          }>
            <Route index element={<Navigate to="pedidos" replace />} />
            <Route path="pedidos" element={
              <Suspense fallback={<GlobalLoadingPage message="Carregando pedidos..." />}>
                <AdvertiserOrders />
              </Suspense>
            } />
            <Route path="pedido/:id" element={
              <Suspense fallback={<GlobalLoadingPage message="Carregando detalhes do pedido..." />}>
                <OrderDetails />
              </Suspense>
            } />
            <Route path="campanhas" element={
              <Suspense fallback={<GlobalLoadingPage message="Carregando campanhas..." />}>
                <MyCampaigns />
              </Suspense>
            } />
            <Route path="campanhas/:id" element={
              <Suspense fallback={<GlobalLoadingPage message="Carregando campanha..." />}>
                <CampaignDetails />
              </Suspense>
            } />
            <Route path="videos" element={
              <Suspense fallback={<GlobalLoadingPage message="Carregando vídeos..." />}>
                <MyVideos />
              </Suspense>
            } />
            <Route path="perfil" element={
              <Suspense fallback={<GlobalLoadingPage message="Carregando perfil..." />}>
                <AdvertiserSettings />
              </Suspense>
            } />
          </Route>

          {/* Rotas de autenticação */}
          <Route path="/login" element={<LoginPage />} />
          <Route path="/cadastro" element={<Cadastro />} />
          <Route path="/termos-uso" element={<TermosUso />} />
          <Route path="/politica-privacidade" element={<PoliticaPrivacidade />} />

          {/* Rota pública de escolha de benefício prestadores */}
          <Route path="/presente" element={<ProviderBenefitChoice />} />

          {/* Rotas administrativas */}
          <Route path="/super_admin/*" element={<SuperAdminPage />} />
          <Route path="/admin/*" element={<AdminPage />} />
          
          {/* Rota catch-all para páginas não encontradas */}
          <Route path="*" element={<NaoEncontrado />} />
        </Routes>
        <Toaster />
      </div>
    </PageTransitionLoader>
  );
};

function App() {
  console.log('🎯 App component rendering...');
  
  return (
    <HelmetProvider>
      <QueryClientProvider client={queryClient}>
        <ResponsiveProvider>
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
        </ResponsiveProvider>
      </QueryClientProvider>
    </HelmetProvider>
  );
}

export default App;
