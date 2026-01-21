import { useMemo } from 'react';
import { useAuth } from '@/hooks/useAuth';
import { useQuery } from '@tanstack/react-query';
import { supabase } from '@/integrations/supabase/client';

// Mapeamento de módulos por departamento
export const DEPARTAMENTO_MODULES: Record<string, string[]> = {
  comercial: ['crm_hub', 'contatos', 'contatos_kanban', 'propostas', 'pedidos', 'juridico', 'vendas', 'posicoes'],
  marketing: ['ticker', 'videos_site', 'editor_videos', 'emails', 'homepage_config', 'logos'],
  financeiro: ['financeiro', 'financeiro_mp', 'relatorios', 'assinaturas', 'cupons'],
  operacao: ['predios', 'paineis', 'agenda', 'beneficios', 'processos', 'aprovacoes', 'sync_notion', 'videos_anunciantes', 'sindicos', 'leads'],
  tecnologia: ['configuracoes', 'seguranca'],
  ia_automacao: ['agentes_sofia'],
  administrativo: ['usuarios', 'tipos_conta', 'notificacoes']
};

// Ícones por departamento
export const DEPARTAMENTO_ICONS: Record<string, string> = {
  administrativo: 'Building',
  comercial: 'TrendingUp',
  marketing: 'Megaphone',
  financeiro: 'DollarSign',
  operacao: 'Cog',
  tecnologia: 'Code',
  ia_automacao: 'Bot'
};

export interface Department {
  id: string;
  name: string;
  color: string;
  icon: string;
  display_order: number;
  is_active: boolean;
}

export const useDepartmentContext = () => {
  const { userProfile, isLoading: authLoading } = useAuth();
  
  // Verificar hierarquia de roles
  const isCEO = userProfile?.role === 'super_admin';
  const isCoord = userProfile?.role === 'admin';
  const isAdminDepartamental = userProfile?.role === 'admin_departamental' || 
    userProfile?.role === 'admin_financeiro' || 
    userProfile?.role === 'admin_marketing' ||
    userProfile?.role === 'comercial';
  
  // CEO e Coordenação podem ver todos os departamentos
  const canSeeAllDepartments = isCEO || isCoord;
  
  // CEO pode ver módulos de Sistema
  const canSeeSystemModules = isCEO;
  
  // CEO e Coordenação podem ver Gestão
  const canSeeGestaoModules = isCEO || isCoord;

  // Buscar departamento do usuário
  const { data: userDepartment, isLoading: departmentLoading } = useQuery({
    queryKey: ['user-department', userProfile?.id],
    queryFn: async () => {
      if (!userProfile?.departamento_id) return null;
      
      const { data, error } = await supabase
        .from('process_departments')
        .select('*')
        .eq('id', userProfile.departamento_id)
        .single();
      
      if (error) {
        console.error('Erro ao buscar departamento:', error);
        return null;
      }
      
      return data as Department;
    },
    enabled: !!userProfile?.departamento_id,
    staleTime: 5 * 60 * 1000,
  });

  // Buscar todos os departamentos ativos (para CEO/Coordenação)
  const { data: allDepartments } = useQuery({
    queryKey: ['all-departments'],
    queryFn: async () => {
      const { data, error } = await supabase
        .from('process_departments')
        .select('*')
        .eq('is_active', true)
        .order('display_order');
      
      if (error) {
        console.error('Erro ao buscar departamentos:', error);
        return [];
      }
      
      return data as Department[];
    },
    enabled: canSeeAllDepartments,
    staleTime: 5 * 60 * 1000,
  });

  // Mapear role antigo para slug de departamento
  const getDepartmentSlugFromRole = (role?: string): string | null => {
    switch (role) {
      case 'admin_financeiro': return 'financeiro';
      case 'admin_marketing': return 'marketing';
      case 'comercial': return 'comercial';
      default: return null;
    }
  };

  // Obter slug do departamento do usuário
  const userDepartmentSlug = useMemo(() => {
    if (userDepartment?.name) {
      return userDepartment.name.toLowerCase()
        .normalize('NFD').replace(/[\u0300-\u036f]/g, '')
        .replace(/[^a-z0-9]+/g, '_')
        .replace(/^_|_$/g, '');
    }
    // Fallback para roles antigos
    return getDepartmentSlugFromRole(userProfile?.role);
  }, [userDepartment, userProfile?.role]);

  // Módulos visíveis para o usuário
  const getVisibleModules = useMemo(() => {
    if (canSeeAllDepartments) {
      // CEO/Coordenação vêem todos os módulos
      return Object.values(DEPARTAMENTO_MODULES).flat();
    }
    
    if (userDepartmentSlug && DEPARTAMENTO_MODULES[userDepartmentSlug]) {
      return DEPARTAMENTO_MODULES[userDepartmentSlug];
    }
    
    return [];
  }, [canSeeAllDepartments, userDepartmentSlug]);

  // Verificar se tem acesso a um módulo específico
  const hasModuleAccess = (moduleKey: string): boolean => {
    if (isCEO) return true;
    if (isCoord) return true; // Coordenação tem acesso a todos os módulos operacionais
    return getVisibleModules.includes(moduleKey);
  };

  // Título do admin baseado no cargo e departamento
  const getAdminTitle = (): string => {
    if (isCEO) return 'CEO / Diretoria';
    if (isCoord) return 'Coordenação';
    if (userDepartment?.name) {
      return `Admin ${userDepartment.name}`;
    }
    // Fallback para roles antigos
    switch (userProfile?.role) {
      case 'admin_financeiro': return 'Admin Financeiro';
      case 'admin_marketing': return 'Admin Marketing';
      case 'comercial': return 'Comercial';
      default: return 'Admin';
    }
  };

  // Cor do badge baseado no cargo
  const getAdminBadgeColor = (): string => {
    if (isCEO) return 'text-amber-400';
    if (isCoord) return 'text-blue-400';
    if (userDepartment?.color) {
      return `text-[${userDepartment.color}]`;
    }
    return 'text-gray-400';
  };

  return {
    // Hierarquia
    isCEO,
    isCoord,
    isAdminDepartamental,
    canSeeAllDepartments,
    canSeeSystemModules,
    canSeeGestaoModules,
    
    // Departamento do usuário
    userDepartment,
    userDepartmentSlug,
    
    // Todos os departamentos (para CEO/Coordenação)
    allDepartments: allDepartments || [],
    
    // Módulos
    getVisibleModules,
    hasModuleAccess,
    
    // UI helpers
    getAdminTitle,
    getAdminBadgeColor,
    
    // Loading state
    isLoading: authLoading || departmentLoading,
  };
};
