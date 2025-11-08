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
  Eye,
  RefreshCw,
  UserCog,
  UserPlus,
  Info,
  DollarSign,
  Trash2
} from 'lucide-react';
import { supabase } from '@/integrations/supabase/client';
import { toast } from 'sonner';
import CreateUserDialog from './CreateUserDialog';
import { UserDetailsDialogComplete } from './UserDetailsDialogComplete';
import SecurityAuditBanner from '../security/SecurityAuditBanner';

interface User {
  id: string;
  email: string;
  role: string;
  data_criacao: string;
  email_confirmed_at?: string;
  last_sign_in_at?: string;
  raw_user_meta_data?: any;
  nome?: string;
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
  const [cleanupLoading, setCleanupLoading] = useState(false);

  // Filter team members - role now comes from users_with_role view (secure)
  const exaTeam = users.filter(user => 
    user.role === 'super_admin' || 
    user.role === 'admin' || 
    user.role === 'admin_marketing' || 
    user.role === 'admin_financeiro'
  );
  
  const filteredTeam = exaTeam.filter(user =>
    user.email.toLowerCase().includes(searchTerm.toLowerCase()) ||
    user.role.toLowerCase().includes(searchTerm.toLowerCase())
  );

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
    total: exaTeam.length,
    superAdmins: exaTeam.filter(u => u.role === 'super_admin').length,
    admins: exaTeam.filter(u => u.role === 'admin').length,
    marketingAdmins: exaTeam.filter(u => u.role === 'admin_marketing').length,
    financialAdmins: exaTeam.filter(u => u.role === 'admin_financeiro').length,
    verified: exaTeam.filter(u => u.email_confirmed_at).length,
  };

  const handleAccountCreated = () => {
    console.log('✅ [EXA TEAM] Nova conta criada, atualizando lista...');
    onRefresh();
    setCreateDialogOpen(false);
  };

  const handleCleanupOrphans = async () => {
    try {
      setCleanupLoading(true);
      console.log('🧹 Iniciando limpeza de emails órfãos...');

      const { data, error } = await supabase.functions.invoke('cleanup-orphan-users', {
        body: {}
      });

      if (error) throw error;

      console.log('✅ Limpeza concluída:', data);
      
      toast.success(
        `Limpeza concluída! ${data.orphansDeleted} email(s) órfão(s) removido(s) do auth.`,
        { duration: 5000 }
      );

      if (data.failedDeletes > 0) {
        toast.warning(
          `${data.failedDeletes} email(s) falharam ao deletar. Verifique os logs.`,
          { duration: 5000 }
        );
      }

      onRefresh();
    } catch (error: any) {
      console.error('❌ Erro na limpeza:', error);
      toast.error(`Erro: ${error.message || 'Falha ao limpar emails órfãos'}`);
    } finally {
      setCleanupLoading(false);
    }
  };


  return (
    <div className="space-y-8">
      <SecurityAuditBanner />
      
      {/* Professional Header */}
      <div className="bg-gradient-to-br from-indexa-purple via-indexa-purple/90 to-indexa-purple/80 rounded-2xl shadow-xl p-8">
        <div className="flex items-center justify-between">
          <div className="flex items-center space-x-4">
            <div className="w-16 h-16 bg-white/20 backdrop-blur-sm rounded-2xl flex items-center justify-center shadow-lg">
              <Crown className="h-8 w-8 text-white" />
            </div>
            <div>
              <h2 className="text-3xl font-bold text-white flex items-center space-x-3">
                Usuários EXA
              </h2>
              <p className="text-white/90 mt-2 text-base">
                Administradores e Super Administradores do sistema
              </p>
            </div>
          </div>
          
          <div className="flex items-center space-x-3">
            <Button 
              onClick={handleCleanupOrphans}
              disabled={cleanupLoading}
              variant="outline"
              className="bg-white/10 backdrop-blur-sm border-white/20 text-white hover:bg-white/20 transition-all duration-200"
              size="lg"
            >
              <Trash2 className="h-4 w-4 mr-2" />
              {cleanupLoading ? 'Limpando...' : 'Limpar Órfãos'}
            </Button>
            <Button 
              onClick={() => setCreateDialogOpen(true)}
              className="bg-white text-indexa-purple hover:bg-white/90 shadow-lg transition-all duration-200"
              size="lg"
            >
              <UserPlus className="h-5 w-5 mr-2" />
              Nova Conta
            </Button>
            <Button 
              variant="outline" 
              onClick={onRefresh} 
              disabled={loading}
              className="bg-white/10 backdrop-blur-sm border-white/20 text-white hover:bg-white/20 transition-all duration-200"
              size="lg"
            >
              <RefreshCw className={`h-4 w-4 ${loading ? 'animate-spin' : ''}`} />
            </Button>
          </div>
        </div>
      </div>

      {/* Professional Statistics Cards */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 xl:grid-cols-6 gap-6">
        <Card className="bg-gradient-to-br from-indexa-purple to-indexa-purple/80 text-white border-0 shadow-lg hover:shadow-xl transition-shadow duration-200">
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium text-white/90">Total da Equipe</CardTitle>
            <div className="w-10 h-10 bg-white/20 rounded-xl flex items-center justify-center">
              <UserCog className="h-5 w-5 text-white" />
            </div>
          </CardHeader>
          <CardContent>
            <div className="text-3xl font-bold">{stats.total}</div>
            <p className="text-xs text-white/80 mt-2">membros ativos</p>
          </CardContent>
        </Card>

        <Card className="border-2 border-indexa-purple/20 hover:border-indexa-purple/40 hover:shadow-lg transition-all duration-200">
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Super Admins</CardTitle>
            <div className="w-10 h-10 bg-indexa-purple/10 rounded-xl flex items-center justify-center">
              <Crown className="h-5 w-5 text-indexa-purple" />
            </div>
          </CardHeader>
          <CardContent>
            <div className="text-3xl font-bold text-indexa-purple">{stats.superAdmins}</div>
            <p className="text-xs text-muted-foreground mt-2">acesso total</p>
          </CardContent>
        </Card>

        <Card className="border-2 border-blue-200 hover:border-blue-300 hover:shadow-lg transition-all duration-200">
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Admin Geral</CardTitle>
            <div className="w-10 h-10 bg-blue-50 rounded-xl flex items-center justify-center">
              <Shield className="h-5 w-5 text-blue-600" />
            </div>
          </CardHeader>
          <CardContent>
            <div className="text-3xl font-bold text-blue-600">{stats.admins}</div>
            <p className="text-xs text-muted-foreground mt-2">gestão completa</p>
          </CardContent>
        </Card>

        <Card className="border-2 border-purple-200 hover:border-purple-300 hover:shadow-lg transition-all duration-200">
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Admin Marketing</CardTitle>
            <div className="w-10 h-10 bg-purple-50 rounded-xl flex items-center justify-center">
              <UserCog className="h-5 w-5 text-purple-600" />
            </div>
          </CardHeader>
          <CardContent>
            <div className="text-3xl font-bold text-purple-600">{stats.marketingAdmins}</div>
            <p className="text-xs text-muted-foreground mt-2">leads e campanhas</p>
          </CardContent>
        </Card>

        <Card className="border-2 border-emerald-200 hover:border-emerald-300 hover:shadow-lg transition-all duration-200">
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Admin Financeiro</CardTitle>
            <div className="w-10 h-10 bg-emerald-50 rounded-xl flex items-center justify-center">
              <DollarSign className="h-5 w-5 text-emerald-600" />
            </div>
          </CardHeader>
          <CardContent>
            <div className="text-3xl font-bold text-emerald-600">{stats.financialAdmins}</div>
            <p className="text-xs text-muted-foreground mt-2">pedidos e benefícios</p>
          </CardContent>
        </Card>

        <Card className="border-2 border-green-200 hover:border-green-300 hover:shadow-lg transition-all duration-200">
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Verificados</CardTitle>
            <div className="w-10 h-10 bg-green-50 rounded-xl flex items-center justify-center">
              <Eye className="h-5 w-5 text-green-600" />
            </div>
          </CardHeader>
          <CardContent>
            <div className="text-3xl font-bold text-green-600">{stats.verified}</div>
            <p className="text-xs text-muted-foreground mt-2">emails confirmados</p>
          </CardContent>
        </Card>
      </div>

      {/* Professional Search Section */}
      <Card className="border-2 shadow-md">
        <CardHeader className="bg-gradient-to-r from-gray-50 to-white">
          <div className="flex items-center justify-between">
            <CardTitle className="text-lg flex items-center">
              <div className="w-10 h-10 bg-indexa-purple/10 rounded-xl flex items-center justify-center mr-3">
                <Search className="h-5 w-5 text-indexa-purple" />
              </div>
              Buscar na Equipe
            </CardTitle>
            <Badge variant="secondary" className="text-sm">
              {filteredTeam.length} resultado(s)
            </Badge>
          </div>
        </CardHeader>
        <CardContent className="pt-6">
          <div className="relative">
            <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-5 w-5 text-muted-foreground" />
            <Input
              placeholder="Buscar por email, nome ou função..."
              value={searchTerm}
              onChange={(e) => setSearchTerm(e.target.value)}
              className="pl-11 h-12 text-base"
            />
          </div>
        </CardContent>
      </Card>

      {/* Professional Team Table */}
      <Card className="border-2 shadow-md">
        <CardHeader className="bg-gradient-to-r from-indexa-purple/5 to-white border-b">
          <div className="flex items-center justify-between">
            <div>
              <CardTitle className="text-xl flex items-center">
                <Crown className="h-6 w-6 text-indexa-purple mr-2" />
                Membros da Equipe EXA
              </CardTitle>
              <CardDescription className="mt-2 text-base">
                {filteredTeam.length} membro(s) encontrado(s)
              </CardDescription>
            </div>
          </div>
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
                      {exaTeam.length === 0 ? 'Nenhum membro da equipe encontrado' : 'Nenhum membro corresponde à busca'}
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
                              {(user as any).nome || user.raw_user_meta_data?.name || 'Nome não informado'}
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
                        <Button
                          variant="outline"
                          size="sm"
                          onClick={() => handleViewDetails(user)}
                        >
                          <Info className="h-3 w-3 mr-1" />
                          Ver Detalhes
                        </Button>
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
      <CreateUserDialog
        open={createDialogOpen}
        onOpenChange={setCreateDialogOpen}
        onSuccess={handleAccountCreated}
      />

      {/* Dialog de Detalhes do Usuário */}
      {selectedUser && (
        <UserDetailsDialogComplete
          open={detailsDialogOpen}
          onOpenChange={setDetailsDialogOpen}
          user={selectedUser}
          onUserUpdated={onRefresh}
        />
      )}
    </div>
  );
};

export default IndexaTeamSection;
