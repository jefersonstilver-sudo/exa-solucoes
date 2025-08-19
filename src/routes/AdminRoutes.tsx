
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
import PortfolioProdutoraPage from '@/pages/admin/PortfolioProdutoraPage';
import LeadsProdutora from '@/pages/admin/LeadsProdutora';
import LeadsLinkae from '@/pages/admin/LeadsLinkae';
import LeadsExa from '@/pages/admin/LeadsExa';
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
      
      {/* ATIVOS */}
      <Route path="predios" element={<BuildingsManagement />} />
      <Route path="paineis" element={<PanelsPage />} />
      
      {/* LEADS & CLIENTES */}
      <Route path="sindicos-interessados" element={<SindicosInteressados />} />
      <Route path="leads-produtora" element={<LeadsProdutora />} />
      <Route path="leads-linkae" element={<LeadsLinkae />} />
      <Route path="leads-exa" element={<LeadsExa />} />
      
      {/* SISTEMA - Filtrado para regular admins */}
      <Route path="cupons" element={<CouponsPage />} />
      {(userInfo.role === 'admin_marketing' || userInfo.role === 'admin') && (
        <Route path="homepage-config" element={<HomepageImagesPage />} />
      )}
      
      {/* CONTEÚDO */}
      <Route path="videos" element={<VideoManagement />} />
      <Route path="portfolio-produtora" element={<PortfolioProdutoraPage />} />
      <Route path="notificacoes" element={<NotificationsPage />} />
    </Routes>
  );
};

export default AdminRoutes;
