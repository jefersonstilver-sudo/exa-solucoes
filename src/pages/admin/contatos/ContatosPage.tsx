import React, { useState, useMemo } from 'react';
import { Plus, Search, Filter, Download, Settings, AlertTriangle } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { useContatos } from '@/hooks/contatos';
import { CategoriaContato } from '@/types/contatos';
import { ContatosCategoryTabs, ContatosTable, NovoContatoDialog } from '@/components/contatos/listagem';
import { useNavigate } from 'react-router-dom';
import { useAdminBasePath } from '@/hooks/useAdminBasePath';
const ContatosPage = () => {
  const navigate = useNavigate();
  const { buildPath } = useAdminBasePath();
  const [selectedCategory, setSelectedCategory] = useState<CategoriaContato | null>(null);
  const [search, setSearch] = useState('');
  const [showNewDialog, setShowNewDialog] = useState(false);

  const { contacts, loading, counts } = useContatos({
    categoria: selectedCategory || undefined,
    search: search || undefined
  });

  // Contagem de bloqueados
  const blockedCount = useMemo(() => {
    return contacts.filter(c => c.bloqueado).length;
  }, [contacts]);

  return (
    <div className="min-h-screen bg-gradient-to-br from-background to-muted/20 p-4 md:p-6 space-y-6">
      {/* Header */}
      <div className="flex flex-col md:flex-row md:items-center justify-between gap-4">
        <div>
          <h1 className="text-xl md:text-2xl font-bold text-foreground">
            Contatos & Inteligência Comercial
          </h1>
          <p className="text-sm text-muted-foreground">
            Gerencie seus contatos com pontuação inteligente
          </p>
        </div>
        <div className="flex items-center gap-2">
          <Button
            variant="outline"
            size="sm"
            onClick={() => navigate(buildPath('contatos/bloqueios'))}
            className="text-amber-600 border-amber-600 hover:bg-amber-50"
          >
            <AlertTriangle className="w-4 h-4 mr-1" />
            Bloqueados ({blockedCount})
          </Button>
          <Button
            variant="outline"
            size="sm"
            onClick={() => navigate(buildPath('contatos/configuracoes/pontuacao'))}
          >
            <Settings className="w-4 h-4 mr-1" />
            Config
          </Button>
          <Button size="sm" onClick={() => setShowNewDialog(true)}>
            <Plus className="w-4 h-4 mr-1" />
            Novo
          </Button>
        </div>
      </div>

      {/* Category Tabs */}
      <div className="border-b border-border pb-3">
        <ContatosCategoryTabs
          selectedCategory={selectedCategory}
          onSelectCategory={setSelectedCategory}
          counts={counts}
        />
      </div>

      {/* Search and Filters */}
      <div className="flex flex-col md:flex-row md:items-center justify-between gap-4 bg-card/50 p-4 rounded-lg border border-border">
        <div className="relative flex-1 max-w-md">
          <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 text-muted-foreground w-4 h-4" />
          <Input
            placeholder="Buscar por nome, empresa, telefone..."
            value={search}
            onChange={(e) => setSearch(e.target.value)}
            className="pl-10"
          />
        </div>
        <div className="flex items-center gap-2">
          <Button variant="outline" size="sm">
            <Filter className="w-4 h-4 mr-1" />
            Filtros
          </Button>
          <Button variant="outline" size="sm">
            <Download className="w-4 h-4 mr-1" />
            Exportar
          </Button>
        </div>
      </div>

      {/* Table */}
      <ContatosTable contacts={contacts} loading={loading} />

      {/* FAB Mobile */}
      <div className="fixed bottom-6 right-6 md:hidden">
        <Button
          size="lg"
          className="rounded-full w-14 h-14 shadow-lg"
          onClick={() => setShowNewDialog(true)}
        >
          <Plus className="w-6 h-6" />
        </Button>
      </div>

      {/* Dialog */}
      <NovoContatoDialog open={showNewDialog} onOpenChange={setShowNewDialog} />
    </div>
  );
};

export default ContatosPage;
