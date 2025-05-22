
import { useEffect, useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { useUserSession } from './useUserSession';
import { toast } from 'sonner';

interface UseRouteProtectionProps {
  redirectTo?: string;
  message?: string;
  requireLogin?: boolean;
  requiredRole?: 'client' | 'admin' | 'super_admin';
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
    
    if (requireLogin && !isLoggedIn) {
      // User needs to be logged in but isn't
      toast.error(message);
      navigate(`${redirectTo}?redirect=${encodeURIComponent(window.location.pathname)}`);
      return;
    } 
    
    if (!requireLogin && isLoggedIn) {
      // User is logged in but page is for anonymous users only
      navigate('/paineis-digitais/loja');
      return;
    }
    
    // Check role if required
    if (requiredRole && isLoggedIn) {
      if (!hasRole(requiredRole)) {
        // User doesn't have the required role
        toast.error(`Você não tem permissão para acessar esta página. Acesso restrito para ${requiredRole}.`);
        
        // Redirect based on the user's highest role
        if (user?.role === 'super_admin') {
          navigate('/admin');
        } else if (user?.role === 'admin') {
          navigate('/admin');
        } else {
          navigate('/anunciante');
        }
        return;
      }
    }
    
    // User has proper authorization for this page
    setIsAuthorized(true);
  }, [isLoggedIn, isLoading, navigate, redirectTo, message, requireLogin, requiredRole, hasRole, user]);

  return { isAuthorized, isLoading };
};
