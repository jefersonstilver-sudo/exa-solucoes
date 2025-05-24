
import React, { useState } from 'react';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { useNavigate } from 'react-router-dom';
import { 
  Search,
  Filter,
  Plus,
  Users,
  Shield,
  User,
  Crown,
  Edit,
  Trash2,
  MoreHorizontal
} from 'lucide-react';
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";

const UsersPage = () => {
  const navigate = useNavigate();
  const [searchTerm, setSearchTerm] = useState('');
  const [roleFilter, setRoleFilter] = useState('all');

  // Mock data
  const users = [
    {
      id: '1',
      email: 'jefersonstilver@gmail.com',
      name: 'Jefferson Stilver',
      role: 'super_admin',
      status: 'active',
      lastLogin: '2024-01-15 14:30',
      createdAt: '2023-01-01',
      campaigns: 0,
      protected: true
    },
    {
      id: '2',
      email: 'admin@exemplo.com',
      name: 'Admin Sistema',
      role: 'admin',
      status: 'active',
      lastLogin: '2024-01-14 10:15',
      createdAt: '2023-06-15',
      campaigns: 5,
      protected: false
    },
    {
      id: '3',
      email: 'cliente@exemplo.com',
      name: 'João Cliente',
      role: 'client',
      status: 'active',
      lastLogin: '2024-01-13 16:45',
      createdAt: '2023-08-20',
      campaigns: 12,
      protected: false
    },
    {
      id: '4',
      email: 'usuario@exemplo.com',
      name: 'Maria Silva',
      role: 'client',
      status: 'inactive',
      lastLogin: '2024-01-01 09:20',
      createdAt: '2023-11-10',
      campaigns: 3,
      protected: false
    },
  ];

  const getRoleInfo = (role: string) => {
    const roleMap: Record<string, { variant: any, label: string, icon: any, color: string }> = {
      super_admin: { variant: 'default', label: 'Super Admin', icon: Crown, color: 'text-amber-400' },
      admin: { variant: 'secondary', label: 'Admin', icon: Shield, color: 'text-blue-400' },
      client: { variant: 'outline', label: 'Cliente', icon: User, color: 'text-green-400' },
      painel: { variant: 'outline', label: 'Painel', icon: User, color: 'text-purple-400' }
    };
    return roleMap[role] || roleMap.client;
  };

  const getStatusBadge = (status: string) => {
    const variants: Record<string, { variant: any, label: string }> = {
      active: { variant: 'success', label: 'Ativo' },
      inactive: { variant: 'secondary', label: 'Inativo' },
      suspended: { variant: 'destructive', label: 'Suspenso' }
    };
    return variants[status] || { variant: 'secondary', label: status };
  };

  const filteredUsers = users.filter(user => {
    const matchesSearch = user.email.toLowerCase().includes(searchTerm.toLowerCase()) ||
                         user.name?.toLowerCase().includes(searchTerm.toLowerCase());
    const matchesRole = roleFilter === 'all' || user.role === roleFilter;
    return matchesSearch && matchesRole;
  });

  const handleEditUser = (userId: string) => {
    navigate(`/super_admin/usuarios/${userId}`);
  };

  const handleNewUser = () => {
    navigate('/super_admin/usuarios/novo');
  };

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-3xl font-bold text-white">Gerenciar Usuários</h1>
          <p className="text-slate-400">Administre contas de usuário e permissões</p>
        </div>
        <Button onClick={handleNewUser} className="bg-amber-500 hover:bg-amber-600 text-slate-900">
          <Plus className="h-4 w-4 mr-2" />
          Novo Usuário
        </Button>
      </div>

      {/* Stats Cards */}
      <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
        <Card className="bg-slate-800/50 border-slate-700/50">
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium text-slate-300">Total de Usuários</CardTitle>
            <Users className="h-4 w-4 text-amber-400" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold text-white">2,543</div>
            <p className="text-xs text-green-400">+12% este mês</p>
          </CardContent>
        </Card>

        <Card className="bg-slate-800/50 border-slate-700/50">
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium text-slate-300">Administradores</CardTitle>
            <Shield className="h-4 w-4 text-blue-400" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold text-white">15</div>
            <p className="text-xs text-blue-400">Sistema seguro</p>
          </CardContent>
        </Card>

        <Card className="bg-slate-800/50 border-slate-700/50">
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium text-slate-300">Clientes Ativos</CardTitle>
            <User className="h-4 w-4 text-green-400" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold text-white">2,521</div>
            <p className="text-xs text-green-400">99.1% atividade</p>
          </CardContent>
        </Card>

        <Card className="bg-slate-800/50 border-slate-700/50">
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium text-slate-300">Super Admin</CardTitle>
            <Crown className="h-4 w-4 text-amber-400" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold text-white">1</div>
            <p className="text-xs text-amber-400">Protegido</p>
          </CardContent>
        </Card>
      </div>

      {/* Filters */}
      <Card className="bg-slate-800/50 border-slate-700/50">
        <CardHeader>
          <CardTitle className="text-white">Filtros</CardTitle>
        </CardHeader>
        <CardContent>
          <div className="flex gap-4">
            <div className="flex-1">
              <div className="relative">
                <Search className="absolute left-3 top-3 h-4 w-4 text-slate-400" />
                <Input
                  placeholder="Buscar por email ou nome..."
                  value={searchTerm}
                  onChange={(e) => setSearchTerm(e.target.value)}
                  className="pl-10 bg-slate-700/50 border-slate-600 text-white"
                />
              </div>
            </div>
            <DropdownMenu>
              <DropdownMenuTrigger asChild>
                <Button variant="outline" className="border-slate-600 text-slate-300">
                  <Filter className="h-4 w-4 mr-2" />
                  Role
                </Button>
              </DropdownMenuTrigger>
              <DropdownMenuContent className="bg-slate-800 border-slate-700">
                <DropdownMenuItem onClick={() => setRoleFilter('all')} className="text-slate-300">
                  Todos
                </DropdownMenuItem>
                <DropdownMenuItem onClick={() => setRoleFilter('super_admin')} className="text-slate-300">
                  Super Admin
                </DropdownMenuItem>
                <DropdownMenuItem onClick={() => setRoleFilter('admin')} className="text-slate-300">
                  Admin
                </DropdownMenuItem>
                <DropdownMenuItem onClick={() => setRoleFilter('client')} className="text-slate-300">
                  Cliente
                </DropdownMenuItem>
              </DropdownMenuContent>
            </DropdownMenu>
          </div>
        </CardContent>
      </Card>

      {/* Users List */}
      <Card className="bg-slate-800/50 border-slate-700/50">
        <CardHeader>
          <CardTitle className="text-white">Lista de Usuários</CardTitle>
          <CardDescription className="text-slate-400">
            {filteredUsers.length} usuários encontrados
          </CardDescription>
        </CardHeader>
        <CardContent>
          <div className="space-y-4">
            {filteredUsers.map((user) => {
              const roleInfo = getRoleInfo(user.role);
              const statusInfo = getStatusBadge(user.status);
              const RoleIcon = roleInfo.icon;
              
              return (
                <div key={user.id} className="flex items-center justify-between p-4 bg-slate-700/30 rounded-lg border border-slate-600/50">
                  <div className="flex items-center space-x-4">
                    <div className={`w-12 h-12 rounded-lg flex items-center justify-center ${
                      user.role === 'super_admin' ? 'bg-amber-500/20' : 'bg-slate-600/50'
                    }`}>
                      <RoleIcon className={`h-6 w-6 ${roleInfo.color}`} />
                    </div>
                    <div>
                      <div className="flex items-center space-x-2 mb-1">
                        <h3 className="font-medium text-white">{user.email}</h3>
                        {user.protected && (
                          <Badge variant="outline" className="text-xs text-amber-400 border-amber-500/50">
                            Protegido
                          </Badge>
                        )}
                        <Badge variant={roleInfo.variant} className="text-xs">
                          {roleInfo.label}
                        </Badge>
                        <Badge variant={statusInfo.variant} className="text-xs">
                          {statusInfo.label}
                        </Badge>
                      </div>
                      {user.name && (
                        <p className="text-sm text-slate-300 mb-1">{user.name}</p>
                      )}
                      <div className="flex items-center space-x-4 text-xs text-slate-400">
                        <span>Último login: {user.lastLogin}</span>
                        <span>•</span>
                        <span>Membro desde: {new Date(user.createdAt).toLocaleDateString('pt-BR')}</span>
                        <span>•</span>
                        <span>{user.campaigns} campanhas</span>
                      </div>
                    </div>
                  </div>
                  
                  <div className="flex items-center space-x-2">
                    {!user.protected ? (
                      <DropdownMenu>
                        <DropdownMenuTrigger asChild>
                          <Button variant="ghost" size="sm">
                            <MoreHorizontal className="h-4 w-4" />
                          </Button>
                        </DropdownMenuTrigger>
                        <DropdownMenuContent className="bg-slate-800 border-slate-700">
                          <DropdownMenuItem 
                            onClick={() => handleEditUser(user.id)}
                            className="text-slate-300"
                          >
                            <Edit className="h-4 w-4 mr-2" />
                            Editar
                          </DropdownMenuItem>
                          <DropdownMenuItem className="text-red-400">
                            <Trash2 className="h-4 w-4 mr-2" />
                            Excluir
                          </DropdownMenuItem>
                        </DropdownMenuContent>
                      </DropdownMenu>
                    ) : (
                      <div className="flex items-center space-x-2 text-amber-400 text-xs">
                        <Crown className="h-4 w-4" />
                        <span>Não editável</span>
                      </div>
                    )}
                  </div>
                </div>
              );
            })}
          </div>
        </CardContent>
      </Card>
    </div>
  );
};

export default UsersPage;
