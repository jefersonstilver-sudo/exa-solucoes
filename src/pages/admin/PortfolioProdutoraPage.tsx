import React, { useState } from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Plus, RefreshCw, Download, Video, Search, Filter } from 'lucide-react';
import { Input } from '@/components/ui/input';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { usePortfolioProdutora } from '@/hooks/usePortfolioProdutora';
import PortfolioTable from '@/components/admin/portfolio/PortfolioTable';
import PortfolioModal from '@/components/admin/portfolio/PortfolioModal';
import { CampanhaPortfolio } from '@/hooks/useCampanhasPortfolio';

const PortfolioProdutoraPage = () => {
  const {
    campanhas,
    loading,
    createCampanha,
    updateCampanha,
    deleteCampanha,
    refetch
  } = usePortfolioProdutora();

  const [isModalOpen, setIsModalOpen] = useState(false);
  const [editingCampanha, setEditingCampanha] = useState<CampanhaPortfolio | null>(null);
  const [searchTerm, setSearchTerm] = useState('');
  const [selectedCategory, setSelectedCategory] = useState<string>('all');

  // Extrair categorias únicas
  const categories = Array.from(new Set(campanhas.map(c => c.categoria))).filter(Boolean);

  // Filtrar campanhas
  const filteredCampanhas = campanhas.filter(campanha => {
    const matchesSearch = campanha.titulo.toLowerCase().includes(searchTerm.toLowerCase()) ||
                         campanha.cliente.toLowerCase().includes(searchTerm.toLowerCase());
    const matchesCategory = selectedCategory === 'all' || campanha.categoria === selectedCategory;
    return matchesSearch && matchesCategory;
  });

  const handleCreateNew = () => {
    setEditingCampanha(null);
    setIsModalOpen(true);
  };

  const handleEdit = (campanha: CampanhaPortfolio) => {
    setEditingCampanha(campanha);
    setIsModalOpen(true);
  };

  const handleModalSubmit = async (data: any) => {
    if (editingCampanha) {
      return await updateCampanha(editingCampanha.id, data);
    } else {
      return await createCampanha(data);
    }
  };

  const handleDelete = async (id: string) => {
    await deleteCampanha(id);
  };

  const handleExport = () => {
    const csvContent = [
      ['Título', 'Cliente', 'Categoria', 'Descrição', 'URL do Vídeo', 'Criado em'],
      ...filteredCampanhas.map(campanha => [
        campanha.titulo,
        campanha.cliente,
        campanha.categoria,
        campanha.descricao || '',
        campanha.url_video,
        new Date(campanha.created_at).toLocaleDateString('pt-BR')
      ])
    ].map(row => row.join(',')).join('\n');

    const blob = new Blob([csvContent], { type: 'text/csv;charset=utf-8;' });
    const url = window.URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = `portfolio_produtora_${new Date().toISOString().split('T')[0]}.csv`;
    document.body.appendChild(a);
    a.click();
    document.body.removeChild(a);
    window.URL.revokeObjectURL(url);
  };

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4">
        <div>
          <h1 className="text-3xl font-bold text-gray-900">Portfólio da Produtora</h1>
          <p className="text-gray-600 mt-2">
            Gerencie os vídeos do portfólio exibidos na seção institucional.
          </p>
        </div>
        
        <div className="flex gap-2">
          <Button
            onClick={handleExport}
            variant="outline"
            size="sm"
            className="flex items-center gap-2"
          >
            <Download className="h-4 w-4" />
            Exportar
          </Button>
          <Button
            onClick={refetch}
            variant="outline"
            size="sm"
            className="flex items-center gap-2"
          >
            <RefreshCw className="h-4 w-4" />
            Atualizar
          </Button>
          <Button
            onClick={handleCreateNew}
            className="flex items-center gap-2 bg-indexa-purple hover:bg-indexa-purple/90"
          >
            <Plus className="h-4 w-4" />
            Adicionar Vídeo
          </Button>
        </div>
      </div>

      {/* Estatísticas */}
      <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
        <Card>
          <CardHeader className="pb-2">
            <CardTitle className="text-sm font-medium text-gray-600">
              Total de Vídeos
            </CardTitle>
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold text-indexa-purple">
              {campanhas.length}
            </div>
          </CardContent>
        </Card>
        
        <Card>
          <CardHeader className="pb-2">
            <CardTitle className="text-sm font-medium text-gray-600">
              Categorias
            </CardTitle>
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold text-indexa-purple">
              {categories.length}
            </div>
          </CardContent>
        </Card>
        
        <Card>
          <CardHeader className="pb-2">
            <CardTitle className="text-sm font-medium text-gray-600">
              Última Atualização
            </CardTitle>
          </CardHeader>
          <CardContent>
            <div className="text-sm text-gray-900">
              {campanhas.length > 0 
                ? new Date(Math.max(...campanhas.map(c => new Date(c.updated_at).getTime()))).toLocaleDateString('pt-BR')
                : 'N/A'
              }
            </div>
          </CardContent>
        </Card>
        
        <Card>
          <CardHeader className="pb-2">
            <CardTitle className="text-sm font-medium text-gray-600">
              Status
            </CardTitle>
          </CardHeader>
          <CardContent>
            <div className="flex items-center gap-2">
              <Video className="w-4 h-4 text-green-500" />
              <span className="text-sm text-gray-900">Online</span>
            </div>
          </CardContent>
        </Card>
      </div>

      {/* Filtros */}
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <Filter className="h-5 w-5" />
            Filtros e Busca
          </CardTitle>
        </CardHeader>
        <CardContent>
          <div className="flex flex-col sm:flex-row gap-4">
            <div className="flex-1">
              <div className="relative">
                <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-400 h-4 w-4" />
                <Input
                  placeholder="Buscar por título ou cliente..."
                  value={searchTerm}
                  onChange={(e) => setSearchTerm(e.target.value)}
                  className="pl-10"
                />
              </div>
            </div>
            
            <Select value={selectedCategory} onValueChange={setSelectedCategory}>
              <SelectTrigger className="w-full sm:w-[200px]">
                <SelectValue placeholder="Filtrar por categoria" />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="all">Todas as categorias</SelectItem>
                {categories.map(category => (
                  <SelectItem key={category} value={category}>
                    {category}
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
          </div>
        </CardContent>
      </Card>

      {/* Tabela de Vídeos */}
      <Card>
        <CardHeader>
          <CardTitle>Vídeos do Portfólio ({filteredCampanhas.length})</CardTitle>
        </CardHeader>
        <CardContent>
          <PortfolioTable
            campanhas={filteredCampanhas}
            loading={loading}
            onEdit={handleEdit}
            onDelete={handleDelete}
          />
        </CardContent>
      </Card>

      {/* Modal de Criação/Edição */}
      <PortfolioModal
        isOpen={isModalOpen}
        onClose={() => setIsModalOpen(false)}
        onSubmit={handleModalSubmit}
        editingCampanha={editingCampanha}
        existingCategories={categories}
      />
    </div>
  );
};

export default PortfolioProdutoraPage;