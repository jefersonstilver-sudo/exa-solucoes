
import React, { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { 
  Users, 
  Plus, 
  Search, 
  Filter, 
  MoreVertical, 
  Edit, 
  Trash2, 
  Shield, 
  Crown,
  UserCheck,
  UserX,
  Activity,
  Mail
} from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from '@/components/ui/table';
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuLabel,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from '@/components/ui/dropdown-menu';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';

// Mock data para demonstração
const mockUsers = [
  {
    id: 1,
    name: 'Jefferson Stilver',
    email: 'jefersonstilver@gmail.com',
    role: 'super_admin',
    status: 'active',
    lastLogin: '2024-01-15 14:30',
    createdAt: '2023-06-01'
  },
  {
    id: 2,
    name: 'Admin Teste',
    email: 'admin@indexa.com',
    role: 'admin',
    status: 'active',
    lastLogin: '2024-01-14 09:15',
    createdAt: '2023-08-15'
  },
  {
    id: 3,
    name: 'Cliente Demo',
    email: 'cliente@exemplo.com',
    role: 'client',
    status: 'inactive',
    lastLogin: '2024-01-10 16:45',
    createdAt: '2023-12-01'
  }
];

const UsersPage = () => {
  const navigate = useNavigate();
  const [searchTerm, setSearchTerm] = useState('');
  const [selectedFilter, setSelectedFilter] = useState('all');

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
          <span className="inline-flex items-center px-3 py-1 rounded-full text-xs font-bold bg-indexa-mint/20 text-indexa-mint border border-indexa-mint/30">
            <Crown className="h-3 w-3 mr-1" />
            Super Admin
          </span>
        );
      case 'admin':
        return (
          <span className="inline-flex items-center px-3 py-1 rounded-full text-xs font-bold bg-blue-500/20 text-blue-400 border border-blue-500/30">
            <Shield className="h-3 w-3 mr-1" />
            Admin
          </span>
        );
      default:
        return (
          <span className="inline-flex items-center px-3 py-1 rounded-full text-xs font-bold bg-gray-500/20 text-gray-400 border border-gray-500/30">
            <UserCheck className="h-3 w-3 mr-1" />
            Cliente
          </span>
        );
    }
  };

  const getStatusBadge = (status: string) => {
    return status === 'active' ? (
      <span className="inline-flex items-center px-2 py-1 rounded-full text-xs font-bold bg-green-500/20 text-green-400 border border-green-500/30">
        <Activity className="h-3 w-3 mr-1" />
        Ativo
      </span>
    ) : (
      <span className="inline-flex items-center px-2 py-1 rounded-full text-xs font-bold bg-red-500/20 text-red-400 border border-red-500/30">
        <UserX className="h-3 w-3 mr-1" />
        Inativo
      </span>
    );
  };

  const stats = [
    {
      title: 'Total de Usuários',
      value: '3',
      change: '+2 este mês',
      icon: <Users className="h-6 w-6 text-indexa-mint" />
    },
    {
      title: 'Super Admins',
      value: '1',
      change: 'Acesso total',
      icon: <Crown className="h-6 w-6 text-indexa-mint" />
    },
    {
      title: 'Administradores',
      value: '1',
      change: 'Acesso limitado',
      icon: <Shield className="h-6 w-6 text-blue-400" />
    },
    {
      title: 'Usuários Ativos',
      value: '2',
      change: '66% do total',
      icon: <Activity className="h-6 w-6 text-green-400" />
    }
  ];

  return (
    <div className="space-y-8">
      {/* Header da página */}
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-3xl font-black text-white flex items-center">
            <Users className="h-8 w-8 mr-3 text-indexa-mint" />
            Gestão de Usuários
          </h1>
          <p className="text-white/70 mt-2 flex items-center">
            <Shield className="h-4 w-4 mr-2 text-indexa-mint" />
            Controle total de acesso ao sistema INDEXA
          </p>
        </div>
        <Button 
          onClick={() => navigate('/super_admin/usuarios/novo')}
          className="bg-gradient-to-r from-indexa-mint to-indexa-mint-dark hover:from-indexa-mint-dark hover:to-indexa-mint text-indexa-purple-dark font-bold px-6 py-3 rounded-xl shadow-lg shadow-indexa-mint/20 transition-all duration-300"
        >
          <Plus className="h-5 w-5 mr-2" />
          Novo Usuário
        </Button>
      </div>

      {/* Cards de estatísticas */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
        {stats.map((stat, index) => (
          <Card key={index} className="bg-white/5 backdrop-blur-xl border-white/10 shadow-xl shadow-indexa-purple-dark/20 hover:bg-white/10 transition-all duration-300">
            <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
              <CardTitle className="text-sm font-bold text-white/80">{stat.title}</CardTitle>
              {stat.icon}
            </CardHeader>
            <CardContent>
              <div className="text-2xl font-black text-white">{stat.value}</div>
              <p className="text-xs text-indexa-mint/80 mt-1">{stat.change}</p>
            </CardContent>
          </Card>
        ))}
      </div>

      {/* Área principal com tabs */}
      <Tabs defaultValue="users" className="space-y-6">
        <TabsList className="bg-white/10 backdrop-blur-xl border border-white/20 rounded-xl p-1">
          <TabsTrigger value="users" className="data-[state=active]:bg-indexa-mint/20 data-[state=active]:text-white text-white/70 font-bold">
            Usuários
          </TabsTrigger>
          <TabsTrigger value="permissions" className="data-[state=active]:bg-indexa-mint/20 data-[state=active]:text-white text-white/70 font-bold">
            Permissões
          </TabsTrigger>
          <TabsTrigger value="activity" className="data-[state=active]:bg-indexa-mint/20 data-[state=active]:text-white text-white/70 font-bold">
            Atividade
          </TabsTrigger>
        </TabsList>

        <TabsContent value="users" className="space-y-6">
          {/* Controles de filtro e busca */}
          <Card className="bg-white/5 backdrop-blur-xl border-white/10 shadow-xl">
            <CardHeader>
              <CardTitle className="text-white flex items-center">
                <Search className="h-5 w-5 mr-2 text-indexa-mint" />
                Buscar e Filtrar
              </CardTitle>
            </CardHeader>
            <CardContent>
              <div className="flex flex-col md:flex-row gap-4">
                <div className="flex-1">
                  <Input
                    placeholder="Buscar por nome ou email..."
                    value={searchTerm}
                    onChange={(e) => setSearchTerm(e.target.value)}
                    className="bg-white/10 border-white/20 text-white placeholder-white/50 focus:border-indexa-mint"
                  />
                </div>
                <Button variant="outline" className="border-white/20 text-white hover:bg-white/10">
                  <Filter className="h-4 w-4 mr-2" />
                  Filtros
                </Button>
              </div>
            </CardContent>
          </Card>

          {/* Tabela de usuários premium */}
          <Card className="bg-white/5 backdrop-blur-xl border-white/10 shadow-xl">
            <CardHeader>
              <CardTitle className="text-white">Lista de Usuários</CardTitle>
              <CardDescription className="text-white/70">
                Gerencie todos os usuários do sistema INDEXA
              </CardDescription>
            </CardHeader>
            <CardContent>
              <Table>
                <TableHeader>
                  <TableRow className="border-white/10 hover:bg-white/5">
                    <TableHead className="text-indexa-mint font-bold">Usuário</TableHead>
                    <TableHead className="text-indexa-mint font-bold">Função</TableHead>
                    <TableHead className="text-indexa-mint font-bold">Status</TableHead>
                    <TableHead className="text-indexa-mint font-bold">Último Login</TableHead>
                    <TableHead className="text-indexa-mint font-bold">Ações</TableHead>
                  </TableRow>
                </TableHeader>
                <TableBody>
                  {mockUsers.map((user) => (
                    <TableRow key={user.id} className="border-white/10 hover:bg-white/5 transition-colors duration-200">
                      <TableCell>
                        <div className="flex items-center space-x-3">
                          <div className="w-10 h-10 bg-gradient-to-br from-indexa-mint to-indexa-mint-dark rounded-lg flex items-center justify-center">
                            <span className="text-indexa-purple-dark font-bold text-sm">
                              {user.name.charAt(0)}
                            </span>
                          </div>
                          <div>
                            <p className="font-bold text-white">{user.name}</p>
                            <p className="text-sm text-white/60 flex items-center">
                              <Mail className="h-3 w-3 mr-1" />
                              {user.email}
                            </p>
                          </div>
                        </div>
                      </TableCell>
                      <TableCell>
                        {getRoleBadge(user.role)}
                      </TableCell>
                      <TableCell>
                        {getStatusBadge(user.status)}
                      </TableCell>
                      <TableCell className="text-white/80">
                        {user.lastLogin}
                      </TableCell>
                      <TableCell>
                        <DropdownMenu>
                          <DropdownMenuTrigger asChild>
                            <Button variant="ghost" size="icon" className="text-white/60 hover:text-white hover:bg-white/10">
                              <MoreVertical className="h-4 w-4" />
                            </Button>
                          </DropdownMenuTrigger>
                          <DropdownMenuContent align="end" className="bg-indexa-purple-dark/95 backdrop-blur-xl border-white/10">
                            <DropdownMenuLabel className="text-indexa-mint">Ações</DropdownMenuLabel>
                            <DropdownMenuSeparator className="bg-white/10" />
                            <DropdownMenuItem className="text-white hover:bg-white/10">
                              <Edit className="mr-2 h-4 w-4 text-indexa-mint" />
                              Editar
                            </DropdownMenuItem>
                            <DropdownMenuItem className="text-red-400 hover:bg-red-500/10">
                              <Trash2 className="mr-2 h-4 w-4" />
                              Excluir
                            </DropdownMenuItem>
                          </DropdownMenuContent>
                        </DropdownMenu>
                      </TableCell>
                    </TableRow>
                  ))}
                </TableBody>
              </Table>
            </CardContent>
          </Card>
        </TabsContent>

        <TabsContent value="permissions">
          <Card className="bg-white/5 backdrop-blur-xl border-white/10 shadow-xl">
            <CardHeader>
              <CardTitle className="text-white">Gestão de Permissões</CardTitle>
              <CardDescription className="text-white/70">
                Configure as permissões por função
              </CardDescription>
            </CardHeader>
            <CardContent>
              <p className="text-white/60">Funcionalidade em desenvolvimento...</p>
            </CardContent>
          </Card>
        </TabsContent>

        <TabsContent value="activity">
          <Card className="bg-white/5 backdrop-blur-xl border-white/10 shadow-xl">
            <CardHeader>
              <CardTitle className="text-white">Log de Atividades</CardTitle>
              <CardDescription className="text-white/70">
                Monitore as ações dos usuários no sistema
              </CardDescription>
            </CardHeader>
            <CardContent>
              <p className="text-white/60">Funcionalidade em desenvolvimento...</p>
            </CardContent>
          </Card>
        </TabsContent>
      </Tabs>
    </div>
  );
};

export default UsersPage;
