
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
    const emailConfirmed = userProfile?.email_verified_at;

    if (import.meta.env.DEV) {
      console.log('🛡️ PROTECTION - Verificação:', {
        userEmail: userProfile?.email,
        userRole: userProfile?.role,
        isSuperAdmin,
        currentPath,
        isLoggedIn,
        emailConfirmed
      });
    }

    // FASE 5: BLOQUEAR SE EMAIL NÃO CONFIRMADO
    if (isLoggedIn && userProfile && !emailConfirmed) {
      if (import.meta.env.DEV) {
        console.log('🚫 PROTECTION: Email não confirmado, bloqueando');
      }
      navigate('/login', { replace: true });
      return;
    }

    // Proteção básica - sem redirecionamentos automáticos
    if (currentPath.startsWith('/super_admin') && (!isLoggedIn || !isSuperAdmin)) {
      if (import.meta.env.DEV) {
        console.log('🚫 PROTECTION: Acesso negado ao super_admin');
      }
      navigate('/login?redirect=/super_admin', { replace: true });
      return;
    }

  }, [userProfile, isLoading, isLoggedIn, location.pathname, navigate]);

  return {
    isSuperAdmin: userProfile?.role === 'super_admin',
    isProtected: true
  };
};
