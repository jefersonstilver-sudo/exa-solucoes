
import { useEffect } from 'react';
import { useNavigate, useLocation } from 'react-router-dom';
import { useAuth } from './useAuth';

export const useSuperAdminProtection = () => {
  const { userProfile, isLoading, isLoggedIn } = useAuth();
  const navigate = useNavigate();
  const location = useLocation();

  useEffect(() => {
    if (isLoading) {
      if (import.meta.env.DEV) {
        console.log('🛡️ PROTECTION: Aguardando carregamento...');
      }
      return;
    }

    const isSuperAdmin = userProfile?.role === 'super_admin';
    const currentPath = location.pathname;

    if (import.meta.env.DEV) {
      console.log('🛡️ PROTECTION - Verificação:', {
        userEmail: userProfile?.email,
        userRole: userProfile?.role,
        isSuperAdmin,
        currentPath,
        isLoggedIn
      });
    }

    // Proteção básica - email confirmado é verificado no momento do login
    if (currentPath.startsWith('/super_admin') && (!isLoggedIn || !isSuperAdmin)) {
      if (import.meta.env.DEV) {
        console.log('🚫 PROTECTION: Acesso negado ao super_admin');
      }
      navigate('/sistema/login', { replace: true });
      return;
    }

  }, [userProfile, isLoading, isLoggedIn, location.pathname, navigate]);

  return {
    isSuperAdmin: userProfile?.role === 'super_admin',
    isProtected: true
  };
};
