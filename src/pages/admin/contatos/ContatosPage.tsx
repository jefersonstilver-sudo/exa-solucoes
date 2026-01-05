import React, { useState, useMemo, useCallback } from 'react';
import { Plus, Search, Filter, Download, Settings, AlertTriangle, Users, Target, CheckCircle, RefreshCcw, ArrowUpDown } from 'lucide-react';
import { format } from 'date-fns';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { useContatos, useKanbanContatos, type KanbanGroupBy } from '@/hooks/contatos';
import { CategoriaContato, ContatosFilters, ContatosOrderBy, ContatosOrderDirection } from '@/types/contatos';
import { ContatosCategoryTabs, ContatosTable } from '@/components/contatos/listagem';
import { ContatosFiltersSheet } from '@/components/contatos/listagem/ContatosFiltersSheet';
import { KanbanBoard, KanbanHeader } from '@/components/contatos/kanban';
import { useNavigate } from 'react-router-dom';
import { useAdminBasePath } from '@/hooks/useAdminBasePath';
import { Card, CardContent } from '@/components/ui/card';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { supabase } from '@/integrations/supabase/client';
import { toast } from 'sonner';
import { TooltipProvider } from '@/components/ui/tooltip';

const ContatosPage = () => {
  const navigate = useNavigate();
  const { buildPath } = useAdminBasePath();
  const [viewMode, setViewMode] = useState<'list' | 'kanban'>('list');
  const [groupBy, setGroupBy] = useState<KanbanGroupBy>('categoria');
  const [selectedCategory, setSelectedCategory] = useState<CategoriaContato | null>(null);
  const [search, setSearch] = useState('');
  const [showFilters, setShowFilters] = useState(false);
  const [filters, setFilters] = useState<ContatosFilters>({});
  const [orderBy, setOrderBy] = useState<ContatosOrderBy>('created_at');
  const [orderDirection, setOrderDirection] = useState<ContatosOrderDirection>('desc');
  const [syncing, setSyncing] = useState(false);

  const { contacts, loading, counts, stats, archiveContact, deleteContact, refetch } = useContatos({
    categoria: viewMode === 'list' ? (selectedCategory || undefined) : undefined,
    search: search || undefined,
    filters,
    orderBy,
    orderDirection
  });

  // Hook do Kanban - só ativo quando viewMode é kanban
  const { 
    columns, 
    loading: kanbanLoading, 
    moveContact,
    refetch: refetchKanban
  } = useKanbanContatos({
    groupBy,
    search: search || undefined,
  });

  const handleApplyFilters = (newFilters: ContatosFilters) => {
    setFilters(newFilters);
    setShowFilters(false);
  };

  const handleClearFilters = () => {
    setFilters({});
  };

  const activeFiltersCount = useMemo(() => {
    return Object.values(filters).filter(v => v !== undefined && v !== '').length;
  }, [filters]);

  const handleNewContact = () => {
    navigate(buildPath('contatos/novo'));
  };

  const handleSync = async () => {
    setSyncing(true);
    try {
      const { data, error } = await supabase.functions.invoke('sync-contacts-unified', {
        body: { dry_run: false, detect_duplicates: true }
      });

      if (error) throw error;

      const { stats } = data;
      toast.success(
        `Sincronização concluída: ${stats.total.created} criados, ${stats.total.updated} atualizados, ${stats.duplicates.detected} duplicados detectados`,
        { duration: 5000 }
      );

      // Recarregar contatos
      refetch?.();
    } catch (error) {
      console.error('Erro ao sincronizar:', error);
      toast.error('Erro ao sincronizar contatos');
    } finally {
      setSyncing(false);
    }
  };

  const handleExportCSV = useCallback(() => {
    if (contacts.length === 0) return;
    
    const headers = ['Nome', 'Empresa', 'Telefone', 'Email', 'Categoria', 'Temperatura', 'Cidade', 'Estado', 'Score', 'Criado em'];
    const rows = contacts.map(c => [
      c.nome || '',
      c.empresa || '',
      c.telefone || '',
      c.email || '',
      c.categoria || '',
      c.temperatura || '',
      c.cidade || '',
      c.estado || '',
      (c as any).score_total?.toString() || '0',
      c.created_at ? format(new Date(c.created_at), 'dd/MM/yyyy') : ''
    ]);
    
    const csvContent = [
      headers.join(';'),
      ...rows.map(r => r.map(cell => `"${cell.replace(/"/g, '""')}"`).join(';'))
    ].join('\n');
    
    const blob = new Blob(['\ufeff' + csvContent], { type: 'text/csv;charset=utf-8;' });
    const url = URL.createObjectURL(blob);
    const link = document.createElement('a');
    link.href = url;
    link.download = `contatos_${format(new Date(), 'yyyy-MM-dd_HHmm')}.csv`;
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
    URL.revokeObjectURL(url);
  }, [contacts]);

  const handleOrderChange = (value: string) => {
    setOrderBy(value as ContatosOrderBy);
  };

  const totalContacts = useMemo(() => {
    return viewMode === 'kanban' 
      ? columns.reduce((sum, col) => sum + col.count, 0)
      : stats.total;
  }, [viewMode, columns, stats.total]);

  const handleRefresh = useCallback(() => {
    if (viewMode === 'kanban') {
      refetchKanban();
    } else {
      refetch?.();
    }
  }, [viewMode, refetch, refetchKanban]);

  return (
    <TooltipProvider>
      <div className="min-h-screen bg-gradient-to-br from-gray-50 to-slate-100 p-3 md:p-4 space-y-4">
        {/* Header Compacto */}
        <div className="flex flex-col md:flex-row md:items-center justify-between gap-3">
          <div>
            <h1 className="text-lg font-bold text-foreground">
              Contatos & Inteligência Comercial
            </h1>
            <p className="text-xs text-muted-foreground">
              Central única de relacionamento EXA
            </p>
          </div>
          <div className="flex items-center gap-2">
            <Button
              variant="outline"
              size="sm"
              onClick={handleSync}
              disabled={syncing}
              className="text-xs h-8"
            >
              <RefreshCcw className={`w-3.5 h-3.5 mr-1 ${syncing ? 'animate-spin' : ''}`} />
              {syncing ? 'Sincronizando...' : 'Sincronizar'}
            </Button>
            <Button
              variant="outline"
              size="sm"
              onClick={() => navigate(buildPath('contatos/bloqueios'))}
              className="text-amber-600 border-amber-300 hover:bg-amber-50 text-xs h-8"
            >
              <AlertTriangle className="w-3.5 h-3.5 mr-1" />
              Bloqueados ({stats.blocked})
            </Button>
            <Button
              variant="outline"
              size="sm"
              onClick={() => navigate(buildPath('contatos/configuracoes/pontuacao'))}
              className="text-xs h-8"
            >
              <Settings className="w-3.5 h-3.5 mr-1" />
              Config
            </Button>
            <Button size="sm" onClick={handleNewContact} className="h-8">
              <Plus className="w-3.5 h-3.5 mr-1" />
              Novo
            </Button>
          </div>
        </div>

        {/* Stats Cards */}
        <div className="grid grid-cols-2 md:grid-cols-4 gap-3">
          <Card className="bg-white/80 backdrop-blur-sm border-0 shadow-sm">
            <CardContent className="p-3">
              <div className="flex items-center gap-2">
                <div className="w-8 h-8 rounded-lg bg-blue-100 flex items-center justify-center">
                  <Users className="w-4 h-4 text-blue-600" />
                </div>
                <div>
                  <p className="text-xs text-muted-foreground">Total</p>
                  <p className="text-lg font-bold">{stats.total}</p>
                </div>
              </div>
            </CardContent>
          </Card>
          <Card className="bg-white/80 backdrop-blur-sm border-0 shadow-sm">
            <CardContent className="p-3">
              <div className="flex items-center gap-2">
                <div className="w-8 h-8 rounded-lg bg-green-100 flex items-center justify-center">
                  <Target className="w-4 h-4 text-green-600" />
                </div>
                <div>
                  <p className="text-xs text-muted-foreground">Leads</p>
                  <p className="text-lg font-bold">{stats.leads}</p>
                </div>
              </div>
            </CardContent>
          </Card>
          <Card className="bg-white/80 backdrop-blur-sm border-0 shadow-sm">
            <CardContent className="p-3">
              <div className="flex items-center gap-2">
                <div className="w-8 h-8 rounded-lg bg-purple-100 flex items-center justify-center">
                  <CheckCircle className="w-4 h-4 text-purple-600" />
                </div>
                <div>
                  <p className="text-xs text-muted-foreground">Anunciantes</p>
                  <p className="text-lg font-bold">{stats.anunciantes}</p>
                </div>
              </div>
            </CardContent>
          </Card>
          <Card className="bg-white/80 backdrop-blur-sm border-0 shadow-sm">
            <CardContent className="p-3">
              <div className="flex items-center gap-2">
                <div className="w-8 h-8 rounded-lg bg-amber-100 flex items-center justify-center">
                  <Plus className="w-4 h-4 text-amber-600" />
                </div>
                <div>
                  <p className="text-xs text-muted-foreground">Novos Hoje</p>
                  <p className="text-lg font-bold">{stats.newToday}</p>
                </div>
              </div>
            </CardContent>
          </Card>
        </div>

        {/* Kanban Header with View Toggle */}
        <KanbanHeader
          viewMode={viewMode}
          onViewModeChange={setViewMode}
          groupBy={groupBy}
          onGroupByChange={setGroupBy}
          search={search}
          onSearchChange={setSearch}
          onOpenFilters={() => setShowFilters(true)}
          activeFiltersCount={activeFiltersCount}
          onRefresh={handleRefresh}
          isRefreshing={syncing || loading || kanbanLoading}
          totalContacts={totalContacts}
        />

        {/* Category Tabs - só no modo lista */}
        {viewMode === 'list' && (
          <div className="border-b border-border pb-2">
            <ContatosCategoryTabs
              selectedCategory={selectedCategory}
              onSelectCategory={setSelectedCategory}
              counts={counts}
            />
          </div>
        )}

        {/* Content - Lista ou Kanban */}
        {viewMode === 'kanban' ? (
          <KanbanBoard
            columns={columns}
            onMoveContact={moveContact}
            loading={kanbanLoading}
          />
        ) : (
          <>
            {/* Search and Filters - só no modo lista */}
            <div className="flex flex-col md:flex-row md:items-center justify-between gap-3 bg-white/60 backdrop-blur-sm p-3 rounded-xl border border-border/50">
              <div className="relative flex-1 max-w-md">
                <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 text-muted-foreground w-4 h-4" />
                <Input
                  placeholder="Buscar por nome, empresa, telefone, CNPJ..."
                  value={search}
                  onChange={(e) => setSearch(e.target.value)}
                  className="pl-9 h-9 text-sm bg-white"
                />
              </div>
              <div className="flex items-center gap-2">
                <Select value={orderBy} onValueChange={handleOrderChange}>
                  <SelectTrigger className="w-[160px] h-8 text-xs">
                    <ArrowUpDown className="w-3.5 h-3.5 mr-1" />
                    <SelectValue placeholder="Ordenar por" />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="created_at">Data Criação</SelectItem>
                    <SelectItem value="last_contact_at">Última Atividade</SelectItem>
                    <SelectItem value="pontuacao_atual">Score</SelectItem>
                    <SelectItem value="nome">Nome</SelectItem>
                  </SelectContent>
                </Select>
                <Button 
                  variant="outline" 
                  size="sm" 
                  onClick={() => setShowFilters(true)}
                  className="h-8 text-xs relative"
                >
                  <Filter className="w-3.5 h-3.5 mr-1" />
                  Filtros
                  {activeFiltersCount > 0 && (
                    <span className="absolute -top-1 -right-1 w-4 h-4 bg-primary text-primary-foreground text-[10px] rounded-full flex items-center justify-center">
                      {activeFiltersCount}
                    </span>
                  )}
                </Button>
                {activeFiltersCount > 0 && (
                  <Button 
                    variant="ghost" 
                    size="sm" 
                    onClick={handleClearFilters}
                    className="h-8 text-xs text-muted-foreground"
                  >
                    Limpar
                  </Button>
                )}
                <Button variant="outline" size="sm" className="h-8 text-xs" onClick={handleExportCSV}>
                  <Download className="w-3.5 h-3.5 mr-1" />
                  Exportar
                </Button>
              </div>
            </div>

            {/* Table */}
            <ContatosTable 
              contacts={contacts} 
              loading={loading}
            />
          </>
        )}

        {/* FAB Mobile */}
        <div className="fixed bottom-6 right-6 md:hidden z-50">
          <Button
            size="lg"
            className="rounded-full w-14 h-14 shadow-lg"
            onClick={handleNewContact}
          >
            <Plus className="w-6 h-6" />
          </Button>
        </div>

        {/* Filters Sheet */}
        <ContatosFiltersSheet 
          open={showFilters} 
          onOpenChange={setShowFilters}
          filters={filters}
          onApply={handleApplyFilters}
        />
      </div>
    </TooltipProvider>
  );
};

export default ContatosPage;
