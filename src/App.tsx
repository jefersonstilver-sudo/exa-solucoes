
import { Toaster } from "@/components/ui/toaster";
import { Toaster as Sonner } from "@/components/ui/sonner";
import { BrowserRouter, Routes, Route } from "react-router-dom";
import Index from "./pages/Index";
import PanelStore from "./pages/PanelStore";
import PlanSelection from "./pages/PlanSelection";
import Checkout from "./pages/Checkout";
import OrderConfirmation from "./pages/OrderConfirmation";
import Login from "./pages/Login";
import Cadastro from "./pages/Cadastro";
import Confirmacao from "./pages/Confirmacao";
import NotFound from "./pages/NotFound";
import Forbidden from "./pages/Forbidden";
import { QueryClient, QueryClientProvider } from "@tanstack/react-query";
import Analytics from "@/components/Analytics";
import UserProfile from "@/components/UserProfile";

const queryClient = new QueryClient();

export function App() {
  return (
    <QueryClientProvider client={queryClient}>
      <BrowserRouter>
        <Routes>
          <Route path="/" element={<Index />} />
          <Route path="/paineis-digitais" element={<Index />} />
          <Route path="/paineis-digitais/loja" element={<PanelStore />} />
          <Route path="/selecionar-plano" element={<PlanSelection />} />
          <Route path="/checkout" element={<Checkout />} />
          <Route path="/login" element={<Login />} />
          <Route path="/cadastro" element={<Cadastro />} />
          <Route path="/confirmacao" element={<Confirmacao />} />
          <Route path="/pedido-confirmado" element={<OrderConfirmation />} />
          <Route path="/minha-conta" element={<UserProfile />} />
          <Route path="/403" element={<Forbidden />} />
          {/* Rotas adicionadas para o menu do usuário */}
          <Route path="/pedidos" element={<NotFound />} /> {/* Temporário - Substituir por componente real */}
          <Route path="/campanhas" element={<NotFound />} /> {/* Temporário - Substituir por componente real */}
          <Route path="/configuracoes" element={<NotFound />} /> {/* Temporário - Substituir por componente real */}
          <Route path="/alterar-senha" element={<NotFound />} /> {/* Temporário - Substituir por componente real */}
          {/* ADD ALL CUSTOM ROUTES ABOVE THE CATCH-ALL "*" ROUTE */}
          <Route path="*" element={<NotFound />} />
        </Routes>
        <Toaster />
        <Sonner />
        <Analytics />
      </BrowserRouter>
    </QueryClientProvider>
  );
}

export default App;
