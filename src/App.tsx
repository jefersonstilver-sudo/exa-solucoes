
import { Suspense, lazy } from "react";
import { Toaster } from "@/components/ui/sonner";
import { Toaster as ShadcnToaster } from "@/components/ui/toaster";
import { TooltipProvider } from "@/components/ui/tooltip";
import { QueryClient, QueryClientProvider } from "@tanstack/react-query";
import { BrowserRouter, Routes, Route } from "react-router-dom";
import { CartProvider } from "@/contexts/CartContext";
import { AuthProvider } from "@/hooks/useAuth";
import { ErrorBoundary } from "react-error-boundary";

// Lazy load pages for better performance - apenas páginas que existem
const Index = lazy(() => import("./pages/Index"));
const Marketing = lazy(() => import("./pages/Marketing"));
const PainelStore = lazy(() => import("./pages/PainelStore"));
const BuildingStore = lazy(() => import("./pages/BuildingStore"));
const PanelStore = lazy(() => import("./pages/PanelStore"));
const Checkout = lazy(() => import("./pages/Checkout"));
const Login = lazy(() => import("./pages/Login"));
const OrderConfirmation = lazy(() => import("./pages/OrderConfirmation"));

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
        <BrowserRouter>
          <AuthProvider>
            <CartProvider>
              <TooltipProvider>
                <Toaster />
                <ShadcnToaster />
                <Suspense fallback={<LoadingFallback />}>
                  <Routes>
                    <Route path="/" element={<Index />} />
                    <Route path="/marketing" element={<Marketing />} />
                    <Route path="/predio" element={<PainelStore />} />
                    <Route path="/building-store" element={<BuildingStore />} />
                    <Route path="/loja" element={<PanelStore />} />
                    <Route path="/checkout" element={<Checkout />} />
                    <Route path="/login" element={<Login />} />
                    <Route path="/order-confirmation" element={<OrderConfirmation />} />
                  </Routes>
                </Suspense>
              </TooltipProvider>
            </CartProvider>
          </AuthProvider>
        </BrowserRouter>
      </QueryClientProvider>
    </ErrorBoundary>
  );
};

export default App;
