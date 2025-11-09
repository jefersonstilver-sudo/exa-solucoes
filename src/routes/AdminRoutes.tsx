
import { Routes, Route } from 'react-router-dom';
import Dashboard from '@/pages/admin/Dashboard';
import BuildingsManagement from '@/pages/admin/BuildingsManagement';
import PanelsPage from '@/pages/admin/PanelsPage';
import OrdersPage from '@/pages/admin/OrdersPage';
import OrderDetails from '@/pages/admin/OrderDetails';
import ApprovalsPage from '@/pages/admin/ApprovalsPage';
import SindicosInteressados from '@/pages/admin/SindicosInteressados';
import CouponsPage from '@/pages/admin/CouponsPage';
import HomepageImagesPage from '@/pages/admin/HomepageImagesPage';
import NotificationsPage from '@/pages/admin/NotificationsPage';
import VideoManagement from '@/pages/admin/VideoManagement';
import VideosSitePage from '@/pages/admin/VideosSitePage';
import LeadsLinkae from '@/pages/admin/LeadsLinkae';
import LeadsExa from '@/pages/admin/LeadsExa';
import LogosAdmin from '@/components/admin/LogosAdmin';
import ProviderBenefits from '@/pages/admin/ProviderBenefits';
import BenefitPurchaseInstructions from '@/pages/admin/BenefitPurchaseInstructions';
import BenefitManagement from '@/pages/admin/BenefitManagement';
import FinancialReports from '@/pages/admin/FinancialReports';
import { useUserPermissions } from '@/hooks/useUserPermissions';

const AdminRoutes = () => {
  const { userInfo } = useUserPermissions();
  
  return (
    <Routes>
      {/* GESTÃO PRINCIPAL */}
      <Route index element={<Dashboard />} />
      <Route path="pedidos" element={<OrdersPage />} />
      <Route path="pedidos/:id" element={<OrderDetails />} />
      <Route path="aprovacoes" element={<ApprovalsPage />} />
      <Route path="beneficio-prestadores" element={<ProviderBenefits />} />
      <Route path="instrucoes-compra-vales" element={<BenefitPurchaseInstructions />} />
      <Route path="gerenciar-beneficios" element={<BenefitManagement />} />
      <Route path="relatorios-financeiros" element={<FinancialReports />} />
      
      {/* ATIVOS */}
      <Route path="predios" element={<BuildingsManagement />} />
      <Route path="paineis" element={<PanelsPage />} />
      
      {/* LEADS & CLIENTES */}
      <Route path="sindicos-interessados" element={<SindicosInteressados />} />
      <Route path="leads-linkae" element={<LeadsLinkae />} />
      <Route path="leads-exa" element={<LeadsExa />} />
      
      {/* SISTEMA - Filtrado para regular admins */}
      <Route path="cupons" element={<CouponsPage />} />
      {(userInfo.role === 'admin_marketing' || userInfo.role === 'admin') && (
        <Route path="homepage-config" element={<HomepageImagesPage />} />
      )}
      
      {/* CONTEÚDO */}
      <Route path="videos" element={<VideoManagement />} />
      <Route path="videos-site" element={<VideosSitePage />} />
      {(userInfo.role === 'admin_marketing' || userInfo.role === 'admin' || userInfo.role === 'super_admin') && (
        <Route path="logos" element={<LogosAdmin />} />
      )}
      <Route path="notificacoes" element={<NotificationsPage />} />
    </Routes>
  );
};

export default AdminRoutes;
