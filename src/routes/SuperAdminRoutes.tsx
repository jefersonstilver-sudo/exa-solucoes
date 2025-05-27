
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

const SuperAdminRoutes = () => {
  return (
    <Routes>
      <Route path="/" element={<Dashboard />} />
      <Route path="/usuarios" element={<UsersPage />} />
      <Route path="/usuarios-gestao" element={<UsersManagement />} />
      <Route path="/pedidos" element={<OrdersPage />} />
      <Route path="/pedidos/:id" element={<OrderDetails />} />
      <Route path="/aprovacoes" element={<ApprovalsPage />} />
      <Route path="/predios" element={<BuildingsManagement />} />
      <Route path="/predios-gestao" element={<BuildingsManagement />} />
      <Route path="/paineis" element={<PanelsPage />} />
      <Route path="/cupons" element={<CouponsPage />} />
      <Route path="/configuracoes" element={<ConfiguracoesPage />} />
    </Routes>
  );
};

export default SuperAdminRoutes;
