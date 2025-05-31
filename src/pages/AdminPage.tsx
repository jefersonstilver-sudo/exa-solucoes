
import React from 'react';
import { Routes, Route } from 'react-router-dom';
import AdminLayout from '@/components/admin/layout/AdminLayout';
import SuperAdminRoutes from '@/routes/SuperAdminRoutes';

const AdminPage = () => {
  return (
    <AdminLayout>
      <SuperAdminRoutes />
    </AdminLayout>
  );
};

export default AdminPage;
