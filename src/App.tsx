
import { Suspense, lazy } from "react";
import { Toaster } from "@/components/ui/sonner";
import { Toaster as ShadcnToaster } from "@/components/ui/toaster";
import { TooltipProvider } from "@/components/ui/tooltip";
import { QueryClient, QueryClientProvider } from "@tanstack/react-query";
import { BrowserRouter, Routes, Route } from "react-router-dom";
import { SessionProvider } from "@/contexts/SessionContext";
import { CartProvider } from "@/contexts/CartContext";
import { AuthProvider } from "@/hooks/useAuth";
import { ErrorBoundary } from "react-error-boundary";

// Lazy load pages for better performance
const Index = lazy(() => import("./pages/Index"));
const MarketingPage = lazy(() => import("./pages/MarketingPage"));
const PainelStore = lazy(() => import("./pages/PainelStore"));
const BuildingStore = lazy(() => import("./pages/BuildingStore"));
const PanelStore = lazy(() => import("./pages/PanelStore"));
const Plano = lazy(() => import("./pages/Plano"));
const Checkout = lazy(() => import("./pages/Checkout"));
const Login = lazy(() => import("./pages/Login"));
const Register = lazy(() => import("./pages/Register"));
const ResetPassword = lazy(() => import("./pages/ResetPassword"));
const OrderConfirmation = lazy(() => import("./pages/OrderConfirmation"));
const OrderDetails = lazy(() => import("./pages/OrderDetails"));
const AdvertiserDashboard = lazy(() => import("./pages/AdvertiserDashboard"));
const AdvertiserOrders = lazy(() => import("./pages/AdvertiserOrders"));
const AdvertiserProfile = lazy(() => import("./pages/AdvertiserProfile"));
const SuperAdminDashboard = lazy(() => import("./pages/SuperAdminDashboard"));
const SuperAdminOrders = lazy(() => import("./pages/SuperAdminOrders"));
const SuperAdminBuildings = lazy(() => import("./pages/SuperAdminBuildings"));
const SuperAdminPanels = lazy(() => import("./pages/SuperAdminPanels"));
const SuperAdminUsers = lazy(() => import("./pages/SuperAdminUsers"));
const SuperAdminCoupons = lazy(() => import("./pages/SuperAdminCoupons"));
const SuperAdminSindicos = lazy(() => import("./pages/SuperAdminSindicos"));
const SuperAdminSetup = lazy(() => import("./pages/SuperAdminSetup"));
const PaineisLanding = lazy(() => import("./pages/PaineisLanding"));

const queryClient = new QueryClient({
  defaultOptions: {
    queries: {
      staleTime: 1000 * 60 * 5, // 5 minutes
      gcTime: 1000 * 60 * 10, // 10 minutes
    },
  },
});

// Error fallback component
function ErrorFallback({ error, resetErrorBoundary }: { error: Error; resetErrorBoundary: () => void }) {
  return (
    <div className="flex flex-col items-center justify-center min-h-screen p-6 text-center">
      <h2 className="text-2xl font-semibold text-red-500 mb-4">Oops! Algo deu errado</h2>
      <p className="text-muted-foreground mb-6">
        {error.message || 'Ocorreu um erro inesperado. Nossa equipe foi notificada.'}
      </p>
      <button 
        onClick={resetErrorBoundary}
        className="px-6 py-3 bg-[#3C1361] text-white rounded-xl hover:bg-[#3C1361]/80 transition-all duration-300 font-medium"
      >
        Tentar novamente
      </button>
    </div>
  );
}

// Loading fallback
function LoadingFallback() {
  return (
    <div className="flex items-center justify-center min-h-screen">
      <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-[#3C1361]"></div>
    </div>
  );
}

const App = () => {
  return (
    <ErrorBoundary FallbackComponent={ErrorFallback}>
      <QueryClientProvider client={queryClient}>
        <SessionProvider>
          <AuthProvider>
            <CartProvider>
              <TooltipProvider>
                <Toaster />
                <ShadcnToaster />
                <BrowserRouter>
                  <Suspense fallback={<LoadingFallback />}>
                    <Routes>
                      <Route path="/" element={<Index />} />
                      <Route path="/marketing" element={<MarketingPage />} />
                      <Route path="/predio" element={<PainelStore />} />
                      <Route path="/building-store" element={<BuildingStore />} />
                      <Route path="/loja" element={<PanelStore />} />
                      <Route path="/plano" element={<Plano />} />
                      <Route path="/checkout" element={<Checkout />} />
                      <Route path="/login" element={<Login />} />
                      <Route path="/register" element={<Register />} />
                      <Route path="/reset-password" element={<ResetPassword />} />
                      <Route path="/order-confirmation" element={<OrderConfirmation />} />
                      <Route path="/order/:id" element={<OrderDetails />} />
                      <Route path="/anunciante" element={<AdvertiserDashboard />} />
                      <Route path="/anunciante/pedidos" element={<AdvertiserOrders />} />
                      <Route path="/anunciante/perfil" element={<AdvertiserProfile />} />
                      <Route path="/super-admin" element={<SuperAdminDashboard />} />
                      <Route path="/super-admin/orders" element={<SuperAdminOrders />} />
                      <Route path="/super-admin/buildings" element={<SuperAdminBuildings />} />
                      <Route path="/super-admin/panels" element={<SuperAdminPanels />} />
                      <Route path="/super-admin/users" element={<SuperAdminUsers />} />
                      <Route path="/super-admin/coupons" element={<SuperAdminCoupons />} />
                      <Route path="/super-admin/sindicos" element={<SuperAdminSindicos />} />
                      <Route path="/super-admin/setup" element={<SuperAdminSetup />} />
                      <Route path="/paineis" element={<PaineisLanding />} />
                    </Routes>
                  </Suspense>
                </BrowserRouter>
              </TooltipProvider>
            </CartProvider>
          </AuthProvider>
        </SessionProvider>
      </QueryClientProvider>
    </ErrorBoundary>
  );
};

export default App;
