import { useQuery } from '@tanstack/react-query';
import { supabase } from '@/integrations/supabase/client';
import { useAuth } from '@/hooks/useAuth';
import { useMemo } from 'react';

// Master account email - always has full access
const MASTER_ACCOUNT_EMAIL = 'jefersonstilver@gmail.com';

// Module keys mapping to sidebar items
// AUDITORIA COMPLETA: Todos os módulos do sistema mapeados
export const MODULE_KEYS = {
  // === MINHA MANHÃ ===
  minha_manha: 'minha_manha',
  dashboard: 'dashboard',
  exa_alerts: 'exa_alerts',
  escalacoes: 'escalacoes',
  
  // === RELACIONAMENTO / CRM ===
  crm_hub: 'crm_hub',
  contatos: 'contatos',
  contatos_kanban: 'contatos_kanban',
  crm_site: 'crm_site',
  crm_chat: 'crm_chat',
  
  // === VENDAS ===
  vendas: 'vendas',
  propostas: 'propostas',
  pedidos: 'pedidos',
  juridico: 'juridico',
  assinaturas: 'assinaturas',
  posicoes: 'posicoes',
  produtos: 'produtos',
  cupons: 'cupons',
  
  // === OPERAÇÃO ===
  predios: 'predios',
  paineis: 'paineis',
  sync_notion: 'sync_notion',
  agenda: 'agenda',
  videos_anunciantes: 'videos_anunciantes',
  aprovacoes: 'aprovacoes',
  beneficios: 'beneficios',
  sindicos: 'sindicos',
  leads: 'leads',
  processos: 'processos',
  
  // === COMUNICAÇÃO ===
  emails: 'emails',
  ticker: 'ticker',
  videos_site: 'videos_site',
  editor_videos: 'editor_videos',
  agentes_sofia: 'agentes_sofia',
  homepage_config: 'homepage_config',
  logos: 'logos',
  
  // === GOVERNANÇA ===
  financeiro: 'financeiro',
  financeiro_mp: 'financeiro_mp',
  relatorios: 'relatorios',
  usuarios: 'usuarios',
  tipos_conta: 'tipos_conta',
  notificacoes: 'notificacoes',
  seguranca: 'seguranca',
  configuracoes: 'configuracoes',
} as const;

export type ModuleKey = keyof typeof MODULE_KEYS;

interface ModulePermission {
  permission_key: string;
  is_enabled: boolean;
}

export const useDynamicModulePermissions = () => {
  const { userProfile, isLoading: authLoading } = useAuth();
  const roleKey = userProfile?.role;
  const userEmail = userProfile?.email;
  
  // Check if this is the master account
  const isMasterAccount = userEmail?.toLowerCase() === MASTER_ACCOUNT_EMAIL.toLowerCase();

  // Fetch module permissions from role_permissions table
  const { data: modulePermissions, isLoading: permissionsLoading } = useQuery({
    queryKey: ['module-permissions', roleKey],
    queryFn: async () => {
      if (!roleKey) return [];
      
      const { data, error } = await supabase
        .from('role_permissions')
        .select('permission_key, is_enabled')
        .eq('role_key', roleKey);
      
      if (error) {
        console.error('Error fetching module permissions:', error);
        return [];
      }
      
      return data as ModulePermission[];
    },
    enabled: !!roleKey && !isMasterAccount,
    staleTime: 5 * 60 * 1000, // 5 minutes
  });

  // Create a map of module permissions for quick lookup
  const permissionsMap = useMemo(() => {
    const map: Record<string, boolean> = {};
    
    if (isMasterAccount) {
      // Master account has all permissions enabled
      Object.values(MODULE_KEYS).forEach(key => {
        map[key] = true;
      });
    } else if (modulePermissions) {
      modulePermissions.forEach(p => {
        map[p.permission_key] = p.is_enabled;
      });
    }
    
    return map;
  }, [modulePermissions, isMasterAccount]);

  // Function to check if user has access to a specific module
  const hasModuleAccess = (moduleKey: string): boolean => {
    // Master account always has access
    if (isMasterAccount) return true;
    
    // If still loading, assume no access for security
    if (authLoading || permissionsLoading) return false;
    
    // Check the permissions map
    return permissionsMap[moduleKey] ?? false;
  };

  // Get all enabled modules
  const enabledModules = useMemo(() => {
    if (isMasterAccount) {
      return Object.values(MODULE_KEYS);
    }
    
    return Object.entries(permissionsMap)
      .filter(([_, enabled]) => enabled)
      .map(([key]) => key);
  }, [permissionsMap, isMasterAccount]);

  // Get count of enabled modules
  const enabledModulesCount = enabledModules.length;

  return {
    hasModuleAccess,
    permissionsMap,
    enabledModules,
    enabledModulesCount,
    isMasterAccount,
    isLoading: authLoading || permissionsLoading,
    roleKey,
    userEmail,
  };
};
