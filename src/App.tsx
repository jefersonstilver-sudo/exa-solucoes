
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
import BuildingStorePage from '@/pages/BuildingStore';
import AdvertiserLayout from '@/components/advertiser/AdvertiserLayout';
import AdvertiserDashboard from '@/pages/advertiser/AdvertiserDashboard';
import AdvertiserOrders from '@/pages/advertiser/AdvertiserOrders';
import MyCampaigns from '@/pages/advertiser/MyCampaigns';
import CampaignDetails from '@/pages/advertiser/CampaignDetails';
import MyVideos from '@/pages/advertiser/MyVideos';
import AdvertiserReports from '@/pages/advertiser/AdvertiserReports';
import AdvertiserSettings from '@/pages/advertiser/AdvertiserSettings';
import AuthHookTest from '@/pages/AuthHookTest';
import AuthDiagnosticPage from '@/pages/AuthDiagnosticPage';
import AuthHookDiagnosticPage from '@/pages/AuthHookDiagnosticPage';

const App = () => {
  return (
    <Router>
      <Routes>
        {/* SUPER ADMIN ROUTES - ACESSO DIRETO */}
        <Route path="/super_admin/*" element={<SuperAdminPage />} />
        
        {/* REDIRECIONAMENTOS PARA SUPER ADMIN */}
        <Route path="/admin/*" element={<Navigate to="/super_admin" replace />} />
        <Route path="/admin" element={<Navigate to="/super_admin" replace />} />
        <Route path="/administracao/*" element={<Navigate to="/super_admin" replace />} />
        <Route path="/administracao" element={<Navigate to="/super_admin" replace />} />
        <Route path="/dashboard" element={<Navigate to="/super_admin" replace />} />
        <Route path="/painel" element={<Navigate to="/super_admin" replace />} />
        
        {/* Debug Routes */}
        <Route path="/auth-hook-diagnostic" element={<AuthHookDiagnosticPage />} />
        <Route path="/auth-hook-test" element={<AuthHookTest />} />
        <Route path="/auth-diagnostic" element={<AuthDiagnosticPage />} />
        
        {/* Auth Routes */}
        <Route path="/auth/*" element={<AuthRoutes />} />
        <Route path="/login" element={<AuthRoutes />} />
        
        {/* Public Routes */}
        <Route path="/" element={<Home />} />
        
        {/* Loja de Prédios - Nova rota principal */}
        <Route path="/loja" element={<BuildingStorePage />} />
        <Route path="/loja-predios" element={<BuildingStorePage />} />
        
        {/* Painéis Digitais - Loja de Painéis (específicos de um prédio) */}
        <Route path="/paineis-digitais/loja" element={<PainelStore />} />
        <Route path="/paineis-digitais" element={<Navigate to="/loja" replace />} />
        
        {/* ADVERTISER ROUTES WITH LAYOUT - ESTRUTURA COMPLETA E CORRIGIDA */}
        <Route path="/anunciante" element={<AdvertiserLayout />}>
          <Route index element={<AdvertiserDashboard />} />
          <Route path="pedidos" element={<AdvertiserOrders />} />
          <Route path="campanhas" element={<MyCampaigns />} />
          <Route path="campanhas/:id" element={<CampaignDetails />} />
          <Route path="videos" element={<MyVideos />} />
          <Route path="relatorios" element={<AdvertiserReports />} />
          <Route path="configuracoes" element={<AdvertiserSettings />} />
        </Route>
        
        {/* Client Routes - apenas rotas não relacionadas ao anunciante */}
        <Route path="/client/*" element={<ClientRoutes />} />
        
        {/* Payment Routes */}
        <Route path="/payment" element={<Payment />} />
        <Route path="/pix-payment" element={<PixPayment />} />
        <Route path="/pedido-confirmado" element={<OrderConfirmation />} />
        
        {/* Redirecionamento para a nova rota no portal do anunciante */}
        <Route path="/meus-pedidos" element={<Navigate to="/anunciante/pedidos" replace />} />
        
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
