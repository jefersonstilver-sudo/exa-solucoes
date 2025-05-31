
import { useEffect, useState } from 'react';
import { useNavigate, useLocation } from 'react-router-dom';
import { useUserSession } from './useUserSession';
import { useUserPermissions } from './useUserPermissions';
import { toast } from 'sonner';
import { UserRole } from '@/types/userTypes';

interface UseRouteProtectionProps {
  redirectTo?: string;
  message?: string;
  requireLogin?: boolean;
  requiredRole?: UserRole;
  requiredPermission?: string;
}

/**
 * Hook de proteção de rotas com sistema granular de permissões
 */
export const useRouteProtection = ({
  redirectTo = '/login',
  message = 'Faça login para acessar esta página',
  requireLogin = true,
  requiredRole,
  requiredPermission
}: UseRouteProtectionProps = {}) => {
  const { isLoggedIn, isLoading, hasRole, user } = useUserSession();
  const { permissions, userInfo, checkPermission } = useUserPermissions();
  const [isAuthorized, setIsAuthorized] = useState(false);
  const navigate = useNavigate();
  const location = useLocation();

  useEffect(() => {
    // Aguardar carregamento do estado de autenticação
    if (isLoading) return;
    
    const currentPath = window.location.pathname;
    const isSuperAdmin = user?.email === 'jefersonstilver@gmail.com' && user?.role === 'super_admin';
    
    console.log('🔐 ROUTE PROTECTION - Análise granular de acesso:', { 
      currentPath,
      isLoggedIn, 
      userEmail: user?.email, 
      userRole: user?.role, 
      requiredRole,
      requiredPermission,
      isSuperAdmin,
      requireLogin,
      permissions
    });
    
    // Páginas públicas que qualquer usuário pode acessar
    const isPublicPage = currentPath === '/' || 
                        currentPath.startsWith('/loja') ||
                        currentPath.startsWith('/paineis-digitais') ||
                        currentPath.startsWith('/sobre') ||
                        currentPath.startsWith('/contato') ||
                        currentPath.startsWith('/planos');
    
    if (isPublicPage) {
      console.log('✅ Página pública - ACESSO LIBERADO:', currentPath);
      setIsAuthorized(true);
      return;
    }
    
    // VERIFICAÇÃO 1: Proteção da rota /super_admin
    if (currentPath.startsWith('/super_admin')) {
      if (!isLoggedIn) {
        console.log('🚫 BLOQUEIO: Usuário não logado tentando acessar super_admin');
        toast.error('Faça login para acessar o painel administrativo');
        navigate('/login', { replace: true });
        return;
      }

      // Verificar se tem algum tipo de acesso administrativo
      const hasAdminAccess = userInfo.isSuperAdmin || userInfo.isAdmin || userInfo.isMarketingAdmin;
      
      if (!hasAdminAccess) {
        console.log('🚫 BLOQUEIO: Usuário sem permissões administrativas');
        toast.error('Acesso negado ao painel administrativo');
        navigate('/login', { replace: true });
        return;
      }

      // Verificação específica de permissão se requerida
      if (requiredPermission && !checkPermission(requiredPermission as any)) {
        console.log('🚫 BLOQUEIO: Permissão específica negada:', requiredPermission);
        toast.error('Você não tem permissão para acessar esta área');
        
        // Redirecionar para área permitida baseada no tipo de admin
        if (userInfo.isMarketingAdmin) {
          navigate('/super_admin/leads-campanhas', { replace: true });
        } else {
          navigate('/super_admin', { replace: true });
        }
        return;
      }
      
      console.log('✅ Acesso administrativo autorizado');
      setIsAuthorized(true);
      return;
    }
    
    // VERIFICAÇÃO 2: Usuário precisa estar logado
    if (requireLogin && !isLoggedIn) {
      console.log('❌ Usuário não autenticado tentando acessar área protegida');
      toast.error(message);
      navigate(`${redirectTo}?redirect=${encodeURIComponent(currentPath)}`);
      return;
    } 
    
    // VERIFICAÇÃO 3: Página para usuários anônimos apenas
    if (!requireLogin && isLoggedIn && !isPublicPage) {
      console.log('🔄 Usuário logado tentando acessar página anônima');
      
      // Redirecionamento baseado no tipo de usuário
      if (userInfo.isSuperAdmin || userInfo.isAdmin || userInfo.isMarketingAdmin) {
        navigate('/super_admin', { replace: true });
      } else {
        navigate('/anunciante', { replace: true });
      }
      return;
    }
    
    // VERIFICAÇÃO 4: Role específica necessária
    if (requiredRole && isLoggedIn) {
      console.log('🔍 Verificando role específica:', { userRole: user?.role, requiredRole });
      
      if (!hasRole(requiredRole)) {
        console.log('❌ Role insuficiente para acesso');
        toast.error(`Você não tem permissão para acessar esta página. Acesso restrito para ${requiredRole}.`);
        
        // Redirecionamento baseado no papel do usuário
        if (userInfo.isSuperAdmin || userInfo.isAdmin || userInfo.isMarketingAdmin) {
          navigate('/super_admin', { replace: true });
        } else if (user?.role === 'client') {
          navigate('/anunciante', { replace: true });
        } else {
          navigate('/login', { replace: true });
        }
        return;
      }
    }
    
    // Usuário tem autorização adequada
    console.log('✅ Usuário autorizado para esta página');
    setIsAuthorized(true);
  }, [
    isLoggedIn, 
    isLoading, 
    navigate, 
    redirectTo, 
    message, 
    requireLogin, 
    requiredRole, 
    requiredPermission,
    hasRole, 
    user, 
    location.pathname,
    permissions,
    userInfo,
    checkPermission
  ]);

  return { 
    isAuthorized, 
    isLoading,
    userPermissions: permissions,
    userInfo
  };
};
