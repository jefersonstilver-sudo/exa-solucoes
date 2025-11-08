import React, { useState, useEffect } from 'react';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { Card, CardContent } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Crown, Users, Shield, Plus, RefreshCw, Search, UserCheck } from 'lucide-react';
import { supabase } from '@/integrations/supabase/client';
import { toast } from 'sonner';
import IndexaTeamSection from '@/components/admin/users/IndexaTeamSection';
import ClientsSection from '@/components/admin/users/ClientsSection';
import { useAdvancedResponsive } from '@/hooks/useAdvancedResponsive';
import { useUserStats } from '@/hooks/useUserStats';
import UserStatsCards from '@/components/admin/users/UserStatsCards';
import EnhancedUserMobileCard from '@/components/admin/users/EnhancedUserMobileCard';
import CreateUserDialog from '@/components/admin/users/CreateUserDialog';
import UserDetailsCard from '@/components/admin/users/UserDetailsCard';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';

interface User {
  id: string;
  email: string;
  role: string;
  data_criacao: string;
  nome?: string;
  email_confirmed_at?: string;
  last_sign_in_at?: string;
  raw_user_meta_data?: any;
  banned_until?: string;
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
      console.log('👥 [USERS_PAGE] Iniciando busca de usuários...');

      // Buscar diretamente da tabela users
      const { data, error, status } = await supabase
        .from('users')
        .select('id, email, role, data_criacao, nome')
        .order('data_criacao', { ascending: false });

      console.log('📊 [USERS_PAGE] Resposta da query:', {
        status,
        hasError: !!error,
        dataLength: data?.length || 0,
        error: error,
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
          <UserDetailsCard user={selectedUser} onClose={() => setSelectedUser(null)} />
        )}
      </div>
    );
  }

  // Desktop View
  const totalStats = {
    total: users.length,
    indexaTeam: indexaTeam.length,
    clients: clients.length,
    verified: users.filter((u) => u.email_confirmed_at).length,
  };

  return (
    <div className="space-y-6">
      {/* Header Principal */}
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-3xl font-bold text-gray-900 flex items-center">
            <Users className="h-8 w-8 mr-3 text-indexa-purple" />
            Sistema de Gestão de Usuários
          </h1>
          <p className="text-gray-600 mt-2">Gestão completa da equipe EXA e base de clientes</p>
        </div>
      </div>

      {/* Estatísticas Gerais */}
      <div className="grid grid-cols-1 md:grid-cols-4 gap-6">
        <Card>
          <CardContent className="pt-6">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm text-muted-foreground">Total de Usuários</p>
                <p className="text-2xl font-bold">{totalStats.total}</p>
              </div>
              <Users className="h-8 w-8 text-gray-500" />
            </div>
          </CardContent>
        </Card>

        <Card>
          <CardContent className="pt-6">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm text-muted-foreground">Equipe EXA</p>
                <p className="text-2xl font-bold text-indexa-purple">{totalStats.indexaTeam}</p>
              </div>
              <Crown className="h-8 w-8 text-indexa-purple" />
            </div>
          </CardContent>
        </Card>

        <Card>
          <CardContent className="pt-6">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm text-muted-foreground">Base de Clientes</p>
                <p className="text-2xl font-bold text-blue-500">{totalStats.clients}</p>
              </div>
              <UserCheck className="h-8 w-8 text-blue-500" />
            </div>
          </CardContent>
        </Card>

        <Card>
          <CardContent className="pt-6">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm text-muted-foreground">Verificados</p>
                <p className="text-2xl font-bold text-green-500">{totalStats.verified}</p>
              </div>
              <Shield className="h-8 w-8 text-green-500" />
            </div>
          </CardContent>
        </Card>
      </div>

      {/* Tabs para Separação */}
      <Tabs value={activeTab} onValueChange={setActiveTab} className="w-full">
        <TabsList className="grid w-full grid-cols-2">
          <TabsTrigger value="team" className="flex items-center space-x-2">
            <Crown className="h-4 w-4" />
            <span>Equipe EXA ({indexaTeam.length})</span>
          </TabsTrigger>
          <TabsTrigger value="clients" className="flex items-center space-x-2">
            <Users className="h-4 w-4" />
            <span>Base de Clientes ({clients.length})</span>
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
  );
};

export default UsersPage;
