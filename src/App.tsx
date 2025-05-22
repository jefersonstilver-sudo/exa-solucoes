
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
import PixPayment from "./pages/PixPayment";
import Payment from "./pages/Payment";
import Pedidos2 from "./pages/Pedidos2";
import { QueryClient, QueryClientProvider } from "@tanstack/react-query";

const queryClient = new QueryClient();

const App = () => (
  <QueryClientProvider client={queryClient}>
    <Toaster />
    <Sonner />
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
        <Route path="/pix-payment" element={<PixPayment />} />
        <Route path="/payment" element={<Payment />} />
        <Route path="/403" element={<Forbidden />} />
        <Route path="/pedidos" element={<Pedidos2 />} /> {/* Route renamed from meus-pedidos to pedidos */}
        <Route path="/meus-pedidos" element={<Pedidos2 />} /> {/* Keep for compatibility */}
        <Route path="/pedidos2" element={<Pedidos2 />} /> {/* Original route */}
        {/* Rotas adicionadas para o menu do usuário */}
        <Route path="/campanhas" element={<NotFound />} /> {/* Temporário - Substituir por componente real */}
        <Route path="/configuracoes" element={<NotFound />} /> {/* Temporário - Substituir por componente real */}
        <Route path="/alterar-senha" element={<NotFound />} /> {/* Temporário - Substituir por componente real */}
        {/* ADD ALL CUSTOM ROUTES ABOVE THE CATCH-ALL "*" ROUTE */}
        <Route path="*" element={<NotFound />} />
      </Routes>
    </BrowserRouter>
  </QueryClientProvider>
);

export default App;
