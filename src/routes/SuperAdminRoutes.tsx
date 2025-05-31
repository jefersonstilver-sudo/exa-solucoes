
import { Routes, Route } from 'react-router-dom';
import Dashboard from '@/pages/admin/Dashboard';
import BuildingsPage from '@/pages/admin/BuildingsPage';
import PanelsPage from '@/pages/admin/PanelsPage';
import OrdersPage from '@/pages/admin/OrdersPage';
import OrderDetails from '@/pages/admin/OrderDetails';
import ApprovalsPage from '@/pages/admin/ApprovalsPage';
import UsersPage from '@/pages/admin/UsersPage';
import SindicosInteressados from '@/pages/admin/SindicosInteressados';
import CouponsPage from '@/pages/admin/CouponsPage';
import HomepageImagesPage from '@/pages/admin/HomepageImagesPage';
import NotificationsPage from '@/pages/admin/NotificationsPage';
import ConfiguracoesPage from '@/pages/admin/ConfiguracoesPage';
import VideoManagement from '@/pages/admin/VideoManagement';
import LeadsProdutora from '@/pages/admin/LeadsProdutora';

const SuperAdminRoutes = () => {
  return (
    <Routes>
      <Route index element={<Dashboard />} />
      <Route path="predios" element={<BuildingsPage />} />
      <Route path="paineis" element={<PanelsPage />} />
      <Route path="pedidos" element={<OrdersPage />} />
      <Route path="pedidos/:id" element={<OrderDetails />} />
      <Route path="aprovacoes" element={<ApprovalsPage />} />
      <Route path="usuarios" element={<UsersPage />} />
      <Route path="sindicos-interessados" element={<SindicosInteressados />} />
      <Route path="cupons" element={<CouponsPage />} />
      <Route path="homepage-config" element={<HomepageImagesPage />} />
      <Route path="notificacoes" element={<NotificationsPage />} />
      <Route path="configuracoes" element={<ConfiguracoesPage />} />
      <Route path="videos" element={<VideoManagement />} />
      <Route path="leads-produtora" element={<LeadsProdutora />} />
    </Routes>
  );
};

export default SuperAdminRoutes;
