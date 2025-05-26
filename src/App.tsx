
import { BrowserRouter as Router, Routes, Route, Navigate } from 'react-router-dom';
import { Toaster } from "@/components/ui/toaster";
import { Toaster as SonnerToaster } from "sonner";

// Pages - Import direto para evitar conflitos
import Home from '@/pages/Home';
import Login from '@/pages/Login';
import Cadastro from '@/pages/Cadastro';
import Confirmacao from '@/pages/Confirmacao';
import NotFound from '@/pages/NotFound';
import Forbidden from '@/pages/Forbidden';

// Building Store
import BuildingStorePage from '@/pages/BuildingStore';
import PanelStore from '@/pages/PanelStore';

// Checkout Flow - TODAS as páginas de checkout
import PlanSelection from '@/pages/PlanSelection';
import CheckoutCoupon from '@/pages/CheckoutCoupon';
import CheckoutSummary from '@/pages/CheckoutSummary';
import Checkout from '@/pages/Checkout';
import CheckoutFinish from '@/pages/CheckoutFinish';

// Payment & Orders
import Payment from '@/pages/Payment';
import PixPayment from '@/pages/PixPayment';
import OrderConfirmation from '@/pages/OrderConfirmation';
import Pedidos from '@/pages/Pedidos';

// Admin & Auth
import SuperAdminPage from '@/pages/SuperAdminPage';
import AdvertiserDashboard from '@/pages/advertiser/AdvertiserDashboard';

// Route Components
import AuthRoutes from '@/routes/AuthRoutes';
import ClientRoutes from '@/routes/ClientRoutes';

// Debug Routes
import AuthHookTest from '@/pages/AuthHookTest';
import AuthDiagnosticPage from '@/pages/AuthDiagnosticPage';
import AuthHookDiagnosticPage from '@/pages/AuthHookDiagnosticPage';

const App = () => {
  return (
    <Router>
      <Routes>
        {/* ============== ROTAS DE CHECKOUT - PRIORIDADE MÁXIMA ============== */}
        {/* Estas rotas devem vir PRIMEIRO para evitar conflitos */}
        
        {/* Seleção de Plano */}
        <Route path="/selecionar-plano" element={<PlanSelection />} />
        <Route path="/planos" element={<PlanSelection />} />
        
        {/* Fluxo de Checkout - Ordem específica */}
        <Route path="/checkout/cupom" element={<CheckoutCoupon />} />
        <Route path="/checkout/resumo" element={<CheckoutSummary />} />
        <Route path="/checkout/finalizar" element={<CheckoutFinish />} />
        <Route path="/checkout" element={<Checkout />} />
        
        {/* ============== SUPER ADMIN ROUTES ============== */}
        <Route path="/super_admin/*" element={<SuperAdminPage />} />
        
        {/* Redirecionamentos para Super Admin */}
        <Route path="/admin/*" element={<Navigate to="/super_admin" replace />} />
        <Route path="/admin" element={<Navigate to="/super_admin" replace />} />
        <Route path="/administracao/*" element={<Navigate to="/super_admin" replace />} />
        <Route path="/administracao" element={<Navigate to="/super_admin" replace />} />
        <Route path="/dashboard" element={<Navigate to="/super_admin" replace />} />
        <Route path="/painel" element={<Navigate to="/super_admin" replace />} />
        
        {/* ============== DEBUG ROUTES ============== */}
        <Route path="/auth-hook-diagnostic" element={<AuthHookDiagnosticPage />} />
        <Route path="/auth-hook-test" element={<AuthHookTest />} />
        <Route path="/auth-diagnostic" element={<AuthDiagnosticPage />} />
        
        {/* ============== AUTH ROUTES ============== */}
        <Route path="/auth/*" element={<AuthRoutes />} />
        <Route path="/login" element={<Login />} />
        <Route path="/cadastro" element={<Cadastro />} />
        <Route path="/confirmacao" element={<Confirmacao />} />
        <Route path="/forbidden" element={<Forbidden />} />
        
        {/* ============== HOME ============== */}
        <Route path="/" element={<Home />} />
        
        {/* ============== LOJA ============== */}
        {/* Loja de Prédios - Nova rota principal */}
        <Route path="/loja" element={<BuildingStorePage />} />
        <Route path="/loja-predios" element={<BuildingStorePage />} />
        <Route path="/predios-loja" element={<BuildingStorePage />} />
        <Route path="/building-store" element={<BuildingStorePage />} />
        
        {/* Painéis Digitais - Loja de Painéis (específicos de um prédio) */}
        <Route path="/paineis-digitais/loja" element={<PanelStore />} />
        <Route path="/paineis-digitais" element={<Navigate to="/loja" replace />} />
        
        {/* ============== ADVERTISER ============== */}
        <Route path="/anunciante" element={<AdvertiserDashboard />} />
        
        {/* ============== CLIENT ROUTES ============== */}
        <Route path="/client/*" element={<ClientRoutes />} />
        
        {/* ============== PAYMENT & ORDERS ============== */}
        <Route path="/payment" element={<Payment />} />
        <Route path="/pix-payment" element={<PixPayment />} />
        <Route path="/pedido-confirmado" element={<OrderConfirmation />} />
        
        {/* Unified Pedidos Route */}
        <Route path="/pedidos" element={<Pedidos />} />
        <Route path="/meus-pedidos" element={<Navigate to="/pedidos" replace />} />
        
        {/* ============== FALLBACK ============== */}
        <Route path="*" element={<NotFound />} />
      </Routes>
      
      <SonnerToaster 
        position="top-right" 
        closeButton 
        richColors 
        toastOptions={{
          duration: 3000,
          classNames: {
            toast: "group toast-class",
          }
        }} 
      />
    </Router>
  );
};

export default App;
