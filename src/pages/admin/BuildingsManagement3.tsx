import React, { useMemo, useState } from 'react';
import { useAdminBuildingsData } from '@/hooks/useAdminBuildingsData';
import { useBuildingActions } from '@/hooks/useBuildingActions';
import ErrorBoundary from '@/components/ui/ErrorBoundary';
import LoadingOverlay from '@/components/ui/LoadingOverlay';
import { DEFAULT_BUILDINGS_FILTERS, type BuildingsFiltersState, type SortKey } from '@/components/admin/buildings/v3/BuildingsFilters3';
import PredioLinha from '@/components/admin/buildings/v3/PredioLinha';
import { useBuildingsVideoCount } from '@/hooks/useBuildingsVideoCount';
import { useQuery } from '@tanstack/react-query';
import { useSearchParams } from 'react-router-dom';
import { supabase } from '@/integrations/supabase/client';
import { Building2, Plus, Tv2, FileSignature, Users } from 'lucide-react';
import { Pagina, Cabecalho, Busca, Pilulas, Kpi, Carregando as CarregandoKit, Vazio, BOTAO, BOTAO2, CAMPO, vidro } from '@/components/admin/ui/exa';
import BuildingFormDialog3 from '@/components/admin/buildings/v3/BuildingFormDialog3';
import BuildingDetailsDialog from '@/components/admin/buildings/BuildingDetailsDialog';
import BuildingImageManager from '@/components/admin/buildings/BuildingImageManager';
import PrediosCelular from '@/components/admin/buildings/v3/PrediosCelular';
import { useIsMobile } from '@/hooks/use-mobile';
import { Carregando, PaginaCelular } from '@/components/admin/celular/kit';

const BuildingsManagement3 = () => {
  const { buildings, stats, loading, refetch, deleteBuilding } = useAdminBuildingsData();
  const [qs] = useSearchParams();
  const [searchTerm, setSearchTerm] = useState(qs.get('busca') || '');
  const [filters, setFilters] = useState<BuildingsFiltersState>(() => ({ ...DEFAULT_BUILDINGS_FILTERS, status: 'ativo' }));
  const [sortBy, setSortBy] = useState<SortKey>(() => { try { return (localStorage.getItem('predios_ordem') as SortKey) || 'name_asc'; } catch { return 'name_asc'; } });
  const celular = useIsMobile();
  const mudarOrdem = (v: SortKey) => { setSortBy(v); try { localStorage.setItem('predios_ordem', v); } catch { /* sem armazenamento */ } };
  const { counts: videoCounts } = useBuildingsVideoCount(buildings.map((b: any) => b.id));
  const { data: contratos } = useQuery({
    queryKey: ['predios-contratos-resumo'],
    queryFn: async () => {
      const { data, error } = await supabase.functions.invoke('exa2-contratos-predio', { body: { acao: 'resumo' } });
      if (error || !data?.ok) return null;
      return data.predios as Record<string, { contrato: boolean; pedido: string | null }>;
    },
    staleTime: 60_000,
  });

  const {
    selectedBuilding,
    isFormOpen,
    setIsFormOpen,
    isDetailsOpen,
    isImageManagerOpen,
    setIsImageManagerOpen,
    operationLoading,
    handleDeleteBuilding,
    handleNewBuilding,
    handleViewBuilding,
    handleViewCampaigns,
    handleEditBuilding,
    handleImageManager,
    handleSuccess,
    handleCloseDetails,
  } = useBuildingActions(deleteBuilding, refetch);

  const filteredAndSorted = useMemo(() => {
    const term = searchTerm.toLowerCase();
    const list = buildings.filter((b: any) => {
      const matchesSearch =
        !term ||
        (b.nome || '').toLowerCase().includes(term) ||
        (b.endereco || '').toLowerCase().includes(term) ||
        (b.bairro || '').toLowerCase().includes(term);

      const normalize = (s?: string) =>
        (s || '')
          .normalize('NFD')
          .replace(/[\u0300-\u036f]/g, '')
          .toLowerCase();
      const matchesStatus =
        filters.status === 'all' || normalize(b.status) === normalize(filters.status);

      const matchesAirbnb =
        filters.airbnb === 'all' ||
        (filters.airbnb === 'with' && Boolean(b.tem_airbnb)) ||
        (filters.airbnb === 'without' && !b.tem_airbnb);

      const matchesPadrao =
        filters.padrao_publico === 'all' || b.padrao_publico === filters.padrao_publico;

      const matchesPaineis =
        filters.paineis === 'all' ||
        (filters.paineis === 'with' && (b.paineis_ativos || 0) > 0) ||
        (filters.paineis === 'without' && (b.paineis_ativos || 0) === 0);

      const matchesDevice =
        filters.device === 'all' ||
        (filters.device === 'online' && b.device_status === 'online') ||
        (filters.device === 'offline' && b.device_status === 'offline') ||
        (filters.device === 'none' && (!b.device_status || b.device_status === 'not_connected'));

      return (
        matchesSearch &&
        matchesStatus &&
        matchesAirbnb &&
        matchesPadrao &&
        matchesPaineis &&
        matchesDevice
      );
    });

    const sorted = [...list];
    sorted.sort((a: any, b: any) => {
      switch (sortBy) {
        case 'name_asc':
          return (a.nome || '').localeCompare(b.nome || '', 'pt-BR');
        case 'audience_desc':
          return (b.publico_estimado || 0) - (a.publico_estimado || 0);
        case 'panels_desc':
          return (b.paineis_ativos || 0) - (a.paineis_ativos || 0);
        case 'created_desc':
          return (
            new Date(b.created_at || 0).getTime() - new Date(a.created_at || 0).getTime()
          );
        case 'updated_desc':
        default: {
          const aTime = new Date(a.local_updated_at || a.created_at || 0).getTime();
          const bTime = new Date(b.local_updated_at || b.created_at || 0).getTime();
          return bTime - aTime;
        }
      }
    });
    return sorted;
  }, [buildings, searchTerm, filters, sortBy]);

  if (loading && celular) return <PaginaCelular><div className="mb-3 h-9 w-40 animate-pulse rounded-xl bg-black/[0.06]" /><Carregando linhas={7} /></PaginaCelular>;
  if (loading) return <CarregandoKit texto="Carregando prédios…" />;

  return (
    <ErrorBoundary
      onError={(error) => {
        console.error('🚨 [BUILDINGS 3.0] Erro crítico:', error);
      }}
    >
      <LoadingOverlay isLoading={operationLoading} message="Processando...">
        <div className={celular ? '' : 'space-y-4 pb-8'}>
          {celular ? (
            <PrediosCelular
              todos={buildings}
              lista={filteredAndSorted}
              stats={stats}
              busca={searchTerm}
              setBusca={setSearchTerm}
              filtros={filters}
              setFiltros={setFilters}
              ordem={sortBy}
              setOrdem={setSortBy}
              atualizar={refetch}
              onNovo={handleNewBuilding}
              onVer={handleViewBuilding}
              onEditar={handleEditBuilding}
              onFotos={handleImageManager}
              onExcluir={handleDeleteBuilding}
            />
          ) : (<>
            <Pagina larga>
              <Cabecalho
                titulo="Prédios"
                sub={`${stats.active} ativos na rede · ${stats.totalPanels} telas · ${stats.inactive} inativos`}
                acoes={(
                  <>
                    <button type="button" className={BOTAO2} onClick={() => window.open('/super_admin/relatorio-playlist', '_blank', 'noopener,noreferrer')} title="Relatório de playlist (auditoria)">Relatório de playlist</button>
                    <button type="button" className={BOTAO} onClick={handleNewBuilding}><Plus className="h-4 w-4" /> Novo prédio</button>
                  </>
                )}
              />
              <div className="grid grid-cols-2 gap-2.5 md:grid-cols-4">
                <Kpi rotulo="Ativos" valor={stats.active} sub={`${stats.totalPanels} telas`} icone={Building2} cor="#1E6B47" onClick={() => setFilters({ ...filters, status: 'ativo', device: 'all' })} />
                <Kpi rotulo="Painel offline" valor={buildings.filter((b: any) => b.status === 'ativo' && b.device_status === 'offline').length} sub="telas sem sinal agora" icone={Tv2} cor={buildings.some((b: any) => b.status === 'ativo' && b.device_status === 'offline') ? '#B0261D' : '#17181A'} onClick={() => setFilters({ ...filters, status: 'ativo', device: 'offline' })} />
                <Kpi rotulo="Sem contrato" valor={contratos ? buildings.filter((b: any) => b.status === 'ativo' && !contratos[b.id]?.contrato && !contratos[b.id]?.pedido).length : '—'} sub="comodato não assinado" icone={FileSignature} cor="#9A5300" onClick={() => setFilters({ ...filters, status: 'ativo', paineis: 'all' })} />
                <Kpi rotulo="Público estimado" valor={buildings.filter((b: any) => b.status === 'ativo').reduce((a: number, b: any) => a + (b.publico_estimado || 0), 0).toLocaleString('pt-BR')} sub="pessoas por dia nos ativos" icone={Users} />
              </div>
              <Busca valor={searchTerm} onChange={setSearchTerm} placeholder="Nome, endereço ou bairro">
                <Pilulas valor={filters.status} onChange={(v) => setFilters({ ...filters, status: v })} opcoes={[
                  { valor: 'ativo', rotulo: 'Ativos', n: stats.active }, { valor: 'instalação', rotulo: 'Instalação' }, { valor: 'manutenção', rotulo: 'Manutenção' }, { valor: 'interno', rotulo: 'Internos' }, { valor: 'inativo', rotulo: 'Inativos', n: stats.inactive }, { valor: 'all', rotulo: 'Todos', n: stats.total },
                ]} />
                <Pilulas valor={filters.device} onChange={(v) => setFilters({ ...filters, device: v as any })} opcoes={[{ valor: 'all', rotulo: 'Painel: todos' }, { valor: 'online', rotulo: 'Online' }, { valor: 'offline', rotulo: 'Offline' }]} />
                <select value={sortBy} onChange={(e) => mudarOrdem(e.target.value as SortKey)} className={`${CAMPO} w-auto`} aria-label="Ordenar">
                  <option value="name_asc">Nome A–Z</option><option value="audience_desc">Mais público</option><option value="panels_desc">Mais painéis</option><option value="created_desc">Mais novos</option><option value="updated_desc">Atualizados</option>
                </select>
              </Busca>
              {!filteredAndSorted.length ? <Vazio icone={<Building2 className="h-5 w-5" />} titulo="Nenhum prédio aqui" texto="Ajuste a busca ou os filtros." /> : (
                <div className={`${vidro} overflow-hidden rounded-[22px]`}>
                  <ul className="divide-y divide-black/[0.06]">
                    {filteredAndSorted.map((b: any) => (
                      <PredioLinha key={b.id} b={b} videos={videoCounts[b.id] ?? 0} contrato={contratos ? (contratos[b.id] || null) : undefined}
                        onVer={handleViewBuilding} onEditar={handleEditBuilding} onFotos={handleImageManager} onExcluir={handleDeleteBuilding} />
                    ))}
                  </ul>
                </div>
              )}
            </Pagina>
          </>)}

          {/* Form Dialog */}
          <BuildingFormDialog3
            open={isFormOpen}
            onOpenChange={setIsFormOpen}
            building={selectedBuilding}
            onSuccess={handleSuccess}
          />

          {/* Details Dialog */}
          {selectedBuilding && (
            <BuildingDetailsDialog
              building={selectedBuilding}
              open={isDetailsOpen}
              onOpenChange={handleCloseDetails}
            />
          )}

          {selectedBuilding && (
            <BuildingImageManager
              building={selectedBuilding}
              open={isImageManagerOpen}
              onOpenChange={setIsImageManagerOpen}
              onImagesUpdate={refetch}
            />
          )}
        </div>
      </LoadingOverlay>
    </ErrorBoundary>
  );
};

export default BuildingsManagement3;
