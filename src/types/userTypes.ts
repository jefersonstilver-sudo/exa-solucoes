
import { Session } from '@supabase/supabase-js';

export type UserRole = 'client' | 'admin' | 'admin_marketing' | 'admin_financeiro' | 'super_admin' | 'painel';

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
  canViewCRM: boolean; // ✅ NOVA: Separado de pedidos
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
  canViewAudit: boolean; // ✅ NOVA: Auditoria
  canViewSecurity: boolean; // ✅ NOVA: Segurança
  
  // Conteúdo
  canManageVideos: boolean;
  canManagePortfolio: boolean;
  canManageNotifications: boolean;
  
  // Financeiro
  canManageProviderBenefits: boolean;
  canViewFinancialReports: boolean;
}

// Permissões customizadas por usuário (sobrescrevem as padrões do role)
export interface UserCustomPermissions extends Partial<UserPermissions> {
  user_id: string;
  custom_permissions: Partial<UserPermissions>;
  updated_at?: string;
  updated_by?: string;
}

// Mapa de permissões por tipo de usuário
export const USER_PERMISSIONS: Record<UserRole, UserPermissions> = {
  super_admin: {
    canViewDashboard: true,
    canViewOrders: true,
    canViewCRM: true,
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
    canViewAudit: true,
    canViewSecurity: true,
    canManageVideos: true,
    canManagePortfolio: true,
    canManageNotifications: true,
    canManageProviderBenefits: true,
    canViewFinancialReports: true,
  },
  admin: {
    canViewDashboard: true,
    canViewOrders: true,
    canViewCRM: true,
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
    canViewAudit: false,
    canViewSecurity: false,
    canManageVideos: true,
    canManagePortfolio: true,
    canManageNotifications: true,
    canManageProviderBenefits: true,
    canViewFinancialReports: true,
  },
  admin_marketing: {
    canViewDashboard: true,
    canViewOrders: false,
    canViewCRM: false, // ❌ Marketing não vê CRM de clientes
    canViewApprovals: true,
    canManageBuildings: false,
    canManagePanels: false,
    canViewLeads: true,
    canViewSindicosInteressados: true,
    canViewLeadsProdutora: true,
    canViewLeadsCampanhas: true,
    canManageUsers: false,
    canManageCoupons: false,
    canManageHomepageConfig: true,
    canManageSystemSettings: false,
    canViewAudit: false,
    canViewSecurity: false,
    canManageVideos: true,
    canManagePortfolio: true,
    canManageNotifications: true,
    canManageProviderBenefits: false,
    canViewFinancialReports: false,
  },
  admin_financeiro: {
    canViewDashboard: true,
    canViewOrders: true,               // ✅ Acesso TOTAL a pedidos
    canViewCRM: false,                 // ❌ Não vê CRM (corrigido)
    canViewApprovals: false,           // ❌ Não precisa aprovar vídeos
    canManageBuildings: false,         // ❌ Não gerencia prédios
    canManagePanels: false,            // ❌ Não gerencia painéis
    canViewLeads: false,               // ❌ Não precisa ver leads
    canViewSindicosInteressados: false,
    canViewLeadsProdutora: false,
    canViewLeadsCampanhas: false,
    canManageUsers: false,             // ❌ Não cria usuários
    canManageCoupons: false,           // ❌ Pode VER mas não CRIAR cupons
    canManageHomepageConfig: false,
    canManageSystemSettings: false,
    canViewAudit: false,
    canViewSecurity: false,
    canManageVideos: false,
    canManagePortfolio: false,
    canManageNotifications: false,
    canManageProviderBenefits: true,   // ✅✅ ACESSO TOTAL a benefícios prestadores
    canViewFinancialReports: true,     // ✅✅ ACESSO a relatórios financeiros
  },
  client: {
    canViewDashboard: false,
    canViewOrders: false,
    canViewCRM: false,
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
    canViewAudit: false,
    canViewSecurity: false,
    canManageVideos: false,
    canManagePortfolio: false,
    canManageNotifications: false,
    canManageProviderBenefits: false,
    canViewFinancialReports: false,
  },
  painel: {
    canViewDashboard: false,
    canViewOrders: false,
    canViewCRM: false,
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
    canViewAudit: false,
    canViewSecurity: false,
    canManageVideos: false,
    canManagePortfolio: false,
    canManageNotifications: false,
    canManageProviderBenefits: false,
    canViewFinancialReports: false,
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
