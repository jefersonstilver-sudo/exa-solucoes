
import { useEffect, useRef } from 'react';
import { useNavigate, useLocation } from 'react-router-dom';
import { useAuth } from './useAuth';
import { toast } from 'sonner';

export const useSuperAdminProtection = () => {
  const { userProfile, isLoading, isLoggedIn } = useAuth();
  const navigate = useNavigate();
  const location = useLocation();
  const redirectedRef = useRef(false);

  useEffect(() => {
    if (isLoading) {
      console.log('🛡️ INDEXA PROTECTION: Aguardando carregamento...');
      return;
    }

    // VERIFICAÇÃO SUPER ADMIN BASEADA EXCLUSIVAMENTE EM JWT CLAIMS
    const isSuperAdmin = userProfile?.role === 'super_admin';
    const currentPath = location.pathname;

    console.log('🛡️ INDEXA PROTECTION - Verificação JWT exclusiva:', {
      userEmail: userProfile?.email,
      userRole: userProfile?.role,
      isSuperAdmin,
      currentPath,
      isLoggedIn,
      hasRedirected: redirectedRef.current
    });

    // Evitar loops de redirecionamento
    if (redirectedRef.current) {
      console.log('⚠️ INDEXA PROTECTION: Redirecionamento já realizado, ignorando...');
      return;
    }

    // REGRA CRÍTICA 1: Super admin fora do painel - REDIRECIONAR UMA VEZ
    if (isLoggedIn && isSuperAdmin && !currentPath.startsWith('/super_admin')) {
      console.log('🚨 INDEXA PROTECTION: Super admin fora da área - REDIRECIONAMENTO ÚNICO');
      redirectedRef.current = true;
      
      toast.success('Bem-vindo ao Painel Super Administrativo!', {
        duration: 2000
      });
      
      navigate('/super_admin', { replace: true });
      return;
    }

    // REGRA CRÍTICA 2: Não super admin tentando acessar /super_admin
    if (currentPath.startsWith('/super_admin') && (!isLoggedIn || !isSuperAdmin)) {
      console.log('🚫 INDEXA PROTECTION: Acesso negado ao super_admin - JWT sem role adequada');
      redirectedRef.current = true;
      
      toast.error('Acesso negado ao painel administrativo', {
        duration: 4000
      });
      
      navigate('/login?redirect=/super_admin', { replace: true });
      return;
    }

  }, [userProfile, isLoading, isLoggedIn, location.pathname, navigate]);

  // Reset do flag quando a localização muda significativamente
  useEffect(() => {
    const timer = setTimeout(() => {
      redirectedRef.current = false;
    }, 3000);

    return () => clearTimeout(timer);
  }, [location.pathname]);

  return {
    isSuperAdmin: userProfile?.role === 'super_admin',
    isProtected: true
  };
};
