
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
 * Hook de proteção de rotas com segurança aprimorada
 * Inclui verificação específica para super admin
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
    
    // VERIFICAÇÃO CRÍTICA 1: Super admin deve SEMPRE ir para /super_admin
    if (isLoggedIn && isSuperAdmin) {
      // Se super admin está fora do painel administrativo, redirecionar
      if (!currentPath.startsWith('/super_admin')) {
        console.log('🚨 CRÍTICO: Super admin detectado fora do painel - REDIRECIONANDO');
        toast.info('Redirecionando para o painel administrativo');
        navigate('/super_admin', { replace: true });
        return;
      }
      
      // Se está no painel correto, autorizar
      if (currentPath.startsWith('/super_admin')) {
        console.log('✅ Super admin no painel correto - AUTORIZADO');
        setIsAuthorized(true);
        return;
      }
    }
    
    // VERIFICAÇÃO CRÍTICA 2: Proteção da rota /super_admin
    if (currentPath.startsWith('/super_admin')) {
      if (!isLoggedIn || !isSuperAdmin) {
        console.log('🚫 BLOQUEIO: Tentativa de acesso não autorizado ao super_admin');
        toast.error('Acesso negado ao painel administrativo');
        navigate('/login', { replace: true });
        return;
      }
    }
    
    // VERIFICAÇÃO 3: Usuário precisa estar logado
    if (requireLogin && !isLoggedIn) {
      console.log('❌ Usuário não autenticado tentando acessar área protegida');
      toast.error(message);
      navigate(`${redirectTo}?redirect=${encodeURIComponent(currentPath)}`);
      return;
    } 
    
    // VERIFICAÇÃO 4: Página para usuários anônimos apenas
    if (!requireLogin && isLoggedIn) {
      console.log('🔄 Usuário logado tentando acessar página anônima');
      
      // Super admin vai para /super_admin
      if (isSuperAdmin) {
        navigate('/super_admin', { replace: true });
      } else {
        navigate('/anunciante', { replace: true });
      }
      return;
    }
    
    // VERIFICAÇÃO 5: Role específica necessária
    if (requiredRole && isLoggedIn) {
      console.log('🔍 Verificando role específica:', { userRole: user?.role, requiredRole });
      
      // Super admin tentando acessar área inadequada
      if (isSuperAdmin && requiredRole !== 'super_admin') {
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
  }, [isLoggedIn, isLoading, navigate, redirectTo, message, requireLogin, requiredRole, hasRole, user]);

  return { isAuthorized, isLoading };
};
