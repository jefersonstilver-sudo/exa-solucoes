
import { useEffect } from 'react';
import { useNavigate, useLocation } from 'react-router-dom';
import { useAuth } from './useAuth';

export const useSuperAdminProtection = () => {
  const { userProfile, isLoading, isLoggedIn } = useAuth();
  const navigate = useNavigate();
  const location = useLocation();

  useEffect(() => {
    if (isLoading) {
      console.log('🛡️ PROTECTION: Aguardando carregamento...');
      return;
    }

    const isSuperAdmin = userProfile?.role === 'super_admin';
    const currentPath = location.pathname;

    console.log('🛡️ PROTECTION - Verificação simples:', {
      userEmail: userProfile?.email,
      userRole: userProfile?.role,
      isSuperAdmin,
      currentPath,
      isLoggedIn
    });

    // APENAS proteção básica - SEM redirecionamentos automáticos
    if (currentPath.startsWith('/super_admin') && (!isLoggedIn || !isSuperAdmin)) {
      console.log('🚫 PROTECTION: Acesso negado ao super_admin');
      navigate('/login?redirect=/super_admin', { replace: true });
      return;
    }

  }, [userProfile, isLoading, isLoggedIn, location.pathname, navigate]);

  return {
    isSuperAdmin: userProfile?.role === 'super_admin',
    isProtected: true
  };
};
