import React from 'react';
import { Navigate } from 'react-router-dom';
import { useDynamicModulePermissions } from '@/hooks/useDynamicModulePermissions';
import GlobalLoadingPage from '@/components/loading/GlobalLoadingPage';

interface ProtectedModuleRouteProps {
  moduleKey: string;
  children: React.ReactNode;
  fallbackPath?: string;
}

export const ProtectedModuleRoute: React.FC<ProtectedModuleRouteProps> = ({
  moduleKey,
  children,
  fallbackPath = '/admin/acesso-negado'
}) => {
  const { hasModuleAccess, isLoading, isMasterAccount } = useDynamicModulePermissions();

  // Show loading while checking permissions
  if (isLoading) {
    return <GlobalLoadingPage message="Verificando permissões..." />;
  }

  // Master account always has access
  if (isMasterAccount) {
    return <>{children}</>;
  }

  // Check if user has access to this module
  if (!hasModuleAccess(moduleKey)) {
    console.log(`🚫 Access denied to module: ${moduleKey}`);
    return <Navigate to={fallbackPath} replace />;
  }

  return <>{children}</>;
};

export default ProtectedModuleRoute;
