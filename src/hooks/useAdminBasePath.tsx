import { useMemo } from 'react';
import { useAuth } from './useAuth';

export const useAdminBasePath = () => {
  const { userProfile } = useAuth();

  const basePath = useMemo(() => {
    const isSuperAdmin = userProfile?.role === 'super_admin';
    
    if (isSuperAdmin) {
      return '/super_admin';
    }
    
    // admin, admin_marketing e admin_financeiro usam /admin
    if (userProfile?.role === 'admin' || 
        userProfile?.role === 'admin_marketing' || 
        userProfile?.role === 'admin_financeiro') {
      return '/admin';
    }
    
    // Fallback para /admin (mais seguro que super_admin)
    return '/admin';
  }, [userProfile]);

  const buildPath = (relativePath: string) => {
    if (relativePath.startsWith('/')) {
      return `${basePath}${relativePath}`;
    }
    return `${basePath}/${relativePath}`;
  };

  return {
    basePath,
    buildPath,
    isSuperAdmin: userProfile?.role === 'super_admin',
    isRegularAdmin: userProfile?.role === 'admin' || 
                     userProfile?.role === 'admin_marketing' || 
                     userProfile?.role === 'admin_financeiro'
  };
};