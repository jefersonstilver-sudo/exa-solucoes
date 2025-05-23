
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
    
    console.log('useRouteProtection - Estado do usuário:', { 
      isLoggedIn, 
      userEmail: user?.email, 
      userRole: user?.role, 
      requiredRole 
    });
    
    if (requireLogin && !isLoggedIn) {
      // User needs to be logged in but isn't
      toast.error(message);
      navigate(`${redirectTo}?redirect=${encodeURIComponent(window.location.pathname)}`);
      return;
    } 
    
    if (!requireLogin && isLoggedIn) {
      // User is logged in but page is for anonymous users only
      navigate('/anunciante');
      return;
    }
    
    // Check role if required
    if (requiredRole && isLoggedIn) {
      console.log('Verificando role:', { userRole: user?.role, requiredRole });
      
      if (!hasRole(requiredRole)) {
        // User doesn't have the required role
        toast.error(`Você não tem permissão para acessar esta página. Acesso restrito para ${requiredRole}.`);
        
        // CORREÇÃO: Redirect baseado no papel do usuário
        if (user?.email === 'jefersonstilver@gmail.com' && user?.role === 'super_admin') {
          console.log('Redirecionando super admin para /super_admin');
          navigate('/super_admin');
        } else if (user?.role === 'admin') {
          console.log('Redirecionando admin regular para /anunciante');
          navigate('/anunciante');
        } else {
          console.log('Redirecionando usuário comum para /anunciante');
          navigate('/anunciante');
        }
        return;
      }
    }
    
    // User has proper authorization for this page
    console.log('Usuário autorizado para esta página');
    setIsAuthorized(true);
  }, [isLoggedIn, isLoading, navigate, redirectTo, message, requireLogin, requiredRole, hasRole, user]);

  return { isAuthorized, isLoading };
};
