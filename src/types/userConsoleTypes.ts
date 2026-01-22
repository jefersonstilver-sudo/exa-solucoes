/**
 * Tipos do Console Administrativo de Usuário - Enterprise
 * Arquitetura de 3 níveis hierárquicos + 7 departamentos
 */

import { UserRole } from './userTypes';

// === DADOS DO USUÁRIO NO CONSOLE ===
export interface ConsoleUser {
  id: string;
  email: string;
  nome?: string;
  telefone?: string;
  role: UserRole;
  departamento_id?: string;
  cc_emails?: string[];
  data_criacao: string;
  email_confirmed_at?: string;
  last_sign_in_at?: string;
  last_access_at?: string;
  is_blocked?: boolean;
  blocked_at?: string;
  blocked_by?: string;
  blocked_reason?: string;
  raw_user_meta_data?: Record<string, unknown>;
}

// === DEPARTAMENTO ===
export interface ConsoleDepartment {
  id: string;
  name: string;
  color: string;
  icon: string;
  display_order: number;
  is_active: boolean;
}

// === NÍVEIS HIERÁRQUICOS (apenas 3) ===
export type HierarchyLevel = 'super_admin' | 'admin' | 'admin_departamental';

export interface HierarchyOption {
  value: HierarchyLevel;
  label: string;
  description: string;
  icon: string;
  color: string;
}

export const HIERARCHY_OPTIONS: HierarchyOption[] = [
  {
    value: 'super_admin',
    label: 'CEO / Diretoria',
    description: 'Acesso total ao sistema',
    icon: 'Crown',
    color: 'purple'
  },
  {
    value: 'admin',
    label: 'Coordenação',
    description: 'Acesso operacional completo',
    icon: 'Shield',
    color: 'blue'
  },
  {
    value: 'admin_departamental',
    label: 'Admin Departamental',
    description: 'Acesso restrito ao departamento',
    icon: 'Building2',
    color: 'gray'
  }
];

// === PREVIEW DE IMPACTO ===
export interface ImpactChange {
  type: 'gain' | 'lose' | 'keep';
  module: string;
  label: string;
}

export interface AccessImpact {
  from: {
    role: string;
    roleLabel: string;
    departamento?: string;
    departamentoLabel?: string;
  };
  to: {
    role: string;
    roleLabel: string;
    departamento?: string;
    departamentoLabel?: string;
  };
  changes: ImpactChange[];
  crmAccess: {
    before: string;
    after: string;
  };
  warnings: string[];
}

// === ITEM DE AUDITORIA ===
export interface AuditEntry {
  id: string;
  type: 'role_change' | 'department_change' | 'login' | 'logout' | 'permission' | 'profile' | 'action' | 'blocked' | 'unblocked';
  title: string;
  description: string;
  timestamp: string;
  performedBy?: string;
  performedByEmail?: string;
  metadata?: Record<string, unknown>;
  ip?: string;
}

// === ESTADO DO CONSOLE ===
export interface UserConsoleState {
  // Dados
  user: ConsoleUser | null;
  departments: ConsoleDepartment[];
  auditEntries: AuditEntry[];
  
  // Estado de edição
  selectedRole: HierarchyLevel;
  selectedDepartamento: string | null;
  pendingChanges: boolean;
  
  // Estado de carregamento
  isLoading: boolean;
  isSaving: boolean;
  
  // Permissões do operador
  canEditRole: boolean;
  canEditDepartment: boolean;
  canBlock: boolean;
  canDelete: boolean;
  
  // Validação
  errors: {
    departmentRequired?: boolean;
    selfRoleChange?: boolean;
    ceoDowngrade?: boolean;
  };
}

// === PROPS DOS COMPONENTES ===
export interface UserConsoleDialogProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  user: ConsoleUser | null;
  onUserUpdated: () => void;
}

export interface IdentityTabProps {
  user: ConsoleUser;
  onSave: (data: { nome: string; telefone: string; ccEmails: string[] }) => Promise<void>;
  onResendEmail: () => Promise<void>;
  isSaving: boolean;
}

export interface AccessTabProps {
  user: ConsoleUser;
  departments: ConsoleDepartment[];
  selectedRole: HierarchyLevel;
  selectedDepartamento: string | null;
  onRoleChange: (role: HierarchyLevel) => void;
  onDepartamentoChange: (deptId: string) => void;
  onSave: () => Promise<void>;
  canEdit: boolean;
  isSaving: boolean;
  errors: UserConsoleState['errors'];
  impact: AccessImpact | null;
}

export interface ScopeTabProps {
  user: ConsoleUser;
  selectedRole: HierarchyLevel;
  selectedDepartamento: string | null;
  departments: ConsoleDepartment[];
}

export interface AuditTabProps {
  userId: string;
  entries: AuditEntry[];
  isLoading: boolean;
  onRefresh: () => void;
}

export interface ImpactPreviewProps {
  impact: AccessImpact;
  onConfirm: () => void;
  onCancel: () => void;
  isLoading: boolean;
}

// === CONSTANTES ===
export const CEO_EMAIL = 'jefersonstilver@gmail.com';

// === HELPERS ===
export const getHierarchyLabel = (role: string): string => {
  const option = HIERARCHY_OPTIONS.find(h => h.value === role);
  return option?.label || 'Desconhecido';
};

export const isValidHierarchy = (role: string): role is HierarchyLevel => {
  return ['super_admin', 'admin', 'admin_departamental'].includes(role);
};

export const mapLegacyRole = (role: string): HierarchyLevel => {
  switch (role) {
    case 'super_admin':
      return 'super_admin';
    case 'admin':
      return 'admin';
    case 'admin_financeiro':
    case 'admin_marketing':
    case 'comercial':
    case 'client':
    case 'painel':
    default:
      return 'admin_departamental';
  }
};
