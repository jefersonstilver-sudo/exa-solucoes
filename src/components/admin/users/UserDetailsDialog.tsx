
import React, { useState } from 'react';
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle,
} from '@/components/ui/dialog';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Badge } from '@/components/ui/badge';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Separator } from '@/components/ui/separator';
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
  AlertTriangle,
  Mail,
  Loader2,
  RefreshCw,
  ShieldCheck
} from 'lucide-react';
import { supabase } from '@/integrations/supabase/client';
import { toast } from 'sonner';
import { useAuth } from '@/hooks/useAuth';
import { UserActivityTimeline } from './UserActivityTimeline';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';

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
}

interface UserDetailsDialogProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  user: User | null;
  onUserUpdated: () => void;
}

const UserDetailsDialog: React.FC<UserDetailsDialogProps> = ({
  open,
  onOpenChange,
  user,
  onUserUpdated
}) => {
  const { userProfile } = useAuth();
  const [isEditing, setIsEditing] = useState(false);
  const [loading, setLoading] = useState(false);
  const [showDeleteConfirm, setShowDeleteConfirm] = useState(false);
  const [deleteLoading, setDeleteLoading] = useState(false);
  const [resendingEmail, setResendingEmail] = useState(false);
  const [selectedRole, setSelectedRole] = useState(user?.role || 'client');
  const [editData, setEditData] = useState({
    name: '',
    telefone: '',
    observacoes: ''
  });

  // Verificar se é super admin
  const isSuperAdmin = userProfile?.role === 'super_admin' && 
                      userProfile?.email === 'jefersonstilver@gmail.com';

  React.useEffect(() => {
    if (user && open) {
      setEditData({
        name: user.nome || user.raw_user_meta_data?.name || '',
        telefone: user.raw_user_meta_data?.telefone || '',
        observacoes: user.raw_user_meta_data?.observacoes || ''
      });
      setSelectedRole(user.role);
      setIsEditing(false);
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
        return null;
    }
  };

  const getRoleBadge = (role: string) => {
    switch (role) {
      case 'super_admin':
        return (
          <Badge className="bg-purple-500/20 text-purple-100 border-purple-300/30">
            <Crown className="h-3 w-3 mr-1" />
            Super Admin
          </Badge>
        );
      case 'admin':
        return (
          <Badge className="bg-blue-500/20 text-blue-100 border-blue-300/30">
            <Shield className="h-3 w-3 mr-1" />
            Coordenação
          </Badge>
        );
      case 'admin_marketing':
        return (
          <Badge className="bg-pink-500/20 text-pink-100 border-pink-300/30">
            <UserCog className="h-3 w-3 mr-1" />
            Admin Marketing
          </Badge>
        );
      case 'admin_financeiro':
        return (
          <Badge className="bg-emerald-500/20 text-emerald-100 border-emerald-300/30">
            <DollarSign className="h-3 w-3 mr-1" />
            Admin Financeiro
          </Badge>
        );
      default:
        return null;
    }
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
    if (!user || !isSuperAdmin) return;

    try {
      setLoading(true);
      
      console.log('🔄 [ROLE_CHANGE] Alterando role de', user.email, 'para', newRole);

      const { error } = await supabase
        .from('users')
        .update({ role: newRole })
        .eq('id', user.id);

      if (error) throw error;

      toast.success(`Role atualizada para: ${getRoleLabel(newRole)}`);
      setSelectedRole(newRole);
      onUserUpdated();
    } catch (error: any) {
      console.error('❌ Erro ao atualizar role:', error);
      toast.error('Erro ao atualizar role: ' + error.message);
    } finally {
      setLoading(false);
    }
  };

  const getRoleLabel = (role: string): string => {
    const labels: Record<string, string> = {
      'super_admin': 'Super Admin',
      'admin': 'Coordenação',
      'admin_marketing': 'Admin Marketing',
      'admin_financeiro': 'Admin Financeiro',
      'client': 'Cliente',
      'painel': 'Painel'
    };
    return labels[role] || role;
  };

  const handleSave = async () => {
    if (!user) return;

    try {
      setLoading(true);

      // Atualizar metadados do usuário via Edge Function
      const { error } = await supabase.functions.invoke('admin-user-management', {
        body: {
          action: 'update_metadata',
          userId: user.id,
          data: {
            user_metadata: {
              ...user.raw_user_meta_data,
              name: editData.name,
              telefone: editData.telefone,
              observacoes: editData.observacoes
            }
          }
        }
      });

      if (error) throw error;

      toast.success('Informações atualizadas com sucesso');
      setIsEditing(false);
      onUserUpdated();
    } catch (error) {
      console.error('Erro ao atualizar usuário:', error);
      toast.error('Erro ao atualizar informações');
    } finally {
      setLoading(false);
    }
  };

  // 🔒 Invalidar todas as sessões ativas de um usuário
  const invalidateUserSessions = async (userId: string) => {
    try {
      await supabase
        .from('active_sessions_monitor')
        .delete()
        .eq('user_id', userId);
      console.log('✅ Sessões invalidadas para usuário:', userId);
    } catch (error) {
      console.error('❌ Erro ao invalidar sessões:', error);
    }
  };

  const handleResetPassword = async () => {
    if (!user || !isSuperAdmin) return;

    try {
      setLoading(true);

      // Use secure password generation instead of hardcoded password
      const { data: securePassword, error: passwordError } = await supabase
        .rpc('generate_secure_temp_password');

      if (passwordError || !securePassword) {
        throw new Error('Falha ao gerar senha segura');
      }

      const { error } = await supabase.functions.invoke('admin-user-management', {
        body: {
          action: 'reset_password',
          userId: user.id,
          data: {
            password: securePassword
          }
        }
      });

      if (error) throw error;

      // 🚨 Invalidar sessões imediatamente após reset
      await invalidateUserSessions(user.id);

      toast.success(`Senha resetada para: ${securePassword}`, {
        duration: 10000,
      });
    } catch (error: any) {
      console.error('Erro ao resetar senha:', error);
      toast.error(`Erro: ${error.message || 'Falha ao resetar senha'}`);
    } finally {
      setLoading(false);
    }
  };

  const handleResendEmail = async () => {
    if (!user) return;

    try {
      setResendingEmail(true);
      console.log('📧 Reenviando email de confirmação para:', user.email);

      const { data, error } = await supabase.functions.invoke('unified-email-service', {
        body: {
          action: 'resend',
          email: user.email
        }
      });

      if (error) throw error;

      console.log('✅ Resposta da edge function:', data);

      toast.success('✅ Email de confirmação enviado!', {
        description: `Um novo link de confirmação foi enviado para ${user.email}`
      });
    } catch (error: any) {
      console.error('❌ Erro ao reenviar email:', error);
      toast.error('Erro ao enviar email', {
        description: error.message || 'Tente novamente mais tarde'
      });
    } finally {
      setResendingEmail(false);
    }
  };

  const handleDeleteUser = async () => {
    if (!user || !isSuperAdmin) return;

    try {
      setDeleteLoading(true);
      console.log('🗑️ Deletando usuário:', user.id);

      // 🚨 Invalidar sessões ANTES de deletar
      await invalidateUserSessions(user.id);

      const { data, error } = await supabase.functions.invoke('delete-user-account', {
        body: { userId: user.id }
      });

      if (error) throw error;

      console.log('✅ Usuário deletado:', data);
      toast.success(`Conta ${user.email} deletada completamente!`);
      
      setShowDeleteConfirm(false);
      onOpenChange(false);
      onUserUpdated();
    } catch (error: any) {
      console.error('❌ Erro ao deletar usuário:', error);
      toast.error(error.message || 'Erro ao deletar usuário');
    } finally {
      setDeleteLoading(false);
    }
  };

  if (!user) return null;

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="max-w-2xl max-h-[90vh] overflow-y-auto p-0">
        {/* MOBILE-OPTIMIZED HEADER */}
        <div className="sticky top-0 bg-gradient-to-br from-primary to-primary/90 p-4 sm:p-6 text-white z-10">
          <div className="flex items-start justify-between mb-3">
            <div className="flex items-center gap-3 flex-1 min-w-0">
              <div className="w-12 h-12 bg-white/20 rounded-xl flex items-center justify-center flex-shrink-0">
                {getRoleIcon(user.role)}
              </div>
              <div className="flex-1 min-w-0">
                <h2 className="text-lg sm:text-xl font-bold truncate">{editData.name || user.email}</h2>
                <p className="text-sm text-white/80 truncate">{user.email}</p>
              </div>
            </div>
          </div>
          <div className="flex items-center justify-between">
            {getRoleBadge(user.role)}
            {!user.email_confirmed_at && (
              <Badge variant="destructive" className="text-xs">
                <AlertCircle className="w-3 h-3 mr-1" />
                Email Pendente
              </Badge>
            )}
          </div>
        </div>

        {/* MOBILE-OPTIMIZED CONTENT */}
        <div className="p-4 sm:p-6 space-y-4">
          {/* QUICK ACTIONS - MOBILE FIRST */}
          {isSuperAdmin && (
            <Card className="border-2 border-primary/20">
              <CardHeader className="pb-3">
                <CardTitle className="text-base flex items-center gap-2">
                  <Key className="w-4 h-4 text-primary" />
                  Ações Rápidas (Super Admin)
                </CardTitle>
              </CardHeader>
              <CardContent className="space-y-2">
                <Button
                  onClick={handleResetPassword}
                  disabled={loading}
                  variant="outline"
                  className="w-full justify-start h-auto py-3 border-orange-200 hover:bg-orange-50"
                >
                  {loading ? (
                    <Loader2 className="w-4 h-4 mr-2 animate-spin" />
                  ) : (
                    <Key className="w-4 h-4 mr-2 text-orange-600" />
                  )}
                  <div className="text-left flex-1">
                    <div className="font-semibold text-orange-700">Resetar Senha</div>
                    <div className="text-xs text-orange-600">Gera nova senha segura</div>
                  </div>
                </Button>

                {!user.email_confirmed_at && (
                  <Button
                    onClick={handleResendEmail}
                    disabled={resendingEmail}
                    variant="outline"
                    className="w-full justify-start h-auto py-3 border-blue-200 hover:bg-blue-50"
                  >
                    {resendingEmail ? (
                      <Loader2 className="w-4 h-4 mr-2 animate-spin" />
                    ) : (
                      <Mail className="w-4 h-4 mr-2 text-blue-600" />
                    )}
                    <div className="text-left flex-1">
                      <div className="font-semibold text-blue-700">Reenviar Email</div>
                      <div className="text-xs text-blue-600">Enviar link de confirmação</div>
                    </div>
                  </Button>
                )}

                <Button
                  onClick={() => setShowDeleteConfirm(true)}
                  disabled={deleteLoading}
                  variant="outline"
                  className="w-full justify-start h-auto py-3 border-red-200 hover:bg-red-50"
                >
                  <Trash2 className="w-4 h-4 mr-2 text-red-600" />
                  <div className="text-left flex-1">
                    <div className="font-semibold text-red-700">Deletar Conta</div>
                    <div className="text-xs text-red-600">Ação permanente e irreversível</div>
                  </div>
                </Button>
              </CardContent>
            </Card>
          )}

          {/* Informações Básicas */}
          <Card>
            <CardHeader className="pb-3">
              <CardTitle className="text-base sm:text-lg flex items-center justify-between">
                📋 Informações Pessoais
                {!isEditing ? (
                  <Button
                    variant="outline"
                    size="sm"
                    onClick={() => setIsEditing(true)}
                  >
                    Editar
                  </Button>
                ) : (
                  <div className="flex gap-2">
                    <Button
                      variant="outline"
                      size="sm"
                      onClick={() => setIsEditing(false)}
                    >
                      <X className="h-4 w-4" />
                    </Button>
                    <Button
                      size="sm"
                      onClick={handleSave}
                      disabled={loading}
                      className="bg-primary"
                    >
                      <Save className="h-4 w-4 mr-1" />
                      Salvar
                    </Button>
                  </div>
                )}
              </CardTitle>
            </CardHeader>
            <CardContent className="space-y-3">
              {/* MOBILE: Stack vertically */}
              <div className="space-y-3 sm:grid sm:grid-cols-2 sm:gap-4 sm:space-y-0">
                <div>
                  <Label className="text-xs text-muted-foreground">Email</Label>
                  <Input value={user.email} disabled className="bg-muted/50 text-sm" />
                </div>
                <div>
                  <Label className="text-xs text-muted-foreground">Função</Label>
                  <div className="flex items-center h-10">
                    {getRoleBadge(user.role)}
                  </div>
                </div>
              </div>

              <div className="space-y-3 sm:grid sm:grid-cols-2 sm:gap-4 sm:space-y-0">
                <div>
                  <Label htmlFor="name" className="text-xs text-muted-foreground">Nome Completo</Label>
                  <Input
                    id="name"
                    value={editData.name}
                    onChange={(e) => setEditData(prev => ({ ...prev, name: e.target.value }))}
                    disabled={!isEditing}
                    placeholder="Nome completo"
                    className="text-sm"
                  />
                </div>
                <div>
                  <Label htmlFor="telefone" className="text-xs text-muted-foreground">Telefone</Label>
                  <Input
                    id="telefone"
                    value={editData.telefone}
                    onChange={(e) => setEditData(prev => ({ ...prev, telefone: e.target.value }))}
                    disabled={!isEditing}
                    placeholder="(11) 99999-9999"
                    className="text-sm"
                  />
                </div>
              </div>

              <div>
                <Label htmlFor="observacoes" className="text-xs text-muted-foreground">Observações</Label>
                <Input
                  id="observacoes"
                  value={editData.observacoes}
                  onChange={(e) => setEditData(prev => ({ ...prev, observacoes: e.target.value }))}
                  disabled={!isEditing}
                  placeholder="Observações sobre o usuário"
                  className="text-sm"
                />
              </div>
            </CardContent>
          </Card>

          {/* Status & Verificações - MOBILE OPTIMIZED */}
          <Card>
            <CardHeader className="pb-3">
              <CardTitle className="text-base sm:text-lg flex items-center gap-2">
                <CheckCircle className="w-4 h-4 text-primary" />
                Status e Verificações
              </CardTitle>
            </CardHeader>
            <CardContent>
              <div className="space-y-3">
                {/* Status do Email */}
                <div className="flex items-start gap-3 p-3 rounded-lg bg-muted/50">
                  {user.email_confirmed_at ? (
                    <CheckCircle className="w-5 h-5 text-green-500 flex-shrink-0 mt-0.5" />
                  ) : (
                    <AlertCircle className="w-5 h-5 text-red-500 flex-shrink-0 mt-0.5" />
                  )}
                  <div className="flex-1 min-w-0">
                    <p className="font-semibold text-sm">Status do Email:</p>
                    <p className="text-sm text-muted-foreground">
                      {user.email_confirmed_at ? '✅ Verificado' : '❌ Pendente de confirmação'}
                    </p>
                    {user.email_confirmed_at && (
                      <p className="text-xs text-muted-foreground mt-1">
                        {formatDate(user.email_confirmed_at)}
                      </p>
                    )}
                  </div>
                </div>

                {/* Cadastro */}
                <div className="flex items-start gap-3 p-3 rounded-lg bg-muted/50">
                  <Calendar className="w-5 h-5 text-blue-500 flex-shrink-0 mt-0.5" />
                  <div className="flex-1 min-w-0">
                    <p className="font-semibold text-sm">Cadastro:</p>
                    <p className="text-sm text-muted-foreground">
                      {formatDate(user.data_criacao)}
                    </p>
                  </div>
                </div>

                {/* Último Acesso */}
                <div className="flex items-start gap-3 p-3 rounded-lg bg-muted/50">
                  <Clock className="w-5 h-5 text-purple-500 flex-shrink-0 mt-0.5" />
                  <div className="flex-1 min-w-0">
                    <p className="font-semibold text-sm">Última Atividade:</p>
                    <p className="text-sm text-muted-foreground">
                      {formatDate(user.last_sign_in_at)}
                    </p>
                  </div>
                </div>
              </div>
            </CardContent>
          </Card>

          {/* CONFIRMAÇÃO DE DELEÇÃO - MOBILE OPTIMIZED */}
          {showDeleteConfirm && (
            <Card className="border-2 border-red-500 bg-red-50">
              <CardHeader className="pb-3">
                <CardTitle className="text-base text-red-800 flex items-center gap-2">
                  <AlertTriangle className="w-5 h-5" />
                  ⚠️ Confirmar Deleção
                </CardTitle>
              </CardHeader>
              <CardContent>
                <div className="space-y-3">
                  <div className="bg-red-100 p-3 rounded-lg border-2 border-red-300">
                    <p className="text-sm font-bold text-red-900 mb-2">
                      AÇÃO IRREVERSÍVEL!
                    </p>
                    <p className="text-xs text-red-800 mb-2">
                      Deletar permanentemente:
                    </p>
                    <div className="p-2 bg-white rounded border border-red-200 text-xs space-y-1">
                      <p className="font-mono break-all"><strong>Email:</strong> {user.email}</p>
                      <p className="font-mono"><strong>Role:</strong> {user.role}</p>
                    </div>
                  </div>

                  <div className="text-xs text-red-700 space-y-1 bg-red-100 p-2 rounded">
                    <p><strong>Será deletado:</strong></p>
                    <p>✓ Conta e autenticação</p>
                    <p>✓ Dados relacionados</p>
                    <p className="pt-1"><strong>Após deleção:</strong></p>
                    <p>✓ Email pode ser reutilizado</p>
                  </div>

                  <div className="flex flex-col sm:flex-row gap-2 pt-2">
                    <Button
                      variant="outline"
                      onClick={() => setShowDeleteConfirm(false)}
                      disabled={deleteLoading}
                      className="w-full sm:w-auto"
                    >
                      Cancelar
                    </Button>
                    <Button
                      variant="destructive"
                      onClick={handleDeleteUser}
                      disabled={deleteLoading}
                      className="bg-red-600 hover:bg-red-700 w-full sm:w-auto"
                    >
                      {deleteLoading ? (
                        <>
                          <Loader2 className="w-4 h-4 mr-2 animate-spin" />
                          Deletando...
                        </>
                      ) : (
                        <>
                          <Trash2 className="w-4 h-4 mr-2" />
                          CONFIRMAR DELEÇÃO
                        </>
                      )}
                    </Button>
                  </div>
                </div>
              </CardContent>
            </Card>
          )}
        </div>
      </DialogContent>
    </Dialog>
  );
};

export default UserDetailsDialog;
