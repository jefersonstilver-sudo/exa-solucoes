
import React from 'react';
import { Navigate } from 'react-router-dom';

// Este arquivo foi removido - todas as rotas admin agora estão em /super_admin
// Redirecionando para super_admin
export const AdminRoutes = () => {
  return <Navigate to="/super_admin" replace />;
};

export default AdminRoutes;
