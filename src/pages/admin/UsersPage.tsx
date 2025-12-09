import React, { useState, useEffect } from 'react';
import { Card } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Crown, Users, Shield, Plus, RefreshCw, Search, UserCheck, UserCog, Settings } from 'lucide-react';
import { supabase } from '@/integrations/supabase/client';
import { toast } from 'sonner';
import { useAdvancedResponsive } from '@/hooks/useAdvancedResponsive';
import { useUserStats } from '@/hooks/useUserStats';
import UserStatsCards from '@/components/admin/users/UserStatsCards';
import EnhancedUserMobileCard from '@/components/admin/users/EnhancedUserMobileCard';
import CreateUserDialog from '@/components/admin/users/CreateUserDialog';
import { UserDetailsDialogComplete } from '@/components/admin/users/UserDetailsDialogComplete';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { useNavigate } from 'react-router-dom';

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
  const navigate = useNavigate();
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
      
      const { data, error, status } = await supabase
        .rpc('get_users_with_last_access');

      if (error) {
        if (error.code === 'PGRST301' || error.message.includes('permission denied')) {
          toast.error('Sem permissão para visualizar usuários.');
        } else {
          toast.error('Erro ao carregar usuários: ' + error.message);
        }
        return;
      }

      if (!data || data.length === 0) {
        toast.warning('Nenhum usuário encontrado');
      } else {
        toast.success(`${data.length} usuários carregados`);
      }

      setUsers(data || []);
    } catch (error: any) {
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

      const { data, error } = await supabase.functions.invoke('sync-users', {
        method: 'POST'
      });

      if (error) throw error;

      toast.success(data.message || `${data.syncedCount} usuários sincronizados!`, { 
        id: 'sync-orphans',
        duration: 5000 
      });

      if (data.syncedCount > 0) {
        await fetchUsers();
        await refetchStats();
      }
    } catch (error: any) {
      toast.error(error.message || 'Erro ao sincronizar', { id: 'sync-orphans' });
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

  // Mobile View - Apple-style Glassmorphism
  if (isMobile) {
    return (
      <div className="min-h-screen bg-gradient-to-br from-gray-50 to-slate-100">
        {/* Mobile Header - Glassmorphism */}
        <div className="sticky top-0 z-40 bg-white/80 backdrop-blur-xl border-b border-gray-100">
          <div className="px-4 py-3 safe-area-top">
            <div className="flex items-center justify-between">
              <div className="flex items-center gap-3">
                <div className="p-2 bg-[hsl(var(--exa-red))]/10 rounded-xl">
                  <Users className="h-5 w-5 text-[hsl(var(--exa-red))]" />
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
                  className="h-8 bg-[hsl(var(--exa-red))] hover:bg-[hsl(var(--exa-red))]/90 px-3"
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

        {/* Botões de Ação - Padronizados */}
        <div className="px-3 pb-2 flex gap-2">
          <Button
            onClick={() => navigate('/super_admin/tipos-conta')}
            size="sm"
            variant="outline"
            className="flex-1 h-9 text-xs border-[hsl(var(--exa-red))]/20 text-[hsl(var(--exa-red))] hover:bg-[hsl(var(--exa-red))]/5"
          >
            <Settings className="w-3.5 h-3.5 mr-1.5" />
            Tipos de Conta
          </Button>
          <Button
            onClick={handleSyncOrphanUsers}
            disabled={syncingOrphans}
            size="sm"
            variant="outline"
            className="flex-1 h-9 text-xs border-[hsl(var(--exa-red))]/20 text-[hsl(var(--exa-red))] hover:bg-[hsl(var(--exa-red))]/5"
          >
            <UserCog className={`w-3.5 h-3.5 mr-1.5 ${syncingOrphans ? 'animate-spin' : ''}`} />
            Sincronizar
          </Button>
        </div>

        {/* Filter Pills - Grid Layout for Better Mobile Display */}
        <div className="px-3 pb-2">
          <div className="flex gap-2">
            <button
              onClick={() => setActiveTab('team')}
              className={`flex-1 px-3 py-2 rounded-xl text-xs font-medium transition-all flex items-center justify-center gap-1.5 ${
                activeTab === 'team'
                  ? 'bg-[hsl(var(--exa-red))] text-white shadow-md'
                  : 'bg-white/80 text-gray-600 border border-gray-200'
              }`}
            >
              <Crown className="h-3.5 w-3.5" />
              Equipe
              <span className={`text-[10px] px-1.5 py-0.5 rounded-full ${
                activeTab === 'team' ? 'bg-white/20' : 'bg-gray-100'
              }`}>
                {filteredTeam.length}
              </span>
            </button>
            <button
              onClick={() => setActiveTab('clients')}
              className={`flex-1 px-3 py-2 rounded-xl text-xs font-medium transition-all flex items-center justify-center gap-1.5 ${
                activeTab === 'clients'
                  ? 'bg-[hsl(var(--exa-red))] text-white shadow-md'
                  : 'bg-white/80 text-gray-600 border border-gray-200'
              }`}
            >
              <UserCheck className="h-3.5 w-3.5" />
              Clientes
              <span className={`text-[10px] px-1.5 py-0.5 rounded-full ${
                activeTab === 'clients' ? 'bg-white/20' : 'bg-gray-100'
              }`}>
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

  // Desktop View - Apple-style Glassmorphism
  return (
    <div className="min-h-screen bg-gradient-to-br from-gray-50 to-slate-100 p-6">
      {/* Header Compacto */}
      <div className="flex items-start justify-between mb-6">
        <div className="flex items-center gap-4">
          <div className="p-3 bg-[hsl(var(--exa-red))]/10 rounded-2xl">
            <Users className="h-6 w-6 text-[hsl(var(--exa-red))]" />
          </div>
          <div>
            <h1 className="text-2xl font-semibold text-foreground">Gestão de Usuários</h1>
            <p className="text-sm text-muted-foreground">{users.length} usuários no sistema</p>
          </div>
        </div>
        
        <div className="flex items-center gap-2">
          <Button 
            onClick={() => navigate('/super_admin/tipos-conta')}
            variant="outline"
            size="sm"
            className="h-9 border-[hsl(var(--exa-red))]/20 text-[hsl(var(--exa-red))] hover:bg-[hsl(var(--exa-red))]/5"
          >
            <Settings className="h-4 w-4 mr-2" />
            Tipos de Conta
          </Button>
          <Button 
            onClick={handleSyncOrphanUsers}
            variant="outline"
            size="sm"
            disabled={syncingOrphans}
            className="h-9 border-[hsl(var(--exa-red))]/20 text-[hsl(var(--exa-red))] hover:bg-[hsl(var(--exa-red))]/5"
          >
            <UserCog className={`h-4 w-4 mr-2 ${syncingOrphans ? 'animate-spin' : ''}`} />
            Sincronizar
          </Button>
          <Button 
            onClick={handleRefresh}
            variant="outline"
            size="sm"
            disabled={loading}
            className="h-9"
          >
            <RefreshCw className={`h-4 w-4 mr-2 ${loading ? 'animate-spin' : ''}`} />
            Atualizar
          </Button>
          <Button 
            onClick={() => setIsCreateDialogOpen(true)}
            size="sm"
            className="h-9 bg-[hsl(var(--exa-red))] hover:bg-[hsl(var(--exa-red))]/90"
          >
            <Plus className="h-4 w-4 mr-2" />
            Novo Usuário
          </Button>
        </div>
      </div>

      {/* Stats Cards */}
      <div className="mb-6">
        <UserStatsCards stats={stats} loading={loadingStats} />
      </div>

      {/* Tabs e Busca */}
      <div className="bg-white/80 backdrop-blur-sm rounded-2xl border border-white/50 shadow-md overflow-hidden">
        <div className="flex items-center justify-between p-4 border-b border-gray-100">
          <div className="flex gap-2">
            <button
              onClick={() => setActiveTab('team')}
              className={`px-4 py-2 rounded-xl text-sm font-medium transition-all flex items-center gap-2 ${
                activeTab === 'team'
                  ? 'bg-[hsl(var(--exa-red))] text-white shadow-md'
                  : 'bg-gray-100 text-gray-600 hover:bg-gray-200'
              }`}
            >
              <Crown className="h-4 w-4" />
              Equipe EXA
              <Badge variant="secondary" className={`text-[10px] ${activeTab === 'team' ? 'bg-white/20 text-white' : ''}`}>
                {filteredTeam.length}
              </Badge>
            </button>
            <button
              onClick={() => setActiveTab('clients')}
              className={`px-4 py-2 rounded-xl text-sm font-medium transition-all flex items-center gap-2 ${
                activeTab === 'clients'
                  ? 'bg-[hsl(var(--exa-red))] text-white shadow-md'
                  : 'bg-gray-100 text-gray-600 hover:bg-gray-200'
              }`}
            >
              <UserCheck className="h-4 w-4" />
              Clientes
              <Badge variant="secondary" className={`text-[10px] ${activeTab === 'clients' ? 'bg-white/20 text-white' : ''}`}>
                {filteredClients.length}
              </Badge>
            </button>
          </div>
          
          <div className="relative w-64">
            <Input
              type="text"
              placeholder="Buscar usuário..."
              value={searchTerm}
              onChange={(e) => setSearchTerm(e.target.value)}
              className="h-9 pl-9 text-sm bg-white"
            />
            <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-muted-foreground" />
          </div>
        </div>

        {/* Lista de Usuários Desktop */}
        <div className="p-4">
          {activeTab === 'team' && (
            <>
              {loading ? (
                <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
                  {[1, 2, 3, 4, 5, 6].map((i) => (
                    <div key={i} className="bg-gray-100 rounded-xl p-4 animate-pulse">
                      <div className="h-16 bg-gray-200 rounded" />
                    </div>
                  ))}
                </div>
              ) : filteredTeam.length === 0 ? (
                <div className="text-center py-12">
                  <Shield className="h-12 w-12 mx-auto text-muted-foreground/50 mb-3" />
                  <p className="text-muted-foreground">
                    {searchTerm ? 'Nenhum membro encontrado' : 'Nenhum membro cadastrado'}
                  </p>
                </div>
              ) : (
                <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
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
                <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
                  {[1, 2, 3, 4, 5, 6].map((i) => (
                    <div key={i} className="bg-gray-100 rounded-xl p-4 animate-pulse">
                      <div className="h-16 bg-gray-200 rounded" />
                    </div>
                  ))}
                </div>
              ) : filteredClients.length === 0 ? (
                <div className="text-center py-12">
                  <UserCheck className="h-12 w-12 mx-auto text-muted-foreground/50 mb-3" />
                  <p className="text-muted-foreground">
                    {searchTerm ? 'Nenhum cliente encontrado' : 'Nenhum cliente cadastrado'}
                  </p>
                </div>
              ) : (
                <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
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
};

export default UsersPage;
