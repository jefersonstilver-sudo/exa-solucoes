import React from 'react';
import { useUserPermissions } from '@/hooks/useUserPermissions';
import { Navigate } from 'react-router-dom';
import LogosAdmin from '@/components/admin/LogosAdmin';

const LogosPage = () => {
  const { canManageHomepageConfig } = useUserPermissions();
  
  // Redirects unauthorized users
  if (!canManageHomepageConfig) {
    return <Navigate to="/login" replace />;
  }
  
  return (
    <div className="container mx-auto px-6 py-8">
      <div className="mb-8">
        <h1 className="text-3xl font-bold text-gray-900">Gerenciar Logos</h1>
        <p className="text-gray-600 mt-2">
          Gerencie as logos exibidas no ticker da homepage
        </p>
      </div>
      
      <LogosAdmin />
    </div>
  );
};

export default LogosPage;