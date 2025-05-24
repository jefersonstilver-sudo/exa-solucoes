
import { useEffect, useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { useUserSession } from './useUserSession';
import { toast } from 'sonner';
import { UserRole } from '@/types/userTypes';

interface UseRouteProtectionProps {
  redirectTo?: string;
  message?: string;
  requireLogin?: boolean;
  requiredRole?: UserRole;
}

/**
 * Hook to protect routes that require authentication and specific roles
 */
export const useRouteProtection = ({
  redirectTo = '/login',
  message = 'Faça login para acessar esta página',
  requireLogin = true,
  requiredRole
}: UseRouteProtectionProps = {}) => {
  const { isLoggedIn, isLoading, hasRole, user } = useUserSession();
  const [isAuthorized, setIsAuthorized] = useState(false);
  const navigate = useNavigate();

  useEffect(() => {
    // Wait until we know the authentication state
    if (isLoading) return;
    
    console.log('🔐 useRouteProtection - Verificação de acesso:', { 
      isLoggedIn, 
      userEmail: user?.email, 
      userRole: user?.role, 
      requiredRole,
      currentPath: window.location.pathname
    });
    
    // VERIFICAÇÃO CRÍTICA: Super admin sempre deve ir para /super_admin
    if (isLoggedIn && user?.email === 'jefersonstilver@gmail.com') {
      const currentPath = window.location.pathname;
      
      // Se super admin está em qualquer lugar que não seja /super_admin, redirecionar
      if (!currentPath.startsWith('/super_admin')) {
        console.log('🚨 REDIRECIONAMENTO CRÍTICO: Super admin fora do painel administrativo');
        toast.info('Redirecionando para o painel administrativo');
        navigate('/super_admin');
        return;
      }
    }
    
    if (requireLogin && !isLoggedIn) {
      // User needs to be logged in but isn't
      console.log('❌ Usuário não autenticado tentando acessar área protegida');
      toast.error(message);
      navigate(`${redirectTo}?redirect=${encodeURIComponent(window.location.pathname)}`);
      return;
    } 
    
    if (!requireLogin && isLoggedIn) {
      // User is logged in but page is for anonymous users only
      console.log('🔄 Usuário logado tentando acessar página anônima');
      
      // VERIFICAÇÃO ESPECIAL: Super admin vai para /super_admin
      if (user?.email === 'jefersonstilver@gmail.com') {
        navigate('/super_admin');
      } else {
        navigate('/anunciante');
      }
      return;
    }
    
    // Check role if required
    if (requiredRole && isLoggedIn) {
      console.log('🔍 Verificando role:', { userRole: user?.role, requiredRole });
      
      // VERIFICAÇÃO ESPECIAL: Super admin tentando acessar área não-admin
      if (user?.email === 'jefersonstilver@gmail.com' && requiredRole !== 'super_admin') {
        console.log('🚫 Super admin tentando acessar área inadequada');
        toast.error('Super administrador deve usar o painel administrativo');
        navigate('/super_admin');
        return;
      }
      
      if (!hasRole(requiredRole)) {
        // User doesn't have the required role
        console.log('❌ Role insuficiente para acesso');
        toast.error(`Você não tem permissão para acessar esta página. Acesso restrito para ${requiredRole}.`);
        
        // Redirecionamento baseado no papel do usuário
        if (user?.email === 'jefersonstilver@gmail.com' && user?.role === 'super_admin') {
          console.log('🔄 Redirecionando super admin para /super_admin');
          navigate('/super_admin');
        } else if (user?.role === 'admin' || user?.role === 'client') {
          console.log('🔄 Redirecionando usuário para /anunciante');
          navigate('/anunciante');
        } else {
          console.log('🔄 Redirecionando para login');
          navigate('/login');
        }
        return;
      }
    }
    
    // User has proper authorization for this page
    console.log('✅ Usuário autorizado para esta página');
    setIsAuthorized(true);
  }, [isLoggedIn, isLoading, navigate, redirectTo, message, requireLogin, requiredRole, hasRole, user]);

  return { isAuthorized, isLoading };
};
