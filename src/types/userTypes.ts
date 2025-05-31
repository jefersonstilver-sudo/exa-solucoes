
import { Session } from '@supabase/supabase-js';

export type UserRole = 'client' | 'admin' | 'admin_marketing' | 'super_admin' | 'painel';

export interface UserProfile {
  id: string;
  email: string;
  name?: string;
  nome?: string; // Adicionar campo nome
  documento?: string; // Adicionar campo documento
  telefone?: string; // Adicionar campo telefone
  avatar_url?: string;
  role?: UserRole;
  data_criacao?: string;
}

export interface UserSessionState {
  user: UserProfile | null;
  session: Session | null;
  isLoading: boolean;
}

// Definir permissões específicas para cada tipo de usuário
export interface UserPermissions {
  // Gestão principal
  canViewDashboard: boolean;
  canViewOrders: boolean;
  canViewApprovals: boolean;
  
  // Ativos
  canManageBuildings: boolean;
  canManagePanels: boolean;
  
  // Leads & Clientes
  canViewLeads: boolean;
  canViewSindicosInteressados: boolean;
  canViewLeadsProdutora: boolean;
  canViewLeadsCampanhas: boolean;
  
  // Sistema
  canManageUsers: boolean;
  canManageCoupons: boolean;
  canManageHomepageConfig: boolean;
  canManageSystemSettings: boolean;
  
  // Conteúdo
  canManageVideos: boolean;
  canManageNotifications: boolean;
}

// Mapa de permissões por tipo de usuário
export const USER_PERMISSIONS: Record<UserRole, UserPermissions> = {
  super_admin: {
    canViewDashboard: true,
    canViewOrders: true,
    canViewApprovals: true,
    canManageBuildings: true,
    canManagePanels: true,
    canViewLeads: true,
    canViewSindicosInteressados: true,
    canViewLeadsProdutora: true,
    canViewLeadsCampanhas: true,
    canManageUsers: true,
    canManageCoupons: true,
    canManageHomepageConfig: true,
    canManageSystemSettings: true,
    canManageVideos: true,
    canManageNotifications: true,
  },
  admin: {
    canViewDashboard: true,
    canViewOrders: true,
    canViewApprovals: true,
    canManageBuildings: true,
    canManagePanels: true,
    canViewLeads: true,
    canViewSindicosInteressados: true,
    canViewLeadsProdutora: true,
    canViewLeadsCampanhas: true,
    canManageUsers: false, // Apenas super_admin pode criar usuários
    canManageCoupons: true,
    canManageHomepageConfig: false, // Reservado para marketing
    canManageSystemSettings: false, // Apenas super_admin
    canManageVideos: true,
    canManageNotifications: true,
  },
  admin_marketing: {
    canViewDashboard: true,
    canViewOrders: false, // Não tem acesso a pedidos financeiros
    canViewApprovals: true, // Apenas aprovações de conteúdo
    canManageBuildings: false, // Sem acesso a gestão de prédios
    canManagePanels: false, // Sem acesso a gestão de painéis
    canViewLeads: true,
    canViewSindicosInteressados: true,
    canViewLeadsProdutora: true,
    canViewLeadsCampanhas: true,
    canManageUsers: false,
    canManageCoupons: false,
    canManageHomepageConfig: true, // Acesso específico para marketing
    canManageSystemSettings: false,
    canManageVideos: false, // Apenas aprovação, não gestão
    canManageNotifications: true,
  },
  client: {
    canViewDashboard: false,
    canViewOrders: false,
    canViewApprovals: false,
    canManageBuildings: false,
    canManagePanels: false,
    canViewLeads: false,
    canViewSindicosInteressados: false,
    canViewLeadsProdutora: false,
    canViewLeadsCampanhas: false,
    canManageUsers: false,
    canManageCoupons: false,
    canManageHomepageConfig: false,
    canManageSystemSettings: false,
    canManageVideos: false,
    canManageNotifications: false,
  },
  painel: {
    canViewDashboard: false,
    canViewOrders: false,
    canViewApprovals: false,
    canManageBuildings: false,
    canManagePanels: false,
    canViewLeads: false,
    canViewSindicosInteressados: false,
    canViewLeadsProdutora: false,
    canViewLeadsCampanhas: false,
    canManageUsers: false,
    canManageCoupons: false,
    canManageHomepageConfig: false,
    canManageSystemSettings: false,
    canManageVideos: false,
    canManageNotifications: false,
  },
};

// Helper para obter permissões do usuário
export const getUserPermissions = (role?: UserRole): UserPermissions => {
  if (!role) return USER_PERMISSIONS.client;
  return USER_PERMISSIONS[role] || USER_PERMISSIONS.client;
};

// Helper para verificar se usuário tem permissão específica
export const hasPermission = (permission: keyof UserPermissions, role?: UserRole): boolean => {
  const permissions = getUserPermissions(role);
  return permissions[permission];
};
