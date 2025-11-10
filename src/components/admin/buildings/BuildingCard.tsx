
import React from 'react';
import { Card, CardContent } from '@/components/ui/card';
import { toast } from 'sonner';
import BuildingImageSection from './card/BuildingImageSection';
import BuildingInfoSection from './card/BuildingInfoSection';

interface BuildingCardProps {
  building: any;
  onView: (building: any) => void;
  onEdit: (building: any) => void;
  onImageManager: (building: any) => void;
  onDelete: (building: any) => void;
  videoCount?: number;
}

const BuildingCard: React.FC<BuildingCardProps> = ({
  building,
  onView,
  onEdit,
  onImageManager,
  onDelete,
  videoCount
}) => {
  console.log('🏢 [BUILDING CARD] Renderizando card:', building?.nome || 'Nome não disponível');

  // Validação básica antes de qualquer ação
  const validateBuildingData = (action: string) => {
    if (!building) {
      console.error(`❌ [BUILDING CARD] Tentativa de ${action} sem dados do prédio`);
      toast.error('Erro: Dados do prédio não encontrados');
      return false;
    }

    if (!building.id) {
      console.error(`❌ [BUILDING CARD] Tentativa de ${action} sem ID do prédio`);
      toast.error('Erro: ID do prédio inválido');
      return false;
    }

    if (!building.nome) {
      console.error(`❌ [BUILDING CARD] Tentativa de ${action} sem nome do prédio`);
      toast.error('Erro: Nome do prédio não encontrado');
      return false;
    }

    return true;
  };

  // Handlers seguros com validação
  const handleView = () => {
    console.log('👁️ [BUILDING CARD] Solicitação para visualizar prédio');
    if (validateBuildingData('visualização')) {
      onView(building);
    }
  };

  const handleEdit = () => {
    console.log('✏️ [BUILDING CARD] Solicitação para editar prédio');
    if (validateBuildingData('edição')) {
      onEdit(building);
    }
  };

  const handleImageManager = () => {
    console.log('🖼️ [BUILDING CARD] Solicitação para gerenciar imagens');
    if (validateBuildingData('gerenciamento de imagens')) {
      onImageManager(building);
    }
  };

  const handleDelete = () => {
    console.log('🗑️ [BUILDING CARD] Solicitação para deletar prédio');
    if (validateBuildingData('exclusão')) {
      onDelete(building);
    }
  };

  // Se não há dados do prédio, renderizar card de erro
  if (!building) {
    return (
      <Card className="overflow-hidden border-red-200 bg-red-50">
        <CardContent className="p-4">
          <div className="text-center text-red-600">
            <p className="font-medium">Erro ao carregar prédio</p>
            <p className="text-sm">Dados não disponíveis</p>
          </div>
        </CardContent>
      </Card>
    );
  }

  return (
    <Card className="overflow-hidden hover:shadow-lg transition-all duration-300 hover:scale-[1.02]">
      <CardContent className="p-0">
        <div className="flex flex-col md:flex-row h-full">
          <BuildingImageSection building={building} />
          <BuildingInfoSection
            building={building}
            onView={handleView}
            onEdit={handleEdit}
            onImageManager={handleImageManager}
            onDelete={handleDelete}
            videoCount={videoCount}
          />
        </div>
      </CardContent>
    </Card>
  );
};

export default BuildingCard;
