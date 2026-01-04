import { useQuery } from '@tanstack/react-query';
import { supabase } from '@/integrations/supabase/client';
import { useAuth } from '@/hooks/useAuth';
import { useMemo } from 'react';

// Master account email - always has full access
const MASTER_ACCOUNT_EMAIL = 'jefersonstilver@gmail.com';

// Module keys mapping to sidebar items
export const MODULE_KEYS = {
  dashboard: 'dashboard',
  posicoes: 'posicoes',
  sync_notion: 'sync_notion',
  agenda: 'agenda',
  pedidos: 'pedidos',
  produtos: 'produtos',
  propostas: 'propostas',
  juridico: 'juridico',
  assinaturas: 'assinaturas',
  aprovacoes: 'aprovacoes',
  cupons: 'cupons',
  beneficios: 'beneficios',
  contatos: 'contatos',
  crm_site: 'crm_site',
  crm_chat: 'crm_chat',
  escalacoes: 'escalacoes',
  agentes_sofia: 'agentes_sofia',
  exa_alerts: 'exa_alerts',
  predios: 'predios',
  paineis: 'paineis',
  sindicos: 'sindicos',
  leads: 'leads',
  videos_anunciantes: 'videos_anunciantes',
  videos_site: 'videos_site',
  ticker: 'ticker',
  editor_videos: 'editor_videos',
  emails: 'emails',
  usuarios: 'usuarios',
  notificacoes: 'notificacoes',
  relatorios: 'relatorios',
  seguranca: 'seguranca',
  configuracoes: 'configuracoes',
  financeiro_mp: 'financeiro_mp',
  processos: 'processos',
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
