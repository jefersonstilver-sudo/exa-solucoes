import React, { useState, useEffect } from 'react';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Crown, Users, Shield, Plus, RefreshCw, Search, UserCheck, UserPlus, UserCog, Settings } from 'lucide-react';
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
  const [syncingOrphans, setSyncingOrphans] = useState(false);
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

  const handleSyncOrphanUsers = async () => {
    try {
      setSyncingOrphans(true);
      toast.loading('Sincronizando usuários órfãos...', { id: 'sync-orphans' });

      console.log('🔄 [SYNC] Iniciando sincronização de usuários órfãos...');

      const { data, error } = await supabase.functions.invoke('sync-users', {
        method: 'POST'
      });

      if (error) {
        throw error;
      }

      console.log('✅ [SYNC] Resultado:', data);

      toast.success(data.message || `${data.syncedCount} usuários sincronizados!`, { 
        id: 'sync-orphans',
        duration: 5000 
      });

      // Recarregar lista de usuários
      if (data.syncedCount > 0) {
        await fetchUsers();
        await refetchStats();
      }
    } catch (error: any) {
      console.error('❌ [SYNC] Erro ao sincronizar:', error);
      toast.error(error.message || 'Erro ao sincronizar usuários órfãos', { id: 'sync-orphans' });
    } finally {
      setSyncingOrphans(false);
    }
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

  // Mobile View - Apple/Nubank Style
  if (isMobile) {
    return (
      <div className="min-h-screen bg-gradient-to-br from-gray-50 to-slate-100">
        {/* Mobile Header - Glassmorphism */}
        <div className="sticky top-0 z-40 bg-white/80 backdrop-blur-xl border-b border-gray-100">
          <div className="px-4 py-3 safe-area-top">
            <div className="flex items-center justify-between">
              <div className="flex items-center gap-3">
                <div className="p-2 bg-[#9C1E1E]/10 rounded-xl">
                  <Users className="h-5 w-5 text-[#9C1E1E]" />
                </div>
                <div>
                  <h1 className="text-lg font-semibold text-foreground">Usuários</h1>
                  <p className="text-[11px] text-muted-foreground">{users.length} no sistema</p>
                </div>
              </div>
              <div className="flex items-center gap-1.5">
                <Button
                  onClick={handleRefresh}
                  size="sm"
                  variant="ghost"
                  className="h-8 w-8 p-0"
                  disabled={loading}
                >
                  <RefreshCw className={`w-4 h-4 ${loading ? 'animate-spin' : ''}`} />
                </Button>
                <Button
                  onClick={() => setIsCreateDialogOpen(true)}
                  size="sm"
                  className="h-8 bg-[#9C1E1E] hover:bg-[#7D1818] px-3"
                >
                  <Plus className="w-4 h-4" />
                </Button>
              </div>
            </div>
          </div>
        </div>

        {/* Stats Grid Compacto */}
        <div className="p-3">
          <UserStatsCards stats={stats} loading={loadingStats} />
        </div>

        {/* Botões de Ação */}
        <div className="px-3 pb-2 flex gap-2">
          <Button
            onClick={() => window.location.href = '/super_admin/tipos-conta'}
            size="sm"
            variant="outline"
            className="flex-1 h-8 text-xs border-[#9C1E1E]/20 text-[#9C1E1E] hover:bg-[#9C1E1E]/5"
          >
            <Settings className="w-3.5 h-3.5 mr-1.5" />
            Tipos de Conta
          </Button>
          <Button
            onClick={handleSyncOrphanUsers}
            disabled={syncingOrphans}
            size="sm"
            variant="outline"
            className="flex-1 h-8 text-xs border-amber-200 text-amber-700 hover:bg-amber-50"
          >
            <UserCog className={`w-3.5 h-3.5 mr-1.5 ${syncingOrphans ? 'animate-spin' : ''}`} />
            Sincronizar
          </Button>
        </div>

        {/* Filter Pills Scrollable */}
        <div className="overflow-x-auto scrollbar-hide px-3 pb-2">
          <div className="inline-flex gap-1.5 min-w-max">
            <button
              onClick={() => setActiveTab('team')}
              className={`px-3 py-1.5 rounded-full text-[11px] font-medium transition-all flex items-center gap-1 ${
                activeTab === 'team'
                  ? 'bg-[#9C1E1E] text-white'
                  : 'bg-white/80 text-gray-600 border border-gray-200'
              }`}
            >
              <Crown className="h-3 w-3" />
              Equipe
              <span className={`text-[10px] ${activeTab === 'team' ? 'opacity-80' : 'text-gray-400'}`}>
                {filteredTeam.length}
              </span>
            </button>
            <button
              onClick={() => setActiveTab('clients')}
              className={`px-3 py-1.5 rounded-full text-[11px] font-medium transition-all flex items-center gap-1 ${
                activeTab === 'clients'
                  ? 'bg-[#9C1E1E] text-white'
                  : 'bg-white/80 text-gray-600 border border-gray-200'
              }`}
            >
              <UserCheck className="h-3 w-3" />
              Clientes
              <span className={`text-[10px] ${activeTab === 'clients' ? 'opacity-80' : 'text-gray-400'}`}>
                {filteredClients.length}
              </span>
            </button>
          </div>
        </div>

        {/* Search */}
        <div className="px-3 pb-3">
          <div className="relative">
            <Input
              type="text"
              placeholder="Buscar..."
              value={searchTerm}
              onChange={(e) => setSearchTerm(e.target.value)}
              className="h-9 pl-9 text-sm bg-white/80"
            />
            <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-muted-foreground" />
          </div>
        </div>

        {/* Lista de Usuários */}
        <div className="px-3 pb-20">
          {activeTab === 'team' && (
            <>
              {loading ? (
                <div className="space-y-2">
                  {[1, 2, 3].map((i) => (
                    <div key={i} className="bg-white/80 rounded-xl p-3 animate-pulse">
                      <div className="h-12 bg-gray-200 rounded" />
                    </div>
                  ))}
                </div>
              ) : filteredTeam.length === 0 ? (
                <Card className="p-6 text-center bg-white/80 backdrop-blur-sm">
                  <Shield className="h-10 w-10 mx-auto text-muted-foreground/50 mb-2" />
                  <p className="text-sm text-muted-foreground">
                    {searchTerm ? 'Nenhum membro encontrado' : 'Nenhum membro cadastrado'}
                  </p>
                </Card>
              ) : (
                <div className="space-y-2">
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
              {loading ? (
                <div className="space-y-2">
                  {[1, 2, 3].map((i) => (
                    <div key={i} className="bg-white/80 rounded-xl p-3 animate-pulse">
                      <div className="h-12 bg-gray-200 rounded" />
                    </div>
                  ))}
                </div>
              ) : filteredClients.length === 0 ? (
                <Card className="p-6 text-center bg-white/80 backdrop-blur-sm">
                  <UserCheck className="h-10 w-10 mx-auto text-muted-foreground/50 mb-2" />
                  <p className="text-sm text-muted-foreground">
                    {searchTerm ? 'Nenhum cliente encontrado' : 'Nenhum cliente cadastrado'}
                  </p>
                </Card>
              ) : (
                <div className="space-y-2">
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
            onClick={() => window.location.href = '/super_admin/tipos-conta'}
            variant="outline"
            className="border-[#9C1E1E]/30 text-[#9C1E1E] hover:bg-[#9C1E1E]/5"
          >
            <Settings className="h-4 w-4 mr-2" />
            Tipos de Conta
          </Button>
          <Button 
            onClick={handleSyncOrphanUsers}
            variant="outline"
            disabled={syncingOrphans}
            className="border-amber-500/30 text-amber-600 hover:bg-amber-50 dark:text-amber-400 dark:hover:bg-amber-500/10"
          >
            <UserCog className={`h-4 w-4 mr-2 ${syncingOrphans ? 'animate-spin' : ''}`} />
            Sincronizar Órfãos
          </Button>
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
