
import { useEffect } from 'react';
import { useNavigate, useLocation } from 'react-router-dom';
import { useUserSession } from './useUserSession';
import { toast } from 'sonner';

/**
 * Hook de proteção específico para super admin
 * Garante que jefersonstilver@gmail.com sempre acesse /super_admin
 */
export const useSuperAdminProtection = () => {
  const { user, isLoading, isLoggedIn } = useUserSession();
  const navigate = useNavigate();
  const location = useLocation();

  useEffect(() => {
    if (isLoading) return;

    const isSuperAdmin = user?.email === 'jefersonstilver@gmail.com';
    const currentPath = location.pathname;

    console.log('🔒 SUPER ADMIN PROTECTION - Verificação:', {
      userEmail: user?.email,
      userRole: user?.role,
      isSuperAdmin,
      currentPath,
      isLoggedIn
    });

    // REGRA CRÍTICA 1: Se é super admin e NÃO está em /super_admin, redirecionar IMEDIATAMENTE
    if (isLoggedIn && isSuperAdmin && !currentPath.startsWith('/super_admin')) {
      console.log('🚨 CRÍTICO: Super admin fora da área administrativa - REDIRECIONANDO');
      toast.info('Redirecionando para o painel administrativo', {
        duration: 2000
      });
      
      // Força redirecionamento imediato
      setTimeout(() => {
        navigate('/super_admin', { replace: true });
      }, 100);
      
      return;
    }

    // REGRA CRÍTICA 2: Se está em /super_admin mas NÃO é super admin, bloquear
    if (currentPath.startsWith('/super_admin') && (!isLoggedIn || !isSuperAdmin)) {
      console.log('🚫 BLOQUEIO: Tentativa de acesso não autorizado ao painel admin');
      toast.error('Acesso negado ao painel administrativo', {
        duration: 3000
      });
      
      setTimeout(() => {
        navigate('/login', { replace: true });
      }, 100);
      
      return;
    }

    // REGRA CRÍTICA 3: Super admin nunca deve acessar áreas de cliente
    if (isLoggedIn && isSuperAdmin && (
      currentPath.startsWith('/anunciante') || 
      currentPath.startsWith('/client') ||
      currentPath === '/paineis-digitais/loja' ||
      currentPath.startsWith('/checkout')
    )) {
      console.log('🚫 BLOQUEIO: Super admin tentando acessar área de cliente');
      toast.error('Super administrador deve usar apenas o painel administrativo', {
        duration: 3000
      });
      
      setTimeout(() => {
        navigate('/super_admin', { replace: true });
      }, 100);
      
      return;
    }

  }, [user, isLoading, isLoggedIn, location.pathname, navigate]);

  return {
    isSuperAdmin: user?.email === 'jefersonstilver@gmail.com',
    isProtected: true
  };
};
