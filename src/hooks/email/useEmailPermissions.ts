import { useMemo } from 'react';
import { useAuth } from '@/hooks/useAuth';
import { EmailPermissions, EmailAccessLevel, EmailCategoria } from '@/types/email';

/**
 * Hook para gerenciar permissões de e-mail baseado na hierarquia
 * 
 * Hierarquia:
 * - Vendedor: Apenas seus e-mails
 * - Gerente: Seus + vendedores abaixo
 * - Admin: Área inteira
 * - Admin Master / Super Admin: Todos
 * - Financeiro: Apenas e-mails financeiros
 * - Marketing: Apenas e-mails de campanha
 */
export const useEmailPermissions = (): EmailPermissions => {
  const { userProfile } = useAuth();
  
  const permissions = useMemo((): EmailPermissions => {
    const role = userProfile?.role || 'client';
    const email = userProfile?.email || '';
    
    // Admin Master tem acesso total
    const isMasterAdmin = email === 'admin@examidia.com.br';
    
    if (isMasterAdmin || role === 'super_admin') {
      return {
        accessLevel: 'all',
        canSend: true,
        canDelete: true,
        canArchive: true,
        canViewAttachments: true,
        allowedCategorias: ['comercial', 'financeiro', 'marketing', 'suporte', 'geral']
      };
    }
    
    switch (role) {
      case 'admin':
        return {
          accessLevel: 'area',
          canSend: true,
          canDelete: true,
          canArchive: true,
          canViewAttachments: true,
          allowedCategorias: ['comercial', 'financeiro', 'marketing', 'suporte', 'geral']
        };
        
      case 'admin_financeiro':
        return {
          accessLevel: 'area',
          canSend: true,
          canDelete: false,
          canArchive: true,
          canViewAttachments: true,
          allowedCategorias: ['financeiro']
        };
        
      case 'admin_marketing':
        return {
          accessLevel: 'area',
          canSend: true,
          canDelete: false,
          canArchive: true,
          canViewAttachments: true,
          allowedCategorias: ['marketing']
        };
        
      default:
        return {
          accessLevel: 'none',
          canSend: false,
          canDelete: false,
          canArchive: false,
          canViewAttachments: false,
          allowedCategorias: []
        };
    }
  }, [userProfile]);
  
  return permissions;
};

/**
 * Hook para verificar se usuário pode ver um e-mail específico
 */
export const useCanViewEmail = (emailUserId: string | null, emailCategoria: EmailCategoria | null) => {
  const { userProfile } = useAuth();
  const permissions = useEmailPermissions();
  
  return useMemo(() => {
    if (permissions.accessLevel === 'none') return false;
    if (permissions.accessLevel === 'all') return true;
    
    // Verificar categoria
    if (emailCategoria && !permissions.allowedCategorias.includes(emailCategoria)) {
      return false;
    }
    
    // Verificar propriedade
    if (permissions.accessLevel === 'own') {
      return emailUserId === userProfile?.id;
    }
    
    // Team e Area precisam de lógica adicional de hierarquia
    // Por agora, permitir se tiver acesso à categoria
    return true;
  }, [permissions, emailUserId, emailCategoria, userProfile]);
};
