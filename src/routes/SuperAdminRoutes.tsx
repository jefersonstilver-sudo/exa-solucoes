
import React from 'react';
import { Routes, Route } from 'react-router-dom';
import Dashboard from '@/pages/admin/Dashboard';
import OrdersPage from '@/pages/admin/OrdersPage';
import OrderDetails from '@/pages/admin/OrderDetails';
import PanelsPage from '@/pages/admin/PanelsPage';
import BuildingsPage from '@/pages/admin/BuildingsPage';
import UsersPage from '@/pages/admin/UsersPage';
import UserForm from '@/pages/admin/UserForm';
import ConfiguracoesPage from '@/pages/admin/ConfiguracoesPage';

export const SuperAdminRoutes = () => {
  return (
    <Routes>
      <Route path="/" element={<Dashboard />} />
      <Route path="/dashboard" element={<Dashboard />} />
      <Route path="/pedidos" element={<OrdersPage />} />
      <Route path="/pedidos/:id" element={<OrderDetails />} />
      <Route path="/paineis" element={<PanelsPage />} />
      <Route path="/predios" element={<BuildingsPage />} />
      <Route path="/usuarios" element={<UsersPage />} />
      <Route path="/usuarios/novo" element={<UserForm />} />
      <Route path="/usuarios/:id" element={<UserForm />} />
      <Route path="/configuracoes" element={<ConfiguracoesPage />} />
    </Routes>
  );
};

export default SuperAdminRoutes;
