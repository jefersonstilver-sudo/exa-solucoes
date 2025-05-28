
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
import Index from '@/pages/Index';
import Pedidos from '@/pages/Pedidos';
import PainelStore from '@/pages/PainelStore';
import Login from '@/pages/Login';
import AdvertiserLayout from '@/components/advertiser/AdvertiserLayout';
import AdvertiserDashboard from '@/pages/advertiser/AdvertiserDashboard';
import AdvertiserOrders from '@/pages/advertiser/AdvertiserOrders';
import OrderDetails from '@/pages/advertiser/OrderDetails';
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
        
        {/* ROTA DE LOGIN DIRETA - CORREÇÃO CRÍTICA */}
        <Route path="/login" element={<Login />} />
        
        {/* Auth Routes */}
        <Route path="/auth/*" element={<AuthRoutes />} />
        
        {/* Public Routes - PÁGINA PRINCIPAL COM OS 3 CARDS ROXOS */}
        <Route path="/" element={<Index />} />
        
        {/* CORREÇÃO CRÍTICA: TODAS AS ROTAS DE LOJA REDIRECIONAM PARA A FUNCIONAL */}
        <Route path="/loja" element={<Navigate to="/paineis-digitais/loja" replace />} />
        <Route path="/loja-predios" element={<Navigate to="/paineis-digitais/loja" replace />} />
        <Route path="/building-store" element={<Navigate to="/paineis-digitais/loja" replace />} />
        <Route path="/predios-loja" element={<Navigate to="/paineis-digitais/loja" replace />} />
        
        {/* LOJA FUNCIONAL - Painéis Digitais (inclui seleção de prédios e painéis) */}
        <Route path="/paineis-digitais/loja" element={<PainelStore />} />
        <Route path="/paineis-digitais" element={<Navigate to="/paineis-digitais/loja" replace />} />
        
        {/* ADVERTISER ROUTES WITH LAYOUT - ESTRUTURA COMPLETA E CORRIGIDA */}
        <Route path="/anunciante" element={<AdvertiserLayout />}>
          <Route index element={<AdvertiserDashboard />} />
          <Route path="pedidos" element={<AdvertiserOrders />} />
          <Route path="pedido/:id" element={<OrderDetails />} />
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
        
        {/* FALLBACK ROUTE: Redirect /pedidos to advertiser orders */}
        <Route path="/pedidos" element={<Navigate to="/anunciante/pedidos" replace />} />
        
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
