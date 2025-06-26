
import { Toaster } from "@/components/ui/sonner";
import { TooltipProvider } from "@/components/ui/tooltip";
import { QueryClient, QueryClientProvider } from "@tanstack/react-query";
import { BrowserRouter, Routes, Route } from "react-router-dom";
import { SimpleCartProvider } from "@/contexts/SimpleCartContext";
import { AuthProvider } from "@/hooks/useAuth";
import ErrorBoundary from "@/components/ui/ErrorBoundary";
import { ClientOnly } from "@/components/ui/client-only";
import Index from "./pages/Index";
import Login from "./pages/Login";
import NotFound from "./pages/NotFound";
import CheckoutSummary from "./pages/CheckoutSummary";
import PaymentMethod from "./pages/PaymentMethod";
import PixPayment from "./pages/PixPayment";

const queryClient = new QueryClient({
  defaultOptions: {
    queries: {
      retry: 1,
      refetchOnWindowFocus: false,
    },
  },
});

const App = () => {
  console.log('🚀 [App] Sistema inicializando - Versão de recuperação');
  
  return (
    <ErrorBoundary>
      <QueryClientProvider client={queryClient}>
        <AuthProvider>
          <TooltipProvider>
            <ClientOnly fallback={
              <div className="min-h-screen bg-gradient-to-br from-purple-600 via-blue-600 to-indigo-700 flex items-center justify-center">
                <div className="text-white text-center">
                  <div className="h-8 w-8 border-4 border-white border-t-transparent rounded-full animate-spin mx-auto mb-4"></div>
                  <p>Sistema carregando...</p>
                </div>
              </div>
            }>
              <BrowserRouter>
                <SimpleCartProvider>
                  <Toaster />
                  <Routes>
                    <Route path="/" element={<Index />} />
                    <Route path="/login" element={<Login />} />
                    <Route path="/checkout/resumo" element={<CheckoutSummary />} />
                    <Route path="/pagamento" element={<PaymentMethod />} />
                    <Route path="/pix-payment" element={<PixPayment />} />
                    <Route path="*" element={<NotFound />} />
                  </Routes>
                </SimpleCartProvider>
              </BrowserRouter>
            </ClientOnly>
          </TooltipProvider>
        </AuthProvider>
      </QueryClientProvider>
    </ErrorBoundary>
  );
};

export default App;
