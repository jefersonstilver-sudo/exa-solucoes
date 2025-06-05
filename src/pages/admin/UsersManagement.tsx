
import React from 'react';
import Layout from '@/components/layout/Layout';
import UserManagementPanel from '@/components/admin/users/UserManagementPanel';
import PendingEmailConfirmations from '@/components/admin/users/PendingEmailConfirmations';
import { useAuth } from '@/hooks/useAuth';
import { Navigate } from 'react-router-dom';

export default function UsersManagement() {
  const { user, isAdmin } = useAuth();

  if (!user || !isAdmin) {
    return <Navigate to="/login" replace />;
  }

  return (
    <Layout>
      <div className="container mx-auto py-8 space-y-8">
        <div>
          <h1 className="text-3xl font-bold text-gray-900 mb-2">Gestão de Usuários</h1>
          <p className="text-gray-600">Gerencie usuários e confirmações de email do sistema</p>
        </div>
        
        {/* Confirmações de Email Pendentes */}
        <PendingEmailConfirmations />
        
        {/* Painel de Gestão de Usuários */}
        <UserManagementPanel />
      </div>
    </Layout>
  );
}
