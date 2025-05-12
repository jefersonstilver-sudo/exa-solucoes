
import { useEffect, useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { useUserSession } from './useUserSession';
import { toast } from 'sonner';

interface UseRouteProtectionProps {
  redirectTo?: string;
  message?: string;
  requireLogin?: boolean;
}

/**
 * Hook to protect routes that require authentication
 */
export const useRouteProtection = ({
  redirectTo = '/login',
  message = 'Faça login para acessar esta página',
  requireLogin = true
}: UseRouteProtectionProps = {}) => {
  const { isLoggedIn, isLoading } = useUserSession();
  const [isAuthorized, setIsAuthorized] = useState(false);
  const navigate = useNavigate();

  useEffect(() => {
    // Wait until we know the authentication state
    if (isLoading) return;
    
    if (requireLogin && !isLoggedIn) {
      // User needs to be logged in but isn't
      toast.error(message);
      navigate(`${redirectTo}?redirect=${encodeURIComponent(window.location.pathname)}`);
    } else if (!requireLogin && isLoggedIn) {
      // User is logged in but page is for anonymous users only
      navigate('/paineis-digitais/loja');
    } else {
      // User has proper authorization for this page
      setIsAuthorized(true);
    }
  }, [isLoggedIn, isLoading, navigate, redirectTo, message, requireLogin]);

  return { isAuthorized, isLoading };
};
