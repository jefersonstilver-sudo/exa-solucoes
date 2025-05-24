
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
import AdvertiserDashboard from '@/pages/advertiser/AdvertiserDashboard';

const App = () => {
  return (
    <Router>
      <Routes>
        {/* Public Routes */}
        <Route path="/" element={<Home />} />
        <Route path="/*" element={<PublicRoutes />} />
        
        {/* Auth Routes */}
        <Route path="/auth/*" element={<AuthRoutes />} />
        
        {/* SUPER ADMIN ROUTES - PROTEÇÃO DIRETA */}
        <Route path="/super_admin/*" element={<SuperAdminPage />} />
        
        {/* Advertiser Dashboard */}
        <Route path="/anunciante" element={<AdvertiserDashboard />} />
        
        {/* Client Routes */}
        <Route path="/client/*" element={<ClientRoutes />} />
        
        {/* Payment Routes */}
        <Route path="/payment" element={<Payment />} />
        <Route path="/pix-payment" element={<PixPayment />} />
        <Route path="/pedido-confirmado" element={<OrderConfirmation />} />
        <Route path="/pedidos" element={<Pedidos />} />
        <Route path="/meus-pedidos" element={<Pedidos />} />
        
        {/* Redirecionamentos de segurança */}
        <Route path="/admin" element={<Navigate to="/super_admin" replace />} />
        <Route path="/admin/*" element={<Navigate to="/super_admin" replace />} />
        
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
