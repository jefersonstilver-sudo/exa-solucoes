
import { BrowserRouter as Router, Routes, Route, Navigate } from 'react-router-dom';
import { Toaster } from "@/components/ui/toaster";
import { Toaster as SonnerToaster } from "sonner";
import AuthRoutes from '@/routes/AuthRoutes';
import AdminRoutes from '@/routes/AdminRoutes';
import ClientRoutes from '@/routes/ClientRoutes';
import PublicRoutes from '@/routes/PublicRoutes';
import NotFound from '@/pages/NotFound';
import Payment from '@/pages/Payment';
import PixPayment from '@/pages/PixPayment';
import OrderConfirmation from '@/pages/OrderConfirmation';
import Home from '@/pages/Home';

const App = () => {
  return (
    <Router>
      <Routes>
        {/* Public Routes */}
        <Route path="/" element={<Home />} />
        <Route path="/*" element={<PublicRoutes />} />
        
        {/* Auth Routes */}
        <Route path="/auth/*" element={<AuthRoutes />} />
        
        {/* Admin Routes */}
        <Route path="/admin/*" element={<AdminRoutes />} />
        
        {/* Client Routes */}
        <Route path="/client/*" element={<ClientRoutes />} />
        
        {/* Payment Routes */}
        <Route path="/payment" element={<Payment />} />
        <Route path="/pix-payment" element={<PixPayment />} />
        <Route path="/pedido-confirmado" element={<OrderConfirmation />} />
        
        {/* Not Found */}
        <Route path="*" element={<NotFound />} />
      </Routes>
      
      <Toaster />
      <SonnerToaster position="top-right" closeButton richColors />
    </Router>
  );
};

export default App;
