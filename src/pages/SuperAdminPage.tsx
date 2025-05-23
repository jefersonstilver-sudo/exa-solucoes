
import React from 'react';
import SuperAdminLayout from '@/components/admin/layout/SuperAdminLayout';
import SuperAdminRoutes from '@/routes/SuperAdminRoutes';

const SuperAdminPage = () => {
  return (
    <SuperAdminLayout>
      <SuperAdminRoutes />
    </SuperAdminLayout>
  );
};

export default SuperAdminPage;
