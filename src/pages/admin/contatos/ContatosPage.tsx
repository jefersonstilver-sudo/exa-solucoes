import React, { useState, useMemo } from 'react';
import { Plus, Search, Filter, Download, Settings, AlertTriangle, Users, Target, CheckCircle } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { useContatos } from '@/hooks/contatos';
import { CategoriaContato, ContatosFilters, ContatosOrderBy, ContatosOrderDirection } from '@/types/contatos';
import { ContatosCategoryTabs, ContatosTable } from '@/components/contatos/listagem';
import { ContatosFiltersSheet } from '@/components/contatos/listagem/ContatosFiltersSheet';
import { useNavigate } from 'react-router-dom';
import { useAdminBasePath } from '@/hooks/useAdminBasePath';
import { Card, CardContent } from '@/components/ui/card';

const ContatosPage = () => {
  const navigate = useNavigate();
  const { buildPath } = useAdminBasePath();
  const [selectedCategory, setSelectedCategory] = useState<CategoriaContato | null>(null);
  const [search, setSearch] = useState('');
  const [showFilters, setShowFilters] = useState(false);
  const [filters, setFilters] = useState<ContatosFilters>({});
  const [orderBy, setOrderBy] = useState<ContatosOrderBy>('created_at');
  const [orderDirection, setOrderDirection] = useState<ContatosOrderDirection>('desc');

  const { contacts, loading, counts, stats, archiveContact, deleteContact } = useContatos({
    categoria: selectedCategory || undefined,
    search: search || undefined,
    filters,
    orderBy,
    orderDirection
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

  return (
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

      {/* Category Tabs */}
      <div className="border-b border-border pb-2">
        <ContatosCategoryTabs
          selectedCategory={selectedCategory}
          onSelectCategory={setSelectedCategory}
          counts={counts}
        />
      </div>

      {/* Search and Filters */}
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
          <Button variant="outline" size="sm" className="h-8 text-xs">
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
  );
};

export default ContatosPage;
