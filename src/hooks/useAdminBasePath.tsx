import { useMemo } from 'react';
import { useAuth } from './useAuth';

export const useAdminBasePath = () => {
  const { userProfile } = useAuth();

  const basePath = useMemo(() => {
    const isSuperAdmin = userProfile?.role === 'super_admin' && userProfile?.email === 'jefersonstilver@gmail.com';
    
    if (isSuperAdmin) {
      return '/super_admin';
    }
    
    // admin e admin_marketing usam /admin
    if (userProfile?.role === 'admin' || userProfile?.role === 'admin_marketing') {
      return '/admin';
    }
    
    // Fallback para super_admin caso não consiga determinar
    return '/super_admin';
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
    isSuperAdmin: userProfile?.role === 'super_admin' && userProfile?.email === 'jefersonstilver@gmail.com',
    isRegularAdmin: userProfile?.role === 'admin' || userProfile?.role === 'admin_marketing'
  };
};