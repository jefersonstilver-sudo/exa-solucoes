
import { Suspense, lazy } from 'react';
import { BrowserRouter as Router, Routes, Route } from 'react-router-dom';
import { QueryClient, QueryClientProvider } from '@tanstack/react-query';
import { TooltipProvider } from '@/components/ui/tooltip';
import { Toaster } from '@/components/ui/sonner';
import { CartProvider } from '@/contexts/CartContext';
import LoadingSpinner from '@/components/ui/LoadingSpinner';
import MinimalLoader from '@/components/ui/MinimalLoader';
import { ErrorBoundary } from '@/components/ui/ErrorBoundary';

// Importações diretas para páginas críticas (sem lazy loading)
import Index from './pages/Index';
import BuildingStore from './pages/BuildingStore';
import PlanSelection from './pages/PlanSelection';
import CheckoutCoupon from './pages/CheckoutCoupon';
import CheckoutSummary from './pages/CheckoutSummary';
import Checkout from './pages/Checkout';
import Confirmacao from './pages/Confirmacao'; // CONFIRMAÇÃO DE EMAIL
import LoginPage from './pages/LoginPage';
import Cadastro from './pages/Cadastro';
import SuperAdminPage from './pages/SuperAdminPage';
import AdminPage from './pages/AdminPage';

// Lazy load apenas para páginas menos usadas
const Marketing = lazy(() => import('./pages/Marketing'));
const Produtora = lazy(() => import('./pages/Produtora'));
const PaineisPublicitarios = lazy(() => import('./pages/PaineisPublicitarios'));
const SouSindico = lazy(() => import('./pages/SouSindico'));
const PanelStore = lazy(() => import('./pages/PanelStore'));
const PainelStore = lazy(() => import('./pages/PainelStore'));
const EmailSent = lazy(() => import('./pages/EmailSent'));
const OrderConfirmation = lazy(() => import('./pages/OrderConfirmation')); // CONFIRMAÇÃO DE PEDIDO

// Lazy load das páginas da área do anunciante
const AdvertiserDashboard = lazy(() => import('./pages/advertiser/AdvertiserDashboard'));
const AdvertiserOrders = lazy(() => import('./pages/advertiser/AdvertiserOrders'));
const OrderDetails = lazy(() => import('./pages/advertiser/OrderDetails'));
const MyCampaigns = lazy(() => import('./pages/advertiser/MyCampaigns'));
const MyVideos = lazy(() => import('./pages/advertiser/MyVideos'));
const AdvertiserSettings = lazy(() => import('./pages/advertiser/AdvertiserSettings'));
const CompleteResponsiveLayout = lazy(() => import('@/components/advertiser/layout/CompleteResponsiveLayout'));

const queryClient = new QueryClient({
  defaultOptions: {
    queries: {
      staleTime: 5 * 60 * 1000, // 5 minutes
      gcTime: 10 * 60 * 1000, // 10 minutes (formerly cacheTime)
      retry: 1,
      refetchOnWindowFocus: false,
    },
  },
});

function App() {
  return (
    <QueryClientProvider client={queryClient}>
      <TooltipProvider>
        <CartProvider>
          <Router>
            <div className="min-h-screen bg-background">
              <Suspense fallback={<LoadingSpinner />}>
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

                  {/* ROTA CORRIGIDA: Confirmação de EMAIL (não pedido) */}
                  <Route path="/confirmacao" element={<Confirmacao />} />
                  
                  {/* ROTA SEPARADA: Confirmação de PEDIDO */}
                  <Route path="/pedido-confirmado" element={
                    <Suspense fallback={<MinimalLoader />}>
                      <OrderConfirmation />
                    </Suspense>
                  } />

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
              </Suspense>
              <Toaster />
            </div>
          </Router>
        </CartProvider>
      </TooltipProvider>
    </QueryClientProvider>
  );
}

export default App;
