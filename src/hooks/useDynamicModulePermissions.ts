import { useQuery } from '@tanstack/react-query';
import { supabase } from '@/integrations/supabase/client';
import { useAuth } from '@/hooks/useAuth';
import { useMemo } from 'react';

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
  gestao_tempo: 'gestao_tempo',
  
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

// Mapeamento módulo → rota + label para uso no UserMenu e redirect
export const MODULE_ROUTES: Record<string, { path: string; label: string }> = {
  dashboard: { path: '/admin', label: 'Dashboard' },
  pedidos: { path: '/admin/pedidos', label: 'Pedidos' },
  propostas: { path: '/admin/propostas', label: 'Propostas' },
  predios: { path: '/admin/predios', label: 'Prédios' },
  paineis: { path: '/admin/paineis-exa', label: 'Painéis' },
  aprovacoes: { path: '/admin/aprovacoes', label: 'Aprovações' },
  contatos: { path: '/admin/contatos', label: 'Contatos' },
  contatos_kanban: { path: '/admin/contatos-kanban', label: 'Kanban' },
  crm_site: { path: '/admin/crm', label: 'CRM Site' },
  crm_chat: { path: '/admin/crm-chat', label: 'CRM Chat' },
  vendas: { path: '/admin/pedidos', label: 'Vendas' },
  juridico: { path: '/admin/juridico', label: 'Jurídico' },
  assinaturas: { path: '/admin/assinaturas', label: 'Assinaturas' },
  posicoes: { path: '/admin/posicoes', label: 'Posições' },
  produtos: { path: '/admin/produtos', label: 'Produtos' },
  cupons: { path: '/admin/cupons', label: 'Cupons' },
  sync_notion: { path: '/admin/sync-notion', label: 'Sync Notion' },
  agenda: { path: '/admin/agenda', label: 'Agenda' },
  videos_anunciantes: { path: '/admin/videos', label: 'Vídeos' },
  beneficios: { path: '/admin/beneficio-prestadores', label: 'Benefícios' },
  sindicos: { path: '/admin/sindicos-interessados', label: 'Síndicos' },
  leads: { path: '/admin/leads-exa', label: 'Leads' },
  processos: { path: '/admin/processos', label: 'Processos' },
  gestao_tempo: { path: '/admin/gestao-tempo', label: 'Gestão de Tempo' },
  emails: { path: '/admin/comunicacoes', label: 'Comunicações' },
  ticker: { path: '/admin/ticker', label: 'Ticker' },
  videos_site: { path: '/admin/videos-site', label: 'Vídeos Site' },
  editor_videos: { path: '/admin/editor-video-controle', label: 'Editor Vídeos' },
  agentes_sofia: { path: '/admin/agentes-sofia', label: 'Agentes Sofia' },
  exa_alerts: { path: '/admin/exa-alerts', label: 'EXA Alerts' },
  escalacoes: { path: '/admin/escalacoes', label: 'Escalações' },
  financeiro: { path: '/admin/financeiro/categorias', label: 'Financeiro' },
  relatorios: { path: '/admin/relatorios-financeiros', label: 'Relatórios' },
  usuarios: { path: '/admin/usuarios', label: 'Usuários' },
  notificacoes: { path: '/admin/notificacoes', label: 'Notificações' },
  seguranca: { path: '/admin/seguranca', label: 'Segurança' },
  configuracoes: { path: '/admin/configuracoes', label: 'Configurações' },
  homepage_config: { path: '/admin/homepage-config', label: 'Homepage' },
  logos: { path: '/admin/logos', label: 'Logos' },
};

interface ModulePermission {
  permission_key: string;
  is_enabled: boolean;
}

export const useDynamicModulePermissions = () => {
  const { userProfile, isLoading: authLoading } = useAuth();
  const roleKey = userProfile?.role;
  const userEmail = userProfile?.email;
  const departamentoId = userProfile?.departamento_id;
  
  // CEO (super_admin) has full access - NO hardcoded email
  const isCEO = roleKey === 'super_admin';
  // Keep isMasterAccount as alias for backward compatibility
  const isMasterAccount = isCEO;

  // Fetch module permissions from role_permissions table
  // Priority: department-specific permissions > generic role permissions
  const { data: modulePermissions, isLoading: permissionsLoading } = useQuery({
    queryKey: ['module-permissions', roleKey, departamentoId],
    queryFn: async () => {
      if (!roleKey) return [];
      
      // If user has a department, try department-specific permissions first
      if (departamentoId) {
        const { data: deptPerms, error: deptError } = await supabase
          .from('role_permissions')
          .select('permission_key, is_enabled')
          .eq('role_key', roleKey)
          .eq('departamento_id', departamentoId);
        
        if (!deptError && deptPerms && deptPerms.length > 0) {
          console.log('✅ [Permissions] Using department-specific permissions:', deptPerms.length);
          return deptPerms as ModulePermission[];
        }
      }
      
      // Fallback: generic role permissions (departamento_id IS NULL)
      const { data, error } = await supabase
        .from('role_permissions')
        .select('permission_key, is_enabled')
        .eq('role_key', roleKey)
        .is('departamento_id', null);
      
      if (error) {
        console.error('Error fetching module permissions:', error);
        return [];
      }
      
      return data as ModulePermission[];
    },
    enabled: !!roleKey && !isCEO,
    staleTime: 5 * 60 * 1000,
  });

  // Create a map of module permissions for quick lookup
  const permissionsMap = useMemo(() => {
    const map: Record<string, boolean> = {};
    
    if (isCEO) {
      // CEO has all permissions enabled
      Object.values(MODULE_KEYS).forEach(key => {
        map[key] = true;
      });
    } else if (modulePermissions) {
      modulePermissions.forEach(p => {
        map[p.permission_key] = p.is_enabled;
      });
    }
    
    return map;
  }, [modulePermissions, isCEO]);

  // Function to check if user has access to a specific module
  const hasModuleAccess = (moduleKey: string): boolean => {
    // CEO always has access
    if (isCEO) return true;
    
    // If still loading, assume no access for security
    if (authLoading || permissionsLoading) return false;
    
    // Check the permissions map
    return permissionsMap[moduleKey] ?? false;
  };

  // Get all enabled modules
  const enabledModules = useMemo(() => {
    if (isCEO) {
      return Object.values(MODULE_KEYS);
    }
    
    return Object.entries(permissionsMap)
      .filter(([_, enabled]) => enabled)
      .map(([key]) => key);
  }, [permissionsMap, isCEO]);

  // Get count of enabled modules
  const enabledModulesCount = enabledModules.length;

  // CRM Access rules:
  // - CEO (super_admin): full access
  // - Comercial: own conversations only (filtered by RLS)
  // - Everyone else: no access
  const hasCRMAccess = isCEO || roleKey === 'comercial';
  const isComercial = roleKey === 'comercial';

  return {
    hasModuleAccess,
    permissionsMap,
    enabledModules,
    enabledModulesCount,
    isMasterAccount,
    isCEO,
    isComercial,
    hasCRMAccess,
    isLoading: authLoading || permissionsLoading,
    roleKey,
    userEmail,
  };
};
