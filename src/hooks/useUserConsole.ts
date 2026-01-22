/**
 * Hook centralizado do Console Administrativo de Usuário
 * Gerencia estado, validações e operações
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
  UserConsoleState,
  CEO_EMAIL,
  getHierarchyLabel,
  mapLegacyRole,
  HIERARCHY_OPTIONS
} from '@/types/userConsoleTypes';

interface UseUserConsoleProps {
  user: ConsoleUser | null;
  open: boolean;
  onUserUpdated: () => void;
}

export const useUserConsole = ({ user, open, onUserUpdated }: UseUserConsoleProps) => {
  const { userProfile, refreshUserProfile } = useAuth();
  
  // Estado principal
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

  // === QUERIES ===
  
  // Buscar departamentos ativos
  const { data: departments = [], isLoading: loadingDepartments } = useQuery({
    queryKey: ['console-departments'],
    queryFn: async () => {
      const { data, error } = await supabase
        .from('process_departments')
        .select('id, name, color, icon, display_order, is_active')
        .eq('is_active', true)
        .order('display_order');
      
      if (error) throw error;
      return (data || []) as ConsoleDepartment[];
    },
    enabled: open
  });

  // Buscar entradas de auditoria
  const { 
    data: auditEntries = [], 
    isLoading: loadingAudit,
    refetch: refetchAudit 
  } = useQuery({
    queryKey: ['console-audit', user?.id],
    queryFn: async () => {
      if (!user?.id) return [];
      
      // Buscar de múltiplas fontes
      const [activityLogs, roleChanges] = await Promise.all([
        supabase
          .from('user_activity_logs')
          .select('*')
          .eq('user_id', user.id)
          .order('created_at', { ascending: false })
          .limit(30),
        supabase
          .from('role_change_audit')
          .select('*')
          .eq('user_id', user.id)
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

      // Ordenar por data
      entries.sort((a, b) => new Date(b.timestamp).getTime() - new Date(a.timestamp).getTime());
      
      return entries.slice(0, 50);
    },
    enabled: open && !!user?.id
  });

  // === EFEITOS ===
  
  // Resetar estado quando o usuário muda
  useEffect(() => {
    if (user && open) {
      const mappedRole = mapLegacyRole(user.role);
      setSelectedRole(mappedRole);
      setSelectedDepartamento(user.departamento_id || null);
      setEditData({
        nome: user.nome || user.raw_user_meta_data?.name as string || '',
        telefone: user.telefone || user.raw_user_meta_data?.telefone as string || '',
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

  // === PERMISSÕES DO OPERADOR ===
  const permissions = useMemo(() => {
    const isSuperAdmin = userProfile?.role === 'super_admin';
    const isAdmin = userProfile?.role === 'admin' || isSuperAdmin;
    const isCEO = user?.email === CEO_EMAIL;
    const isSelf = user?.id === userProfile?.id;
    
    return {
      canEditRole: isAdmin && !isSelf,
      canEditDepartment: isAdmin,
      canBlock: isSuperAdmin && !isCEO && !isSelf,
      canDelete: isSuperAdmin && !isCEO && !isSelf,
      isSuperAdmin,
      isAdmin,
      isCEO,
      isSelf
    };
  }, [userProfile, user]);

  // === VALIDAÇÕES ===
  const errors = useMemo(() => {
    const result: UserConsoleState['errors'] = {};
    
    // Admin departamental precisa de departamento
    if (selectedRole === 'admin_departamental' && !selectedDepartamento) {
      result.departmentRequired = true;
    }
    
    // Não pode alterar próprio cargo
    if (permissions.isSelf && selectedRole !== mapLegacyRole(user?.role || '')) {
      result.selfRoleChange = true;
    }
    
    // CEO não pode ser rebaixado
    if (permissions.isCEO && selectedRole !== 'super_admin') {
      result.ceoDowngrade = true;
    }
    
    return result;
  }, [selectedRole, selectedDepartamento, permissions, user]);

  // === PREVIEW DE IMPACTO ===
  const impact = useMemo((): AccessImpact | null => {
    if (!user || !pendingChanges) return null;
    
    const currentRole = mapLegacyRole(user.role);
    const currentDept = departments.find(d => d.id === user.departamento_id);
    const newDept = departments.find(d => d.id === selectedDepartamento);
    
    // Calcular mudanças de acesso
    const changes: AccessImpact['changes'] = [];
    const warnings: string[] = [];
    
    // Se está indo de CEO para outro cargo
    if (currentRole === 'super_admin' && selectedRole !== 'super_admin') {
      warnings.push('⚠️ CEO não pode ser rebaixado');
    }
    
    // Se está virando admin departamental
    if (selectedRole === 'admin_departamental') {
      if (currentRole !== 'admin_departamental') {
        changes.push({ type: 'lose', module: 'all_departments', label: 'Acesso a todos os departamentos' });
        changes.push({ type: 'lose', module: 'crm_full', label: 'CRM completo' });
      }
      if (!selectedDepartamento) {
        warnings.push('❌ Departamento obrigatório para Admin Departamental');
      } else if (newDept) {
        changes.push({ type: 'gain', module: `dept_${newDept.id}`, label: `Acesso ao ${newDept.name}` });
      }
    }
    
    // Se está virando Coordenação
    if (selectedRole === 'admin' && currentRole !== 'admin') {
      changes.push({ type: 'gain', module: 'operational', label: 'Acesso operacional completo' });
      if (currentRole === 'super_admin') {
        changes.push({ type: 'lose', module: 'system', label: 'Configurações de sistema' });
        changes.push({ type: 'lose', module: 'users', label: 'Gerenciamento de usuários' });
      }
    }
    
    // Se está virando CEO
    if (selectedRole === 'super_admin' && currentRole !== 'super_admin') {
      changes.push({ type: 'gain', module: 'full', label: 'Acesso total ao sistema' });
    }
    
    // Calcular CRM
    let crmBefore = 'Sem acesso';
    let crmAfter = 'Sem acesso';
    
    if (currentRole === 'super_admin') crmBefore = 'Acesso total';
    else if (currentDept?.name === 'Comercial') crmBefore = 'Apenas próprias conversas';
    
    if (selectedRole === 'super_admin') crmAfter = 'Acesso total';
    else if (selectedRole === 'admin') crmAfter = 'Acesso total';
    else if (newDept?.name === 'Comercial') crmAfter = 'Apenas próprias conversas';
    
    return {
      from: {
        role: currentRole,
        roleLabel: getHierarchyLabel(currentRole),
        departamento: user.departamento_id,
        departamentoLabel: currentDept?.name
      },
      to: {
        role: selectedRole,
        roleLabel: getHierarchyLabel(selectedRole),
        departamento: selectedDepartamento || undefined,
        departamentoLabel: newDept?.name
      },
      changes,
      crmAccess: { before: crmBefore, after: crmAfter },
      warnings
    };
  }, [user, pendingChanges, selectedRole, selectedDepartamento, departments]);

  // === OPERAÇÕES ===
  
  const handleRoleChange = useCallback((newRole: HierarchyLevel) => {
    // Validar antes de permitir
    if (permissions.isSelf) {
      toast.error('Ação bloqueada', {
        description: 'Você não pode alterar seu próprio cargo'
      });
      return;
    }
    
    if (permissions.isCEO && newRole !== 'super_admin') {
      toast.error('Ação bloqueada', {
        description: 'O CEO não pode ser rebaixado'
      });
      return;
    }
    
    if (newRole === 'super_admin' && !permissions.isSuperAdmin) {
      toast.error('Permissão negada', {
        description: 'Apenas o CEO pode promover usuários a CEO'
      });
      return;
    }
    
    setSelectedRole(newRole);
  }, [permissions]);

  const handleDepartamentoChange = useCallback((deptId: string) => {
    setSelectedDepartamento(deptId);
  }, []);

  const saveAccessChanges = useCallback(async () => {
    if (!user || !pendingChanges) return;
    
    // Validar
    if (Object.keys(errors).some(k => errors[k as keyof typeof errors])) {
      toast.error('Validação falhou', {
        description: 'Corrija os erros antes de salvar'
      });
      return;
    }
    
    try {
      setIsSaving(true);
      
      const updates: Record<string, unknown> = {};
      const oldRole = user.role;
      
      // Mapear role se necessário (para compatibilidade)
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
      
      // Atualizar usuário
      const { error: updateError } = await supabase
        .from('users')
        .update(updates as any)
        .eq('id', user.id);
      
      if (updateError) throw updateError;
      
      // Se role mudou, atualizar também em user_roles
      if (updates.role) {
        await supabase
          .from('user_roles')
          .update({ role: updates.role as any })
          .eq('user_id', user.id);
        
        // Log de auditoria
        await supabase.from('role_change_audit').insert([{
          user_id: user.id,
          old_role: oldRole as any,
          new_role: selectedRole as any,
          changed_by: userProfile?.id
        }]);
      }
      
      // Log geral
      await supabase.from('log_eventos_sistema').insert({
        tipo_evento: 'USER_ACCESS_UPDATED',
        descricao: `Acesso alterado: ${getHierarchyLabel(selectedRole)}${selectedDepartamento ? ` - Departamento: ${departments.find(d => d.id === selectedDepartamento)?.name}` : ''}`,
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
  }, [user, selectedRole, selectedDepartamento, pendingChanges, errors, userProfile, departments, onUserUpdated, refetchAudit]);

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
  }, [user, permissions, userProfile, onUserUpdated, refetchAudit]);

  return {
    // Estado
    selectedRole,
    selectedDepartamento,
    editData,
    setEditData,
    pendingChanges,
    isSaving,
    
    // Dados
    departments,
    auditEntries,
    
    // Loading
    isLoading: loadingDepartments || loadingAudit,
    
    // Permissões e validações
    permissions,
    errors,
    impact,
    
    // Operações
    handleRoleChange,
    handleDepartamentoChange,
    saveAccessChanges,
    saveIdentity,
    resendConfirmationEmail,
    toggleBlock,
    refetchAudit,
    
    // Constantes
    hierarchyOptions: HIERARCHY_OPTIONS
  };
};

// === HELPERS INTERNOS ===

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
