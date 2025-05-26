
import { useEffect, useState } from 'react';
import { useNavigate, useLocation } from 'react-router-dom';
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
 * Hook de proteção de rotas com segurança aprimorada
 * CORREÇÃO: Permite que super admin navegue livremente em páginas públicas
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
  const location = useLocation();

  useEffect(() => {
    // Aguardar carregamento do estado de autenticação
    if (isLoading) return;
    
    const currentPath = window.location.pathname;
    const isSuperAdmin = user?.email === 'jefersonstilver@gmail.com' && user?.role === 'super_admin';
    
    console.log('🔐 ROUTE PROTECTION - Análise de acesso:', { 
      currentPath,
      isLoggedIn, 
      userEmail: user?.email, 
      userRole: user?.role, 
      requiredRole,
      isSuperAdmin,
      requireLogin
    });
    
    // CORREÇÃO CRÍTICA: Super admin pode navegar livremente em páginas públicas
    const isPublicPage = currentPath === '/' || 
                        currentPath.startsWith('/loja') ||
                        currentPath.startsWith('/paineis-digitais') ||
                        currentPath.startsWith('/sobre') ||
                        currentPath.startsWith('/contato') ||
                        currentPath.startsWith('/planos');
    
    if (isSuperAdmin && isPublicPage) {
      console.log('✅ Super admin acessando página pública - PERMITIDO:', currentPath);
      setIsAuthorized(true);
      return;
    }
    
    // VERIFICAÇÃO CRÍTICA 1: Proteção da rota /super_admin
    if (currentPath.startsWith('/super_admin')) {
      if (!isLoggedIn || !isSuperAdmin) {
        console.log('🚫 BLOQUEIO: Tentativa de acesso não autorizado ao super_admin');
        toast.error('Acesso negado ao painel administrativo');
        navigate('/login', { replace: true });
        return;
      }
      
      // Se super admin está no painel correto, autorizar
      console.log('✅ Super admin no painel administrativo - AUTORIZADO');
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
      
      // Redirecionamento apenas se não for página pública
      if (isSuperAdmin) {
        navigate('/super_admin', { replace: true });
      } else {
        navigate('/anunciante', { replace: true });
      }
      return;
    }
    
    // VERIFICAÇÃO 4: Role específica necessária
    if (requiredRole && isLoggedIn) {
      console.log('🔍 Verificando role específica:', { userRole: user?.role, requiredRole });
      
      // Super admin tentando acessar área inadequada (exceto páginas públicas)
      if (isSuperAdmin && requiredRole !== 'super_admin' && !isPublicPage) {
        console.log('🚫 Super admin tentando acessar área inadequada');
        toast.error('Super administrador deve usar o painel administrativo');
        navigate('/super_admin', { replace: true });
        return;
      }
      
      if (!hasRole(requiredRole)) {
        console.log('❌ Role insuficiente para acesso');
        toast.error(`Você não tem permissão para acessar esta página. Acesso restrito para ${requiredRole}.`);
        
        // Redirecionamento baseado no papel do usuário
        if (isSuperAdmin) {
          navigate('/super_admin', { replace: true });
        } else if (user?.role === 'admin' || user?.role === 'client') {
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
  }, [isLoggedIn, isLoading, navigate, redirectTo, message, requireLogin, requiredRole, hasRole, user, location.pathname]);

  return { isAuthorized, isLoading };
};
