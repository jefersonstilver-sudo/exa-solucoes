
import React from 'react';
import { Routes, Route } from 'react-router-dom';
import Dashboard from '@/pages/admin/Dashboard';
import UsersPage from '@/pages/admin/UsersPage';
import UsersManagement from '@/pages/admin/UsersManagement';
import BuildingsManagement from '@/pages/admin/BuildingsManagement';
import OrdersPage from '@/pages/admin/OrdersPage';
import OrderDetails from '@/pages/admin/OrderDetails';
import ApprovalsPage from '@/pages/admin/ApprovalsPage';
import PanelsPage from '@/pages/admin/PanelsPage';
import ConfiguracoesPage from '@/pages/admin/ConfiguracoesPage';
import CouponsPage from '@/pages/admin/CouponsPage';
import NotificationsPage from '@/pages/admin/NotificationsPage';
import VideoManagement from '@/pages/admin/VideoManagement';
import HomepageImagesPage from '@/pages/admin/HomepageImagesPage';

const SuperAdminRoutes = () => {
  return (
    <Routes>
      {/* Dashboard Principal */}
      <Route path="/" element={<Dashboard />} />
      
      {/* Gestão de Usuários */}
      <Route path="/usuarios" element={<UsersPage />} />
      <Route path="/usuarios-gestao" element={<UsersManagement />} />
      
      {/* Gestão de Pedidos */}
      <Route path="/pedidos" element={<OrdersPage />} />
      <Route path="/pedidos/:id" element={<OrderDetails />} />
      
      {/* Aprovações */}
      <Route path="/aprovacoes" element={<ApprovalsPage />} />
      
      {/* Gestão de Vídeos */}
      <Route path="/videos" element={<VideoManagement />} />
      
      {/* Gestão de Prédios */}
      <Route path="/predios" element={<BuildingsManagement />} />
      <Route path="/predios-gestao" element={<BuildingsManagement />} />
      
      {/* Gestão de Painéis */}
      <Route path="/paineis" element={<PanelsPage />} />
      
      {/* Homepage Imagens */}
      <Route path="/homepage-imagens" element={<HomepageImagesPage />} />
      
      {/* Gestão de Cupons */}
      <Route path="/cupons" element={<CouponsPage />} />
      
      {/* Configurações */}
      <Route path="/configuracoes" element={<ConfiguracoesPage />} />
      
      {/* Notificações */}
      <Route path="/notifications" element={<NotificationsPage />} />
    </Routes>
  );
};

export default SuperAdminRoutes;
