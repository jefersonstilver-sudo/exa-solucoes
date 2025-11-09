import React, { useState, useEffect } from 'react';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
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
    <div className="space-y-6">
      {/* Header */}
      <div className="flex justify-between items-center">
        <div>
          <h1 className="text-3xl font-bold">Gestão de Usuários</h1>
          <p className="text-muted-foreground">
            Administre contas e permissões do sistema
          </p>
        </div>
        <div className="flex gap-2">
          <Button 
            onClick={handleRefresh}
            variant="outline"
            disabled={loading}
          >
            <RefreshCw className={`h-4 w-4 mr-2 ${loading ? 'animate-spin' : ''}`} />
            Atualizar
          </Button>
          <Button onClick={() => setIsCreateDialogOpen(true)}>
            <UserPlus className="h-4 w-4 mr-2" />
            Nova Conta
          </Button>
        </div>
      </div>

      {/* Stats Cards */}
      <UserStatsCards stats={stats} loading={loadingStats} />

      {/* Main Content */}
      <Card>
        <CardHeader>
          <div className="flex items-center justify-between">
            <CardTitle>Usuários do Sistema</CardTitle>
            <div className="flex items-center gap-4">
              <div className="relative w-72">
                <Input
                  type="text"
                  placeholder="Buscar por email ou nome..."
                  value={searchTerm}
                  onChange={(e) => setSearchTerm(e.target.value)}
                  className="pl-9"
                />
                <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-muted-foreground" />
              </div>
            </div>
          </div>
        </CardHeader>
        <CardContent>
          <Tabs value={activeTab} onValueChange={setActiveTab} className="w-full">
            <TabsList className="grid w-full grid-cols-2">
              <TabsTrigger value="team">
                <Crown className="h-4 w-4 mr-2" />
                Equipe ({filteredTeam.length})
              </TabsTrigger>
              <TabsTrigger value="clients">
                <UserCheck className="h-4 w-4 mr-2" />
                Clientes ({filteredClients.length})
              </TabsTrigger>
            </TabsList>

            <TabsContent value="team" className="mt-4">
              {loading ? (
                <div className="space-y-3">
                  {[1, 2, 3].map((i) => (
                    <div key={i} className="h-16 bg-muted rounded animate-pulse" />
                  ))}
                </div>
              ) : (
                <IndexaTeamSection users={filteredTeam} loading={loading} onRefresh={handleRefresh} />
              )}
            </TabsContent>

            <TabsContent value="clients" className="mt-4">
              {loading ? (
                <div className="space-y-3">
                  {[1, 2, 3].map((i) => (
                    <div key={i} className="h-16 bg-muted rounded animate-pulse" />
                  ))}
                </div>
              ) : (
                <ClientsSection users={filteredClients} loading={loading} onRefresh={handleRefresh} />
              )}
            </TabsContent>
          </Tabs>
        </CardContent>
      </Card>

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
};

export default UsersPage;
