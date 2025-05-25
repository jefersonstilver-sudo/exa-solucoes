
import React, { useState } from 'react';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { 
  Building2, 
  Plus, 
  Search, 
  RefreshCw,
  Users,
  DollarSign,
  Monitor,
  TrendingUp,
  Calculator
} from 'lucide-react';
import { useBuildingsData } from '@/hooks/useBuildingsData';
import BuildingFormDialog from '@/components/admin/buildings/BuildingFormDialog';
import BuildingDetailsDialog from '@/components/admin/buildings/BuildingDetailsDialog';
import BuildingImageManager from '@/components/admin/buildings/BuildingImageManager';
import BuildingFilters from '@/components/admin/buildings/BuildingFilters';
import BuildingCard from '@/components/admin/buildings/BuildingCard';

const BuildingsManagement = () => {
  const { buildings, stats, loading, refetch, deleteBuilding } = useBuildingsData();
  const [searchTerm, setSearchTerm] = useState('');
  const [selectedBuilding, setSelectedBuilding] = useState<any>(null);
  const [isFormOpen, setIsFormOpen] = useState(false);
  const [isDetailsOpen, setIsDetailsOpen] = useState(false);
  const [isImageManagerOpen, setIsImageManagerOpen] = useState(false);
  const [filters, setFilters] = useState({
    status: 'all',
    bairro: 'all',
    padrao_publico: 'all'
  });

  const filteredBuildings = buildings.filter(building => {
    const matchesSearch = building.nome.toLowerCase().includes(searchTerm.toLowerCase()) ||
                         building.endereco.toLowerCase().includes(searchTerm.toLowerCase()) ||
                         building.bairro.toLowerCase().includes(searchTerm.toLowerCase());
    
    const matchesStatus = filters.status === 'all' || building.status === filters.status;
    const matchesBairro = filters.bairro === 'all' || building.bairro === filters.bairro;
    const matchesPadrao = filters.padrao_publico === 'all' || building.padrao_publico === filters.padrao_publico;
    
    return matchesSearch && matchesStatus && matchesBairro && matchesPadrao;
  });

  const formatPrice = (price: number) => {
    return new Intl.NumberFormat('pt-BR', {
      style: 'currency',
      currency: 'BRL'
    }).format(price);
  };

  const handleDeleteBuilding = async (building: any) => {
    if (window.confirm(`Tem certeza que deseja excluir o prédio "${building.nome}"? Esta ação não pode ser desfeita.`)) {
      await deleteBuilding(building.id);
    }
  };

  if (loading) {
    return (
      <div className="flex items-center justify-center py-12">
        <RefreshCw className="h-8 w-8 animate-spin text-indexa-purple" />
        <span className="ml-2 text-indexa-purple">Carregando sistema completo...</span>
      </div>
    );
  }

  return (
    <div className="space-y-8">
      {/* Header Aprimorado */}
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-3xl font-bold text-gray-900 flex items-center">
            <Building2 className="h-8 w-8 mr-3 text-indexa-purple" />
            Sistema Completo de Prédios
          </h1>
          <p className="text-gray-600 mt-2">
            Gerenciamento completo com galeria de imagens, cálculos automáticos e integração total
          </p>
        </div>
        <div className="flex items-center space-x-3">
          <Button variant="outline" onClick={refetch} disabled={loading}>
            <RefreshCw className="h-4 w-4 mr-2" />
            Atualizar
          </Button>
          <Button 
            className="bg-indexa-purple hover:bg-indexa-purple-dark"
            onClick={() => {
              setSelectedBuilding(null);
              setIsFormOpen(true);
            }}
          >
            <Plus className="h-4 w-4 mr-2" />
            Novo Prédio
          </Button>
        </div>
      </div>

      {/* Estatísticas Completas */}
      <div className="grid grid-cols-2 md:grid-cols-4 lg:grid-cols-8 gap-4">
        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Total</CardTitle>
            <Building2 className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{stats.total}</div>
            <p className="text-xs text-muted-foreground">prédios</p>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Ativos</CardTitle>
            <TrendingUp className="h-4 w-4 text-green-600" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold text-green-600">{stats.active}</div>
            <p className="text-xs text-green-600">operacionais</p>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Unidades</CardTitle>
            <Users className="h-4 w-4 text-blue-600" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold text-blue-600">{stats.totalUnits}</div>
            <p className="text-xs text-blue-600">apartamentos</p>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Público</CardTitle>
            <Users className="h-4 w-4 text-purple-600" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold text-purple-600">{stats.totalPublic}</div>
            <p className="text-xs text-purple-600">pessoas</p>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Painéis</CardTitle>
            <Monitor className="h-4 w-4 text-indigo-600" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold text-indigo-600">{stats.totalScreens}</div>
            <p className="text-xs text-indigo-600">telas ativas</p>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Visualizações</CardTitle>
            <Calculator className="h-4 w-4 text-orange-600" />
          </CardHeader>
          <CardContent>
            <div className="text-xl font-bold text-orange-600">{stats.totalViews.toLocaleString()}</div>
            <p className="text-xs text-orange-600">por mês</p>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Preço Médio</CardTitle>
            <DollarSign className="h-4 w-4 text-green-600" />
          </CardHeader>
          <CardContent>
            <div className="text-lg font-bold text-green-600">{formatPrice(stats.averagePrice)}</div>
            <p className="text-xs text-green-600">média</p>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Tráfego</CardTitle>
            <TrendingUp className="h-4 w-4 text-cyan-600" />
          </CardHeader>
          <CardContent>
            <div className="text-xl font-bold text-cyan-600">{stats.totalTraffic.toLocaleString()}</div>
            <p className="text-xs text-cyan-600">mensal</p>
          </CardContent>
        </Card>
      </div>

      {/* Filtros Avançados */}
      <BuildingFilters 
        filters={filters} 
        onFiltersChange={setFilters}
        buildings={buildings}
      />

      {/* Busca */}
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center">
            <Search className="h-5 w-5 mr-2 text-indexa-purple" />
            Buscar Prédios
          </CardTitle>
        </CardHeader>
        <CardContent>
          <Input
            placeholder="Buscar por nome, endereço ou bairro..."
            value={searchTerm}
            onChange={(e) => setSearchTerm(e.target.value)}
            className="max-w-md"
          />
        </CardContent>
      </Card>

      {/* Grid de Cards */}
      <Card>
        <CardHeader>
          <CardTitle>Prédios Cadastrados ({filteredBuildings.length})</CardTitle>
          <CardDescription>
            Sistema completo com todas as funcionalidades implementadas
          </CardDescription>
        </CardHeader>
        <CardContent>
          {filteredBuildings.length === 0 ? (
            <div className="text-center py-12">
              <Building2 className="h-16 w-16 mx-auto text-gray-300 mb-4" />
              <h3 className="text-lg font-medium text-gray-900 mb-2">Nenhum prédio encontrado</h3>
              <p className="text-gray-500">
                {searchTerm || filters.status !== 'all' || filters.bairro !== 'all' || filters.padrao_publico !== 'all'
                  ? 'Tente ajustar os filtros de busca.'
                  : 'Comece criando seu primeiro prédio.'}
              </p>
            </div>
          ) : (
            <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
              {filteredBuildings.map((building) => (
                <BuildingCard
                  key={building.id}
                  building={building}
                  onView={(building) => {
                    setSelectedBuilding(building);
                    setIsDetailsOpen(true);
                  }}
                  onEdit={(building) => {
                    setSelectedBuilding(building);
                    setIsFormOpen(true);
                  }}
                  onImageManager={(building) => {
                    setSelectedBuilding(building);
                    setIsImageManagerOpen(true);
                  }}
                  onDelete={handleDeleteBuilding}
                />
              ))}
            </div>
          )}
        </CardContent>
      </Card>

      {/* Dialogs */}
      <BuildingFormDialog
        open={isFormOpen}
        onOpenChange={setIsFormOpen}
        building={selectedBuilding}
        onSuccess={() => {
          setIsFormOpen(false);
          setSelectedBuilding(null);
          refetch();
        }}
      />

      <BuildingDetailsDialog
        open={isDetailsOpen}
        onOpenChange={setIsDetailsOpen}
        building={selectedBuilding}
      />

      <BuildingImageManager
        open={isImageManagerOpen}
        onOpenChange={setIsImageManagerOpen}
        building={selectedBuilding}
        onImagesUpdate={refetch}
      />
    </div>
  );
};

export default BuildingsManagement;
