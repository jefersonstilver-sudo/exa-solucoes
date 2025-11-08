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
  Trash2,
  Users
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
          <Badge variant="secondary" className="bg-indexa-purple/10 text-indexa-purple border-0 font-normal text-xs">
            Super Admin
          </Badge>
        );
      case 'admin':
        return (
          <Badge variant="secondary" className="bg-blue-50 text-blue-700 border-0 font-normal text-xs">
            Admin Geral
          </Badge>
        );
      case 'admin_marketing':
        return (
          <Badge variant="secondary" className="bg-purple-50 text-purple-700 border-0 font-normal text-xs">
            Marketing
          </Badge>
        );
      case 'admin_financeiro':
        return (
          <Badge variant="secondary" className="bg-emerald-50 text-emerald-700 border-0 font-normal text-xs">
            Financeiro
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
      return (
        <Badge variant="secondary" className="bg-red-50 text-red-700 border-0 font-normal text-xs">
          Não Verificado
        </Badge>
      );
    }
    
    const lastSignIn = user.last_sign_in_at ? new Date(user.last_sign_in_at) : null;
    const thirtyDaysAgo = new Date();
    thirtyDaysAgo.setDate(thirtyDaysAgo.getDate() - 30);
    
    if (lastSignIn && lastSignIn > thirtyDaysAgo) {
      return (
        <Badge variant="secondary" className="bg-green-50 text-green-700 border-0 font-normal text-xs">
          Ativo
        </Badge>
      );
    } else {
      return (
        <Badge variant="secondary" className="bg-gray-100 text-gray-600 border-0 font-normal text-xs">
          Inativo
        </Badge>
      );
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
    <div className="space-y-6">
      <SecurityAuditBanner />
      
      {/* Minimalist Action Bar */}
      <div className="bg-white rounded-lg border border-gray-200 shadow-sm p-4">
        <div className="flex items-center justify-between">
          <div className="flex items-center space-x-4 flex-1">
            <div className="relative flex-1 max-w-md">
              <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-gray-400" />
              <Input
                placeholder="Buscar por email ou nome..."
                value={searchTerm}
                onChange={(e) => setSearchTerm(e.target.value)}
                className="pl-10 border-gray-200 focus:border-indexa-purple focus:ring-1 focus:ring-indexa-purple"
              />
            </div>
            <Badge variant="secondary" className="text-xs">
              {filteredTeam.length} resultado(s)
            </Badge>
          </div>
          
          <div className="flex items-center space-x-2">
            <Button 
              onClick={handleCleanupOrphans}
              disabled={cleanupLoading}
              variant="outline"
              size="sm"
              className="text-gray-600 hover:text-gray-900"
            >
              <Trash2 className="h-4 w-4 mr-2" />
              {cleanupLoading ? 'Limpando...' : 'Limpar'}
            </Button>
            <Button 
              onClick={onRefresh} 
              disabled={loading}
              variant="outline"
              size="sm"
              className="text-gray-600 hover:text-gray-900"
            >
              <RefreshCw className={`h-4 w-4 ${loading ? 'animate-spin' : ''}`} />
            </Button>
          </div>
        </div>
      </div>

      {/* Minimalist Stats Grid */}
      <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-6 gap-4">
        <div className="bg-white rounded-lg border border-gray-200 p-4 hover:shadow-md transition-shadow">
          <div className="flex items-center justify-between mb-2">
            <UserCog className="h-5 w-5 text-gray-400" />
          </div>
          <div className="text-2xl font-light text-gray-900">{stats.total}</div>
          <div className="text-xs text-gray-500 mt-1">Total</div>
        </div>

        <div className="bg-white rounded-lg border border-indexa-purple/20 p-4 hover:shadow-md transition-shadow">
          <div className="flex items-center justify-between mb-2">
            <Crown className="h-5 w-5 text-indexa-purple" />
          </div>
          <div className="text-2xl font-light text-indexa-purple">{stats.superAdmins}</div>
          <div className="text-xs text-gray-500 mt-1">Super Admins</div>
        </div>

        <div className="bg-white rounded-lg border border-blue-200 p-4 hover:shadow-md transition-shadow">
          <div className="flex items-center justify-between mb-2">
            <Shield className="h-5 w-5 text-blue-600" />
          </div>
          <div className="text-2xl font-light text-blue-600">{stats.admins}</div>
          <div className="text-xs text-gray-500 mt-1">Admin Geral</div>
        </div>

        <div className="bg-white rounded-lg border border-purple-200 p-4 hover:shadow-md transition-shadow">
          <div className="flex items-center justify-between mb-2">
            <UserCog className="h-5 w-5 text-purple-600" />
          </div>
          <div className="text-2xl font-light text-purple-600">{stats.marketingAdmins}</div>
          <div className="text-xs text-gray-500 mt-1">Marketing</div>
        </div>

        <div className="bg-white rounded-lg border border-emerald-200 p-4 hover:shadow-md transition-shadow">
          <div className="flex items-center justify-between mb-2">
            <DollarSign className="h-5 w-5 text-emerald-600" />
          </div>
          <div className="text-2xl font-light text-emerald-600">{stats.financialAdmins}</div>
          <div className="text-xs text-gray-500 mt-1">Financeiro</div>
        </div>

        <div className="bg-white rounded-lg border border-green-200 p-4 hover:shadow-md transition-shadow">
          <div className="flex items-center justify-between mb-2">
            <Eye className="h-5 w-5 text-green-600" />
          </div>
          <div className="text-2xl font-light text-green-600">{stats.verified}</div>
          <div className="text-xs text-gray-500 mt-1">Verificados</div>
        </div>
      </div>

      {/* Clean Minimalist Table */}
      <div className="bg-white rounded-lg border border-gray-200 shadow-sm overflow-hidden">
        {loading ? (
          <div className="flex items-center justify-center py-16">
            <RefreshCw className="h-6 w-6 animate-spin text-indexa-purple" />
            <span className="ml-3 text-sm text-gray-600">Carregando...</span>
          </div>
        ) : (
          <Table>
            <TableHeader>
              <TableRow className="border-gray-100 hover:bg-transparent">
                <TableHead className="text-xs font-medium text-gray-500 uppercase tracking-wider">Membro</TableHead>
                <TableHead className="text-xs font-medium text-gray-500 uppercase tracking-wider">Função</TableHead>
                <TableHead className="text-xs font-medium text-gray-500 uppercase tracking-wider">Status</TableHead>
                <TableHead className="text-xs font-medium text-gray-500 uppercase tracking-wider">Último Acesso</TableHead>
                <TableHead className="text-xs font-medium text-gray-500 uppercase tracking-wider text-right">Ações</TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {filteredTeam.length === 0 ? (
                <TableRow>
                  <TableCell colSpan={5} className="text-center py-16">
                    <div className="flex flex-col items-center space-y-2">
                      <Users className="h-12 w-12 text-gray-300" />
                      <p className="text-sm text-gray-500">
                        {exaTeam.length === 0 ? 'Nenhum membro encontrado' : 'Nenhum resultado para sua busca'}
                      </p>
                    </div>
                  </TableCell>
                </TableRow>
              ) : (
                filteredTeam.map((user) => (
                  <TableRow key={user.id} className="border-gray-100 hover:bg-gray-50/50 transition-colors">
                    <TableCell className="py-4">
                      <div className="flex items-center space-x-3">
                        <div className="w-10 h-10 bg-gray-100 rounded-full flex items-center justify-center">
                          {getRoleIcon(user.role) || (
                            <span className="text-sm font-medium text-gray-600">
                              {user.email.charAt(0).toUpperCase()}
                            </span>
                          )}
                        </div>
                        <div>
                          <p className="text-sm font-medium text-gray-900">{user.email}</p>
                          <p className="text-xs text-gray-500">
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
                    <TableCell className="text-sm text-gray-600">
                      {formatDate(user.last_sign_in_at)}
                    </TableCell>
                    <TableCell className="text-right">
                      <Button
                        variant="ghost"
                        size="sm"
                        onClick={() => handleViewDetails(user)}
                        className="text-gray-600 hover:text-indexa-purple hover:bg-indexa-purple/5"
                      >
                        <Info className="h-4 w-4 mr-1" />
                        Detalhes
                      </Button>
                    </TableCell>
                  </TableRow>
                ))
              )}
            </TableBody>
          </Table>
        )}
      </div>

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
