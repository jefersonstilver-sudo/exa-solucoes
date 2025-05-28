
import React, { useState } from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Badge } from '@/components/ui/badge';
import { Checkbox } from '@/components/ui/checkbox';
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from '@/components/ui/table';
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
} from '@/components/ui/dialog';
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select';
import { Label } from '@/components/ui/label';
import { 
  Users, 
  Plus, 
  Search, 
  Crown, 
  Shield, 
  UserCheck, 
  RefreshCw,
  Trash2,
  Edit,
  UserPlus,
  Copy
} from 'lucide-react';
import { supabase } from '@/integrations/supabase/client';
import { toast } from 'sonner';

interface User {
  id: string;
  email: string;
  role: string;
  data_criacao: string;
}

interface UserManagementPanelProps {
  users: User[];
  loading: boolean;
  onRefresh: () => void;
}

const UserManagementPanel: React.FC<UserManagementPanelProps> = ({ users, loading, onRefresh }) => {
  const [selectedUsers, setSelectedUsers] = useState<string[]>([]);
  const [searchTerm, setSearchTerm] = useState('');
  const [isCreateDialogOpen, setIsCreateDialogOpen] = useState(false);
  const [newUserEmail, setNewUserEmail] = useState('');
  const [newUserRole, setNewUserRole] = useState('admin');
  const [creating, setCreating] = useState(false);

  const filteredUsers = users.filter(user =>
    user.email.toLowerCase().includes(searchTerm.toLowerCase()) ||
    user.role.toLowerCase().includes(searchTerm.toLowerCase())
  );

  const handleSelectAll = (checked: boolean) => {
    if (checked) {
      setSelectedUsers(filteredUsers.map(user => user.id));
    } else {
      setSelectedUsers([]);
    }
  };

  const handleSelectUser = (userId: string, checked: boolean) => {
    if (checked) {
      setSelectedUsers(prev => [...prev, userId]);
    } else {
      setSelectedUsers(prev => prev.filter(id => id !== userId));
    }
  };

  const createAdminAccount = async () => {
    if (!newUserEmail.trim()) {
      toast.error('Email é obrigatório');
      return;
    }

    try {
      setCreating(true);
      console.log('🔨 Criando nova conta administrativa:', { email: newUserEmail, role: newUserRole });

      // Criar usuário no Supabase Auth
      const { data: authData, error: authError } = await supabase.auth.signUp({
        email: newUserEmail,
        password: 'indexa2025',
        options: {
          data: {
            role: newUserRole
          }
        }
      });

      if (authError) {
        console.error('❌ Erro ao criar usuário:', authError);
        toast.error('Erro ao criar usuário: ' + authError.message);
        return;
      }

      console.log('✅ Usuário criado no Auth:', authData);

      // Inserir na tabela users se não existir (trigger automático deve fazer isso)
      if (authData.user) {
        const { error: insertError } = await supabase
          .from('users')
          .upsert({
            id: authData.user.id,
            email: newUserEmail,
            role: newUserRole,
            data_criacao: new Date().toISOString()
          });

        if (insertError) {
          console.error('❌ Erro ao inserir na tabela users:', insertError);
        }
      }

      toast.success(`Conta administrativa criada com sucesso!`, {
        description: `Email: ${newUserEmail} | Senha: indexa2025`
      });

      // Copiar credenciais para área de transferência
      const credentials = `Email: ${newUserEmail}\nSenha: indexa2025\nRole: ${newUserRole}`;
      navigator.clipboard.writeText(credentials);
      toast.info('Credenciais copiadas para área de transferência');

      // Limpar formulário e fechar dialog
      setNewUserEmail('');
      setNewUserRole('admin');
      setIsCreateDialogOpen(false);
      
      // Atualizar lista
      onRefresh();

    } catch (error: any) {
      console.error('💥 Erro crítico:', error);
      toast.error('Erro crítico ao criar conta');
    } finally {
      setCreating(false);
    }
  };

  const deleteSelectedUsers = async () => {
    if (selectedUsers.length === 0) {
      toast.error('Nenhum usuário selecionado');
      return;
    }

    const confirmDelete = confirm(`Deseja realmente excluir ${selectedUsers.length} usuário(s)? Esta ação não pode ser desfeita.`);
    if (!confirmDelete) return;

    try {
      console.log('🗑️ Excluindo usuários selecionados:', selectedUsers);
      
      // Por enquanto, apenas simular exclusão
      toast.info('Funcionalidade de exclusão em desenvolvimento');
      
    } catch (error: any) {
      console.error('💥 Erro ao excluir usuários:', error);
      toast.error('Erro ao excluir usuários');
    }
  };

  const getRoleIcon = (role: string) => {
    switch (role) {
      case 'super_admin':
        return <Crown className="h-4 w-4 text-yellow-500" />;
      case 'admin':
        return <Shield className="h-4 w-4 text-blue-500" />;
      default:
        return <UserCheck className="h-4 w-4 text-gray-500" />;
    }
  };

  const getRoleBadge = (role: string) => {
    switch (role) {
      case 'super_admin':
        return (
          <Badge className="bg-yellow-100 text-yellow-800 border-yellow-300">
            <Crown className="h-3 w-3 mr-1" />
            Super Admin
          </Badge>
        );
      case 'admin':
        return (
          <Badge className="bg-blue-100 text-blue-800 border-blue-300">
            <Shield className="h-3 w-3 mr-1" />
            Admin
          </Badge>
        );
      default:
        return (
          <Badge variant="secondary">
            <UserCheck className="h-3 w-3 mr-1" />
            Cliente
          </Badge>
        );
    }
  };

  const formatDate = (dateString: string) => {
    return new Intl.DateTimeFormat('pt-BR', {
      day: '2-digit',
      month: '2-digit',
      year: 'numeric',
      hour: '2-digit',
      minute: '2-digit'
    }).format(new Date(dateString));
  };

  return (
    <div className="space-y-6">
      {/* Header com ações */}
      <div className="flex items-center justify-between">
        <div>
          <h2 className="text-2xl font-bold text-black">Gestão de Usuários</h2>
          <p className="text-gray-600">Gerenciar contas administrativas e usuários do sistema</p>
        </div>
        <div className="flex items-center space-x-3">
          <Button variant="outline" onClick={onRefresh} disabled={loading}>
            <RefreshCw className="h-4 w-4 mr-2" />
            Atualizar
          </Button>
          <Dialog open={isCreateDialogOpen} onOpenChange={setIsCreateDialogOpen}>
            <DialogTrigger asChild>
              <Button className="bg-indexa-purple hover:bg-indexa-purple-dark text-white">
                <UserPlus className="h-4 w-4 mr-2" />
                Novo Admin
              </Button>
            </DialogTrigger>
            <DialogContent className="bg-white">
              <DialogHeader>
                <DialogTitle className="text-black">Criar Nova Conta Administrativa</DialogTitle>
                <DialogDescription className="text-gray-600">
                  Crie uma nova conta com senha padrão "indexa2025"
                </DialogDescription>
              </DialogHeader>
              <div className="space-y-4">
                <div>
                  <Label htmlFor="email" className="text-black">Email</Label>
                  <Input
                    id="email"
                    type="email"
                    value={newUserEmail}
                    onChange={(e) => setNewUserEmail(e.target.value)}
                    placeholder="admin@indexa.com"
                    className="bg-white border-gray-300 text-black"
                  />
                </div>
                <div>
                  <Label htmlFor="role" className="text-black">Função</Label>
                  <Select value={newUserRole} onValueChange={setNewUserRole}>
                    <SelectTrigger className="bg-white border-gray-300 text-black">
                      <SelectValue />
                    </SelectTrigger>
                    <SelectContent className="bg-white border-gray-300">
                      <SelectItem value="admin">Administrador</SelectItem>
                      <SelectItem value="super_admin">Super Administrador</SelectItem>
                    </SelectContent>
                  </Select>
                </div>
                <div className="bg-gray-100 p-3 rounded-lg">
                  <p className="text-sm text-gray-600">
                    <strong>Senha padrão:</strong> indexa2025
                  </p>
                </div>
              </div>
              <DialogFooter>
                <Button variant="outline" onClick={() => setIsCreateDialogOpen(false)}>
                  Cancelar
                </Button>
                <Button 
                  onClick={createAdminAccount}
                  disabled={creating}
                  className="bg-indexa-purple hover:bg-indexa-purple-dark text-white"
                >
                  {creating ? 'Criando...' : 'Criar Conta'}
                </Button>
              </DialogFooter>
            </DialogContent>
          </Dialog>
        </div>
      </div>

      {/* Busca e ações em lote */}
      <Card className="bg-white border-gray-200">
        <CardHeader>
          <CardTitle className="text-black">Buscar e Filtrar</CardTitle>
        </CardHeader>
        <CardContent>
          <div className="flex items-center justify-between gap-4">
            <div className="flex-1">
              <div className="relative">
                <Search className="absolute left-3 top-3 h-4 w-4 text-gray-400" />
                <Input
                  placeholder="Buscar por email ou função..."
                  value={searchTerm}
                  onChange={(e) => setSearchTerm(e.target.value)}
                  className="pl-10 bg-white border-gray-300 text-black"
                />
              </div>
            </div>
            {selectedUsers.length > 0 && (
              <div className="flex items-center space-x-2">
                <Badge variant="secondary">{selectedUsers.length} selecionados</Badge>
                <Button
                  variant="outline"
                  size="sm"
                  onClick={deleteSelectedUsers}
                  className="text-red-600 border-red-300 hover:bg-red-50"
                >
                  <Trash2 className="h-4 w-4 mr-1" />
                  Excluir
                </Button>
              </div>
            )}
          </div>
        </CardContent>
      </Card>

      {/* Tabela de usuários */}
      <Card className="bg-white border-gray-200">
        <CardHeader>
          <CardTitle className="text-black">Lista de Usuários ({filteredUsers.length})</CardTitle>
        </CardHeader>
        <CardContent>
          {loading ? (
            <div className="flex items-center justify-center py-8">
              <RefreshCw className="h-8 w-8 animate-spin text-indexa-purple" />
              <span className="ml-2 text-black">Carregando usuários...</span>
            </div>
          ) : (
            <Table>
              <TableHeader>
                <TableRow>
                  <TableHead className="w-12">
                    <Checkbox
                      checked={selectedUsers.length === filteredUsers.length && filteredUsers.length > 0}
                      onCheckedChange={handleSelectAll}
                    />
                  </TableHead>
                  <TableHead className="text-black">Email</TableHead>
                  <TableHead className="text-black">Função</TableHead>
                  <TableHead className="text-black">Data de Criação</TableHead>
                  <TableHead className="text-black">ID</TableHead>
                  <TableHead className="text-black">Ações</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {filteredUsers.length === 0 ? (
                  <TableRow>
                    <TableCell colSpan={6} className="text-center py-8 text-gray-500">
                      {users.length === 0 ? 'Nenhum usuário encontrado' : 'Nenhum usuário corresponde à busca'}
                    </TableCell>
                  </TableRow>
                ) : (
                  filteredUsers.map((user) => (
                    <TableRow key={user.id}>
                      <TableCell>
                        <Checkbox
                          checked={selectedUsers.includes(user.id)}
                          onCheckedChange={(checked) => handleSelectUser(user.id, checked as boolean)}
                        />
                      </TableCell>
                      <TableCell>
                        <div className="flex items-center space-x-3">
                          <div className="w-8 h-8 bg-gray-100 rounded-full flex items-center justify-center">
                            {getRoleIcon(user.role)}
                          </div>
                          <span className="font-medium text-black">{user.email}</span>
                        </div>
                      </TableCell>
                      <TableCell>
                        {getRoleBadge(user.role)}
                      </TableCell>
                      <TableCell className="text-black">
                        {formatDate(user.data_criacao)}
                      </TableCell>
                      <TableCell>
                        <code className="text-xs bg-gray-100 px-2 py-1 rounded text-black">
                          {user.id.substring(0, 8)}...
                        </code>
                      </TableCell>
                      <TableCell>
                        <div className="flex space-x-2">
                          <Button variant="ghost" size="sm">
                            <Edit className="h-4 w-4" />
                          </Button>
                          <Button variant="ghost" size="sm" className="text-red-600 hover:bg-red-50">
                            <Trash2 className="h-4 w-4" />
                          </Button>
                        </div>
                      </TableCell>
                    </TableRow>
                  ))
                )}
              </TableBody>
            </Table>
          )}
        </CardContent>
      </Card>
    </div>
  );
};

export default UserManagementPanel;
