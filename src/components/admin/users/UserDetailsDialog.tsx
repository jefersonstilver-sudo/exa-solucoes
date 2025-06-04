
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
  X
} from 'lucide-react';
import { supabase } from '@/integrations/supabase/client';
import { toast } from 'sonner';
import { useAuth } from '@/hooks/useAuth';

interface User {
  id: string;
  email: string;
  role: string;
  data_criacao: string;
  email_confirmed_at?: string;
  last_sign_in_at?: string;
  raw_user_meta_data?: any;
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
        name: user.raw_user_meta_data?.name || '',
        telefone: user.raw_user_meta_data?.telefone || '',
        observacoes: user.raw_user_meta_data?.observacoes || ''
      });
      setIsEditing(false);
    }
  }, [user, open]);

  const getRoleIcon = (role: string) => {
    switch (role) {
      case 'super_admin':
        return <Crown className="h-4 w-4 text-indexa-purple" />;
      case 'admin':
        return <Shield className="h-4 w-4 text-blue-500" />;
      case 'admin_marketing':
        return <UserCog className="h-4 w-4 text-purple-500" />;
      default:
        return null;
    }
  };

  const getRoleBadge = (role: string) => {
    switch (role) {
      case 'super_admin':
        return (
          <Badge className="bg-indexa-purple/10 text-indexa-purple border-indexa-purple/20">
            <Crown className="h-3 w-3 mr-1" />
            Super Admin
          </Badge>
        );
      case 'admin':
        return (
          <Badge className="bg-blue-50 text-blue-600 border-blue-200">
            <Shield className="h-3 w-3 mr-1" />
            Admin Geral
          </Badge>
        );
      case 'admin_marketing':
        return (
          <Badge className="bg-purple-50 text-purple-600 border-purple-200">
            <UserCog className="h-3 w-3 mr-1" />
            Admin Marketing
          </Badge>
        );
      default:
        return null;
    }
  };

  const formatDate = (dateString?: string) => {
    if (!dateString) return 'Nunca';
    return new Intl.DateTimeFormat('pt-BR', {
      day: '2-digit',
      month: '2-digit',
      year: 'numeric',
      hour: '2-digit',
      minute: '2-digit'
    }).format(new Date(dateString));
  };

  const handleSave = async () => {
    if (!user) return;

    try {
      setLoading(true);

      // Atualizar metadados do usuário
      const { error } = await supabase.auth.admin.updateUserById(user.id, {
        user_metadata: {
          ...user.raw_user_meta_data,
          name: editData.name,
          telefone: editData.telefone,
          observacoes: editData.observacoes
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

  const handleResetPassword = async () => {
    if (!user || !isSuperAdmin) return;

    try {
      setLoading(true);

      const { error } = await supabase.auth.admin.updateUserById(user.id, {
        password: 'indexa2025'
      });

      if (error) throw error;

      toast.success('Senha resetada para "indexa2025"');
    } catch (error) {
      console.error('Erro ao resetar senha:', error);
      toast.error('Erro ao resetar senha');
    } finally {
      setLoading(false);
    }
  };

  if (!user) return null;

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="max-w-2xl max-h-[90vh] overflow-y-auto">
        <DialogHeader>
          <DialogTitle className="flex items-center space-x-3">
            <div className="w-10 h-10 bg-indexa-purple/10 rounded-lg flex items-center justify-center">
              {getRoleIcon(user.role)}
            </div>
            <div>
              <p className="text-lg font-semibold">{editData.name || user.email}</p>
              <p className="text-sm text-gray-500">{user.email}</p>
            </div>
          </DialogTitle>
          <DialogDescription>
            Visualizar e editar informações do membro da equipe INDEXA
          </DialogDescription>
        </DialogHeader>

        <div className="space-y-6">
          {/* Informações Básicas */}
          <Card>
            <CardHeader className="pb-3">
              <CardTitle className="text-lg flex items-center justify-between">
                Informações Básicas
                {!isEditing ? (
                  <Button
                    variant="outline"
                    size="sm"
                    onClick={() => setIsEditing(true)}
                  >
                    Editar
                  </Button>
                ) : (
                  <div className="flex space-x-2">
                    <Button
                      variant="outline"
                      size="sm"
                      onClick={() => setIsEditing(false)}
                    >
                      <X className="h-4 w-4 mr-1" />
                      Cancelar
                    </Button>
                    <Button
                      size="sm"
                      onClick={handleSave}
                      disabled={loading}
                      className="bg-indexa-purple hover:bg-indexa-purple/90"
                    >
                      <Save className="h-4 w-4 mr-1" />
                      Salvar
                    </Button>
                  </div>
                )}
              </CardTitle>
            </CardHeader>
            <CardContent className="space-y-4">
              <div className="grid grid-cols-2 gap-4">
                <div>
                  <Label>Email</Label>
                  <Input value={user.email} disabled className="bg-gray-50" />
                </div>
                <div>
                  <Label>Função</Label>
                  <div className="flex items-center h-10">
                    {getRoleBadge(user.role)}
                  </div>
                </div>
              </div>

              <div className="grid grid-cols-2 gap-4">
                <div>
                  <Label htmlFor="name">Nome Completo</Label>
                  <Input
                    id="name"
                    value={editData.name}
                    onChange={(e) => setEditData(prev => ({ ...prev, name: e.target.value }))}
                    disabled={!isEditing}
                    placeholder="Nome completo"
                  />
                </div>
                <div>
                  <Label htmlFor="telefone">Telefone</Label>
                  <Input
                    id="telefone"
                    value={editData.telefone}
                    onChange={(e) => setEditData(prev => ({ ...prev, telefone: e.target.value }))}
                    disabled={!isEditing}
                    placeholder="(11) 99999-9999"
                  />
                </div>
              </div>

              <div>
                <Label htmlFor="observacoes">Observações</Label>
                <Input
                  id="observacoes"
                  value={editData.observacoes}
                  onChange={(e) => setEditData(prev => ({ ...prev, observacoes: e.target.value }))}
                  disabled={!isEditing}
                  placeholder="Observações sobre o usuário"
                />
              </div>
            </CardContent>
          </Card>

          {/* Status da Conta */}
          <Card>
            <CardHeader className="pb-3">
              <CardTitle className="text-lg">Status da Conta</CardTitle>
            </CardHeader>
            <CardContent>
              <div className="grid grid-cols-2 gap-6">
                <div className="flex items-center space-x-3">
                  {user.email_confirmed_at ? (
                    <CheckCircle className="h-5 w-5 text-green-500" />
                  ) : (
                    <AlertCircle className="h-5 w-5 text-red-500" />
                  )}
                  <div>
                    <p className="font-medium">Email Verificado</p>
                    <p className="text-sm text-gray-500">
                      {user.email_confirmed_at ? 'Confirmado' : 'Não confirmado'}
                    </p>
                  </div>
                </div>

                <div className="flex items-center space-x-3">
                  <Calendar className="h-5 w-5 text-blue-500" />
                  <div>
                    <p className="font-medium">Membro desde</p>
                    <p className="text-sm text-gray-500">
                      {formatDate(user.data_criacao)}
                    </p>
                  </div>
                </div>

                <div className="flex items-center space-x-3">
                  <Clock className="h-5 w-5 text-purple-500" />
                  <div>
                    <p className="font-medium">Último Acesso</p>
                    <p className="text-sm text-gray-500">
                      {formatDate(user.last_sign_in_at)}
                    </p>
                  </div>
                </div>

                <div className="flex items-center space-x-3">
                  <CheckCircle className="h-5 w-5 text-green-500" />
                  <div>
                    <p className="font-medium">Email Confirmado em</p>
                    <p className="text-sm text-gray-500">
                      {formatDate(user.email_confirmed_at)}
                    </p>
                  </div>
                </div>
              </div>
            </CardContent>
          </Card>

          {/* Ações Administrativas - Apenas Super Admin */}
          {isSuperAdmin && (
            <Card className="border-red-200 bg-red-50">
              <CardHeader className="pb-3">
                <CardTitle className="text-lg text-red-800 flex items-center">
                  <Key className="h-5 w-5 mr-2" />
                  Ações de Super Admin
                </CardTitle>
              </CardHeader>
              <CardContent>
                <div className="space-y-3">
                  <p className="text-sm text-red-700">
                    As ações abaixo são exclusivas do Super Administrador.
                  </p>
                  
                  <div className="flex space-x-3">
                    <Button
                      variant="destructive"
                      size="sm"
                      onClick={handleResetPassword}
                      disabled={loading}
                    >
                      <Key className="h-4 w-4 mr-2" />
                      Resetar Senha para "indexa2025"
                    </Button>
                  </div>

                  <div className="text-xs text-red-600 bg-red-100 p-3 rounded-lg">
                    <p><strong>Lembrete de Segurança:</strong></p>
                    <p>• Apenas jefersonstilver@gmail.com é Super Admin permanente</p>
                    <p>• Outras contas jamais podem ser promovidas a Super Admin</p>
                    <p>• Senhas resetadas ficam como "indexa2025"</p>
                  </div>
                </div>
              </CardContent>
            </Card>
          )}

          {/* Informações Técnicas */}
          <Card>
            <CardHeader className="pb-3">
              <CardTitle className="text-lg">Informações Técnicas</CardTitle>
            </CardHeader>
            <CardContent>
              <div className="space-y-3 text-sm">
                <div className="flex justify-between">
                  <span className="text-gray-600">ID do Usuário:</span>
                  <span className="font-mono text-xs bg-gray-100 px-2 py-1 rounded">
                    {user.id}
                  </span>
                </div>
                <div className="flex justify-between">
                  <span className="text-gray-600">Método de Criação:</span>
                  <span>{user.raw_user_meta_data?.creation_method || 'Padrão'}</span>
                </div>
                {user.raw_user_meta_data?.created_by_admin && (
                  <div className="flex justify-between">
                    <span className="text-gray-600">Criado por Admin:</span>
                    <Badge variant="secondary">Sim</Badge>
                  </div>
                )}
              </div>
            </CardContent>
          </Card>
        </div>
      </DialogContent>
    </Dialog>
  );
};

export default UserDetailsDialog;
