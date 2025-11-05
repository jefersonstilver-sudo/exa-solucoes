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
  Crown, 
  Shield, 
  Search, 
  Settings,
  Eye,
  RefreshCw,
  UserCog,
  UserPlus,
  Info
} from 'lucide-react';
import { supabase } from '@/integrations/supabase/client';
import { toast } from 'sonner';
import CreateAdminDialog from './CreateAdminDialog';
import UserDetailsDialog from './UserDetailsDialog';
import { useSecureAdmin } from '@/hooks/useSecureAdmin';
import SecurityAuditBanner from '../security/SecurityAuditBanner';

interface User {
  id: string;
  email: string;
  role: string;
  data_criacao: string;
  email_confirmed_at?: string;
  last_sign_in_at?: string;
  raw_user_meta_data?: any;
}

interface IndexaTeamSectionProps {
  users: User[];
  loading: boolean;
  onRefresh: () => void;
}

const IndexaTeamSection: React.FC<IndexaTeamSectionProps> = ({ users, loading, onRefresh }) => {
  const [searchTerm, setSearchTerm] = useState('');
  const [createDialogOpen, setCreateDialogOpen] = useState(false);
  const [detailsDialogOpen, setDetailsDialogOpen] = useState(false);
  const [selectedUser, setSelectedUser] = useState<User | null>(null);
  const { updateUserRole, loading: secureLoading } = useSecureAdmin();

  // Filter team members - role now comes from users_with_role view (secure)
  const indexaTeam = users.filter(user => 
    user.role === 'super_admin' || user.role === 'admin' || user.role === 'admin_marketing'
  );
  
  const filteredTeam = indexaTeam.filter(user =>
    user.email.toLowerCase().includes(searchTerm.toLowerCase()) ||
    user.role.toLowerCase().includes(searchTerm.toLowerCase())
  );

  const handleRoleChange = async (userId: string, currentRole: string) => {
    const newRole = currentRole === 'admin' ? 'super_admin' : 'admin';
    
    const result = await updateUserRole(userId, newRole);
    if (result.success) {
      toast.success(`Role alterada para ${newRole} com sucesso`);
      onRefresh();
    }
    // Error handling is done inside useSecureAdmin hook
  };

  const handleViewDetails = (user: User) => {
    setSelectedUser(user);
    setDetailsDialogOpen(true);
  };

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
      case 'admin_financeiro':
        return (
          <Badge className="bg-emerald-50 text-emerald-600 border-emerald-200">
            <UserCog className="h-3 w-3 mr-1" />
            Admin Financeiro
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

  const getStatusBadge = (user: User) => {
    if (!user.email_confirmed_at) {
      return <Badge variant="destructive">Não Verificado</Badge>;
    }
    
    const lastSignIn = user.last_sign_in_at ? new Date(user.last_sign_in_at) : null;
    const thirtyDaysAgo = new Date();
    thirtyDaysAgo.setDate(thirtyDaysAgo.getDate() - 30);
    
    if (lastSignIn && lastSignIn > thirtyDaysAgo) {
      return <Badge className="bg-green-50 text-green-600 border-green-200">Ativo</Badge>;
    } else {
      return <Badge variant="secondary">Inativo</Badge>;
    }
  };

  const stats = {
    total: indexaTeam.length,
    superAdmins: indexaTeam.filter(u => u.role === 'super_admin').length,
    admins: indexaTeam.filter(u => u.role === 'admin').length,
    marketingAdmins: indexaTeam.filter(u => u.role === 'admin_marketing').length,
    financialAdmins: indexaTeam.filter(u => u.role === 'admin_financeiro').length,
    verified: indexaTeam.filter(u => u.email_confirmed_at).length,
  };

  const handleAccountCreated = () => {
    console.log('✅ [INDEXA TEAM] Nova conta criada, atualizando lista...');
    onRefresh();
    setCreateDialogOpen(false);
  };

  return (
    <div className="space-y-6">
      <SecurityAuditBanner />
      {/* Header da Seção */}
      <div className="flex items-center justify-between">
        <div>
            <h2 className="text-xl font-bold text-gray-900 flex items-center">
              <Crown className="h-6 w-6 mr-2 text-indexa-purple" />
              Usuários EXA
            </h2>
          <p className="text-gray-600 mt-1">
            Administradores e Super Administradores do sistema
          </p>
        </div>
        <div className="flex space-x-3">
          <Button 
            onClick={() => setCreateDialogOpen(true)}
            className="bg-indexa-purple hover:bg-indexa-purple/90 text-white flex items-center"
          >
            <UserPlus className="h-4 w-4 mr-2" />
            Criar Nova Conta
          </Button>
          <Button 
            variant="outline" 
            onClick={onRefresh} 
            disabled={loading || secureLoading}
            className="flex items-center"
          >
            <RefreshCw className="h-4 w-4 mr-2" />
            Atualizar
          </Button>
        </div>
      </div>

      {/* Estatísticas da Equipe */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 xl:grid-cols-6 gap-4">
        <Card className="bg-indexa-purple/5 border-indexa-purple/20">
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Total da Equipe</CardTitle>
            <UserCog className="h-4 w-4 text-indexa-purple" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold text-indexa-purple">{stats.total}</div>
            <p className="text-xs text-gray-500 mt-1">membros da equipe</p>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Super Admins</CardTitle>
            <Crown className="h-4 w-4 text-indexa-purple" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold text-indexa-purple">{stats.superAdmins}</div>
            <p className="text-xs text-gray-500 mt-1">acesso total</p>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Admin Geral</CardTitle>
            <Shield className="h-4 w-4 text-blue-500" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold text-blue-500">{stats.admins}</div>
            <p className="text-xs text-gray-500 mt-1">gestão completa</p>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Admin Marketing</CardTitle>
            <UserCog className="h-4 w-4 text-purple-500" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold text-purple-500">{stats.marketingAdmins}</div>
            <p className="text-xs text-gray-500 mt-1">leads e campanhas</p>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Admin Financeiro</CardTitle>
            <UserCog className="h-4 w-4 text-emerald-500" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold text-emerald-500">{stats.financialAdmins}</div>
            <p className="text-xs text-gray-500 mt-1">pedidos e benefícios</p>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Verificados</CardTitle>
            <Eye className="h-4 w-4 text-green-500" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold text-green-500">{stats.verified}</div>
            <p className="text-xs text-gray-500 mt-1">emails confirmados</p>
          </CardContent>
        </Card>
      </div>

      {/* Busca */}
      <Card>
        <CardHeader>
          <CardTitle className="text-lg flex items-center">
            <Search className="h-5 w-5 mr-2" />
            Buscar na Equipe
          </CardTitle>
        </CardHeader>
        <CardContent>
          <Input
            placeholder="Buscar por email ou função..."
            value={searchTerm}
            onChange={(e) => setSearchTerm(e.target.value)}
            className="max-w-md"
          />
        </CardContent>
      </Card>

      {/* Tabela da Equipe */}
      <Card className="bg-indexa-purple/5 border-indexa-purple/20">
        <CardHeader>
          <CardTitle className="text-lg">Membros da Equipe INDEXA</CardTitle>
          <CardDescription>
            {filteredTeam.length} membro(s) encontrado(s)
          </CardDescription>
        </CardHeader>
        <CardContent>
          {loading ? (
            <div className="flex items-center justify-center py-12">
              <RefreshCw className="h-8 w-8 animate-spin text-indexa-purple" />
              <span className="ml-3 text-gray-600">Carregando equipe...</span>
            </div>
          ) : (
            <Table>
              <TableHeader>
                <TableRow>
                  <TableHead>Membro</TableHead>
                  <TableHead>Função</TableHead>
                  <TableHead>Status</TableHead>
                  <TableHead>Último Acesso</TableHead>
                  <TableHead>Ações</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {filteredTeam.length === 0 ? (
                  <TableRow>
                    <TableCell colSpan={5} className="text-center py-12 text-gray-500">
                      {indexaTeam.length === 0 ? 'Nenhum membro da equipe encontrado' : 'Nenhum membro corresponde à busca'}
                    </TableCell>
                  </TableRow>
                ) : (
                  filteredTeam.map((user) => (
                    <TableRow key={user.id}>
                      <TableCell>
                        <div className="flex items-center space-x-3">
                          <div className="w-10 h-10 bg-indexa-purple/10 rounded-lg flex items-center justify-center">
                            {getRoleIcon(user.role)}
                          </div>
                          <div>
                            <p className="font-medium text-gray-900">{user.email}</p>
                            <p className="text-sm text-gray-500">
                              {user.raw_user_meta_data?.name || 'Nome não informado'}
                            </p>
                          </div>
                        </div>
                      </TableCell>
                      <TableCell>
                        {getRoleBadge(user.role)}
                      </TableCell>
                      <TableCell>
                        {getStatusBadge(user)}
                      </TableCell>
                      <TableCell className="text-gray-600">
                        {formatDate(user.last_sign_in_at)}
                      </TableCell>
                      <TableCell>
                        <div className="flex items-center space-x-2">
                          <Button
                            variant="outline"
                            size="sm"
                            onClick={() => handleViewDetails(user)}
                          >
                            <Info className="h-3 w-3 mr-1" />
                            Ver Detalhes
                          </Button>
                          <Button
                            variant="outline"
                            size="sm"
                            onClick={() => handleRoleChange(user.id, user.role)}
                            disabled={user.role === 'super_admin'}
                          >
                            <Settings className="h-3 w-3 mr-1" />
                            {user.role === 'admin' ? 'Promover' : 'Alterar'}
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

      {/* Dialog de Criação de Conta */}
      <CreateAdminDialog
        open={createDialogOpen}
        onOpenChange={setCreateDialogOpen}
        onAccountCreated={handleAccountCreated}
      />

      {/* Dialog de Detalhes do Usuário */}
      <UserDetailsDialog
        open={detailsDialogOpen}
        onOpenChange={setDetailsDialogOpen}
        user={selectedUser}
        onUserUpdated={onRefresh}
      />
    </div>
  );
};

export default IndexaTeamSection;
