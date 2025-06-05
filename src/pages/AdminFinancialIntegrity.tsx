
import React from 'react';
import ModernSuperAdminLayout from '@/components/admin/layout/ModernSuperAdminLayout';
import FinancialIntegrityDashboard from '@/components/admin/FinancialIntegrityDashboard';

const AdminFinancialIntegrity = () => {
  return (
    <ModernSuperAdminLayout>
      <div className="container mx-auto">
        <FinancialIntegrityDashboard />
      </div>
    </ModernSuperAdminLayout>
  );
};

export default AdminFinancialIntegrity;
