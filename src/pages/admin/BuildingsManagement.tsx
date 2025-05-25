
import React, { useState } from 'react';
import { RefreshCw } from 'lucide-react';
import { useBuildingsData } from '@/hooks/useBuildingsData';
import { toast } from 'sonner';
import ErrorBoundary from '@/components/ui/ErrorBoundary';
import LoadingOverlay from '@/components/ui/LoadingOverlay';
import BuildingFormDialog from '@/components/admin/buildings/BuildingFormDialog';
import SafeBuildingDetailsDialog from '@/components/admin/buildings/safe/SafeBuildingDetailsDialog';
import BuildingImageManager from '@/components/admin/buildings/BuildingImageManager';
import BuildingFilters from '@/components/admin/buildings/BuildingFilters';
import BuildingHeader from '@/components/admin/buildings/BuildingHeader';
import BuildingStatsCards from '@/components/admin/buildings/BuildingStatsCards';
import BuildingSearchSection from '@/components/admin/buildings/BuildingSearchSection';
import BuildingsList from '@/components/admin/buildings/BuildingsList';

const BuildingsManagement = () => {
  const { buildings, stats, loading, refetch, deleteBuilding } = useBuildingsData();
  const [searchTerm, setSearchTerm] = useState('');
  const [selectedBuilding, setSelectedBuilding] = useState<any>(null);
  const [isFormOpen, setIsFormOpen] = useState(false);
  const [isDetailsOpen, setIsDetailsOpen] = useState(false);
  const [isImageManagerOpen, setIsImageManagerOpen] = useState(false);
  const [operationLoading, setOperationLoading] = useState(false);
  const [filters, setFilters] = useState({
    status: 'all',
    bairro: 'all',
    padrao_publico: 'all'
  });

  console.log('🏢 [BUILDINGS MANAGEMENT] Estado atual:', {
    totalBuildings: buildings.length,
    selectedBuilding: selectedBuilding?.nome || 'Nenhum',
    isDetailsOpen,
    isFormOpen
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

  const handleDeleteBuilding = async (building: any) => {
    if (!building?.id) {
      toast.error('Erro: Dados do prédio inválidos para exclusão');
      return;
    }

    if (window.confirm(`Tem certeza que deseja excluir o prédio "${building.nome}"? Esta ação não pode ser desfeita.`)) {
      setOperationLoading(true);
      try {
        await deleteBuilding(building.id);
      } catch (error) {
        console.error('❌ [BUILDINGS MANAGEMENT] Erro ao excluir prédio:', error);
        toast.error('Erro ao excluir prédio');
      } finally {
        setOperationLoading(false);
      }
    }
  };

  const handleNewBuilding = () => {
    console.log('➕ [BUILDINGS MANAGEMENT] Criando novo prédio');
    setSelectedBuilding(null);
    setIsFormOpen(true);
  };

  const handleViewBuilding = (building: any) => {
    console.log('👁️ [BUILDINGS MANAGEMENT] Visualizando prédio:', building?.nome);
    
    if (!building || !building.id) {
      console.error('❌ [BUILDINGS MANAGEMENT] Tentativa de visualizar prédio inválido');
      toast.error('Erro: Dados do prédio inválidos');
      return;
    }

    setSelectedBuilding(building);
    setIsDetailsOpen(true);
  };

  const handleEditBuilding = (building: any) => {
    console.log('✏️ [BUILDINGS MANAGEMENT] Editando prédio:', building?.nome);
    
    if (!building || !building.id) {
      console.error('❌ [BUILDINGS MANAGEMENT] Tentativa de editar prédio inválido');
      toast.error('Erro: Dados do prédio inválidos');
      return;
    }

    setSelectedBuilding(building);
    setIsFormOpen(true);
  };

  const handleImageManager = (building: any) => {
    console.log('🖼️ [BUILDINGS MANAGEMENT] Gerenciando imagens:', building?.nome);
    
    if (!building || !building.id) {
      console.error('❌ [BUILDINGS MANAGEMENT] Tentativa de gerenciar imagens de prédio inválido');
      toast.error('Erro: Dados do prédio inválidos');
      return;
    }

    setSelectedBuilding(building);
    setIsImageManagerOpen(true);
  };

  const handleSuccess = () => {
    console.log('✅ [BUILDINGS MANAGEMENT] Operação bem-sucedida');
    setIsFormOpen(false);
    setSelectedBuilding(null);
    refetch();
  };

  const handleCloseDetails = (open: boolean) => {
    console.log('🔄 [BUILDINGS MANAGEMENT] Fechando detalhes:', open);
    setIsDetailsOpen(open);
    if (!open) {
      // Delay para evitar problemas de estado
      setTimeout(() => {
        setSelectedBuilding(null);
      }, 100);
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
    <ErrorBoundary
      onError={(error) => {
        console.error('🚨 [BUILDINGS MANAGEMENT] Erro crítico:', error);
        toast.error('Erro crítico no sistema de prédios');
      }}
    >
      <LoadingOverlay isLoading={operationLoading} message="Processando operação...">
        <div className="space-y-8">
          <BuildingHeader
            loading={loading}
            onRefresh={refetch}
            onNewBuilding={handleNewBuilding}
          />

          <BuildingStatsCards stats={stats} />

          <BuildingFilters 
            filters={filters} 
            onFiltersChange={setFilters}
            buildings={buildings}
          />

          <BuildingSearchSection
            searchTerm={searchTerm}
            onSearchChange={setSearchTerm}
          />

          <BuildingsList
            buildings={filteredBuildings}
            onView={handleViewBuilding}
            onEdit={handleEditBuilding}
            onImageManager={handleImageManager}
            onDelete={handleDeleteBuilding}
          />

          <BuildingFormDialog
            open={isFormOpen}
            onOpenChange={setIsFormOpen}
            building={selectedBuilding}
            onSuccess={handleSuccess}
          />

          <SafeBuildingDetailsDialog
            open={isDetailsOpen}
            onOpenChange={handleCloseDetails}
            building={selectedBuilding}
          />

          <BuildingImageManager
            open={isImageManagerOpen}
            onOpenChange={setIsImageManagerOpen}
            building={selectedBuilding}
            onImagesUpdate={refetch}
          />
        </div>
      </LoadingOverlay>
    </ErrorBoundary>
  );
};

export default BuildingsManagement;
