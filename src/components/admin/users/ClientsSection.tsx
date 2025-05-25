
import React, { useState } from 'react';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Badge } from '@/components/ui/badge';
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from '@/components/ui/table';
import { 
  Users, 
  Search, 
  UserCheck,
  RefreshCw,
  Ban,
  RotateCcw,
  Trash2,
  Key,
  Eye,
  CheckCircle,
  XCircle,
  Clock
} from 'lucide-react';
import { supabase } from '@/integrations/supabase/client';
import { toast } from 'sonner';

interface User {
  id: string;
  email: string;
  role: string;
  data_criacao: string;
  email_confirmed_at?: string;
  last_sign_in_at?: string;
  raw_user_meta_data?: any;
  banned_until?: string;
}

interface ClientsSectionProps {
  users: User[];
  loading: boolean;
  onRefresh: () => void;
}

const ClientsSection: React.FC<ClientsSectionProps> = ({ users, loading, onRefresh }) => {
  const [searchTerm, setSearchTerm] = useState('');

  const clients = users.filter(user => user.role === 'client');

  const filteredClients = clients.filter(user =>
    user.email.toLowerCase().includes(searchTerm.toLowerCase()) ||
    (user.raw_user_meta_data?.name || '').toLowerCase().includes(searchTerm.toLowerCase())
  );

  const handleBlockUser = async (userId: string, userEmail: string) => {
    try {
      const banUntil = new Date();
      banUntil.setFullYear(banUntil.getFullYear() + 1); // Ban por 1 ano
      
      const { error } = await supabase.auth.admin.updateUserById(userId, {
        ban_duration: 'none',
        user_metadata: { banned_until: banUntil.toISOString() }
      });

      if (error) throw error;

      toast.success(`Cliente ${userEmail} bloqueado com sucesso`);
      onRefresh();
    } catch (error) {
      console.error('Erro ao bloquear usuário:', error);
      toast.error('Erro ao bloquear cliente');
    }
  };

  const handleUnblockUser = async (userId: string, userEmail: string) => {
    try {
      const { error } = await supabase.auth.admin.updateUserById(userId, {
        user_metadata: { banned_until: null }
      });

      if (error) throw error;

      toast.success(`Cliente ${userEmail} desbloqueado com sucesso`);
      onRefresh();
    } catch (error) {
      console.error('Erro ao desbloquear usuário:', error);
      toast.error('Erro ao desbloquear cliente');
    }
  };

  const handleResetPassword = async (userEmail: string) => {
    try {
      const { error } = await supabase.auth.resetPasswordForEmail(userEmail, {
        redirectTo: `${window.location.origin}/reset-password`
      });

      if (error) throw error;

      toast.success(`Email de reset enviado para ${userEmail}`);
    } catch (error) {
      console.error('Erro ao resetar senha:', error);
      toast.error('Erro ao enviar email de reset');
    }
  };

  const handleDeleteUser = async (userId: string, userEmail: string) => {
    const confirmDelete = window.confirm(
      `Tem certeza que deseja deletar o cliente ${userEmail}? Esta ação não pode ser desfeita.`
    );

    if (!confirmDelete) return;

    try {
      const { error } = await supabase.auth.admin.deleteUser(userId);

      if (error) throw error;

      toast.success(`Cliente ${userEmail} deletado com sucesso`);
      onRefresh();
    } catch (error) {
      console.error('Erro ao deletar usuário:', error);
      toast.error('Erro ao deletar cliente');
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

  const getStatusBadge = (user: User) => {
    // Verificar se está banido
    if (user.banned_until && new Date(user.banned_until) > new Date()) {
      return <Badge variant="destructive"><Ban className="h-3 w-3 mr-1" />Bloqueado</Badge>;
    }

    // Verificar se email foi confirmado
    if (!user.email_confirmed_at) {
      return <Badge variant="secondary"><XCircle className="h-3 w-3 mr-1" />Não Verificado</Badge>;
    }
    
    // Verificar atividade recente
    const lastSignIn = user.last_sign_in_at ? new Date(user.last_sign_in_at) : null;
    const thirtyDaysAgo = new Date();
    thirtyDaysAgo.setDate(thirtyDaysAgo.getDate() - 30);
    
    if (lastSignIn && lastSignIn > thirtyDaysAgo) {
      return <Badge className="bg-green-50 text-green-600 border-green-200"><CheckCircle className="h-3 w-3 mr-1" />Ativo</Badge>;
    } else {
      return <Badge variant="outline"><Clock className="h-3 w-3 mr-1" />Inativo</Badge>;
    }
  };

  const isUserBlocked = (user: User) => {
    return user.banned_until && new Date(user.banned_until) > new Date();
  };

  const stats = {
    total: clients.length,
    verified: clients.filter(u => u.email_confirmed_at).length,
    active: clients.filter(u => {
      const lastSignIn = u.last_sign_in_at ? new Date(u.last_sign_in_at) : null;
      const thirtyDaysAgo = new Date();
      thirtyDaysAgo.setDate(thirtyDaysAgo.getDate() - 30);
      return lastSignIn && lastSignIn > thirtyDaysAgo;
    }).length,
    blocked: clients.filter(u => isUserBlocked(u)).length,
  };

  return (
    <div className="space-y-6">
      {/* Header da Seção */}
      <div className="flex items-center justify-between">
        <div>
          <h2 className="text-xl font-bold text-gray-900 flex items-center">
            <Users className="h-6 w-6 mr-2 text-blue-600" />
            Base de Clientes
          </h2>
          <p className="text-gray-600 mt-1">
            Usuários finais e clientes do sistema INDEXA
          </p>
        </div>
        <Button 
          variant="outline" 
          onClick={onRefresh} 
          disabled={loading}
          className="flex items-center"
        >
          <RefreshCw className="h-4 w-4 mr-2" />
          Atualizar
        </Button>
      </div>

      {/* Estatísticas de Clientes */}
      <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Total de Clientes</CardTitle>
            <Users className="h-4 w-4 text-blue-600" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold text-blue-600">{stats.total}</div>
            <p className="text-xs text-gray-500 mt-1">clientes registrados</p>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Verificados</CardTitle>
            <CheckCircle className="h-4 w-4 text-green-500" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold text-green-500">{stats.verified}</div>
            <p className="text-xs text-gray-500 mt-1">emails confirmados</p>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Ativos</CardTitle>
            <UserCheck className="h-4 w-4 text-blue-500" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold text-blue-500">{stats.active}</div>
            <p className="text-xs text-gray-500 mt-1">últimos 30 dias</p>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Bloqueados</CardTitle>
            <Ban className="h-4 w-4 text-red-500" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold text-red-500">{stats.blocked}</div>
            <p className="text-xs text-gray-500 mt-1">clientes suspensos</p>
          </CardContent>
        </Card>
      </div>

      {/* Busca */}
      <Card>
        <CardHeader>
          <CardTitle className="text-lg flex items-center">
            <Search className="h-5 w-5 mr-2" />
            Buscar Clientes
          </CardTitle>
        </CardHeader>
        <CardContent>
          <Input
            placeholder="Buscar por email ou nome..."
            value={searchTerm}
            onChange={(e) => setSearchTerm(e.target.value)}
            className="max-w-md"
          />
        </CardContent>
      </Card>

      {/* Tabela de Clientes */}
      <Card>
        <CardHeader>
          <CardTitle className="text-lg">Lista de Clientes</CardTitle>
          <CardDescription>
            {filteredClients.length} cliente(s) encontrado(s)
          </CardDescription>
        </CardHeader>
        <CardContent>
          {loading ? (
            <div className="flex items-center justify-center py-12">
              <RefreshCw className="h-8 w-8 animate-spin text-blue-600" />
              <span className="ml-3 text-gray-600">Carregando clientes...</span>
            </div>
          ) : (
            <Table>
              <TableHeader>
                <TableRow>
                  <TableHead>Cliente</TableHead>
                  <TableHead>Status</TableHead>
                  <TableHead>Último Acesso</TableHead>
                  <TableHead>Data de Cadastro</TableHead>
                  <TableHead>Ações</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {filteredClients.length === 0 ? (
                  <TableRow>
                    <TableCell colSpan={5} className="text-center py-12 text-gray-500">
                      {clients.length === 0 ? 'Nenhum cliente encontrado' : 'Nenhum cliente corresponde à busca'}
                    </TableCell>
                  </TableRow>
                ) : (
                  filteredClients.map((user) => (
                    <TableRow key={user.id}>
                      <TableCell>
                        <div className="flex items-center space-x-3">
                          <div className="w-10 h-10 bg-blue-100 rounded-lg flex items-center justify-center">
                            <UserCheck className="h-5 w-5 text-blue-600" />
                          </div>
                          <div>
                            <p className="font-medium text-gray-900">{user.email}</p>
                            <p className="text-sm text-gray-500">
                              {user.raw_user_meta_data?.name || 'Nome não informado'}
                            </p>
                            {user.raw_user_meta_data?.cpf && (
                              <p className="text-xs text-gray-400">
                                CPF: {user.raw_user_meta_data.cpf}
                              </p>
                            )}
                          </div>
                        </div>
                      </TableCell>
                      <TableCell>
                        {getStatusBadge(user)}
                      </TableCell>
                      <TableCell className="text-gray-600">
                        {formatDate(user.last_sign_in_at)}
                      </TableCell>
                      <TableCell className="text-gray-600">
                        {formatDate(user.data_criacao)}
                      </TableCell>
                      <TableCell>
                        <div className="flex items-center space-x-2">
                          {isUserBlocked(user) ? (
                            <Button
                              variant="outline"
                              size="sm"
                              onClick={() => handleUnblockUser(user.id, user.email)}
                              className="text-green-600 hover:text-green-700"
                            >
                              <RotateCcw className="h-3 w-3 mr-1" />
                              Desbloquear
                            </Button>
                          ) : (
                            <Button
                              variant="outline"
                              size="sm"
                              onClick={() => handleBlockUser(user.id, user.email)}
                              className="text-red-600 hover:text-red-700"
                            >
                              <Ban className="h-3 w-3 mr-1" />
                              Bloquear
                            </Button>
                          )}
                          
                          <Button
                            variant="outline"
                            size="sm"
                            onClick={() => handleResetPassword(user.email)}
                          >
                            <Key className="h-3 w-3 mr-1" />
                            Reset Senha
                          </Button>
                          
                          <Button
                            variant="outline"
                            size="sm"
                            onClick={() => handleDeleteUser(user.id, user.email)}
                            className="text-red-600 hover:text-red-700"
                          >
                            <Trash2 className="h-3 w-3" />
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

export default ClientsSection;
