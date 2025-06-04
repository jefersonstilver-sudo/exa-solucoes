
import { Suspense } from 'react';
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
import MinimalLoader from './components/ui/MinimalLoader';
import CompleteResponsiveLayout from './components/advertiser/layout/CompleteResponsiveLayout';

// Importações diretas para páginas críticas (sem lazy loading)
import Index from './pages/Index';
import BuildingStore from './pages/BuildingStore';
import PlanSelection from './pages/PlanSelection';
import CheckoutCoupon from './pages/CheckoutCoupon';
import CheckoutSummary from './pages/CheckoutSummary';
import Checkout from './pages/Checkout';

// Lazy load apenas para páginas menos usadas
import { lazy } from 'react';
const Marketing = lazy(() => import('./pages/Marketing'));
const Produtora = lazy(() => import('./pages/Produtora'));
const PaineisPublicitarios = lazy(() => import('./pages/PaineisPublicitarios'));
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

const queryClient = new QueryClient({
  defaultOptions: {
    queries: {
      staleTime: 5 * 60 * 1000, // 5 minutos - cache mais agressivo
      retry: 1, // Menos tentativas
      refetchOnWindowFocus: false, // Não refetch ao focar janela
    },
  },
});

function App() {
  return (
    <ErrorBoundary>
      <QueryClientProvider client={queryClient}>
        <AuthProvider>
          <TooltipProvider>
            <Toaster />
            <BrowserRouter>
              <Routes>
                {/* Rotas principais - carregamento direto */}
                <Route path="/" element={<Index />} />
                <Route path="/loja" element={<BuildingStore />} />
                <Route path="/plano" element={<PlanSelection />} />
                <Route path="/planos" element={<PlanSelection />} />
                <Route path="/selecionar-plano" element={<PlanSelection />} />
                <Route path="/checkout/cupom" element={<CheckoutCoupon />} />
                <Route path="/checkout/resumo" element={<CheckoutSummary />} />
                <Route path="/checkout" element={<Checkout />} />

                {/* Rotas com lazy loading */}
                <Route path="/marketing" element={
                  <Suspense fallback={<MinimalLoader />}>
                    <Marketing />
                  </Suspense>
                } />
                <Route path="/produtora" element={
                  <Suspense fallback={<MinimalLoader />}>
                    <Produtora />
                  </Suspense>
                } />
                <Route path="/paineis-publicitarios" element={
                  <Suspense fallback={<MinimalLoader />}>
                    <PaineisPublicitarios />
                  </Suspense>
                } />
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
                <Route path="/confirmacao" element={
                  <Suspense fallback={<MinimalLoader />}>
                    <OrderConfirmation />
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
                    <CompleteResponsiveLayout />
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

                {/* Rotas de autenticação - sem lazy loading */}
                <Route path="/login" element={<LoginPage />} />
                <Route path="/cadastro" element={<Cadastro />} />

                {/* Rotas administrativas */}
                <Route path="/super_admin/*" element={<SuperAdminPage />} />
                <Route path="/admin/*" element={<AdminPage />} />
              </Routes>
            </BrowserRouter>
          </TooltipProvider>
        </AuthProvider>
      </QueryClientProvider>
    </ErrorBoundary>
  );
}

export default App;
