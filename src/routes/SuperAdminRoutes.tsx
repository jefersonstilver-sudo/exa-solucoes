
import React from 'react';
import { Routes, Route } from 'react-router-dom';
import Dashboard from '@/pages/admin/Dashboard';
import OrdersPage from '@/pages/admin/OrdersPage';
import ApprovalsPage from '@/pages/admin/ApprovalsPage';
import BuildingsPage from '@/pages/admin/BuildingsPage';
import PanelsPage from '@/pages/admin/PanelsPage';
import SindicosInteressados from '@/pages/admin/SindicosInteressados';
import LeadsProdutora from '@/pages/admin/LeadsProdutora';
import LeadsCampanhas from '@/pages/admin/LeadsCampanhas';
import UsersPage from '@/pages/admin/UsersPage';
import CouponsPage from '@/pages/admin/CouponsPage';
import HomepageImagesPage from '@/pages/admin/HomepageImagesPage';
import ClientLogosPage from '@/pages/admin/ClientLogosPage';
import ConfiguracoesPage from '@/pages/admin/ConfiguracoesPage';
import VideoManagement from '@/pages/admin/VideoManagement';
import NotificationsPage from '@/pages/admin/NotificationsPage';
import OrderDetails from '@/pages/admin/OrderDetails';

const SuperAdminRoutes = () => {
  return (
    <Routes>
      <Route index element={<Dashboard />} />
      <Route path="pedidos" element={<OrdersPage />} />
      <Route path="pedidos/:orderId" element={<OrderDetails />} />
      <Route path="aprovacoes" element={<ApprovalsPage />} />
      <Route path="predios" element={<BuildingsPage />} />
      <Route path="paineis" element={<PanelsPage />} />
      <Route path="sindicos-interessados" element={<SindicosInteressados />} />
      <Route path="leads-produtora" element={<LeadsProdutora />} />
      <Route path="leads-campanhas" element={<LeadsCampanhas />} />
      <Route path="usuarios" element={<UsersPage />} />
      <Route path="cupons" element={<CouponsPage />} />
      <Route path="homepage-config" element={<HomepageImagesPage />} />
      <Route path="client-logos" element={<ClientLogosPage />} />
      <Route path="configuracoes" element={<ConfiguracoesPage />} />
      <Route path="videos" element={<VideoManagement />} />
      <Route path="notificacoes" element={<NotificationsPage />} />
    </Routes>
  );
};

export default SuperAdminRoutes;
