
import { Toaster } from "@/components/ui/sonner";
import { TooltipProvider } from "@/components/ui/tooltip";
import { QueryClient, QueryClientProvider } from "@tanstack/react-query";
import { BrowserRouter, Routes, Route } from "react-router-dom";
import { SimpleCartProvider } from "@/contexts/SimpleCartContext";
import Index from "./pages/Index";
import Login from "./pages/Login";
import NotFound from "./pages/NotFound";
import CheckoutSummary from "./pages/CheckoutSummary";
import PaymentMethod from "./pages/PaymentMethod";
import PixPayment from "./pages/PixPayment";

const queryClient = new QueryClient();

const App = () => (
  <QueryClientProvider client={queryClient}>
    <TooltipProvider>
      <SimpleCartProvider>
        <Toaster />
        <BrowserRouter>
          <Routes>
            <Route path="/" element={<Index />} />
            <Route path="/login" element={<Login />} />
            <Route path="/checkout/resumo" element={<CheckoutSummary />} />
            <Route path="/pagamento" element={<PaymentMethod />} />
            <Route path="/pix-payment" element={<PixPayment />} />
            <Route path="*" element={<NotFound />} />
          </Routes>
        </BrowserRouter>
      </SimpleCartProvider>
    </TooltipProvider>
  </QueryClientProvider>
);

export default App;
