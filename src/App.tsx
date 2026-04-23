import React, { Suspense, lazy } from 'react';
import { BrowserRouter as Router, Routes, Route, Navigate } from 'react-router-dom';
import { QueryClient, QueryClientProvider } from '@tanstack/react-query';
import { HelmetProvider } from 'react-helmet-async';
import { TooltipProvider } from '@/components/ui/tooltip';
import { Toaster } from '@/components/ui/sonner';
import { AuthProvider } from '@/hooks/useAuth';
import { SimpleCartProvider } from '@/contexts/SimpleCartContext';
import { ResponsiveProvider } from '@/contexts/ResponsiveContext';
import { DebugProvider } from '@/contexts/DebugContext';
import GlobalLoadingPage from '@/components/loading/GlobalLoadingPage';
import PageTransitionLoader from '@/components/loading/PageTransitionLoader';
import ErrorBoundary from '@/components/ui/ErrorBoundary';
import { hasLaunchTimePassed, MAINTENANCE_MODE } from '@/config/comingSoonConfig';
import ComingSoonPage from '@/pages/ComingSoonPage';
import { useState, useEffect } from 'react';
import { usePageTransition } from '@/hooks/usePageTransition';
import { useLoadingState } from '@/hooks/useLoadingState';
import { GlobalActivityTracker } from '@/components/tracking/GlobalActivityTracker';
import { FloatingDebugButton } from '@/components/debug/FloatingDebugButton';
import { useActiveSession } from '@/hooks/useActiveSession';
import { GlobalNotificationProvider } from '@/providers/GlobalNotificationProvider';
import { ZAPIDisconnectAlert } from '@/components/notifications/ZAPIDisconnectAlert';
import { useForceCacheClear } from '@/hooks/useForceCacheClear';
import TwoFactorVerificationPage from '@/pages/auth/TwoFactorVerificationPage';

// Importação direta APENAS para a homepage (rota /)
import Exa from './pages/Exa';

// Lazy load para todas as outras páginas (reduz carga inicial no proxy)
const BuildingStore = lazy(() => import('./pages/BuildingStore'));
const PlanSelection = lazy(() => import('./pages/PlanSelection'));
const CheckoutCoupon = lazy(() => import('./pages/CheckoutCoupon'));
const CheckoutSummary = lazy(() => import('./pages/CheckoutSummary'));
const CheckoutFinish = lazy(() => import('./pages/CheckoutFinish'));
const Payment = lazy(() => import('./pages/Payment'));
const PixPayment = lazy(() => import('./pages/PixPayment'));
const Confirmacao = lazy(() => import('./pages/Confirmacao'));
const ResetPassword = lazy(() => import('./pages/ResetPassword'));
const LoginPage = lazy(() => import('./pages/LoginPage'));
const Cadastro = lazy(() => import('./pages/Cadastro'));
const TermosUso = lazy(() => import('./pages/TermosUso'));
const PoliticaPrivacidade = lazy(() => import('./pages/PoliticaPrivacidade'));
const NaoEncontrado = lazy(() => import('./pages/NaoEncontrado'));
const SuperAdminPage = lazy(() => import('./pages/SuperAdminPage'));
const AdminPage = lazy(() => import('./pages/AdminPage'));
const ProviderBenefitChoice = lazy(() => import('./pages/ProviderBenefitChoice'));
const EmailNotConfirmed = lazy(() => import('./pages/EmailNotConfirmed'));
const EmailEnviado = lazy(() => import('./pages/EmailEnviado'));
const OrderConfirmation = lazy(() => import('./pages/OrderConfirmation'));
const PainelKiosk = lazy(() => import('./pages/PainelKiosk'));
const LoginERP = lazy(() => import('./pages/sistema/LoginERP'));
const PaineisPublicitarios = lazy(() => import('./pages/PaineisPublicitarios'));
const TestLinks = lazy(() => import('./pages/TestLinks'));
const AIReportsPage = lazy(() => import('./pages/admin/monitoramento-ia/AIReportsPage'));
const AdvertiserInvoices = lazy(() => import('./pages/advertiser/AdvertiserInvoices'));
const ParanaNutriTalentos = lazy(() => import('./pages/ParanaNutriTalentos'));

// Video Editor Pages
const VideoEditorDashboard = lazy(() => import('./pages/video-editor/VideoEditorDashboard'));
const VideoEditorAccessControl = lazy(() => import('./pages/video-editor/VideoEditorAccessControl'));
const VideoEditorPage = lazy(() => import('./pages/video-editor/VideoEditorPage'));

// Monitoramento IA Module imports removidos - agora integrados no AdminRoutes

// Lazy load apenas para páginas menos usadas
const SouSindico = lazy(() => import('./pages/SouSindico'));

// Fluxo público Interesse Síndico — lazy ESTÁVEIS no escopo do módulo
// (NÃO declarar inline dentro de <Route element>, senão o React recria o
// componente lazy a cada render, anula o cache do chunk e força Suspense).
const InteresseSindicoLanding = lazy(() => import('./pages/InteresseSindicoLanding'));
const InteresseSindicoFormulario = lazy(() => import('./pages/InteresseSindicoFormulario'));
const InteresseSindicoSucesso = lazy(() => import('./pages/InteresseSindicoSucesso'));
const Contato = lazy(() => import('./pages/Contato'));
const ComparativoOutdoor = lazy(() => import('./pages/ComparativoOutdoor'));
const QuemSomos = lazy(() => import('./pages/QuemSomos'));
const MidiaKit = lazy(() => import('./pages/MidiaKit'));
const MinimalDisplayPanel = lazy(() => import('./pages/public/MinimalDisplayPanel'));
const BuildingDisplayCommercial = lazy(() => import('./pages/public/BuildingDisplayCommercial'));
const PublicBuildingDisplay = lazy(() => import('./pages/public/PublicBuildingDisplay'));
const BuildingDisplayEmbed = lazy(() => import('./pages/public/BuildingDisplayEmbed'));
const PainelAguardandoVinculo = lazy(() => import('./pages/public/PainelAguardandoVinculo'));
const MonitorPublicPage = lazy(() => import('./pages/public/MonitorPublicPage'));

// Blog pages
const BlogIndex = lazy(() => import('./pages/blog/Index'));
const PublicidadeElevadoresROI = lazy(() => import('./pages/blog/PublicidadeElevadoresROI'));
const CalcularROIElevadores = lazy(() => import('./pages/blog/CalcularROIElevadores'));
const MidiaIndoorVsOutdoor = lazy(() => import('./pages/blog/MidiaIndoorVsOutdoor'));
const ErrosAnunciarCondominios = lazy(() => import('./pages/blog/ErrosAnunciarCondominios'));
const CaseSucessoAcademia = lazy(() => import('./pages/blog/CaseSucessoAcademia'));
const PanelStore = lazy(() => import('./pages/PanelStore'));
const PainelStore = lazy(() => import('./pages/PainelStore'));
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

// 🚨 SUBDOMAIN REDIRECT - Must run BEFORE React renders
// Detecta se está acessando via sistema.examidia.com.br e redireciona para /sistema/login
(() => {
  const hostname = window.location.hostname;
  const pathname = window.location.pathname;
  
  // Verifica se é o subdomínio do sistema ERP
  const isERPSubdomain = hostname === 'sistema.examidia.com.br' || hostname.startsWith('sistema.');
  
  // Se for subdomínio ERP e NÃO estiver em uma rota /sistema/*, redirecionar
  if (isERPSubdomain && !pathname.startsWith('/sistema')) {
    console.log('🔄 [SUBDOMAIN] Detectado acesso via sistema.*, redirecionando para /sistema/login');
    window.location.replace('/sistema/login');
    // Não continua a execução
    throw new Error('Redirecting to ERP login...');
  }
})();

console.log('⚙️ Initializing QueryClient...');
const queryClient = new QueryClient({
  defaultOptions: {
    queries: {
      staleTime: 1 * 60 * 1000, // 1 minute cache only (reduced from 10)
      gcTime: 5 * 60 * 1000, // 5 minutes garbage collection (reduced from 30)
      retry: 1,
      refetchOnWindowFocus: true, // Refresh when window focuses
      refetchOnReconnect: true,
      refetchOnMount: 'always', // Always refetch on mount to ensure fresh data
    },
  },
});
console.log('✅ QueryClient initialized');

// Main App content wrapper with Coming Soon protection
const AppContent = () => {
  const [isMaintenanceMode, setIsMaintenanceMode] = useState(MAINTENANCE_MODE && !hasLaunchTimePassed());
  const isDevSession = typeof window !== 'undefined' && sessionStorage.getItem('exa_dev_session') === 'true';
  
  // 🔄 Force cache clear on version change
  const { version } = useForceCacheClear();
  console.log(`📦 Running version: ${version}`);
  
  // ✅ CORREÇÃO CRÍTICA: Detectar se é rota de painel/display público
  const currentPath = window.location.pathname;
  const isInteresseSindicoRoute = currentPath.startsWith('/interessesindico');
  const isPublicDisplayRoute = 
    currentPath.includes('/painel/') || 
    currentPath.includes('/painel-comercial/') ||
    currentPath.includes('/embed/') ||
    currentPath.startsWith('/viena/') ||
    currentPath === '/painel-aguardando-vinculo';
  
  // 🔍 Debug logs para verificação
  console.log('🔍 [SESSION] Rota atual:', currentPath);
  console.log('🔍 [SESSION] É display público?', isPublicDisplayRoute);
  console.log(isPublicDisplayRoute ? '🚫 [SESSION] Tracking desabilitado' : '✅ [SESSION] Tracking ativado');
  
  // ⚠️ Active session tracking - passa flag para desabilitar internamente para painéis públicos
  useActiveSession({ disabled: isPublicDisplayRoute });
  
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
    <PageTransitionLoader isLoading={isInteresseSindicoRoute ? false : isTransitioning} loadingMessage={loadingMessage}>
      <div className={isInteresseSindicoRoute ? 'bg-background' : 'min-h-screen bg-background'}>
        {/* Global Activity Tracker - tracks login/logout */}
        <GlobalActivityTracker />
        
        {/* Floating Debug Button - appears on all pages when Debug AI is enabled */}
        <FloatingDebugButton />
        
        {/* Z-API Disconnect Alert - global alert for agent disconnections */}
        <ZAPIDisconnectAlert />
        
        <Routes>
          {/* Rotas principais */}
          <Route path="/" element={<Exa />} />
          <Route path="/coming-soon" element={<ComingSoonPage />} />
          <Route path="/portrasdamarca" element={
            <Suspense fallback={<GlobalLoadingPage message="" />}>
              {React.createElement(lazy(() => import('./pages/PortrasDaMarca')))}
            </Suspense>
          } />

          {/* LANDING PÚBLICA - Interesse do Síndico (sem auth) */}
          <Route path="/interessesindico" element={
            <Suspense fallback={<GlobalLoadingPage message="Carregando..." />}>
              <InteresseSindicoLanding />
            </Suspense>
          } />

          {/* FORMULÁRIO PÚBLICO - Interesse do Síndico (sem auth) */}
          <Route path="/interessesindico/formulario" element={
            <Suspense fallback={<GlobalLoadingPage message="Carregando formulário..." />}>
              <InteresseSindicoFormulario />
            </Suspense>
          } />

          {/* PÁGINA DE SUCESSO - Interesse do Síndico */}
          <Route path="/interessesindico/sucesso" element={
            <Suspense fallback={<GlobalLoadingPage message="Carregando..." />}>
              <InteresseSindicoSucesso />
            </Suspense>
          } />


          <Route path="/monitor" element={
            <Suspense fallback={<GlobalLoadingPage message="Carregando monitor..." />}>
              <MonitorPublicPage />
            </Suspense>
          } />
          
          {/* ROTAS PÚBLICAS DE EXIBIÇÃO - Novo padrão com nome+código */}
          
          {/* Relatório Público VAR - Sem autenticação */}
          <Route path="/r/:reportId" element={
            <Suspense fallback={<GlobalLoadingPage message="Carregando relatório..." />}>
              {React.createElement(lazy(() => import('./pages/public/RelatorioPublicoPage')))}
            </Suspense>
          } />
          
          {/* Embed livre (para iframes) - /embed/[nome-predio]/[codigo] */}
          <Route path="/embed/:buildingSlug/:buildingCode" element={
            <Suspense fallback={<div className="w-full h-full bg-black" />}>
              <PublicBuildingDisplay variant="embed" />
            </Suspense>
          } />
          
          {/* Painel limpo (sem UI) - /painel/[nome-predio]/[codigo] */}
          <Route path="/painel/:buildingSlug/:buildingCode" element={
            <Suspense fallback={<GlobalLoadingPage />}>
              <PublicBuildingDisplay variant="panel" />
            </Suspense>
          } />
          
          {/* Display comercial (com UI) - /comercial/[nome-predio]/[codigo] */}
          <Route path="/comercial/:buildingSlug/:buildingCode" element={
            <Suspense fallback={<GlobalLoadingPage />}>
              <PublicBuildingDisplay variant="commercial" />
            </Suspense>
          } />
          
          {/* Proposta Linkaê × Passou Ganhou */}
          <Route path="/propostapassouganhou3029" element={
            <Suspense fallback={<GlobalLoadingPage />}>
              {React.createElement(lazy(() => import('./pages/public/PropostaPassouGanhou')))}
            </Suspense>
          } />
          
          {/* Display comercial (rota raiz) - /[nome-predio]/[codigo] */}
          <Route path="/:buildingSlug/:buildingCode" element={
            <Suspense fallback={<GlobalLoadingPage />}>
              <PublicBuildingDisplay variant="commercial" />
            </Suspense>
          } />
          
          {/* ROTAS LEGADAS (UUID) - Manter compatibilidade */}
          <Route path="/embed/:buildingId" element={
            <Suspense fallback={<div className="w-full h-full bg-black" />}>
              <BuildingDisplayEmbed />
            </Suspense>
          } />
          
          <Route path="/painel/:buildingId" element={
            <Suspense fallback={<GlobalLoadingPage />}>
              <MinimalDisplayPanel />
            </Suspense>
          } />
          
          <Route path="/painel-comercial/:buildingId" element={
            <Suspense fallback={<GlobalLoadingPage />}>
              <BuildingDisplayCommercial />
            </Suspense>
          } />
          
          {/* CORREÇÃO: Rotas da loja unificadas */}
          <Route path="/loja" element={<Suspense fallback={<GlobalLoadingPage message="Carregando loja..." />}><BuildingStore /></Suspense>} />
          <Route path="/paineis-digitais/loja" element={<Suspense fallback={<GlobalLoadingPage message="Carregando loja..." />}><BuildingStore /></Suspense>} />
          <Route path="/building-store" element={<Suspense fallback={<GlobalLoadingPage message="Carregando loja..." />}><BuildingStore /></Suspense>} />
          
          <Route path="/plano" element={<Suspense fallback={<GlobalLoadingPage />}><PlanSelection /></Suspense>} />
          <Route path="/planos" element={<Suspense fallback={<GlobalLoadingPage />}><PlanSelection /></Suspense>} />
          <Route path="/selecionar-plano" element={<Suspense fallback={<GlobalLoadingPage />}><PlanSelection /></Suspense>} />
          
          {/* CONFIRMAÇÕES - MOVIDA PARA CIMA PARA EVITAR CONFLITOS */}
          <Route path="/confirmacao" element={<Suspense fallback={<GlobalLoadingPage />}><Confirmacao /></Suspense>} />
          <Route path="/confirmacao/*" element={<Suspense fallback={<GlobalLoadingPage />}><Confirmacao /></Suspense>} />
          <Route path="/reset-password" element={
            <Suspense fallback={<GlobalLoadingPage message="Carregando redefinição de senha..." />}>
              <ResetPassword />
            </Suspense>
          } />
          
          {/* CHECKOUT FLOW - Redirect antigo checkout para novo fluxo */}
          <Route path="/checkout" element={<Navigate to="/selecionar-plano" replace />} />
          <Route path="/checkout/cupom" element={<Suspense fallback={<GlobalLoadingPage />}><CheckoutCoupon /></Suspense>} />
          <Route path="/checkout/resumo" element={<Suspense fallback={<GlobalLoadingPage />}><CheckoutSummary /></Suspense>} />
          <Route path="/checkout/fidelidade" element={
            <Suspense fallback={<GlobalLoadingPage message="Carregando contrato..." />}>
              {React.createElement(lazy(() => import('./pages/CheckoutFidelidade')))}
            </Suspense>
          } />
          <Route path="/checkout/finalizar" element={<Suspense fallback={<GlobalLoadingPage />}><CheckoutFinish /></Suspense>} />
          
          {/* PAGAMENTO - ROTAS CORRIGIDAS */}
          <Route path="/payment" element={<Suspense fallback={<GlobalLoadingPage />}><Payment /></Suspense>} />
          <Route path="/payment/success" element={
            <Suspense fallback={<GlobalLoadingPage message="Carregando..." />}>
              {React.createElement(lazy(() => import('./pages/PaymentSuccess')))}
            </Suspense>
          } />
          <Route path="/payment/canceled" element={
            <Suspense fallback={<GlobalLoadingPage message="Carregando..." />}>
              {React.createElement(lazy(() => import('./pages/PaymentCanceled')))}
            </Suspense>
          } />
          <Route path="/pix-payment" element={<Suspense fallback={<GlobalLoadingPage />}><PixPayment /></Suspense>} />
          <Route path="/pedido-confirmado" element={<Suspense fallback={<GlobalLoadingPage />}><OrderConfirmation /></Suspense>} />
          
          {/* VALIDAÇÃO PÚBLICA DE PEDIDOS */}
          <Route path="/validate-order" element={
            <Suspense fallback={<GlobalLoadingPage message="Carregando validação..." />}>
              <ValidateOrder />
            </Suspense>
          } />
          
          {/* PAINEL KIOSK - VINCULAÇÃO DE DISPOSITIVOS */}
          <Route path="/painel-kiosk/:token" element={<Suspense fallback={<GlobalLoadingPage />}><PainelKiosk /></Suspense>} />
          
          {/* PAINEL AGUARDANDO VÍNCULO */}
          <Route path="/painel-aguardando-vinculo/:painelId" element={
            <Suspense fallback={<div className="h-screen w-screen flex items-center justify-center bg-black text-white">Carregando...</div>}>
              <PainelAguardandoVinculo />
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
          <Route path="/midia-kit" element={
            <Suspense fallback={<GlobalLoadingPage message="Carregando Mídia Kit..." />}>
              <MidiaKit />
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
          <Route path="/email-enviado" element={<Suspense fallback={<GlobalLoadingPage />}><EmailEnviado /></Suspense>} />

          {/* PROPOSTA PÚBLICA - indexamidia.com.br/propostacomercial/:id */}
          <Route path="/propostacomercial/:id" element={
            <Suspense fallback={<GlobalLoadingPage message="Carregando proposta..." />}>
              {React.createElement(lazy(() => import('./pages/public/PropostaPublicaPage')))}
            </Suspense>
          } />

          {/* ASSINATURA CONFIRMADA - Após pagamento recorrente com cartão */}
          <Route path="/assinatura-confirmada" element={
            <Suspense fallback={<GlobalLoadingPage message="Carregando..." />}>
              {React.createElement(lazy(() => import('./pages/public/AssinaturaConfirmadaPage')))}
            </Suspense>
          } />
          
          {/* DEFINIR SENHA - Para novos clientes via proposta */}
          <Route path="/definir-senha" element={
            <Suspense fallback={<GlobalLoadingPage message="Carregando..." />}>
              {React.createElement(lazy(() => import('./pages/public/DefinirSenhaPage')))}
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
            <Route path="editor-video" element={<Suspense fallback={<GlobalLoadingPage />}><VideoEditorDashboard /></Suspense>} />
            <Route path="editor-video/:projectId" element={<Suspense fallback={<GlobalLoadingPage />}><VideoEditorPage /></Suspense>} />
            <Route path="perfil" element={
              <Suspense fallback={<GlobalLoadingPage message="Carregando perfil..." />}>
                <AdvertiserSettings />
              </Suspense>
            } />
            <Route path="configuracoes" element={
              <Suspense fallback={<GlobalLoadingPage message="Carregando perfil..." />}>
                <AdvertiserSettings />
              </Suspense>
            } />
            <Route path="faturas" element={
              <Suspense fallback={<GlobalLoadingPage message="Carregando faturas..." />}>
                <AdvertiserInvoices />
              </Suspense>
            } />
          </Route>

          {/* Rotas de autenticação */}
          <Route path="/login" element={<Suspense fallback={<GlobalLoadingPage />}><LoginPage /></Suspense>} />
          <Route path="/sistema/login" element={<Suspense fallback={<GlobalLoadingPage />}><LoginERP /></Suspense>} />
          <Route path="/cadastro" element={<Suspense fallback={<GlobalLoadingPage />}><Cadastro /></Suspense>} />
          <Route path="/email-not-confirmed" element={<Suspense fallback={<GlobalLoadingPage />}><EmailNotConfirmed /></Suspense>} />
          <Route path="/termos-uso" element={<Suspense fallback={<GlobalLoadingPage />}><TermosUso /></Suspense>} />
          <Route path="/politica-privacidade" element={<Suspense fallback={<GlobalLoadingPage />}><PoliticaPrivacidade /></Suspense>} />
          <Route path="/verificacao-2fa" element={<TwoFactorVerificationPage />} />

          {/* Rota pública de escolha de benefício prestadores */}
          <Route path="/presente" element={<Suspense fallback={<GlobalLoadingPage />}><ProviderBenefitChoice /></Suspense>} />
          
          {/* Página pública de proposta comercial */}
          <Route path="/proposta" element={
            <Suspense fallback={<GlobalLoadingPage message="Carregando proposta..." />}>
              {React.createElement(lazy(() => import('./pages/public/PropostaPublicaPage')))}
            </Suspense>
          } />

          {/* Página de teste de links */}
          <Route path="/test-links" element={<Suspense fallback={<GlobalLoadingPage />}><TestLinks /></Suspense>} />

          {/* Redirects para rotas antigas do Monitoramento IA - agora integrado no AdminRoutes */}
          <Route path="/admin/monitoramento-ia" element={<Navigate to="/admin/paineis-exa" replace />} />
          <Route path="/admin/monitoramento-ia/*" element={<Navigate to="/admin" replace />} />

          {/* Rotas administrativas */}
          <Route path="/super_admin/*" element={<Suspense fallback={<GlobalLoadingPage />}><SuperAdminPage /></Suspense>} />
          <Route path="/admin/*" element={<Suspense fallback={<GlobalLoadingPage />}><AdminPage /></Suspense>} />
          
          {/* Apresentação privada Paraná Nutri Talentos */}
          <Route path="/parananutritalentos" element={<Suspense fallback={<GlobalLoadingPage />}><ParanaNutriTalentos /></Suspense>} />

          {/* Rota catch-all para páginas não encontradas */}
          <Route path="*" element={<Suspense fallback={<GlobalLoadingPage />}><NaoEncontrado /></Suspense>} />
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
              <GlobalNotificationProvider>
                <DebugProvider>
                  <Router>
                    <SimpleCartProvider>
                      <ErrorBoundary>
                        <AppContent />
                      </ErrorBoundary>
                    </SimpleCartProvider>
                  </Router>
                </DebugProvider>
              </GlobalNotificationProvider>
            </AuthProvider>
          </TooltipProvider>
        </ResponsiveProvider>
      </QueryClientProvider>
    </HelmetProvider>
  );
}

export default App;
