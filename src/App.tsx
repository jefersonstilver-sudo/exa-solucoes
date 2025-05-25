
import { BrowserRouter as Router, Routes, Route, Navigate } from 'react-router-dom';
import { Toaster } from "@/components/ui/toaster";
import { Toaster as SonnerToaster } from "sonner";
import AuthRoutes from '@/routes/AuthRoutes';
import ClientRoutes from '@/routes/ClientRoutes';
import PublicRoutes from '@/routes/PublicRoutes';
import SuperAdminPage from '@/pages/SuperAdminPage';
import NotFound from '@/pages/NotFound';
import Payment from '@/pages/Payment';
import PixPayment from '@/pages/PixPayment';
import OrderConfirmation from '@/pages/OrderConfirmation';
import Home from '@/pages/Home';
import Pedidos from '@/pages/Pedidos';
import PainelStore from '@/pages/PainelStore';
import AdvertiserDashboard from '@/pages/advertiser/AdvertiserDashboard';
import AuthHookTest from '@/pages/AuthHookTest';
import AuthDiagnosticPage from '@/pages/AuthDiagnosticPage';

const App = () => {
  return (
    <Router>
      <Routes>
        {/* SUPER ADMIN ROUTES - MÁXIMA PRECEDÊNCIA */}
        <Route path="/super_admin/*" element={<SuperAdminPage />} />
        
        {/* REDIRECIONAMENTOS CRÍTICOS PARA SUPER ADMIN */}
        <Route path="/admin/*" element={<Navigate to="/super_admin" replace />} />
        <Route path="/admin" element={<Navigate to="/super_admin" replace />} />
        <Route path="/administracao/*" element={<Navigate to="/super_admin" replace />} />
        <Route path="/administracao" element={<Navigate to="/super_admin" replace />} />
        <Route path="/dashboard" element={<Navigate to="/super_admin" replace />} />
        <Route path="/painel" element={<Navigate to="/super_admin" replace />} />
        
        {/* Debug Routes - TEMPORÁRIO */}
        <Route path="/auth-hook-test" element={<AuthHookTest />} />
        <Route path="/auth-diagnostic" element={<AuthDiagnosticPage />} />
        
        {/* Auth Routes */}
        <Route path="/auth/*" element={<AuthRoutes />} />
        <Route path="/login" element={<AuthRoutes />} />
        
        {/* Public Routes */}
        <Route path="/" element={<Home />} />
        
        {/* Painéis Digitais - Loja Online */}
        <Route path="/paineis-digitais/loja" element={<PainelStore />} />
        <Route path="/paineis-digitais" element={<Navigate to="/paineis-digitais/loja" replace />} />
        
        {/* Advertiser Dashboard */}
        <Route path="/anunciante" element={<AdvertiserDashboard />} />
        
        {/* Client Routes */}
        <Route path="/client/*" element={<ClientRoutes />} />
        
        {/* Payment Routes */}
        <Route path="/payment" element={<Payment />} />
        <Route path="/pix-payment" element={<PixPayment />} />
        <Route path="/pedido-confirmado" element={<OrderConfirmation />} />
        
        {/* Unified Pedidos Route */}
        <Route path="/pedidos" element={<Pedidos />} />
        <Route path="/meus-pedidos" element={<Navigate to="/pedidos" replace />} />
        
        {/* Public Routes - must be after specific routes */}
        <Route path="/*" element={<PublicRoutes />} />
        
        {/* Not Found */}
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
