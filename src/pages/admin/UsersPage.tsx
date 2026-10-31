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
import { UserConsoleDialog } from '@/components/admin/users/console/UserConsoleDialog';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { useNavigate, useSearchParams } from 'react-router-dom';
import { PaginaCelular, TopoCelular, BotaoRedondo, BotaoPrincipal, Kpis, BuscaCelular, CartaoCelular, Selo, SELO, Vazio, Carregando } from '@/components/admin/celular/kit';

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
  const [searchParams] = useSearchParams();
  const [users, setUsers] = useState<User[]>([]);
  const [loading, setLoading] = useState(true);
  const [loadError, setLoadError] = useState<string | null>(null);
  const [activeTab, setActiveTab] = useState('team');
  const [searchTerm, setSearchTerm] = useState('');
  const [isCreateDialogOpen, setIsCreateDialogOpen] = useState(false);
  const [selectedUser, setSelectedUser] = useState<User | null>(null);
  const [syncingOrphans, setSyncingOrphans] = useState(false);
  const { isMobile } = useAdvancedResponsive();
  const { stats, loading: loadingStats, refetch: refetchStats } = useUserStats();

  const fetchUsers = async () => {
    console.log('[UsersPage] fetchUsers iniciado');
    try {
      setLoading(true);
      setLoadError(null);

      const { data, error } = await supabase.rpc('get_users_with_last_access');

      if (error) {
        console.error('[UsersPage] Erro RPC get_users_with_last_access:', error);
        const msg = error.code === 'PGRST301' || (error.message || '').includes('permission denied')
          ? 'Sem permissão para visualizar usuários.'
          : `Erro ao carregar usuários: ${error.message}`;
        setLoadError(msg);
        toast.error(msg);
        setUsers([]);
        return;
      }

      console.log('[UsersPage] usuários carregados:', data?.length ?? 0);
      setUsers((data as any) || []);
    } catch (error: any) {
      console.error('[UsersPage] Erro crítico em fetchUsers:', error);
      setLoadError(error?.message || 'Erro crítico ao carregar usuários');
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

  useEffect(() => {
    const userId = searchParams.get('user');
    if (!userId || loading) return;
    const target = users.find(u => u.id === userId);
    if (target) { setSelectedUser(target); setActiveTab(target.role === 'client' ? 'clients' : 'team'); }
  }, [searchParams, users, loading]);

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

  // Filtrar usuários - incluindo comercial na equipe EXA
  const indexaTeam = users.filter((u) =>
    ['super_admin', 'admin', 'admin_marketing', 'admin_financeiro', 'comercial'].includes(u.role)
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

  // Estado de erro - visível, sem redirecionar
  if (loadError && !loading) {
    return (
      <div className="min-h-[60vh] flex items-center justify-center p-6">
        <Card className="max-w-lg w-full p-6 border-red-200 bg-red-50">
          <div className="flex items-start gap-3">
            <Shield className="h-6 w-6 text-red-600 flex-shrink-0 mt-0.5" />
            <div className="flex-1">
              <h2 className="text-lg font-semibold text-red-900 mb-1">Não foi possível carregar usuários</h2>
              <p className="text-sm text-red-800 mb-4 break-words">{loadError}</p>
              <Button onClick={handleRefresh} size="sm" className="bg-red-600 hover:bg-red-700 text-white">
                <RefreshCw className="w-4 h-4 mr-2" />
                Tentar novamente
              </Button>
            </div>
          </div>
        </Card>
      </div>
    );
  }

  // Estado de carregamento inicial
  if (loading && users.length === 0) {
    return (
      <div className="min-h-[60vh] flex flex-col items-center justify-center gap-3">
        <RefreshCw className="w-8 h-8 text-[hsl(var(--exa-red))] animate-spin" />
        <p className="text-sm text-muted-foreground">Carregando usuários...</p>
      </div>
    );
  }

  // Mobile View
  if (isMobile) {
    const PAPEL: Record<string, { r: string; c: keyof typeof SELO }> = {
      super_admin: { r: 'Super admin', c: 'ambar' }, admin: { r: 'Coordenação', c: 'azul' },
      admin_marketing: { r: 'Marketing', c: 'roxo' }, admin_financeiro: { r: 'Financeiro', c: 'verde' },
      comercial: { r: 'Comercial', c: 'azul' }, client: { r: 'Cliente', c: 'cinza' },
    };
    const lista = activeTab === 'team' ? filteredTeam : filteredClients;
    const quando = (iso?: string) => {
      if (!iso) return 'Nunca acessou';
      const d = new Date(iso); const dias = Math.floor((Date.now() - d.getTime()) / 86400000);
      if (dias <= 0) return `Acessou hoje ${d.toLocaleTimeString('pt-BR', { hour: '2-digit', minute: '2-digit' })}`;
      if (dias === 1) return 'Acessou ontem';
      if (dias < 30) return `Acessou há ${dias} dias`;
      return `Último acesso ${d.toLocaleDateString('pt-BR')}`;
    };
    return (
      <PaginaCelular>
        <TopoCelular
          titulo="Usuários"
          sub={`${users.length} no sistema`}
          acoes={
            <>
              <BotaoRedondo rotulo="Atualizar" onClick={handleRefresh} disabled={loading}><RefreshCw className={`h-[18px] w-[18px] ${loading ? 'animate-spin' : ''}`} /></BotaoRedondo>
              <BotaoPrincipal onClick={() => setIsCreateDialogOpen(true)}><Plus className="h-[18px] w-[18px]" strokeWidth={2.6} /> Novo</BotaoPrincipal>
            </>
          }
        />
        <Kpis
          colunas={2}
          itens={[
            { rotulo: 'Equipe EXA', valor: indexaTeam.length, cor: '#9C1E1E', ativo: activeTab === 'team', onClick: () => setActiveTab('team') },
            { rotulo: 'Clientes', valor: clients.length, cor: '#2B4C8C', ativo: activeTab === 'clients', onClick: () => setActiveTab('clients') },
          ]}
        />
        <BuscaCelular valor={searchTerm} onChange={setSearchTerm} placeholder={activeTab === 'team' ? 'Buscar na equipe' : 'Buscar cliente por nome ou e-mail'} />
        {loading ? <Carregando /> : lista.length === 0 ? (
          <Vazio icone={<Users className="h-6 w-6" />} titulo={searchTerm ? 'Ninguém encontrado' : 'Nenhum cadastro'} />
        ) : (
          <CartaoCelular className="divide-y divide-black/[0.05] overflow-hidden">
            {lista.map((u) => {
              const papel = PAPEL[u.role] || { r: u.role, c: 'cinza' as const };
              const cor = SELO[papel.c];
              const nome = u.nome || u.email.split('@')[0];
              return (
                <button key={u.id} type="button" onClick={() => handleViewDetails(u)} className="flex w-full items-center gap-3 px-4 py-3 text-left active:bg-black/[0.03]">
                  <span className="grid h-11 w-11 shrink-0 place-items-center overflow-hidden rounded-full bg-[#9C1E1E]/10 text-[15px] font-extrabold text-[#9C1E1E]">
                    {u.avatar_url ? <img src={u.avatar_url} alt="" className="h-full w-full object-cover" /> : nome.trim().charAt(0).toUpperCase()}
                  </span>
                  <span className="min-w-0 flex-1">
                    <span className="flex items-center gap-2">
                      <span className="min-w-0 flex-1 truncate text-[15.5px] font-extrabold">{nome}</span>
                      <Selo fundo={cor.fundo} cor={cor.cor}>{papel.r}</Selo>
                    </span>
                    <span className="mt-0.5 block truncate text-[13px] text-[#5E5F63]">{u.email}</span>
                    <span className="mt-0.5 block truncate text-[12px] font-semibold text-[#8A8B90]">
                      {quando(u.last_sign_in_at)}{!u.email_confirmed_at && !u.email_verified_at ? ' · e-mail não confirmado' : ''}
                    </span>
                  </span>
                </button>
              );
            })}
          </CartaoCelular>
        )}
        <div className="mt-3 grid grid-cols-2 gap-2">
          <button type="button" onClick={() => navigate('/super_admin/tipos-conta')} className="flex h-11 items-center justify-center gap-1.5 rounded-2xl border border-black/[0.08] bg-white/80 text-[13.5px] font-bold text-[#45464A]">
            <Settings className="h-4 w-4" /> Tipos de conta
          </button>
          <button type="button" onClick={handleSyncOrphanUsers} disabled={syncingOrphans} className="flex h-11 items-center justify-center gap-1.5 rounded-2xl border border-black/[0.08] bg-white/80 text-[13.5px] font-bold text-[#45464A] disabled:opacity-60">
            <UserCog className={`h-4 w-4 ${syncingOrphans ? 'animate-spin' : ''}`} /> Sincronizar
          </button>
        </div>
        <CreateUserDialog open={isCreateDialogOpen} onOpenChange={setIsCreateDialogOpen} onSuccess={handleRefresh} />
        {selectedUser && (
          <UserConsoleDialog open={true} onOpenChange={(open) => !open && setSelectedUser(null)} user={selectedUser as any} onUserUpdated={handleRefresh} />
        )}
      </PaginaCelular>
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
            className="h-9 border-[#9C1E1E]/20 text-[#9C1E1E] hover:bg-[#9C1E1E]/5"
          >
            <Settings className="h-4 w-4 mr-2" />
            Tipos de Conta
          </Button>
          <Button 
            onClick={handleSyncOrphanUsers}
            variant="outline"
            size="sm"
            disabled={syncingOrphans}
            className="h-9 border-[#9C1E1E]/20 text-[#9C1E1E] hover:bg-[#9C1E1E]/5"
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
            className="h-9 bg-[#9C1E1E] hover:bg-[#7C1818] text-white"
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
                  ? 'bg-[#9C1E1E] text-white shadow-md'
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
                  ? 'bg-[#9C1E1E] text-white shadow-md'
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
        <UserConsoleDialog 
          open={true}
          onOpenChange={(open) => !open && setSelectedUser(null)}
          user={selectedUser as any} 
          onUserUpdated={handleRefresh}
        />
      )}
    </div>
  );
};

export default UsersPage;
