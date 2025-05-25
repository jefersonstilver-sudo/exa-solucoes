
import React, { useState, useEffect } from 'react';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Badge } from '@/components/ui/badge';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
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
  Plus, 
  Search, 
  Crown, 
  Shield, 
  UserCheck, 
  RefreshCw,
  Database,
  CheckCircle,
  Mail,
  Activity
} from 'lucide-react';
import { supabase } from '@/integrations/supabase/client';
import { toast } from 'sonner';

interface User {
  id: string;
  email: string;
  role: string;
  data_criacao: string;
}

const UsersPage = () => {
  const [users, setUsers] = useState<User[]>([]);
  const [loading, setLoading] = useState(true);
  const [searchTerm, setSearchTerm] = useState('');

  const fetchUsers = async () => {
    try {
      setLoading(true);
      console.log('👥 USERS PAGE: Buscando todos os usuários do Supabase...');
      
      const { data, error } = await supabase
        .from('users')
        .select('*')
        .order('data_criacao', { ascending: false });

      if (error) {
        console.error('❌ ERRO ao buscar usuários:', error);
        toast.error('Erro ao carregar usuários');
        return;
      }

      console.log('✅ USUÁRIOS CARREGADOS:', data?.length, data);
      setUsers(data || []);
      toast.success(`${data?.length || 0} usuários carregados com sucesso`);
    } catch (error) {
      console.error('💥 ERRO CRÍTICO:', error);
      toast.error('Erro crítico ao carregar usuários');
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchUsers();
  }, []);

  const getRoleIcon = (role: string) => {
    switch (role) {
      case 'super_admin':
        return <Crown className="h-4 w-4 text-indexa-mint" />;
      case 'admin':
        return <Shield className="h-4 w-4 text-blue-400" />;
      default:
        return <UserCheck className="h-4 w-4 text-gray-400" />;
    }
  };

  const getRoleBadge = (role: string) => {
    switch (role) {
      case 'super_admin':
        return (
          <Badge className="bg-gradient-to-r from-indexa-mint to-indexa-mint-dark text-indexa-purple-dark border-indexa-mint font-bold">
            <Crown className="h-3 w-3 mr-1" />
            Super Admin
          </Badge>
        );
      case 'admin':
        return (
          <Badge className="bg-blue-500/20 text-blue-400 border-blue-500/30 font-bold">
            <Shield className="h-3 w-3 mr-1" />
            Admin
          </Badge>
        );
      default:
        return (
          <Badge variant="secondary" className="font-bold">
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

  const filteredUsers = users.filter(user =>
    user.email.toLowerCase().includes(searchTerm.toLowerCase()) ||
    user.role.toLowerCase().includes(searchTerm.toLowerCase())
  );

  const stats = {
    total: users.length,
    superAdmins: users.filter(u => u.role === 'super_admin').length,
    admins: users.filter(u => u.role === 'admin').length,
    clients: users.filter(u => u.role === 'client').length,
  };

  return (
    <div className="min-h-screen bg-gradient-to-br from-indexa-purple-dark via-indexa-purple to-indexa-purple-dark p-6">
      <div className="max-w-7xl mx-auto space-y-8">
        {/* Header */}
        <div className="flex items-center justify-between">
          <div>
            <h1 className="text-4xl font-black text-white flex items-center">
              <Users className="h-10 w-10 mr-4 text-indexa-mint" />
              Gestão de Usuários
            </h1>
            <p className="text-white/70 mt-2 flex items-center text-lg">
              <Database className="h-5 w-5 mr-2 text-indexa-mint" />
              Sistema INDEXA conectado ao Supabase • {stats.total} usuários registrados
            </p>
          </div>
          <div className="flex items-center space-x-3">
            <Button 
              variant="outline" 
              onClick={fetchUsers} 
              disabled={loading}
              className="border-indexa-mint text-indexa-mint hover:bg-indexa-mint hover:text-indexa-purple-dark font-bold"
            >
              <RefreshCw className="h-4 w-4 mr-2" />
              Atualizar
            </Button>
            <Button className="bg-gradient-to-r from-indexa-mint to-indexa-mint-dark hover:from-indexa-mint-dark hover:to-indexa-mint text-indexa-purple-dark font-bold px-6 py-3 rounded-xl shadow-lg">
              <Plus className="h-5 w-5 mr-2" />
              Novo Usuário
            </Button>
          </div>
        </div>

        {/* Status da conexão */}
        <Card className="bg-green-500/20 border-green-400/30 backdrop-blur-xl">
          <CardContent className="p-6">
            <div className="flex items-center space-x-4">
              <CheckCircle className="h-8 w-8 text-green-400" />
              <div>
                <h3 className="font-bold text-green-300 text-lg">Conectado ao Supabase com Sucesso!</h3>
                <p className="text-green-200">
                  {stats.total} usuários carregados: {stats.superAdmins} super admins, {stats.admins} admins, {stats.clients} clientes
                </p>
              </div>
            </div>
          </CardContent>
        </Card>

        {/* Estatísticas */}
        <div className="grid grid-cols-1 md:grid-cols-4 gap-6">
          <Card className="bg-white/10 backdrop-blur-xl border-white/20 shadow-xl">
            <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
              <CardTitle className="text-sm font-bold text-white/90">Total de Usuários</CardTitle>
              <Users className="h-5 w-5 text-indexa-mint" />
            </CardHeader>
            <CardContent>
              <div className="text-3xl font-black text-white">{stats.total}</div>
              <p className="text-xs text-indexa-mint/80 mt-1">usuários registrados</p>
            </CardContent>
          </Card>

          <Card className="bg-white/10 backdrop-blur-xl border-white/20 shadow-xl">
            <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
              <CardTitle className="text-sm font-bold text-white/90">Super Admins</CardTitle>
              <Crown className="h-5 w-5 text-indexa-mint" />
            </CardHeader>
            <CardContent>
              <div className="text-3xl font-black text-indexa-mint">{stats.superAdmins}</div>
              <p className="text-xs text-indexa-mint/80 mt-1">acesso total</p>
            </CardContent>
          </Card>

          <Card className="bg-white/10 backdrop-blur-xl border-white/20 shadow-xl">
            <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
              <CardTitle className="text-sm font-bold text-white/90">Administradores</CardTitle>
              <Shield className="h-5 w-5 text-blue-400" />
            </CardHeader>
            <CardContent>
              <div className="text-3xl font-black text-blue-400">{stats.admins}</div>
              <p className="text-xs text-blue-300/80 mt-1">acesso limitado</p>
            </CardContent>
          </Card>

          <Card className="bg-white/10 backdrop-blur-xl border-white/20 shadow-xl">
            <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
              <CardTitle className="text-sm font-bold text-white/90">Clientes</CardTitle>
              <UserCheck className="h-5 w-5 text-green-400" />
            </CardHeader>
            <CardContent>
              <div className="text-3xl font-black text-green-400">{stats.clients}</div>
              <p className="text-xs text-green-300/80 mt-1">usuários finais</p>
            </CardContent>
          </Card>
        </div>

        {/* Tabs */}
        <Tabs defaultValue="users" className="space-y-6">
          <TabsList className="bg-white/10 backdrop-blur-xl border border-white/20 rounded-xl p-1">
            <TabsTrigger 
              value="users" 
              className="data-[state=active]:bg-indexa-mint/20 data-[state=active]:text-white text-white/70 font-bold"
            >
              <Users className="h-4 w-4 mr-2" />
              Usuários ({stats.total})
            </TabsTrigger>
            <TabsTrigger 
              value="activity" 
              className="data-[state=active]:bg-indexa-mint/20 data-[state=active]:text-white text-white/70 font-bold"
            >
              <Activity className="h-4 w-4 mr-2" />
              Atividade
            </TabsTrigger>
          </TabsList>

          <TabsContent value="users" className="space-y-6">
            {/* Busca */}
            <Card className="bg-white/10 backdrop-blur-xl border-white/20 shadow-xl">
              <CardHeader>
                <CardTitle className="text-white flex items-center">
                  <Search className="h-5 w-5 mr-2 text-indexa-mint" />
                  Buscar Usuários
                </CardTitle>
              </CardHeader>
              <CardContent>
                <Input
                  placeholder="Buscar por email ou função..."
                  value={searchTerm}
                  onChange={(e) => setSearchTerm(e.target.value)}
                  className="bg-white/10 border-white/20 text-white placeholder-white/50 focus:border-indexa-mint max-w-md"
                />
              </CardContent>
            </Card>

            {/* Tabela de usuários */}
            <Card className="bg-white/10 backdrop-blur-xl border-white/20 shadow-xl">
              <CardHeader>
                <CardTitle className="text-white">Lista de Usuários ({filteredUsers.length})</CardTitle>
                <CardDescription className="text-white/70">
                  Usuários cadastrados no sistema INDEXA
                </CardDescription>
              </CardHeader>
              <CardContent>
                {loading ? (
                  <div className="flex items-center justify-center py-12">
                    <RefreshCw className="h-12 w-12 animate-spin text-indexa-mint" />
                    <span className="ml-4 text-white text-lg">Carregando usuários do Supabase...</span>
                  </div>
                ) : (
                  <Table>
                    <TableHeader>
                      <TableRow className="border-white/10 hover:bg-white/5">
                        <TableHead className="text-indexa-mint font-bold text-sm">Usuário</TableHead>
                        <TableHead className="text-indexa-mint font-bold text-sm">Função</TableHead>
                        <TableHead className="text-indexa-mint font-bold text-sm">Data de Criação</TableHead>
                        <TableHead className="text-indexa-mint font-bold text-sm">ID</TableHead>
                      </TableRow>
                    </TableHeader>
                    <TableBody>
                      {filteredUsers.length === 0 ? (
                        <TableRow>
                          <TableCell colSpan={4} className="text-center py-12 text-white/60 text-lg">
                            {users.length === 0 ? 'Nenhum usuário encontrado no Supabase' : 'Nenhum usuário corresponde à busca'}
                          </TableCell>
                        </TableRow>
                      ) : (
                        filteredUsers.map((user) => (
                          <TableRow key={user.id} className="border-white/10 hover:bg-white/5 transition-colors duration-200">
                            <TableCell>
                              <div className="flex items-center space-x-4">
                                <div className="w-12 h-12 bg-gradient-to-br from-indexa-mint to-indexa-mint-dark rounded-xl flex items-center justify-center shadow-lg">
                                  {getRoleIcon(user.role)}
                                </div>
                                <div>
                                  <p className="font-bold text-white text-base">{user.email}</p>
                                  <p className="text-sm text-white/60 flex items-center">
                                    <Mail className="h-3 w-3 mr-1" />
                                    Email verificado
                                  </p>
                                </div>
                              </div>
                            </TableCell>
                            <TableCell>
                              {getRoleBadge(user.role)}
                            </TableCell>
                            <TableCell className="text-white/90 font-medium">
                              {formatDate(user.data_criacao)}
                            </TableCell>
                            <TableCell>
                              <code className="text-xs bg-white/10 text-indexa-mint px-3 py-1 rounded-lg border border-white/20">
                                {user.id.substring(0, 8)}...
                              </code>
                            </TableCell>
                          </TableRow>
                        ))
                      )}
                    </TableBody>
                  </Table>
                )}
              </CardContent>
            </Card>
          </TabsContent>

          <TabsContent value="activity">
            <Card className="bg-white/10 backdrop-blur-xl border-white/20 shadow-xl">
              <CardHeader>
                <CardTitle className="text-white">Log de Atividades</CardTitle>
                <CardDescription className="text-white/70">
                  Monitore as ações dos usuários no sistema
                </CardDescription>
              </CardHeader>
              <CardContent>
                <div className="text-center py-12">
                  <Activity className="h-16 w-16 text-white/30 mx-auto mb-4" />
                  <p className="text-white/60 text-lg">Funcionalidade em desenvolvimento...</p>
                  <p className="text-white/40 text-sm mt-2">Em breve você poderá monitorar todas as atividades dos usuários</p>
                </div>
              </CardContent>
            </Card>
          </TabsContent>
        </Tabs>
      </div>
    </div>
  );
};

export default UsersPage;
