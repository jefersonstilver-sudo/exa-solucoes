
import { Toaster } from "@/components/ui/toaster";
import { Toaster as Sonner } from "@/components/ui/sonner";
import { BrowserRouter, Routes, Route } from "react-router-dom";
import Index from "./pages/Index";
import PanelStore from "./pages/PanelStore";
import Checkout from "./pages/Checkout";
import OrderConfirmation from "./pages/OrderConfirmation";
import Login from "./pages/Login";
import Cadastro from "./pages/Cadastro";
import NotFound from "./pages/NotFound";
import Forbidden from "./pages/Forbidden";
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
        <Route path="/checkout" element={<Checkout />} />
        <Route path="/login" element={<Login />} />
        <Route path="/cadastro" element={<Cadastro />} />
        <Route path="/pedido-confirmado" element={<OrderConfirmation />} />
        <Route path="/403" element={<Forbidden />} />
        {/* Rotas adicionadas para o menu do usuário */}
        <Route path="/pedidos" element={<NotFound />} /> {/* Temporário - Substituir por componente real */}
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
