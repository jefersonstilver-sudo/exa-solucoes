import React, { useState, useEffect } from 'react';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { Card, CardContent } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Crown, Users, Shield, Plus, RefreshCw, Search, UserCheck, UserPlus } from 'lucide-react';
import { supabase } from '@/integrations/supabase/client';
import { toast } from 'sonner';
import IndexaTeamSection from '@/components/admin/users/IndexaTeamSection';
import ClientsSection from '@/components/admin/users/ClientsSection';
import { useAdvancedResponsive } from '@/hooks/useAdvancedResponsive';
import { useUserStats } from '@/hooks/useUserStats';
import UserStatsCards from '@/components/admin/users/UserStatsCards';
import EnhancedUserMobileCard from '@/components/admin/users/EnhancedUserMobileCard';
import CreateUserDialog from '@/components/admin/users/CreateUserDialog';
import { UserDetailsDialogComplete } from '@/components/admin/users/UserDetailsDialogComplete';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';

interface User {
  id: string;
  email: string;
  role: string;
  data_criacao: string;
  nome?: string;
  telefone?: string;
  cpf?: string;
  documento_estrangeiro?: string;
  email_verified_at?: string;
  avatar_url?: string;
  tipo_documento?: string;
  documento_frente_url?: string;
  documento_verso_url?: string;
  last_sign_in_at?: string;
  email_confirmed_at?: string;
  raw_user_meta_data?: any;
}

const UsersPage = () => {
  const [users, setUsers] = useState<User[]>([]);
  const [loading, setLoading] = useState(true);
  const [activeTab, setActiveTab] = useState('team');
  const [searchTerm, setSearchTerm] = useState('');
  const [isCreateDialogOpen, setIsCreateDialogOpen] = useState(false);
  const [selectedUser, setSelectedUser] = useState<User | null>(null);
  const { isMobile } = useAdvancedResponsive();
  const { stats, loading: loadingStats, refetch: refetchStats } = useUserStats();

  const fetchUsers = async () => {
    try {
      setLoading(true);
      
      console.log('📊 [USERS_PAGE] Buscando usuários da função otimizada...');
      
      // Usar função get_users_with_last_access que usa SECURITY DEFINER
      const { data, error, status } = await supabase
        .rpc('get_users_with_last_access');

      console.log('📊 [USERS_PAGE] Resposta da query:', {
        status,
        error,
        userCount: data?.length
      });

      if (error) {
        console.error('❌ [USERS_PAGE] Erro ao buscar usuários:', error);
        
        // Mensagem específica baseada no erro
        if (error.code === 'PGRST301' || error.message.includes('permission denied')) {
          toast.error('Sem permissão para visualizar usuários. Verifique suas credenciais.');
        } else {
          toast.error('Erro ao carregar usuários: ' + error.message);
        }
        return;
      }

      if (!data || data.length === 0) {
        console.warn('⚠️ [USERS_PAGE] Nenhum usuário encontrado');
        toast.warning('Nenhum usuário encontrado no sistema');
      } else {
        console.log('✅ [USERS_PAGE] Usuários carregados com sucesso:', {
          total: data.length,
          admins: data.filter((u) => u.role !== 'client').length,
          clients: data.filter((u) => u.role === 'client').length,
        });
        toast.success(`${data.length} usuários carregados`);
      }

      setUsers(data || []);
    } catch (error: any) {
      console.error('💥 [USERS_PAGE] Erro crítico:', error);
      toast.error('Erro crítico ao carregar usuários');
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchUsers();
  }, []);

  const handleRefresh = () => {
    fetchUsers();
    refetchStats();
  };

  const handleViewDetails = (user: User) => {
    setSelectedUser(user);
  };

  // Filtrar usuários
  const indexaTeam = users.filter((u) =>
    ['super_admin', 'admin', 'admin_marketing', 'admin_financeiro'].includes(u.role)
  );
  const clients = users.filter((u) => u.role === 'client');

  const filteredTeam = indexaTeam.filter(
    (u) =>
      u.email.toLowerCase().includes(searchTerm.toLowerCase()) ||
      (u.nome || '').toLowerCase().includes(searchTerm.toLowerCase())
  );

  const filteredClients = clients.filter(
    (u) =>
      u.email.toLowerCase().includes(searchTerm.toLowerCase()) ||
      (u.nome || '').toLowerCase().includes(searchTerm.toLowerCase())
  );

  // Mobile View
  if (isMobile) {
    return (
      <div className="min-h-screen bg-gray-50">
        {/* Mobile Header */}
        <div className="bg-gradient-to-r from-[#9C1E1E] to-[#DC2626] border-b border-white/10">
          <div className="px-4 py-4">
            <div className="flex items-center gap-2.5">
              <div className="w-8 h-8 rounded-full bg-white/15 flex items-center justify-center">
                <Users className="w-4 h-4 text-white" />
              </div>
              <div className="flex-1 min-w-0">
                <h1 className="text-base font-semibold text-white tracking-tight">
                  Gestão de Usuários
                </h1>
                <p className="text-xs text-white/80">
                  {users.length} usuários no sistema
                </p>
              </div>
            </div>

            {/* Botões de ação */}
            <div className="mt-3 flex gap-2">
              <Button
                onClick={() => setIsCreateDialogOpen(true)}
                size="sm"
                className="flex-1 h-9 bg-white/10 hover:bg-white/20 text-white border-0 text-sm"
              >
                <Plus className="w-3.5 h-3.5 mr-1.5" />
                Novo Admin
              </Button>
              <Button
                onClick={handleRefresh}
                size="sm"
                variant="ghost"
                className="h-9 w-9 p-0 text-white hover:bg-white/10"
                disabled={loading}
              >
                <RefreshCw className={`w-4 h-4 ${loading ? 'animate-spin' : ''}`} />
              </Button>
            </div>
          </div>
        </div>

        {/* Dashboard de Estatísticas */}
        <div className="px-4 py-4 bg-white border-b">
          <UserStatsCards stats={stats} loading={loadingStats} />
        </div>

        {/* Tabs Mobile */}
        <div className="px-4 py-3 bg-white border-b">
          <Tabs value={activeTab} onValueChange={setActiveTab} className="w-full">
            <TabsList className="grid w-full grid-cols-2 h-10">
              <TabsTrigger value="team" className="text-xs">
                <Crown className="h-3 w-3 mr-1" />
                Equipe ({filteredTeam.length})
              </TabsTrigger>
              <TabsTrigger value="clients" className="text-xs">
                <UserCheck className="h-3 w-3 mr-1" />
                Clientes ({filteredClients.length})
              </TabsTrigger>
            </TabsList>
          </Tabs>
        </div>

        {/* Barra de Busca */}
        <div className="px-4 py-3 bg-white border-b">
          <div className="relative">
            <Input
              type="text"
              placeholder="Buscar por email ou nome..."
              value={searchTerm}
              onChange={(e) => setSearchTerm(e.target.value)}
              className="h-10 pl-9 text-sm"
            />
            <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-muted-foreground" />
          </div>
        </div>

        {/* Lista de Usuários */}
        <div className="px-4 py-3 bg-gray-50">
          {activeTab === 'team' && (
            <>
              <div className="mb-3 flex items-center justify-between">
                <div className="text-sm text-muted-foreground">
                  {filteredTeam.length} membro{filteredTeam.length !== 1 ? 's' : ''} da equipe
                  {searchTerm && ' encontrado' + (filteredTeam.length !== 1 ? 's' : '')}
                </div>
                {filteredTeam.length > 0 && (
                  <Badge variant="secondary" className="text-xs">
                    {filteredTeam.filter((u) => u.role === 'super_admin').length} Super Admins
                  </Badge>
                )}
              </div>
              {loading ? (
                <div className="space-y-3">
                  {[1, 2, 3].map((i) => (
                    <div key={i} className="bg-card rounded-lg border shadow-sm p-3 animate-pulse">
                      <div className="h-12 bg-gray-200 rounded" />
                    </div>
                  ))}
                </div>
              ) : filteredTeam.length === 0 ? (
                <Card className="p-6 text-center">
                  <Shield className="h-12 w-12 mx-auto text-muted-foreground mb-2" />
                  <p className="text-sm text-muted-foreground">
                    {searchTerm
                      ? 'Nenhum membro da equipe encontrado'
                      : 'Nenhum membro da equipe cadastrado'}
                  </p>
                </Card>
              ) : (
                <div className="space-y-3 pb-20">
                  {filteredTeam.map((user) => (
                    <EnhancedUserMobileCard
                      key={user.id}
                      user={user}
                      onViewDetails={handleViewDetails}
                    />
                  ))}
                </div>
              )}
            </>
          )}

          {activeTab === 'clients' && (
            <>
              <div className="mb-3 flex items-center justify-between">
                <div className="text-sm text-muted-foreground">
                  {filteredClients.length} cliente{filteredClients.length !== 1 ? 's' : ''}
                  {searchTerm && ' encontrado' + (filteredClients.length !== 1 ? 's' : '')}
                </div>
                {filteredClients.length > 0 && (
                  <Badge variant="secondary" className="text-xs">
                    Base total
                  </Badge>
                )}
              </div>
              {loading ? (
                <div className="space-y-3">
                  {[1, 2, 3].map((i) => (
                    <div key={i} className="bg-card rounded-lg border shadow-sm p-3 animate-pulse">
                      <div className="h-12 bg-gray-200 rounded" />
                    </div>
                  ))}
                </div>
              ) : filteredClients.length === 0 ? (
                <Card className="p-6 text-center">
                  <UserCheck className="h-12 w-12 mx-auto text-muted-foreground mb-2" />
                  <p className="text-sm text-muted-foreground">
                    {searchTerm ? 'Nenhum cliente encontrado' : 'Nenhum cliente cadastrado'}
                  </p>
                </Card>
              ) : (
                <div className="space-y-3 pb-20">
                  {filteredClients.map((user) => (
                    <EnhancedUserMobileCard
                      key={user.id}
                      user={user}
                      onViewDetails={handleViewDetails}
                    />
                  ))}
                </div>
              )}
            </>
          )}
        </div>

        {/* Dialogs */}
        <CreateUserDialog
          open={isCreateDialogOpen}
          onOpenChange={setIsCreateDialogOpen}
          onSuccess={handleRefresh}
        />

        {selectedUser && (
          <UserDetailsDialogComplete 
            open={true}
            onOpenChange={(open) => !open && setSelectedUser(null)}
            user={selectedUser} 
            onUserUpdated={handleRefresh}
          />
        )}
      </div>
    );
  }

  // Desktop View - Professional & Elegant
  return (
    <div className="min-h-screen bg-gradient-to-br from-gray-50 via-gray-100 to-white">
      {/* Professional Header with Elegant Stats */}
      <div className="relative bg-gradient-to-r from-[#9C1E1E] via-[#B91C1C] to-[#9C1E1E] border-b-4 border-[#7A1616]">
        <div className="absolute inset-0 bg-[url('data:image/svg+xml;base64,PHN2ZyB3aWR0aD0iNjAiIGhlaWdodD0iNjAiIHhtbG5zPSJodHRwOi8vd3d3LnczLm9yZy8yMDAwL3N2ZyI+PGRlZnM+PHBhdHRlcm4gaWQ9ImdyaWQiIHdpZHRoPSI2MCIgaGVpZ2h0PSI2MCIgcGF0dGVyblVuaXRzPSJ1c2VyU3BhY2VPblVzZSI+PHBhdGggZD0iTSAxMCAwIEwgMCAwIDAgMTAiIGZpbGw9Im5vbmUiIHN0cm9rZT0id2hpdGUiIHN0cm9rZS1vcGFjaXR5PSIwLjA1IiBzdHJva2Utd2lkdGg9IjEiLz48L3BhdHRlcm4+PC9kZWZzPjxyZWN0IHdpZHRoPSIxMDAlIiBoZWlnaHQ9IjEwMCUiIGZpbGw9InVybCgjZ3JpZCkiLz48L3N2Zz4=')] opacity-30"></div>
        
        <div className="relative max-w-7xl mx-auto px-6 py-10">
          <div className="flex items-center justify-between mb-8">
            <div className="flex items-center space-x-4">
              <div className="w-12 h-12 bg-white/20 backdrop-blur-sm rounded-xl flex items-center justify-center">
                <Users className="h-6 w-6 text-white" />
              </div>
              <div>
                <h1 className="text-3xl font-bold text-white tracking-tight">
                  Gestão de Usuários
                </h1>
                <p className="text-sm text-white/80 mt-1">
                  Administre contas e permissões do sistema INDEXA
                </p>
              </div>
            </div>
            <Button 
              onClick={() => setIsCreateDialogOpen(true)}
              className="bg-white text-[#9C1E1E] hover:bg-gray-100 shadow-lg font-semibold"
              size="lg"
            >
              <UserPlus className="h-5 w-5 mr-2" />
              Nova Conta
            </Button>
          </div>

          {/* Elegant Stats Cards */}
          <div className="grid grid-cols-4 gap-4">
            <Card className="border-0 bg-white/95 backdrop-blur-sm shadow-xl hover:shadow-2xl transition-all duration-300 hover:-translate-y-1">
              <CardContent className="p-6">
                <div className="flex items-center justify-between mb-3">
                  <div className="w-10 h-10 bg-gradient-to-br from-gray-100 to-gray-200 rounded-lg flex items-center justify-center">
                    <Users className="h-5 w-5 text-gray-700" />
                  </div>
                </div>
                <div className="text-3xl font-bold text-gray-900 mb-1">
                  {stats?.total_users || users.length}
                </div>
                <div className="text-xs font-medium text-gray-600 uppercase tracking-wide">
                  Total de Usuários
                </div>
              </CardContent>
            </Card>

            <Card className="border-0 bg-gradient-to-br from-purple-50 to-purple-100/50 backdrop-blur-sm shadow-xl hover:shadow-2xl transition-all duration-300 hover:-translate-y-1">
              <CardContent className="p-6">
                <div className="flex items-center justify-between mb-3">
                  <div className="w-10 h-10 bg-gradient-to-br from-purple-500 to-purple-600 rounded-lg flex items-center justify-center">
                    <Crown className="h-5 w-5 text-white" />
                  </div>
                </div>
                <div className="text-3xl font-bold text-purple-900 mb-1">
                  {stats?.admins_count || indexaTeam.length}
                </div>
                <div className="text-xs font-medium text-purple-700 uppercase tracking-wide">
                  Equipe EXA
                </div>
              </CardContent>
            </Card>

            <Card className="border-0 bg-gradient-to-br from-blue-50 to-blue-100/50 backdrop-blur-sm shadow-xl hover:shadow-2xl transition-all duration-300 hover:-translate-y-1">
              <CardContent className="p-6">
                <div className="flex items-center justify-between mb-3">
                  <div className="w-10 h-10 bg-gradient-to-br from-blue-500 to-blue-600 rounded-lg flex items-center justify-center">
                    <UserCheck className="h-5 w-5 text-white" />
                  </div>
                </div>
                <div className="text-3xl font-bold text-blue-900 mb-1">
                  {stats?.clients_count || clients.length}
                </div>
                <div className="text-xs font-medium text-blue-700 uppercase tracking-wide">
                  Clientes Ativos
                </div>
              </CardContent>
            </Card>

            <Card className="border-0 bg-gradient-to-br from-green-50 to-green-100/50 backdrop-blur-sm shadow-xl hover:shadow-2xl transition-all duration-300 hover:-translate-y-1">
              <CardContent className="p-6">
                <div className="flex items-center justify-between mb-3">
                  <div className="w-10 h-10 bg-gradient-to-br from-green-500 to-green-600 rounded-lg flex items-center justify-center">
                    <Shield className="h-5 w-5 text-white" />
                  </div>
                </div>
                <div className="text-3xl font-bold text-green-900 mb-1">
                  {stats?.verified_users || users.filter((u) => u.email_verified_at).length}
                </div>
                <div className="text-xs font-medium text-green-700 uppercase tracking-wide">
                  Verificados
                </div>
              </CardContent>
            </Card>
          </div>
        </div>
      </div>

      {/* Elegant Tabs */}
      <div className="max-w-7xl mx-auto px-6 py-8">
        <Tabs value={activeTab} onValueChange={setActiveTab} className="w-full">
          <TabsList className="bg-white border-2 border-gray-200 p-1.5 rounded-xl shadow-md h-14">
            <TabsTrigger 
              value="team" 
              className="data-[state=active]:bg-gradient-to-r data-[state=active]:from-[#9C1E1E] data-[state=active]:to-[#B91C1C] data-[state=active]:text-white data-[state=inactive]:text-gray-700 data-[state=inactive]:hover:bg-gray-100 rounded-lg px-8 py-3 text-sm font-semibold transition-all duration-200 shadow-sm"
            >
              <Crown className="h-4 w-4 mr-2" />
              Equipe EXA
              <Badge variant="secondary" className="ml-3 bg-white/20 text-white data-[state=inactive]:bg-gray-200 data-[state=inactive]:text-gray-900 border-0">
                {indexaTeam.length}
              </Badge>
            </TabsTrigger>
            <TabsTrigger 
              value="clients"
              className="data-[state=active]:bg-gradient-to-r data-[state=active]:from-[#9C1E1E] data-[state=active]:to-[#B91C1C] data-[state=active]:text-white data-[state=inactive]:text-gray-700 data-[state=inactive]:hover:bg-gray-100 rounded-lg px-8 py-3 text-sm font-semibold transition-all duration-200 shadow-sm"
            >
              <Users className="h-4 w-4 mr-2" />
              Clientes
              <Badge variant="secondary" className="ml-3 bg-white/20 text-white data-[state=inactive]:bg-gray-200 data-[state=inactive]:text-gray-900 border-0">
                {clients.length}
              </Badge>
            </TabsTrigger>
          </TabsList>

          <TabsContent value="team" className="mt-6">
            <IndexaTeamSection users={users} loading={loading} onRefresh={fetchUsers} />
          </TabsContent>

          <TabsContent value="clients" className="mt-6">
            <ClientsSection users={users} loading={loading} onRefresh={fetchUsers} />
          </TabsContent>
        </Tabs>
      </div>

      {/* Dialogs */}
      <CreateUserDialog
        open={isCreateDialogOpen}
        onOpenChange={setIsCreateDialogOpen}
        onSuccess={handleRefresh}
      />
    </div>
  );
};

export default UsersPage;
