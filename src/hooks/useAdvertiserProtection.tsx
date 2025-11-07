import { useEffect } from 'react';
import { useNavigate, useLocation } from 'react-router-dom';
import { useAuth } from './useAuth';

/**
 * Hook de proteção para páginas do portal do anunciante
 * Redireciona automaticamente usuários não autenticados para o login
 */
export const useAdvertiserProtection = () => {
  const { userProfile, isLoading, isLoggedIn } = useAuth();
  const navigate = useNavigate();
  const location = useLocation();

  useEffect(() => {
    // Aguardar carregamento inicial
    if (isLoading) {
      return;
    }

    const currentPath = location.pathname;
    const isAdvertiserRoute = currentPath.startsWith('/anunciante');

    // Se está em rota de anunciante e não está logado, redirecionar IMEDIATAMENTE
    if (isAdvertiserRoute && !isLoggedIn) {
      console.log('🚫 [ADVERTISER_PROTECTION] Acesso negado - usuário não autenticado');
      console.log('🔄 [ADVERTISER_PROTECTION] Redirecionando para login...');
      
      // Redirecionar para login com URL de retorno
      navigate(`/login?redirect=${encodeURIComponent(currentPath)}`, { 
        replace: true 
      });
      return;
    }

    // Log de acesso permitido
    if (isAdvertiserRoute && isLoggedIn) {
      console.log('✅ [ADVERTISER_PROTECTION] Acesso permitido:', {
        userEmail: userProfile?.email,
        currentPath
      });
    }

  }, [userProfile, isLoading, isLoggedIn, location.pathname, navigate]);

  return {
    isAuthenticated: isLoggedIn,
    isLoading,
    userProfile
  };
};
