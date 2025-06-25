
import { Toaster } from "@/components/ui/sonner";
import { TooltipProvider } from "@/components/ui/tooltip";
import { QueryClient, QueryClientProvider } from "@tanstack/react-query";
import { BrowserRouter, Routes, Route } from "react-router-dom";
import { navItems } from "./nav-items";
import Index from "./pages/Index";
import Login from "./pages/Login";
import Register from "./pages/Register";
import NotFound from "./pages/NotFound";
import PainelsDigitaisLoja from "./pages/PainelsDigitaisLoja";
import SelecionarPlano from "./pages/SelecionarPlano";
import CheckoutCoupon from "./pages/CheckoutCoupon";
import CheckoutSummary from "./pages/CheckoutSummary";
import PaymentMethod from "./pages/PaymentMethod";
import PixPayment from "./pages/PixPayment";
import UnifiedCheckout from "./pages/UnifiedCheckout";
import AnunciantePedidos from "./pages/AnunciantePedidos";
import AdminDashboard from "./pages/AdminDashboard";
import AdminBuildings from "./pages/AdminBuildings";
import AdminUsers from "./pages/AdminUsers";
import AdminOrders from "./pages/AdminOrders";
import AdminApprovals from "./pages/AdminApprovals";
import AdminCoupons from "./pages/AdminCoupons";
import VideoUpload from "./pages/VideoUpload";

const queryClient = new QueryClient();

const App = () => (
  <QueryClientProvider client={queryClient}>
    <TooltipProvider>
      <Toaster />
      <BrowserRouter>
        <Routes>
          <Route path="/" element={<Index />} />
          <Route path="/login" element={<Login />} />
          <Route path="/register" element={<Register />} />
          <Route path="/paineis-digitais/loja" element={<PainelsDigitaisLoja />} />
          <Route path="/selecionar-plano" element={<SelecionarPlano />} />
          <Route path="/checkout/cupom" element={<CheckoutCoupon />} />
          <Route path="/checkout/resumo" element={<CheckoutSummary />} />
          <Route path="/pagamento" element={<PaymentMethod />} />
          <Route path="/pix-payment" element={<PixPayment />} />
          <Route path="/checkout" element={<UnifiedCheckout />} />
          <Route path="/anunciante/pedidos" element={<AnunciantePedidos />} />
          <Route path="/admin/dashboard" element={<AdminDashboard />} />
          <Route path="/admin/buildings" element={<AdminBuildings />} />
          <Route path="/admin/users" element={<AdminUsers />} />
          <Route path="/admin/orders" element={<AdminOrders />} />
          <Route path="/admin/approvals" element={<AdminApprovals />} />
          <Route path="/admin/coupons" element={<AdminCoupons />} />
          <Route path="/upload-video/:pedidoId" element={<VideoUpload />} />
          <Route path="*" element={<NotFound />} />
        </Routes>
      </BrowserRouter>
    </TooltipProvider>
  </QueryClientProvider>
);

export default App;
