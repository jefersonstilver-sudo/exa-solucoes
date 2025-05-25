
import React from 'react';
import { Routes, Route } from 'react-router-dom';
import Dashboard from '@/pages/admin/Dashboard';
import UsersPage from '@/pages/admin/UsersPage';
import UsersManagement from '@/pages/admin/UsersManagement';
import BuildingsManagement from '@/pages/admin/BuildingsManagement';
import OrdersPage from '@/pages/admin/OrdersPage';
import OrderDetails from '@/pages/admin/OrderDetails';
import PanelsPage from '@/pages/admin/PanelsPage';
import BuildingsPage from '@/pages/admin/BuildingsPage';
import ConfiguracoesPage from '@/pages/admin/ConfiguracoesPage';

const SuperAdminRoutes = () => {
  return (
    <Routes>
      <Route path="/" element={<Dashboard />} />
      <Route path="/usuarios" element={<UsersPage />} />
      <Route path="/usuarios-gestao" element={<UsersManagement />} />
      <Route path="/predios" element={<BuildingsPage />} />
      <Route path="/predios-gestao" element={<BuildingsManagement />} />
      <Route path="/pedidos" element={<OrdersPage />} />
      <Route path="/pedidos/:id" element={<OrderDetails />} />
      <Route path="/paineis" element={<PanelsPage />} />
      <Route path="/configuracoes" element={<ConfiguracoesPage />} />
    </Routes>
  );
};

export default SuperAdminRoutes;
