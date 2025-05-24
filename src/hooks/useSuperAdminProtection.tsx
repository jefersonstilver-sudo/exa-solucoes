
import { useEffect } from 'react';
import { useNavigate, useLocation } from 'react-router-dom';
import { useAuth } from './useAuth';
import { toast } from 'sonner';

/**
 * Hook de proteção DEFINITIVO para super admin
 * Garante que jefersonstilver@gmail.com sempre acesse /super_admin
 */
export const useSuperAdminProtection = () => {
  const { userProfile, isLoading, isLoggedIn } = useAuth();
  const navigate = useNavigate();
  const location = useLocation();

  useEffect(() => {
    if (isLoading) return;

    const isSuperAdmin = userProfile?.email === 'jefersonstilver@gmail.com' && 
                        userProfile?.role === 'super_admin';
    const currentPath = location.pathname;

    console.log('🛡️ SUPER ADMIN PROTECTION - Verificação COMPLETA:', {
      userEmail: userProfile?.email,
      userRole: userProfile?.role,
      isSuperAdmin,
      currentPath,
      isLoggedIn
    });

    // REGRA CRÍTICA 1: Se é super admin e NÃO está em /super_admin, redirecionar IMEDIATAMENTE
    if (isLoggedIn && isSuperAdmin && !currentPath.startsWith('/super_admin')) {
      console.log('🚨 CRÍTICO: Super admin fora da área administrativa - REDIRECIONANDO AGORA');
      toast.success('Redirecionando para o painel administrativo completo', {
        duration: 2000
      });
      
      // REDIRECIONAMENTO FORÇADO E IMEDIATO
      window.location.href = '/super_admin';
      return;
    }

    // REGRA CRÍTICA 2: Se está em /super_admin mas NÃO é super admin, bloquear IMEDIATAMENTE
    if (currentPath.startsWith('/super_admin') && (!isLoggedIn || !isSuperAdmin)) {
      console.log('🚫 BLOQUEIO: Tentativa de acesso não autorizado ao painel admin');
      toast.error('Acesso negado ao painel administrativo - Apenas Super Admin', {
        duration: 4000
      });
      
      navigate('/login?redirect=/super_admin', { replace: true });
      return;
    }

    // REGRA CRÍTICA 3: Super admin nunca deve acessar áreas de cliente
    if (isLoggedIn && isSuperAdmin && (
      currentPath.startsWith('/anunciante') || 
      currentPath.startsWith('/client') ||
      currentPath === '/paineis-digitais/loja' ||
      currentPath.startsWith('/checkout') ||
      currentPath === '/admin' ||
      currentPath === '/dashboard' ||
      currentPath === '/painel'
    )) {
      console.log('🚫 BLOQUEIO: Super admin tentando acessar área inadequada');
      toast.error('Super administrador deve usar apenas o painel administrativo', {
        duration: 3000
      });
      
      window.location.href = '/super_admin';
      return;
    }

  }, [userProfile, isLoading, isLoggedIn, location.pathname, navigate]);

  return {
    isSuperAdmin: userProfile?.email === 'jefersonstilver@gmail.com' && userProfile?.role === 'super_admin',
    isProtected: true
  };
};
