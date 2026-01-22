/**
 * Hook centralizado do Console Administrativo de Usuário
 * 
 * ARQUITETURA:
 * 1. SEÇÃO DE ESTADO - Estado principal do console
 * 2. SEÇÃO DE QUERIES - Busca de dados (departamentos, auditoria)
 * 3. SEÇÃO DE PERMISSÕES - O que o operador pode fazer
 * 4. SEÇÃO DE VALIDAÇÕES - Regras de negócio que bloqueiam ações
 * 5. SEÇÃO DE IMPACTO - Cálculo de consequências antes de salvar
 * 6. SEÇÃO DE OPERAÇÕES - Ações que modificam dados
 * 
 * REGRAS DE NEGÓCIO:
 * - Admin departamental SEM departamento = INVÁLIDO
 * - Ninguém altera o próprio cargo
 * - CEO nunca pode ser rebaixado (email dinâmico da config)
 * - Toda mudança gera log de auditoria
 */

import { useState, useEffect, useMemo, useCallback } from 'react';
import { useQuery } from '@tanstack/react-query';
import { supabase } from '@/integrations/supabase/client';
import { useAuth } from './useAuth';
import { toast } from 'sonner';
import {
  ConsoleUser,
  ConsoleDepartment,
  AuditEntry,
  HierarchyLevel,
  AccessImpact,
  ImpactChange,
  UserConsoleState,
  getHierarchyLabel,
  mapLegacyRole,
  HIERARCHY_OPTIONS
} from '@/types/userConsoleTypes';

// ============================================================================
// TIPOS E INTERFACES
// ============================================================================

interface UseUserConsoleProps {
  user: ConsoleUser | null;
  open: boolean;
  onUserUpdated: () => void;
}

interface OperatorPermissions {
  /** Operador pode alterar o cargo deste usuário */
  canEditRole: boolean;
  /** Operador pode alterar o departamento */
  canEditDepartment: boolean;
  /** Operador pode bloquear/desbloquear */
  canBlock: boolean;
  /** Operador pode excluir a conta */
  canDelete: boolean;
  /** Operador pode resetar senha */
  canResetPassword: boolean;
  /** Operador é super_admin */
  isSuperAdmin: boolean;
  /** Operador é admin ou super_admin */
  isAdmin: boolean;
  /** Usuário alvo é o CEO protegido */
  isTargetCEO: boolean;
  /** Operador está editando a si mesmo */
  isSelf: boolean;
}

interface ValidationErrors {
  /** Admin departamental precisa de departamento */
  departmentRequired?: boolean;
  /** Usuário tentando alterar próprio cargo */
  selfRoleChange?: boolean;
  /** Tentativa de rebaixar o CEO */
  ceoDowngrade?: boolean;
  /** Tentativa de promoção a CEO sem permissão */
  unauthorizedPromotion?: boolean;
}

// ============================================================================
// HOOK PRINCIPAL
// ============================================================================

export const useUserConsole = ({ user, open, onUserUpdated }: UseUserConsoleProps) => {
  const { userProfile, refreshUserProfile } = useAuth();
  
  // ==========================================================================
  // SEÇÃO 1: ESTADO PRINCIPAL
  // ==========================================================================
  
  const [selectedRole, setSelectedRole] = useState<HierarchyLevel>('admin_departamental');
  const [selectedDepartamento, setSelectedDepartamento] = useState<string | null>(null);
  const [isSaving, setIsSaving] = useState(false);
  const [pendingChanges, setPendingChanges] = useState(false);
  
  // Estado de edição de identidade
  const [editData, setEditData] = useState({
    nome: '',
    telefone: '',
    ccEmails: [] as string[]
  });

  // ==========================================================================
  // SEÇÃO 2: QUERIES - Busca de dados externos
  // ==========================================================================

  // Lista fixa dos 5 departamentos para organização de usuários (Governança EXA)
  const DEPARTAMENTOS_USUARIOS = [
    'Administrativo',
    'Comercial',
    'Marketing',
    'Financeiro',
    'Tecnologia'
  ];

  // Query: Departamentos ativos (filtrado pelos 5 organizacionais)
  const { data: departments = [], isLoading: loadingDepartments } = useQuery({
    queryKey: ['console-departments'],
    queryFn: async () => {
      const { data, error } = await supabase
        .from('process_departments')
        .select('id, name, color, icon, display_order, is_active')
        .eq('is_active', true)
        .in('name', DEPARTAMENTOS_USUARIOS)
        .order('display_order');
      
      if (error) throw error;
      return (data || []) as ConsoleDepartment[];
    },
    enabled: open
  });

  // Query: Entradas de auditoria unificadas
  const { 
    data: auditEntries = [], 
    isLoading: loadingAudit,
    refetch: refetchAudit 
  } = useQuery({
    queryKey: ['console-audit', user?.id],
    queryFn: async () => fetchAuditEntries(user?.id),
    enabled: open && !!user?.id
  });

  // ==========================================================================
  // SEÇÃO 3: PERMISSÕES - O que o operador pode fazer
  // ==========================================================================
  
  const permissions = useMemo((): OperatorPermissions => {
    const isSuperAdmin = userProfile?.role === 'super_admin';
    const isAdmin = userProfile?.role === 'admin' || isSuperAdmin;
    // CEO é identificado por role, não por email
    const isTargetCEO = user?.role === 'super_admin';
    const isSelf = user?.id === userProfile?.id;
    
    return {
      // Regras de edição - Apenas super_admin pode alterar cargo e departamento
      canEditRole: isSuperAdmin && !isSelf,
      canEditDepartment: isSuperAdmin && !isSelf,
      
      // Regras de ações críticas
      canBlock: isSuperAdmin && !isTargetCEO && !isSelf,
      canDelete: isSuperAdmin && !isTargetCEO && !isSelf,
      canResetPassword: isAdmin && !isSelf,
      
      // Flags de contexto
      isSuperAdmin,
      isAdmin,
      isTargetCEO,
      isSelf
    };
  }, [userProfile, user]);

  // ==========================================================================
  // SEÇÃO 4: VALIDAÇÕES - Regras de negócio que bloqueiam ações
  // ==========================================================================
  
  const errors = useMemo((): ValidationErrors => {
    const result: ValidationErrors = {};
    
    // REGRA 1: Admin departamental PRECISA de departamento
    if (selectedRole === 'admin_departamental' && !selectedDepartamento) {
      result.departmentRequired = true;
    }
    
    // REGRA 2: Ninguém altera o próprio cargo
    if (permissions.isSelf && selectedRole !== mapLegacyRole(user?.role || '')) {
      result.selfRoleChange = true;
    }
    
    // REGRA 3: CEO nunca pode ser rebaixado
    if (permissions.isTargetCEO && selectedRole !== 'super_admin') {
      result.ceoDowngrade = true;
    }
    
    // REGRA 4: Apenas super_admin pode promover para CEO
    if (selectedRole === 'super_admin' && 
        mapLegacyRole(user?.role || '') !== 'super_admin' && 
        !permissions.isSuperAdmin) {
      result.unauthorizedPromotion = true;
    }
    
    return result;
  }, [selectedRole, selectedDepartamento, permissions, user]);

  /** Verifica se há algum erro de validação */
  const hasValidationErrors = useMemo(() => {
    return Object.values(errors).some(Boolean);
  }, [errors]);

  // ==========================================================================
  // SEÇÃO 5: CÁLCULO DE IMPACTO - Consequências das mudanças
  // ==========================================================================
  
  const impact = useMemo((): AccessImpact | null => {
    if (!user || !pendingChanges) return null;
    
    return calculateAccessImpact({
      user,
      currentRole: mapLegacyRole(user.role),
      newRole: selectedRole,
      currentDeptId: user.departamento_id,
      newDeptId: selectedDepartamento,
      departments,
      isTargetCEO: permissions.isTargetCEO
    });
  }, [user, pendingChanges, selectedRole, selectedDepartamento, departments, permissions.isTargetCEO]);

  // ==========================================================================
  // SEÇÃO 6: EFEITOS - Sincronização de estado
  // ==========================================================================
  
  // Resetar estado quando o usuário muda
  useEffect(() => {
    if (user && open) {
      const mappedRole = mapLegacyRole(user.role);
      setSelectedRole(mappedRole);
      setSelectedDepartamento(user.departamento_id || null);
      setEditData({
        nome: user.nome || (user.raw_user_meta_data?.name as string) || '',
        telefone: user.telefone || (user.raw_user_meta_data?.telefone as string) || '',
        ccEmails: user.cc_emails || []
      });
      setPendingChanges(false);
    }
  }, [user, open]);

  // Detectar mudanças pendentes
  useEffect(() => {
    if (!user) return;
    
    const roleChanged = mapLegacyRole(user.role) !== selectedRole;
    const deptChanged = user.departamento_id !== selectedDepartamento;
    
    setPendingChanges(roleChanged || deptChanged);
  }, [user, selectedRole, selectedDepartamento]);

  // ==========================================================================
  // SEÇÃO 7: OPERAÇÕES - Ações que modificam dados
  // ==========================================================================
  
  /** Altera o cargo selecionado (UI decide bloqueios via errors) */
  const handleRoleChange = useCallback((newRole: HierarchyLevel) => {
    setSelectedRole(newRole);
  }, []);

  /** Altera o departamento selecionado */
  const handleDepartamentoChange = useCallback((deptId: string) => {
    setSelectedDepartamento(deptId);
  }, []);

  /** Salva alterações de acesso (role + departamento) */
  const saveAccessChanges = useCallback(async () => {
    if (!user || !pendingChanges) return;
    
    // Bloquear se houver erros de validação
    if (hasValidationErrors) {
      toast.error('Validação falhou', {
        description: 'Corrija os erros antes de salvar'
      });
      return;
    }
    
    try {
      setIsSaving(true);
      
      const updates: Record<string, unknown> = {};
      const oldRole = user.role;
      
      // Determinar o que mudou
      if (selectedRole !== mapLegacyRole(user.role)) {
        updates.role = selectedRole;
      }
      
      if (selectedDepartamento !== user.departamento_id) {
        updates.departamento_id = selectedDepartamento;
      }
      
      if (Object.keys(updates).length === 0) {
        toast.info('Nenhuma alteração');
        return;
      }
      
      // 1. Atualizar tabela users
      const { error: updateError } = await supabase
        .from('users')
        .update(updates as any)
        .eq('id', user.id);
      
      if (updateError) throw updateError;
      
      // 2. Se role mudou, atualizar também user_roles
      if (updates.role) {
        await supabase
          .from('user_roles')
          .update({ role: updates.role as any })
          .eq('user_id', user.id);
        
        // 3. Log de auditoria de role
        await supabase.from('role_change_audit').insert([{
          user_id: user.id,
          old_role: oldRole as any,
          new_role: selectedRole as any,
          changed_by: userProfile?.id
        }]);
      }
      
      // 4. Log geral do sistema
      const deptName = departments.find(d => d.id === selectedDepartamento)?.name;
      await supabase.from('log_eventos_sistema').insert({
        tipo_evento: 'USER_ACCESS_UPDATED',
        descricao: `Acesso alterado: ${getHierarchyLabel(selectedRole)}${deptName ? ` - Departamento: ${deptName}` : ''}`,
        usuario_id: user.id
      });
      
      toast.success('Acesso atualizado!', {
        description: `${user.email} agora é ${getHierarchyLabel(selectedRole)}`
      });
      
      onUserUpdated();
      setPendingChanges(false);
      refetchAudit();
      
    } catch (error: unknown) {
      console.error('Erro ao salvar:', error);
      toast.error('Erro ao salvar alterações', {
        description: error instanceof Error ? error.message : 'Erro desconhecido'
      });
    } finally {
      setIsSaving(false);
    }
  }, [user, selectedRole, selectedDepartamento, pendingChanges, hasValidationErrors, userProfile, departments, onUserUpdated, refetchAudit]);

  /** Salva dados de identidade (nome, telefone, cc_emails) */
  const saveIdentity = useCallback(async (data: { nome: string; telefone: string; ccEmails: string[] }) => {
    if (!user) return;
    
    try {
      setIsSaving(true);
      
      const { error } = await supabase
        .from('users')
        .update({
          nome: data.nome,
          telefone: data.telefone || null,
          cc_emails: data.ccEmails.length > 0 ? data.ccEmails : null
        })
        .eq('id', user.id);
      
      if (error) throw error;
      
      toast.success('Informações atualizadas!');
      
      // Se é o próprio usuário, atualizar estado global
      if (user.id === userProfile?.id) {
        await refreshUserProfile();
      }
      
      onUserUpdated();
      
    } catch (error: unknown) {
      console.error('Erro ao salvar identidade:', error);
      toast.error('Erro ao salvar');
    } finally {
      setIsSaving(false);
    }
  }, [user, userProfile, refreshUserProfile, onUserUpdated]);

  /** Reenvia email de confirmação */
  const resendConfirmationEmail = useCallback(async () => {
    if (!user) return;
    
    try {
      setIsSaving(true);
      
      const { data, error } = await supabase.functions.invoke('unified-email-service', {
        body: { action: 'resend', email: user.email }
      });
      
      if (error) throw error;
      
      if (data?.success) {
        toast.success('Email reenviado!', {
          description: 'Verifique a caixa de entrada'
        });
      } else {
        throw new Error(data?.error || 'Erro ao enviar');
      }
    } catch (error: unknown) {
      console.error('Erro ao reenviar email:', error);
      toast.error('Erro ao reenviar email');
    } finally {
      setIsSaving(false);
    }
  }, [user]);

  /** Bloqueia ou desbloqueia o usuário */
  const toggleBlock = useCallback(async () => {
    if (!user || !permissions.canBlock) return;
    
    const isBlocked = user.is_blocked;
    const action = isBlocked ? 'desbloquear' : 'bloquear';
    
    if (!confirm(`Tem certeza que deseja ${action} ${user.email}?`)) return;
    
    try {
      setIsSaving(true);
      
      const updateData = isBlocked
        ? { is_blocked: false, blocked_at: null, blocked_by: null, blocked_reason: null }
        : { 
            is_blocked: true, 
            blocked_at: new Date().toISOString(), 
            blocked_by: userProfile?.id,
            blocked_reason: 'Bloqueado manualmente pelo administrador'
          };
      
      const { error } = await supabase
        .from('users')
        .update(updateData)
        .eq('id', user.id);
      
      if (error) throw error;
      
      await supabase.from('log_eventos_sistema').insert({
        tipo_evento: isBlocked ? 'USER_UNBLOCKED' : 'USER_BLOCKED',
        descricao: `Usuário ${user.email} foi ${isBlocked ? 'desbloqueado' : 'bloqueado'} por ${userProfile?.email}`,
        usuario_id: user.id
      });
      
      toast.success(isBlocked ? 'Usuário desbloqueado!' : 'Usuário bloqueado!');
      onUserUpdated();
      refetchAudit();
      
    } catch (error: unknown) {
      console.error('Erro ao alterar bloqueio:', error);
      toast.error('Erro ao alterar bloqueio');
    } finally {
      setIsSaving(false);
    }
  }, [user, permissions.canBlock, userProfile, onUserUpdated, refetchAudit]);

  /** Reseta a senha do usuário (envia email) */
  const resetPassword = useCallback(async () => {
    if (!user || !permissions.canResetPassword) return;
    
    if (!confirm(`Enviar email de redefinição de senha para ${user.email}?`)) return;
    
    try {
      setIsSaving(true);
      
      const { error } = await supabase.auth.resetPasswordForEmail(user.email, {
        redirectTo: `${window.location.origin}/reset-password`
      });
      
      if (error) throw error;
      
      await supabase.from('log_eventos_sistema').insert({
        tipo_evento: 'PASSWORD_RESET_REQUESTED',
        descricao: `Reset de senha solicitado para ${user.email} por ${userProfile?.email}`,
        usuario_id: user.id
      });
      
      toast.success('Email de redefinição enviado!', {
        description: `Link enviado para ${user.email}`
      });
      
    } catch (error: unknown) {
      console.error('Erro ao resetar senha:', error);
      toast.error('Erro ao enviar email de redefinição');
    } finally {
      setIsSaving(false);
    }
  }, [user, permissions.canResetPassword, userProfile]);

  /** Exclui permanentemente a conta do usuário */
  const deleteAccount = useCallback(async () => {
    if (!user || !permissions.canDelete) return;
    
    const confirmText = `EXCLUIR ${user.email}`;
    const input = prompt(`Digite "${confirmText}" para confirmar a exclusão permanente:`);
    
    if (input !== confirmText) {
      toast.error('Exclusão cancelada', {
        description: 'Texto de confirmação não corresponde'
      });
      return;
    }
    
    try {
      setIsSaving(true);
      
      // Log antes de excluir (usuario_id = alvo, metadata = operador)
      await supabase.from('log_eventos_sistema').insert({
        tipo_evento: 'USER_DELETED',
        descricao: `Usuário ${user.email} excluído permanentemente por ${userProfile?.email}`,
        usuario_id: user.id,
        metadata: {
          deleted_by_id: userProfile?.id,
          deleted_by_email: userProfile?.email,
          deleted_user_email: user.email
        }
      });
      
      // Excluir de user_roles primeiro (FK)
      await supabase
        .from('user_roles')
        .delete()
        .eq('user_id', user.id);
      
      // Excluir da tabela users
      const { error } = await supabase
        .from('users')
        .delete()
        .eq('id', user.id);
      
      if (error) throw error;
      
      toast.success('Conta excluída permanentemente');
      onUserUpdated();
      
    } catch (error: unknown) {
      console.error('Erro ao excluir conta:', error);
      toast.error('Erro ao excluir conta');
    } finally {
      setIsSaving(false);
    }
  }, [user, permissions.canDelete, userProfile, onUserUpdated]);

  // ==========================================================================
  // RETORNO DO HOOK
  // ==========================================================================
  
  return {
    // Estado
    selectedRole,
    selectedDepartamento,
    editData,
    setEditData,
    pendingChanges,
    isSaving,
    
    // Dados carregados
    departments,
    auditEntries,
    
    // Loading
    isLoading: loadingDepartments || loadingAudit,
    
    // Permissões e validações (separados claramente)
    permissions,
    errors,
    hasValidationErrors,
    
    // Preview de impacto
    impact,
    
    // Operações de acesso
    handleRoleChange,
    handleDepartamentoChange,
    saveAccessChanges,
    
    // Operações de identidade
    saveIdentity,
    resendConfirmationEmail,
    
    // Operações críticas (danger zone)
    toggleBlock,
    resetPassword,
    deleteAccount,
    
    // Utilitários
    refetchAudit,
    hierarchyOptions: HIERARCHY_OPTIONS
  };
};

// ============================================================================
// FUNÇÕES AUXILIARES (fora do hook para melhor performance)
// ============================================================================

/** Busca entradas de auditoria de múltiplas fontes */
async function fetchAuditEntries(userId: string | undefined): Promise<AuditEntry[]> {
  if (!userId) return [];
  
  const [activityLogs, roleChanges] = await Promise.all([
    supabase
      .from('user_activity_logs')
      .select('*')
      .eq('user_id', userId)
      .order('created_at', { ascending: false })
      .limit(30),
    supabase
      .from('role_change_audit')
      .select('*')
      .eq('user_id', userId)
      .order('created_at', { ascending: false })
      .limit(20)
  ]);

  const entries: AuditEntry[] = [];

  // Processar activity logs
  if (activityLogs.data) {
    for (const log of activityLogs.data) {
      const meta = log.metadata as Record<string, unknown> | null;
      entries.push({
        id: log.id,
        type: categorizeActivityType(log.action_type),
        title: formatActivityTitle(log.action_type),
        description: log.action_description || '',
        timestamp: log.created_at,
        performedBy: meta?.performed_by as string | undefined,
        performedByEmail: meta?.user_email as string | undefined,
        metadata: meta || undefined,
        ip: log.ip_address
      });
    }
  }

  // Processar role changes
  if (roleChanges.data) {
    for (const change of roleChanges.data) {
      entries.push({
        id: change.id,
        type: 'role_change',
        title: 'Alteração de Cargo',
        description: `Cargo alterado de ${getHierarchyLabel(change.old_role)} para ${getHierarchyLabel(change.new_role)}`,
        timestamp: change.created_at,
        performedBy: change.changed_by,
        metadata: { old_role: change.old_role, new_role: change.new_role }
      });
    }
  }

  // Ordenar por data (mais recente primeiro)
  entries.sort((a, b) => new Date(b.timestamp).getTime() - new Date(a.timestamp).getTime());
  
  return entries.slice(0, 50);
}

/** Calcula o impacto das mudanças de acesso */
function calculateAccessImpact(params: {
  user: ConsoleUser;
  currentRole: HierarchyLevel;
  newRole: HierarchyLevel;
  currentDeptId: string | null | undefined;
  newDeptId: string | null;
  departments: ConsoleDepartment[];
  isTargetCEO: boolean;
}): AccessImpact {
  const { user, currentRole, newRole, currentDeptId, newDeptId, departments, isTargetCEO } = params;
  
  const currentDept = departments.find(d => d.id === currentDeptId);
  const newDept = departments.find(d => d.id === newDeptId);
  
  const changes: ImpactChange[] = [];
  const warnings: string[] = [];
  
  // Mudanças ao virar admin departamental
  if (newRole === 'admin_departamental') {
    if (currentRole !== 'admin_departamental') {
      changes.push({ type: 'lose', module: 'all_departments', label: 'Acesso a todos os departamentos' });
      changes.push({ type: 'lose', module: 'crm_full', label: 'CRM completo' });
    }
    if (newDept) {
      changes.push({ type: 'gain', module: `dept_${newDept.id}`, label: `Acesso ao ${newDept.name}` });
    }
  }
  
  // Mudanças ao virar Coordenação
  if (newRole === 'admin' && currentRole !== 'admin') {
    changes.push({ type: 'gain', module: 'operational', label: 'Acesso operacional completo' });
    if (currentRole === 'super_admin') {
      changes.push({ type: 'lose', module: 'system', label: 'Configurações de sistema' });
      changes.push({ type: 'lose', module: 'users', label: 'Gerenciamento de usuários' });
    }
  }
  
  // Mudanças ao virar CEO
  if (newRole === 'super_admin' && currentRole !== 'super_admin') {
    changes.push({ type: 'gain', module: 'full', label: 'Acesso total ao sistema' });
  }
  
  // Calcular acesso CRM
  let crmBefore = 'Sem acesso';
  let crmAfter = 'Sem acesso';
  
  if (currentRole === 'super_admin') crmBefore = 'Acesso total';
  else if (currentRole === 'admin') crmBefore = 'Acesso total';
  else if (currentDept?.name === 'Comercial') crmBefore = 'Apenas próprias conversas';
  
  if (newRole === 'super_admin') crmAfter = 'Acesso total';
  else if (newRole === 'admin') crmAfter = 'Acesso total';
  else if (newDept?.name === 'Comercial') crmAfter = 'Apenas próprias conversas';
  
  return {
    from: {
      role: currentRole,
      roleLabel: getHierarchyLabel(currentRole),
      departamento: currentDeptId || undefined,
      departamentoLabel: currentDept?.name
    },
    to: {
      role: newRole,
      roleLabel: getHierarchyLabel(newRole),
      departamento: newDeptId || undefined,
      departamentoLabel: newDept?.name
    },
    changes,
    crmAccess: { before: crmBefore, after: crmAfter },
    warnings
  };
}

/** Categoriza o tipo de atividade para exibição */
function categorizeActivityType(actionType: string): AuditEntry['type'] {
  const type = actionType.toLowerCase();
  if (type.includes('login') || type.includes('signin')) return 'login';
  if (type.includes('logout') || type.includes('signout')) return 'logout';
  if (type.includes('role')) return 'role_change';
  if (type.includes('department')) return 'department_change';
  if (type.includes('permission')) return 'permission';
  if (type.includes('block')) return 'blocked';
  if (type.includes('unblock')) return 'unblocked';
  if (type.includes('profile') || type.includes('update')) return 'profile';
  return 'action';
}

/** Formata o título da atividade para exibição */
function formatActivityTitle(actionType: string): string {
  const map: Record<string, string> = {
    'login': 'Login',
    'logout': 'Logout',
    'role_change': 'Alteração de Cargo',
    'permission_change': 'Alteração de Permissão',
    'profile_update': 'Atualização de Perfil',
    'view': 'Visualização',
    'create': 'Criação',
    'update': 'Atualização',
    'delete': 'Exclusão'
  };
  
  if (map[actionType]) return map[actionType];
  
  return actionType
    .split('_')
    .map(w => w.charAt(0).toUpperCase() + w.slice(1).toLowerCase())
    .join(' ');
}
