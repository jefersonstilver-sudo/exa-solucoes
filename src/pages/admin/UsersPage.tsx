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
import { Pagina, Cabecalho, Busca, Pilulas, Kpi, Chip, TOM, Avatar, Carregando as CarregandoKit, Vazio as VazioKit, BOTAO, BOTAO2, vidro } from '@/components/admin/ui/exa';
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
  is_blocked?: boolean;
}

const UsersPage = () => {
  const navigate = useNavigate();
  const [searchParams] = useSearchParams();
  const [users, setUsers] = useState<User[]>([]);
  const [loading, setLoading] = useState(true);
  const [fotoQuebrada, setFotoQuebrada] = useState<Set<string>>(new Set()); // foto que não abre vira a inicial do nome
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
      // 07/11/2026: a RPC não devolve is_blocked; busca à parte quem está bloqueado
      const { data: bloq } = await supabase.from('users').select('id').eq('is_blocked', true);
      const setBloq = new Set((bloq || []).map((b: any) => b.id));
      setUsers(((data as any) || []).map((u: any) => ({ ...u, is_blocked: setBloq.has(u.id) })));
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
                    {u.avatar_url && !fotoQuebrada.has(u.avatar_url) ? <img src={u.avatar_url} alt="" className="h-full w-full object-cover" onError={() => setFotoQuebrada((q) => new Set(q).add(u.avatar_url!))} /> : nome.trim().charAt(0).toUpperCase()}
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

  // Desktop (07/11/2026): kit de vidro — equipe x clientes, busca, linha por usuário com papel, bloqueio e último acesso
  const PAPEL_D: Record<string, { r: string; tom: keyof typeof TOM }> = {
    super_admin: { r: 'Super admin', tom: 'ambar' }, admin: { r: 'Coordenação', tom: 'azul' }, admin_marketing: { r: 'Marketing', tom: 'roxo' },
    admin_financeiro: { r: 'Financeiro', tom: 'verde' }, comercial: { r: 'Comercial', tom: 'azul' }, client: { r: 'Cliente', tom: 'cinza' },
  };
  const quandoD = (iso?: string) => {
    if (!iso) return 'nunca acessou';
    const d = new Date(iso); const dias = Math.floor((Date.now() - d.getTime()) / 86400000);
    if (dias <= 0) return `acessou hoje ${d.toLocaleTimeString('pt-BR', { hour: '2-digit', minute: '2-digit' })}`;
    if (dias === 1) return 'acessou ontem';
    if (dias < 30) return `acessou há ${dias} dias`;
    return `último acesso ${d.toLocaleDateString('pt-BR')}`;
  };
  const listaD = activeTab === 'team' ? filteredTeam : filteredClients;
  const bloqueados = users.filter((u: any) => u.is_blocked).length;
  const semAcesso30 = clients.filter((u) => !u.last_sign_in_at || Date.now() - new Date(u.last_sign_in_at).getTime() > 30 * 86400000).length;
  return (
    <Pagina>
      <Cabecalho
        titulo="Usuários"
        sub={`${indexaTeam.length} na equipe · ${clients.length} clientes com conta`}
        acoes={(
          <>
            <button type="button" className={BOTAO2} onClick={() => navigate('/super_admin/tipos-conta')}><Settings className="h-4 w-4" /> Tipos de conta</button>
            <button type="button" className={BOTAO2} onClick={handleSyncOrphanUsers} disabled={syncingOrphans} title="Trazer contas do Auth que não estão na tabela de usuários"><UserCog className={`h-4 w-4 ${syncingOrphans ? 'animate-spin' : ''}`} /> Sincronizar</button>
            <button type="button" className={BOTAO2} onClick={handleRefresh} disabled={loading} title="Atualizar"><RefreshCw className={`h-4 w-4 ${loading ? 'animate-spin' : ''}`} /></button>
            <button type="button" className={BOTAO} onClick={() => setIsCreateDialogOpen(true)}><Plus className="h-4 w-4" /> Novo usuário</button>
          </>
        )}
      />

      <div className="grid grid-cols-2 gap-2.5 md:grid-cols-4">
        <Kpi rotulo="Equipe EXA" valor={indexaTeam.length} sub="admins, financeiro, marketing, comercial" icone={Crown} onClick={() => setActiveTab('team')} />
        <Kpi rotulo="Clientes" valor={clients.length} sub="contas de anunciante" icone={UserCheck} cor="#1E6B47" onClick={() => setActiveTab('clients')} />
        <Kpi rotulo="Bloqueados" valor={bloqueados} sub="sem acesso ao sistema" icone={Shield} cor={bloqueados ? '#B0261D' : '#17181A'} />
        <Kpi rotulo="Clientes sem acessar" valor={semAcesso30} sub="há mais de 30 dias" cor="#9A5300" />
      </div>

      <Busca valor={searchTerm} onChange={setSearchTerm} placeholder="Nome ou e-mail">
        <Pilulas valor={activeTab} onChange={setActiveTab} opcoes={[{ valor: 'team', rotulo: 'Equipe EXA', n: filteredTeam.length }, { valor: 'clients', rotulo: 'Clientes', n: filteredClients.length }]} />
      </Busca>

      {loading && !users.length ? <CarregandoKit texto="Carregando usuários…" /> : !listaD.length ? (
        <VazioKit icone={<Users className="h-5 w-5" />} titulo={searchTerm ? 'Ninguém encontrado' : 'Ninguém aqui'} />
      ) : (
        <div className={`${vidro} overflow-hidden rounded-[22px]`}>
          <ul className="divide-y divide-black/[0.06]">
            {listaD.map((u: any) => {
              const papel = PAPEL_D[u.role] || { r: u.role, tom: 'cinza' as const };
              return (
                <li key={u.id} className={`flex items-center gap-3 px-3 py-2.5 hover:bg-white/70 md:px-4 ${u.is_blocked ? 'opacity-70' : ''}`}>
                  <button type="button" onClick={() => handleViewDetails(u)} className="flex min-w-0 flex-1 items-center gap-3 text-left">
                    <Avatar nome={u.nome || u.email} foto={fotoQuebrada.has(u.id) ? null : u.avatar_url} tamanho={40} cor={TOM[papel.tom].cor} />
                    <span className="min-w-0 flex-1">
                      <span className="flex flex-wrap items-center gap-x-2 gap-y-0.5">
                        <span className="truncate text-[14px] font-bold">{u.nome || u.email}</span>
                        <Chip {...TOM[papel.tom]}>{papel.r}</Chip>
                        {u.is_blocked && <Chip {...TOM.vermelho}>bloqueado</Chip>}
                        {!u.email_confirmed_at && !u.email_verified_at && <Chip {...TOM.ambar}>e-mail não confirmado</Chip>}
                      </span>
                      <span className="block truncate text-[12.5px] text-[#6A6B70]">{[u.email, u.telefone, quandoD(u.last_sign_in_at)].filter(Boolean).join(' · ')}</span>
                    </span>
                  </button>
                  <span className="hidden w-[90px] shrink-0 text-right text-[12px] tabular-nums text-[#8A8B90] lg:block" title="Conta criada em">{u.data_criacao ? new Date(u.data_criacao).toLocaleDateString('pt-BR') : ''}</span>
                </li>
              );
            })}
          </ul>
        </div>
      )}

      <CreateUserDialog open={isCreateDialogOpen} onOpenChange={setIsCreateDialogOpen} onSuccess={handleRefresh} />
      {selectedUser && (
        <UserConsoleDialog open={true} onOpenChange={(open) => !open && setSelectedUser(null)} user={selectedUser as any} onUserUpdated={handleRefresh} />
      )}
    </Pagina>
  );
};

export default UsersPage;
