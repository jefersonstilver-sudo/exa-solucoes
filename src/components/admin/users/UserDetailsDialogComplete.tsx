// FASE 4: Dialog Completo com Permissões e Timeline
import React, { useState } from 'react';
import {
  Dialog,
  DialogContent,
} from '@/components/ui/dialog';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Badge } from '@/components/ui/badge';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Separator } from '@/components/ui/separator';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { 
  Crown, 
  Shield, 
  UserCog, 
  Calendar, 
  Clock, 
  CheckCircle, 
  AlertCircle,
  Key,
  Save,
  X,
  DollarSign,
  Trash2,
  Mail,
  Loader2,
  ShieldCheck,
  Activity,
  User,
  Ban,
  Unlock
} from 'lucide-react';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { supabase } from '@/integrations/supabase/client';
import { toast } from 'sonner';
import { useAuth } from '@/hooks/useAuth';
import { UserActivityTimeline } from './UserActivityTimeline';
import { updateUserRoleInDB } from '@/services/userRoleService';
import { CCEmailsInput } from '@/components/ui/cc-emails-input';

interface User {
  id: string;
  email: string;
  role: string;
  data_criacao: string;
  email_confirmed_at?: string;
  last_sign_in_at?: string;
  last_access_at?: string;
  raw_user_meta_data?: any;
  nome?: string;
  telefone?: string;
  cc_emails?: string[];
  is_blocked?: boolean;
  blocked_at?: string;
  blocked_by?: string;
  blocked_reason?: string;
}

interface UserDetailsDialogCompleteProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  user: User | null;
  onUserUpdated: () => void;
}

// Email do CEO que nunca pode ser bloqueado
const CEO_EMAIL = 'jefersonstilver@gmail.com';

export const UserDetailsDialogComplete: React.FC<UserDetailsDialogCompleteProps> = ({
  open,
  onOpenChange,
  user,
  onUserUpdated
}) => {
  const { userProfile, refreshUserProfile } = useAuth();
  const [loading, setLoading] = useState(false);
  const [blockingUser, setBlockingUser] = useState(false);
  const [resendingEmail, setResendingEmail] = useState(false);
  const [selectedRole, setSelectedRole] = useState(user?.role || 'client');
  const [editData, setEditData] = useState({
    name: '',
    telefone: '',
    observacoes: '',
    ccEmails: [] as string[]
  });

  const isSuperAdmin = userProfile?.role === 'super_admin';
  const isAdmin = userProfile?.role === 'admin' || isSuperAdmin;
  const canManageRoles = isAdmin || isSuperAdmin;
  const isCEO = user?.email === CEO_EMAIL;
  const isUserBlocked = user?.is_blocked || false;

  React.useEffect(() => {
    if (user && open) {
      setEditData({
        name: user.nome || user.raw_user_meta_data?.name || '',
        telefone: user.telefone || user.raw_user_meta_data?.telefone || '',
        observacoes: user.raw_user_meta_data?.observacoes || '',
        ccEmails: user.cc_emails || []
      });
      setSelectedRole(user.role);
    }
  }, [user, open]);

  const getRoleIcon = (role: string) => {
    switch (role) {
      case 'super_admin':
        return <Crown className="h-5 w-5 text-white" />;
      case 'admin':
        return <Shield className="h-5 w-5 text-white" />;
      case 'admin_marketing':
        return <UserCog className="h-5 w-5 text-white" />;
      case 'admin_financeiro':
        return <DollarSign className="h-5 w-5 text-white" />;
      default:
        return <User className="h-5 w-5 text-white" />;
    }
  };

  const getRoleBadge = (role: string) => {
    const badges: Record<string, JSX.Element> = {
      'super_admin': (
        <Badge className="bg-purple-500/20 text-purple-100 border-purple-300/30">
          <Crown className="h-3 w-3 mr-1" />
          Super Admin
        </Badge>
      ),
      'admin': (
        <Badge className="bg-blue-500/20 text-blue-100 border-blue-300/30">
          <Shield className="h-3 w-3 mr-1" />
          Admin Geral
        </Badge>
      ),
      'admin_marketing': (
        <Badge className="bg-pink-500/20 text-pink-100 border-pink-300/30">
          <UserCog className="h-3 w-3 mr-1" />
          Admin Marketing
        </Badge>
      ),
      'admin_financeiro': (
        <Badge className="bg-emerald-500/20 text-emerald-100 border-emerald-300/30">
          <DollarSign className="h-3 w-3 mr-1" />
          Admin Financeiro
        </Badge>
      ),
      'client': (
        <Badge variant="outline">
          <User className="h-3 w-3 mr-1" />
          Cliente
        </Badge>
      )
    };
    return badges[role] || badges['client'];
  };

  const formatDate = (dateString?: string) => {
    if (!dateString) return 'Nunca';
    try {
      return new Intl.DateTimeFormat('pt-BR', {
        day: '2-digit',
        month: '2-digit',
        year: 'numeric',
        hour: '2-digit',
        minute: '2-digit'
      }).format(new Date(dateString));
    } catch {
      return 'Data inválida';
    }
  };

  const handleRoleChange = async (newRole: string) => {
    if (!user || !canManageRoles) {
      toast.error('Sem permissão', {
        description: 'Você não tem permissão para alterar roles'
      });
      return;
    }

    // Apenas super_admin pode promover para super_admin
    if (newRole === 'super_admin' && !isSuperAdmin) {
      toast.error('Permissão negada', {
        description: 'Apenas Super Admins podem promover usuários a Super Admin'
      });
      return;
    }

    try {
      setLoading(true);
      
      console.log('🔄 [ROLE_CHANGE] Alterando role:', {
        user: user.email,
        oldRole: user.role,
        newRole,
        changedBy: userProfile?.email
      });

      // ✅ CORREÇÃO: Usar função de serviço que atualiza via user_roles
      const { success, error } = await updateUserRoleInDB(user.id, newRole as any);

      if (!success || error) {
        throw error || new Error('Falha ao atualizar role');
      }

      toast.success(`Role atualizada com sucesso!`, {
        description: `${user.email} agora é ${getRoleLabel(newRole)}`
      });
      
      setSelectedRole(newRole);
      onUserUpdated();
    } catch (error: any) {
      console.error('❌ Erro ao atualizar role:', error);
      toast.error('Erro ao atualizar role', {
        description: error.message
      });
    } finally {
      setLoading(false);
    }
  };

  const getRoleLabel = (role: string): string => {
    const labels: Record<string, string> = {
      'super_admin': 'Super Admin',
      'admin': 'Admin Geral',
      'admin_marketing': 'Admin Marketing',
      'admin_financeiro': 'Admin Financeiro',
      'client': 'Cliente',
      'painel': 'Painel'
    };
    return labels[role] || role;
  };

  const handleResendEmail = async () => {
    if (!user) return;

    try {
      setResendingEmail(true);
      
      console.log('📧 [TESTE-NOVO-EMAIL] Reenviando via unified-email-service');
      console.log('🔍 [DEBUG] Email destino:', user.email);
      console.log('🕐 [DEBUG] Timestamp:', new Date().toISOString());
      
      // ✅ CORREÇÃO: Usar edge function unificada que considera o role
      const { data, error } = await supabase.functions.invoke('unified-email-service', {
        body: { 
          action: 'resend', 
          email: user.email 
        }
      });

      if (error) throw error;

      if (data?.success) {
        toast.success('✅ Email reenviado! PROCURE O EMAIL COM HORÁRIO NO ASSUNTO', {
          description: `Procure: "🎯 Confirme seu email - EXA [${new Date().toISOString().substring(11, 19)}...]"`,
          duration: 8000
        });
        console.log('✅ [SUCESSO] Email enviado - ID:', data.email_id);
      } else {
        throw new Error(data?.error || 'Erro desconhecido');
      }
    } catch (error: any) {
      console.error('❌ Erro ao reenviar email:', error);
      toast.error('Erro ao enviar email', {
        description: error.message
      });
    } finally {
      setResendingEmail(false);
    }
  };

  const handleSaveProfile = async () => {
    if (!user) return;

    try {
      setLoading(true);

      const { error } = await supabase
        .from('users')
        .update({
          nome: editData.name,
          telefone: editData.telefone || null,
          cc_emails: editData.ccEmails.length > 0 ? editData.ccEmails : null
        })
        .eq('id', user.id);

      if (error) throw error;

      toast.success('Informações atualizadas!');
      
      // SEMPRE atualizar o estado global se for o próprio usuário
      console.log('🔄 Verificando refresh:', { editedUserId: user.id, loggedUserId: userProfile?.id });
      if (user.id === userProfile?.id) {
        console.log('🔄 Chamando refreshUserProfile para atualizar nome globalmente...');
        await refreshUserProfile();
        console.log('✅ refreshUserProfile concluído');
      }
      
      onUserUpdated();
    } catch (error: any) {
      console.error('❌ Erro ao atualizar:', error);
      toast.error('Erro ao atualizar informações');
    } finally {
      setLoading(false);
    }
  };

  const handleDeleteAccount = async () => {
    if (!user || !isSuperAdmin) return;

    // Confirmação dupla para segurança
    const confirmFirst = window.confirm(
      `⚠️ ATENÇÃO: Você está prestes a DELETAR permanentemente a conta de:\n\n` +
      `Email: ${user.email}\n` +
      `Nome: ${editData.name || 'N/A'}\n` +
      `Role: ${getRoleLabel(selectedRole)}\n\n` +
      `Esta ação é IRREVERSÍVEL!\n\n` +
      `Deseja continuar?`
    );

    if (!confirmFirst) return;

    const confirmSecond = window.confirm(
      `🚨 CONFIRMAÇÃO FINAL:\n\n` +
      `Tem CERTEZA ABSOLUTA que deseja deletar esta conta?\n\n` +
      `Todos os dados serão PERMANENTEMENTE removidos:\n` +
      `• Dados de autenticação\n` +
      `• Perfil do usuário\n` +
      `• Histórico de atividades\n` +
      `• Todas as relações no sistema\n\n` +
      `Digite "DELETAR" no próximo prompt para confirmar.`
    );

    if (!confirmSecond) return;

    const finalConfirm = window.prompt(
      `Digite exatamente "DELETAR" (em maiúsculas) para confirmar a eliminação da conta ${user.email}:`
    );

    if (finalConfirm !== 'DELETAR') {
      toast.error('Deleção cancelada', {
        description: 'Texto de confirmação incorreto'
      });
      return;
    }

    try {
      setLoading(true);
      
      console.log('🗑️ [DELETE_ACCOUNT] Iniciando deleção:', user.email);

      const { data: { session } } = await supabase.auth.getSession();
      
      const response = await fetch(
        `https://aakenoljsycyrcrchgxj.supabase.co/functions/v1/delete-user-account`,
        {
          method: 'POST',
          headers: {
            'Content-Type': 'application/json',
            'Authorization': `Bearer ${session?.access_token}`
          },
          body: JSON.stringify({ userId: user.id })
        }
      );

      const result = await response.json();

      if (!response.ok) {
        throw new Error(result.error || 'Erro ao deletar conta');
      }

      toast.success('✅ Conta deletada com sucesso', {
        description: `${user.email} foi permanentemente removido do sistema`
      });

      onOpenChange(false);
      onUserUpdated();
    } catch (error: any) {
      console.error('❌ Erro ao deletar conta:', error);
      toast.error('Erro ao deletar conta', {
        description: error.message
      });
    } finally {
      setLoading(false);
    }
  };

  const handleToggleBlock = async () => {
    if (!user || !isSuperAdmin) return;
    
    // CEO não pode ser bloqueado
    if (isCEO) {
      toast.error('Ação não permitida', {
        description: 'O CEO/criador do sistema não pode ser bloqueado'
      });
      return;
    }

    const action = isUserBlocked ? 'desbloquear' : 'bloquear';
    const confirm = window.confirm(
      `Tem certeza que deseja ${action} o usuário ${user.email}?`
    );

    if (!confirm) return;

    try {
      setBlockingUser(true);

      const updateData = isUserBlocked 
        ? {
            is_blocked: false,
            blocked_at: null,
            blocked_by: null,
            blocked_reason: null
          }
        : {
            is_blocked: true,
            blocked_at: new Date().toISOString(),
            blocked_by: userProfile?.id || null,
            blocked_reason: 'Bloqueado manualmente pelo administrador'
          };

      const { error } = await supabase
        .from('users')
        .update(updateData)
        .eq('id', user.id);

      if (error) throw error;

      // Log do evento
      await supabase.from('log_eventos_sistema').insert({
        tipo_evento: isUserBlocked ? 'USER_UNBLOCKED' : 'USER_BLOCKED',
        descricao: `Usuário ${user.email} foi ${isUserBlocked ? 'desbloqueado' : 'bloqueado'} por ${userProfile?.email}`,
        usuario_id: user.id
      });

      toast.success(
        isUserBlocked ? '✅ Usuário desbloqueado!' : '🚫 Usuário bloqueado!',
        { description: user.email }
      );

      // Fechar dialog e atualizar lista
      onOpenChange(false);
      onUserUpdated();
    } catch (error: any) {
      console.error('❌ Erro ao alterar bloqueio:', error);
      toast.error('Erro ao alterar status de bloqueio', {
        description: error.message
      });
    } finally {
      setBlockingUser(false);
    }
  };

  if (!user) return null;

  // BLOQUEAR se email não confirmado OU bloqueado manualmente
  const isBlocked = !user.email_confirmed_at || isUserBlocked;

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="max-w-2xl max-h-[90vh] overflow-y-auto p-0">
        {/* Header Premium */}
        <div className="sticky top-0 bg-gradient-to-br from-primary to-primary/90 p-6 text-white z-10">
          <div className="flex items-start justify-between mb-3">
            <div className="flex items-center gap-3 flex-1 min-w-0">
              <div className="w-14 h-14 bg-white/20 rounded-xl flex items-center justify-center flex-shrink-0">
                {getRoleIcon(selectedRole)}
              </div>
              <div className="flex-1 min-w-0">
                <h2 className="text-xl font-bold truncate">
                  {editData.name || user.email}
                </h2>
                <p className="text-sm text-white/80 truncate">{user.email}</p>
              </div>
            </div>
          </div>
          <div className="flex items-center gap-2 flex-wrap">
            {getRoleBadge(selectedRole)}
            {isCEO && (
              <Badge className="bg-yellow-500/20 text-yellow-100 border-yellow-300/30">
                <Crown className="w-3 h-3 mr-1" />
                CEO/Criador
              </Badge>
            )}
            {isUserBlocked && (
              <Badge variant="destructive" className="animate-pulse">
                <Ban className="w-3 h-3 mr-1" />
                🚫 BLOQUEADO
              </Badge>
            )}
            {!user.email_confirmed_at && !isUserBlocked && (
              <Badge variant="destructive" className="animate-pulse">
                <AlertCircle className="w-3 h-3 mr-1" />
                Email Não Confirmado
              </Badge>
            )}
          </div>
        </div>

        {/* Alerta Crítico se Bloqueado */}
        {isBlocked && (
          <div className="mx-6 mt-4 p-4 bg-red-50 border-2 border-red-200 rounded-lg">
            <div className="flex items-start gap-3">
              <AlertCircle className="h-5 w-5 text-red-600 flex-shrink-0 mt-0.5" />
              <div className="flex-1">
                <h4 className="font-semibold text-red-900">⚠️ Acesso Bloqueado</h4>
                <p className="text-sm text-red-700 mt-1">
                  Este usuário NÃO confirmou o email e está BLOQUEADO. Nenhum acesso será permitido até a confirmação.
                </p>
                <Button
                  onClick={handleResendEmail}
                  disabled={resendingEmail}
                  size="sm"
                  className="mt-3 bg-red-600 hover:bg-red-700"
                >
                  {resendingEmail ? (
                    <Loader2 className="h-4 w-4 mr-2 animate-spin" />
                  ) : (
                    <Mail className="h-4 w-4 mr-2" />
                  )}
                  Reenviar Email de Confirmação
                </Button>
              </div>
            </div>
          </div>
        )}

        {/* Content com Tabs */}
        <div className="overflow-y-auto" style={{ maxHeight: 'calc(90vh - 180px)' }}>
          <Tabs defaultValue="info" className="w-full">
            <TabsList className="w-full justify-start border-b rounded-none px-6">
              <TabsTrigger value="info" className="gap-2">
                <User className="h-4 w-4" />
                Informações
              </TabsTrigger>
              <TabsTrigger value="permissions" className="gap-2">
                <ShieldCheck className="h-4 w-4" />
                Permissões
              </TabsTrigger>
              <TabsTrigger value="activity" className="gap-2">
                <Activity className="h-4 w-4" />
                Atividades
              </TabsTrigger>
            </TabsList>

            <div className="p-6 space-y-6">
              {/* Tab: Informações */}
              <TabsContent value="info" className="mt-0 space-y-6">
                {/* Gestão de Role - ADMIN E SUPER ADMIN */}
                {canManageRoles && (
                  <Card className="border-2 border-primary/20">
                    <CardHeader className="pb-3">
                      <CardTitle className="text-base flex items-center gap-2">
                        <ShieldCheck className="h-5 w-5 text-primary" />
                        Hierarquia e Tipo de Acesso
                      </CardTitle>
                    </CardHeader>
                    <CardContent>
                      <Label className="text-sm font-medium mb-2 block">
                        Role / Função do Sistema
                      </Label>
                      <Select
                        value={selectedRole}
                        onValueChange={handleRoleChange}
                        disabled={loading || isBlocked}
                      >
                        <SelectTrigger className="w-full">
                          <SelectValue />
                        </SelectTrigger>
                        <SelectContent>
                          <SelectItem value="super_admin">
                            <div className="flex items-center gap-2">
                              <Crown className="h-4 w-4 text-purple-500" />
                              Super Admin
                            </div>
                          </SelectItem>
                          <SelectItem value="admin">
                            <div className="flex items-center gap-2">
                              <Shield className="h-4 w-4 text-blue-500" />
                              Admin Geral
                            </div>
                          </SelectItem>
                          <SelectItem value="admin_marketing">
                            <div className="flex items-center gap-2">
                              <UserCog className="h-4 w-4 text-pink-500" />
                              Admin Marketing
                            </div>
                          </SelectItem>
                          <SelectItem value="admin_financeiro">
                            <div className="flex items-center gap-2">
                              <DollarSign className="h-4 w-4 text-emerald-500" />
                              Admin Financeiro
                            </div>
                          </SelectItem>
                          <SelectItem value="client">
                            <div className="flex items-center gap-2">
                              <User className="h-4 w-4 text-gray-500" />
                              Cliente
                            </div>
                          </SelectItem>
                        </SelectContent>
                      </Select>
                      <p className="text-xs text-muted-foreground mt-2">
                        ⚠️ Mudanças de role são registradas no log de auditoria
                      </p>
                    </CardContent>
                  </Card>
                )}

                {/* Informações Pessoais */}
                <Card>
                  <CardHeader className="pb-3">
                    <CardTitle className="text-base">📋 Informações Pessoais</CardTitle>
                  </CardHeader>
                  <CardContent className="space-y-4">
                    <div className="grid grid-cols-2 gap-4">
                      <div>
                        <Label className="text-xs text-muted-foreground">Email</Label>
                        <Input value={user.email} disabled className="bg-muted/50 text-sm" />
                      </div>
                      <div>
                        <Label className="text-xs text-muted-foreground">Nome Completo</Label>
                        <Input
                          value={editData.name}
                          onChange={(e) => setEditData(prev => ({ ...prev, name: e.target.value }))}
                          placeholder="Nome completo"
                          className="text-sm"
                        />
                      </div>
                    </div>
                    <div>
                      <Label className="text-xs text-muted-foreground">📱 Telefone Comercial</Label>
                      <Input
                        value={editData.telefone}
                        onChange={(e) => setEditData(prev => ({ ...prev, telefone: e.target.value }))}
                        placeholder="(45) 99999-9999"
                        className="text-sm"
                      />
                      <p className="text-[10px] text-muted-foreground mt-1">
                        Este telefone aparecerá nas propostas comerciais enviadas
                      </p>
                    </div>
                    
                    {/* E-mails de Cópia (CC) */}
                    <div className="mt-4">
                      <CCEmailsInput
                        value={editData.ccEmails}
                        onChange={(emails) => setEditData(prev => ({ ...prev, ccEmails: emails }))}
                        label="E-mails de Cópia (CC)"
                        placeholder="email@empresa.com"
                        maxEmails={5}
                      />
                    </div>
                    
                    <Button onClick={handleSaveProfile} disabled={loading} size="sm" className="mt-4">
                      <Save className="h-4 w-4 mr-2" />
                      Salvar Alterações
                    </Button>
                  </CardContent>
                </Card>

                {/* Status */}
                <Card>
                  <CardHeader className="pb-3">
                    <CardTitle className="text-base flex items-center gap-2">
                      <CheckCircle className="h-5 w-5 text-primary" />
                      Status e Verificações
                    </CardTitle>
                  </CardHeader>
                  <CardContent className="space-y-3">
                    <div className="flex items-start gap-3 p-3 rounded-lg bg-muted/50">
                      {user.email_confirmed_at ? (
                        <CheckCircle className="w-5 h-5 text-green-500 flex-shrink-0" />
                      ) : (
                        <AlertCircle className="w-5 h-5 text-red-500 flex-shrink-0" />
                      )}
                      <div className="flex-1">
                        <p className="font-semibold text-sm">Email:</p>
                        <p className="text-sm">
                          {user.email_confirmed_at ? '✅ Confirmado' : '❌ Pendente'}
                        </p>
                        {user.email_confirmed_at && (
                          <p className="text-xs text-muted-foreground mt-1">
                            {formatDate(user.email_confirmed_at)}
                          </p>
                        )}
                      </div>
                    </div>

                    <div className="flex items-start gap-3 p-3 rounded-lg bg-muted/50">
                      <Calendar className="w-5 h-5 text-blue-500 flex-shrink-0" />
                      <div className="flex-1">
                        <p className="font-semibold text-sm">Cadastro:</p>
                        <p className="text-sm">{formatDate(user.data_criacao)}</p>
                      </div>
                    </div>

                    <div className="flex items-start gap-3 p-3 rounded-lg bg-muted/50">
                      <Clock className="w-5 h-5 text-purple-500 flex-shrink-0" />
                      <div className="flex-1">
                        <p className="font-semibold text-sm">Último Acesso:</p>
                        <p className="text-sm">{formatDate(user.last_access_at || user.last_sign_in_at)}</p>
                      </div>
                    </div>
                  </CardContent>
                </Card>

                {/* Zona de Perigo - SUPER ADMIN ONLY */}
                {isSuperAdmin && (
                  <Card className="border-2 border-red-500/50 bg-red-50/50 dark:bg-red-950/20">
                    <CardHeader className="pb-3">
                      <CardTitle className="text-base flex items-center gap-2 text-red-700 dark:text-red-400">
                        <AlertCircle className="h-5 w-5" />
                        ⚠️ Zona de Perigo
                      </CardTitle>
                    </CardHeader>
                    <CardContent className="space-y-4">
                      <p className="text-sm text-red-700 dark:text-red-300">
                        Ações sensíveis que afetam esta conta.
                      </p>
                      
                      {/* Reset de Senha */}
                      <div className="space-y-2 p-3 bg-amber-50 dark:bg-amber-950/30 rounded-lg border border-amber-200 dark:border-amber-800">
                        <p className="text-xs font-semibold text-amber-900 dark:text-amber-100">
                          🔑 Resetar Senha
                        </p>
                        <p className="text-xs text-amber-700 dark:text-amber-300">
                          Envia um email para o usuário com link para redefinir a senha.
                        </p>
                        <Button
                          variant="outline"
                          size="sm"
                          onClick={async () => {
                            try {
                              setLoading(true);
                              const { error } = await supabase.auth.resetPasswordForEmail(user.email, {
                                redirectTo: `${window.location.origin}/reset-password`
                              });
                              if (error) throw error;
                              toast.success('Email de reset enviado!', {
                                description: `Link enviado para ${user.email}`
                              });
                            } catch (error: any) {
                              toast.error('Erro ao enviar email', { description: error.message });
                            } finally {
                              setLoading(false);
                            }
                          }}
                          disabled={loading}
                          className="w-full border-amber-300 text-amber-700 hover:bg-amber-100"
                        >
                          {loading ? (
                            <Loader2 className="h-4 w-4 mr-2 animate-spin" />
                          ) : (
                            <Key className="h-4 w-4 mr-2" />
                          )}
                          Enviar Email de Reset de Senha
                        </Button>
                      </div>

                      {/* Bloquear/Desbloquear Acesso */}
                      {!isCEO && (
                        <div className={`space-y-2 p-3 rounded-lg border ${isUserBlocked ? 'bg-green-50 dark:bg-green-950/30 border-green-200 dark:border-green-800' : 'bg-orange-50 dark:bg-orange-950/30 border-orange-200 dark:border-orange-800'}`}>
                          <p className={`text-xs font-semibold ${isUserBlocked ? 'text-green-900 dark:text-green-100' : 'text-orange-900 dark:text-orange-100'}`}>
                            {isUserBlocked ? '🔓 Desbloquear Acesso' : '🔒 Bloquear Acesso'}
                          </p>
                          <p className={`text-xs ${isUserBlocked ? 'text-green-700 dark:text-green-300' : 'text-orange-700 dark:text-orange-300'}`}>
                            {isUserBlocked 
                              ? 'O usuário está bloqueado e não consegue acessar o sistema. Clique para restaurar o acesso.'
                              : 'Bloqueia completamente o acesso do usuário ao sistema. O usuário não conseguirá fazer login.'}
                          </p>
                          {isUserBlocked && user.blocked_at && (
                            <p className="text-[10px] text-green-600 dark:text-green-400">
                              Bloqueado em: {formatDate(user.blocked_at)}
                            </p>
                          )}
                          <Button
                            variant="outline"
                            size="sm"
                            onClick={handleToggleBlock}
                            disabled={blockingUser}
                            className={`w-full ${isUserBlocked ? 'border-green-300 text-green-700 hover:bg-green-100' : 'border-orange-300 text-orange-700 hover:bg-orange-100'}`}
                          >
                            {blockingUser ? (
                              <Loader2 className="h-4 w-4 mr-2 animate-spin" />
                            ) : isUserBlocked ? (
                              <Unlock className="h-4 w-4 mr-2" />
                            ) : (
                              <Ban className="h-4 w-4 mr-2" />
                            )}
                            {isUserBlocked ? 'Desbloquear Usuário' : 'Bloquear Usuário'}
                          </Button>
                        </div>
                      )}
                      
                      {isCEO && (
                        <div className="p-3 bg-gray-100 dark:bg-gray-800 rounded-lg border border-gray-200 dark:border-gray-700">
                          <p className="text-xs text-gray-600 dark:text-gray-400 flex items-center gap-2">
                            <Crown className="h-4 w-4 text-yellow-500" />
                            Esta conta é do CEO/criador e não pode ser bloqueada.
                          </p>
                        </div>
                      )}

                      <Separator className="bg-red-200 dark:bg-red-800" />
                      
                      <div className="space-y-2">
                        <p className="text-xs font-semibold text-red-900 dark:text-red-100">
                          🗑️ Eliminar Conta Permanentemente
                        </p>
                        <p className="text-xs text-red-700 dark:text-red-300">
                          Remove TODOS os dados do usuário do sistema de forma irreversível:
                          autenticação, perfil, histórico, pedidos e todas as relações.
                        </p>
                        <Button
                          variant="destructive"
                          size="sm"
                          onClick={handleDeleteAccount}
                          disabled={loading}
                          className="w-full bg-red-600 hover:bg-red-700"
                        >
                          {loading ? (
                            <Loader2 className="h-4 w-4 mr-2 animate-spin" />
                          ) : (
                            <Trash2 className="h-4 w-4 mr-2" />
                          )}
                          Eliminar Conta Permanentemente
                        </Button>
                      </div>
                    </CardContent>
                  </Card>
                )}
              </TabsContent>

              {/* Tab: Permissões - Removido (simplificado para role-based apenas) */}
              <TabsContent value="permissions" className="mt-0">
                <Card>
                  <CardContent className="pt-6 text-center text-muted-foreground">
                    <p className="text-sm">
                      As permissões agora são gerenciadas automaticamente com base no tipo de conta (role).
                    </p>
                    <p className="text-xs text-gray-500 mt-2">
                      Role atual: <strong>{getRoleLabel(selectedRole)}</strong>
                    </p>
                  </CardContent>
                </Card>
              </TabsContent>

              {/* Tab: Atividades */}
              <TabsContent value="activity" className="mt-0">
                <UserActivityTimeline userId={user.id} />
              </TabsContent>
            </div>
          </Tabs>
        </div>
      </DialogContent>
    </Dialog>
  );
};
