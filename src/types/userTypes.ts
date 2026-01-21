import { Session } from '@supabase/supabase-js';

// === ROLES DO SISTEMA ===
// Hierarquia principal (3 níveis):
// - super_admin: CEO/Diretoria - acesso total
// - admin: Coordenação - acesso operacional completo
// - admin_departamental: Acesso restrito ao próprio departamento
// 
// Roles legados (mantidos para compatibilidade):
// - admin_financeiro, admin_marketing, comercial → migrar para admin_departamental + departamento_id
// - client, painel → mantidos para compatibilidade, mas não são usuários internos

export type UserRole = 
  | 'super_admin' 
  | 'admin' 
  | 'admin_departamental' 
  | 'admin_financeiro' 
  | 'admin_marketing' 
  | 'comercial'
  | 'client'  // Legado - manter para compatibilidade
  | 'painel'; // Legado - manter para compatibilidade

export interface UserDepartment {
  id: string;
  name: string;
  color: string;
  icon: string;
  display_order: number;
}

export interface UserProfile {
  id: string;
  email: string;
  name?: string;
  nome?: string;
  documento?: string;
  telefone?: string;
  avatar_url?: string;
  role?: UserRole;
  departamento_id?: string; // NOVO: Link obrigatório com departamento
  departamento?: UserDepartment; // NOVO: Dados do departamento
  data_criacao?: string;
  email_verified_at?: string;
  terms_accepted_at?: string;
  privacy_accepted_at?: string;
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
  canViewCRM: boolean;
  canViewApprovals: boolean;
  
  // Ativos
  canManageBuildings: boolean;
  canDeleteBuildings: boolean;
  canManagePanels: boolean;
  
  // Leads & Clientes
  canViewLeads: boolean;
  canViewSindicosInteressados: boolean;
  canViewLeadsProdutora: boolean;
  canViewLeadsCampanhas: boolean;
  canViewLeadsLinkae: boolean;
  canViewLeadsExa: boolean;
  
  // Sistema
  canManageUsers: boolean;
  canManageCoupons: boolean;
  canManageHomepageConfig: boolean;
  canManageSystemSettings: boolean;
  canViewAudit: boolean;
  canViewSecurity: boolean;
  
  // Conteúdo
  canManageVideos: boolean;
  canManagePortfolio: boolean;
  canManageNotifications: boolean;
  canManageEmails: boolean;
  
  // Financeiro
  canManageProviderBenefits: boolean;
  canViewFinancialReports: boolean;
}

// Permissões customizadas por usuário
export interface UserCustomPermissions {
  user_id?: string;
  can_view_dashboard?: boolean;
  can_view_orders?: boolean;
  can_view_crm?: boolean;
  can_view_approvals?: boolean;
  can_view_leads?: boolean;
  can_manage_users?: boolean;
  can_manage_coupons?: boolean;
  can_view_audit?: boolean;
  can_manage_videos?: boolean;
  can_manage_portfolio?: boolean;
  can_manage_provider_benefits?: boolean;
  can_view_financial_reports?: boolean;
  created_at?: string;
  updated_at?: string;
}

// === PERMISSÕES POR ROLE ===
// CEO (super_admin): Acesso TOTAL
// Coordenação (admin): Acesso operacional (sem sistema)
// Admin Departamental: Acesso apenas ao próprio departamento

export const USER_PERMISSIONS: Record<UserRole, UserPermissions> = {
  super_admin: {
    canViewDashboard: true,
    canViewOrders: true,
    canViewCRM: true,
    canViewApprovals: true,
    canManageBuildings: true,
    canDeleteBuildings: true,
    canManagePanels: true,
    canViewLeads: true,
    canViewSindicosInteressados: true,
    canViewLeadsProdutora: true,
    canViewLeadsCampanhas: true,
    canViewLeadsLinkae: true,
    canViewLeadsExa: true,
    canManageUsers: true,
    canManageCoupons: true,
    canManageHomepageConfig: true,
    canManageSystemSettings: true,
    canViewAudit: true,
    canViewSecurity: true,
    canManageVideos: true,
    canManagePortfolio: true,
    canManageNotifications: true,
    canManageEmails: true,
    canManageProviderBenefits: true,
    canViewFinancialReports: true,
  },
  admin: {
    // COORDENAÇÃO: Acesso operacional completo, sem configurações de sistema
    canViewDashboard: true,
    canViewOrders: true,
    canViewCRM: true,
    canViewApprovals: true,
    canManageBuildings: true,
    canDeleteBuildings: false, // Apenas CEO pode deletar
    canManagePanels: true,
    canViewLeads: true,
    canViewSindicosInteressados: true,
    canViewLeadsProdutora: true,
    canViewLeadsCampanhas: true,
    canViewLeadsLinkae: true,
    canViewLeadsExa: true,
    canManageUsers: false, // Apenas CEO
    canManageCoupons: true,
    canManageHomepageConfig: true,
    canManageSystemSettings: false, // Apenas CEO
    canViewAudit: false, // Apenas CEO
    canViewSecurity: false, // Apenas CEO
    canManageVideos: true,
    canManagePortfolio: true,
    canManageNotifications: true,
    canManageEmails: true,
    canManageProviderBenefits: true,
    canViewFinancialReports: true,
  },
  admin_departamental: {
    // ADMIN DEPARTAMENTAL: Permissões base (complementadas pelo departamento)
    canViewDashboard: true,
    canViewOrders: false,
    canViewCRM: false,
    canViewApprovals: false,
    canManageBuildings: false,
    canDeleteBuildings: false,
    canManagePanels: false,
    canViewLeads: false,
    canViewSindicosInteressados: false,
    canViewLeadsProdutora: false,
    canViewLeadsCampanhas: false,
    canViewLeadsLinkae: false,
    canViewLeadsExa: false,
    canManageUsers: false,
    canManageCoupons: false,
    canManageHomepageConfig: false,
    canManageSystemSettings: false,
    canViewAudit: false,
    canViewSecurity: false,
    canManageVideos: false,
    canManagePortfolio: false,
    canManageNotifications: false,
    canManageEmails: false,
    canManageProviderBenefits: false,
    canViewFinancialReports: false,
  },
  // === ROLES LEGADOS (para compatibilidade) ===
  admin_financeiro: {
    canViewDashboard: true,
    canViewOrders: true,
    canViewCRM: false,
    canViewApprovals: false,
    canManageBuildings: false,
    canDeleteBuildings: false,
    canManagePanels: false,
    canViewLeads: false,
    canViewSindicosInteressados: false,
    canViewLeadsProdutora: false,
    canViewLeadsCampanhas: false,
    canViewLeadsLinkae: false,
    canViewLeadsExa: false,
    canManageUsers: false,
    canManageCoupons: false,
    canManageHomepageConfig: false,
    canManageSystemSettings: false,
    canViewAudit: false,
    canViewSecurity: false,
    canManageVideos: false,
    canManagePortfolio: false,
    canManageNotifications: false,
    canManageEmails: false,
    canManageProviderBenefits: true,
    canViewFinancialReports: true,
  },
  admin_marketing: {
    canViewDashboard: true,
    canViewOrders: false,
    canViewCRM: false,
    canViewApprovals: true,
    canManageBuildings: false,
    canDeleteBuildings: false,
    canManagePanels: false,
    canViewLeads: true,
    canViewSindicosInteressados: true,
    canViewLeadsProdutora: true,
    canViewLeadsCampanhas: true,
    canViewLeadsLinkae: true,
    canViewLeadsExa: true,
    canManageUsers: false,
    canManageCoupons: false,
    canManageHomepageConfig: true,
    canManageSystemSettings: false,
    canViewAudit: false,
    canViewSecurity: false,
    canManageVideos: true,
    canManagePortfolio: true,
    canManageNotifications: true,
    canManageEmails: true,
    canManageProviderBenefits: false,
    canViewFinancialReports: false,
  },
  // === ROLES LEGADOS (para compatibilidade) ===
  client: {
    canViewDashboard: false,
    canViewOrders: false,
    canViewCRM: false,
    canViewApprovals: false,
    canManageBuildings: false,
    canDeleteBuildings: false,
    canManagePanels: false,
    canViewLeads: false,
    canViewSindicosInteressados: false,
    canViewLeadsProdutora: false,
    canViewLeadsCampanhas: false,
    canViewLeadsLinkae: false,
    canViewLeadsExa: false,
    canManageUsers: false,
    canManageCoupons: false,
    canManageHomepageConfig: false,
    canManageSystemSettings: false,
    canViewAudit: false,
    canViewSecurity: false,
    canManageVideos: false,
    canManagePortfolio: false,
    canManageNotifications: false,
    canManageEmails: false,
    canManageProviderBenefits: false,
    canViewFinancialReports: false,
  },
  painel: {
    canViewDashboard: false,
    canViewOrders: false,
    canViewCRM: false,
    canViewApprovals: false,
    canManageBuildings: false,
    canDeleteBuildings: false,
    canManagePanels: false,
    canViewLeads: false,
    canViewSindicosInteressados: false,
    canViewLeadsProdutora: false,
    canViewLeadsCampanhas: false,
    canViewLeadsLinkae: false,
    canViewLeadsExa: false,
    canManageUsers: false,
    canManageCoupons: false,
    canManageHomepageConfig: false,
    canManageSystemSettings: false,
    canViewAudit: false,
    canViewSecurity: false,
    canManageVideos: false,
    canManagePortfolio: false,
    canManageNotifications: false,
    canManageEmails: false,
    canManageProviderBenefits: false,
    canViewFinancialReports: false,
  },
  comercial: {
    canViewDashboard: false,
    canViewOrders: true,
    canViewCRM: true,
    canViewApprovals: false,
    canManageBuildings: false,
    canDeleteBuildings: false,
    canManagePanels: false,
    canViewLeads: true,
    canViewSindicosInteressados: false,
    canViewLeadsProdutora: false,
    canViewLeadsCampanhas: false,
    canViewLeadsLinkae: false,
    canViewLeadsExa: true,
    canManageUsers: false,
    canManageCoupons: false,
    canManageHomepageConfig: false,
    canManageSystemSettings: false,
    canViewAudit: false,
    canViewSecurity: false,
    canManageVideos: false,
    canManagePortfolio: false,
    canManageNotifications: false,
    canManageEmails: false,
    canManageProviderBenefits: false,
    canViewFinancialReports: false,
  },
};

// Helper para obter permissões do usuário
export const getUserPermissions = (role?: UserRole): UserPermissions => {
  if (!role) return USER_PERMISSIONS.admin_departamental;
  return USER_PERMISSIONS[role] || USER_PERMISSIONS.admin_departamental;
};

// Helper para verificar se usuário tem permissão específica
export const hasPermission = (permission: keyof UserPermissions, role?: UserRole): boolean => {
  const permissions = getUserPermissions(role);
  return permissions[permission];
};

// Helper para verificar nível hierárquico
export const getRoleLevel = (role?: UserRole): number => {
  switch (role) {
    case 'super_admin': return 1; // CEO - mais alto
    case 'admin': return 2; // Coordenação
    default: return 3; // Admin Departamental - mais baixo
  }
};

// Helper para verificar se um role pode gerenciar outro
export const canManageRole = (managerRole?: UserRole, targetRole?: UserRole): boolean => {
  return getRoleLevel(managerRole) < getRoleLevel(targetRole);
};
