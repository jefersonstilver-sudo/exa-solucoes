import { useMemo } from 'react';
import { useAuth } from '@/hooks/useAuth';

export type FinanceiroPermissionLevel = 'none' | 'view' | 'partial' | 'full';

export interface FinanceiroPermissions {
  level: FinanceiroPermissionLevel;
  canView: boolean;
  canViewCobrancas: boolean;
  canViewRecebimentos: boolean;
  canViewDespesas: boolean;
  canViewImpostos: boolean;
  canViewInadimplencia: boolean;
  canEdit: boolean;
  canCreate: boolean;
  canDelete: boolean;
  canExport: boolean;
}

/**
 * Hook para gerenciar permissões do módulo financeiro
 * 
 * Níveis de acesso:
 * - vendedor: nenhum acesso
 * - marketing: nenhum acesso
 * - gerente: nenhum acesso
 * - admin: acesso parcial (visualização)
 * - financeiro: acesso total
 * - admin_master: acesso total
 * - super_admin: acesso total
 */
export const useFinanceiroPermissions = (): FinanceiroPermissions => {
  const { userProfile } = useAuth();

  return useMemo(() => {
    const role = userProfile?.role || '';

    // Sem acesso: vendedor, marketing, gerente
    if (['vendedor', 'marketing', 'gerente', 'cliente'].includes(role)) {
      return {
        level: 'none',
        canView: false,
        canViewCobrancas: false,
        canViewRecebimentos: false,
        canViewDespesas: false,
        canViewImpostos: false,
        canViewInadimplencia: false,
        canEdit: false,
        canCreate: false,
        canDelete: false,
        canExport: false
      };
    }

    // Acesso parcial: admin (apenas visualização limitada)
    if (role === 'admin') {
      return {
        level: 'partial',
        canView: true,
        canViewCobrancas: true,
        canViewRecebimentos: true,
        canViewDespesas: false, // Admin não vê despesas
        canViewImpostos: false, // Admin não vê impostos
        canViewInadimplencia: true,
        canEdit: false,
        canCreate: false,
        canDelete: false,
        canExport: false
      };
    }

    // Acesso total: financeiro, admin_master, super_admin
    if (['financeiro', 'admin_master', 'super_admin'].includes(role)) {
      return {
        level: 'full',
        canView: true,
        canViewCobrancas: true,
        canViewRecebimentos: true,
        canViewDespesas: true,
        canViewImpostos: true,
        canViewInadimplencia: true,
        canEdit: true,
        canCreate: true,
        canDelete: ['super_admin', 'admin_master'].includes(role),
        canExport: true
      };
    }

    // Default: sem acesso
    return {
      level: 'none',
      canView: false,
      canViewCobrancas: false,
      canViewRecebimentos: false,
      canViewDespesas: false,
      canViewImpostos: false,
      canViewInadimplencia: false,
      canEdit: false,
      canCreate: false,
      canDelete: false,
      canExport: false
    };
  }, [userProfile?.role]);
};
