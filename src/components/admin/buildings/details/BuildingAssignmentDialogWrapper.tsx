
import React from 'react';
import { toast } from 'sonner';
import PanelAssignmentDialog from '../panels/PanelAssignmentDialog';

interface BuildingAssignmentDialogWrapperProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  building?: any;
  onSuccess: () => void;
}

const BuildingAssignmentDialogWrapper: React.FC<BuildingAssignmentDialogWrapperProps> = ({
  open,
  onOpenChange,
  building,
  onSuccess
}) => {
  console.log('🔍 [ASSIGNMENT WRAPPER] Renderização:', {
    timestamp: new Date().toISOString(),
    open,
    building_exists: !!building,
    building_id: building?.id || 'undefined',
    building_nome: building?.nome || 'undefined'
  });

  // INVESTIGAÇÃO: Validação rigorosa antes de qualquer operação
  const validateBuildingData = () => {
    console.log('🔍 [ASSIGNMENT WRAPPER] Validando dados do building...');
    
    if (!building) {
      console.error('❌ [ASSIGNMENT WRAPPER] Building é null/undefined');
      return false;
    }

    if (!building.id) {
      console.error('❌ [ASSIGNMENT WRAPPER] Building.id é null/undefined:', building);
      return false;
    }

    if (!building.nome) {
      console.error('❌ [ASSIGNMENT WRAPPER] Building.nome é null/undefined:', building);
      return false;
    }

    console.log('✅ [ASSIGNMENT WRAPPER] Dados do building validados:', {
      id: building.id,
      nome: building.nome
    });
    return true;
  };

  // CORREÇÃO CRÍTICA: Interceptar abertura e validar dados
  const handleOpenChange = (newOpen: boolean) => {
    console.log('🔍 [ASSIGNMENT WRAPPER] handleOpenChange:', {
      newOpen,
      currentOpen: open,
      hasValidBuilding: validateBuildingData()
    });

    if (newOpen && !validateBuildingData()) {
      console.error('❌ [ASSIGNMENT WRAPPER] Tentativa de abrir com dados inválidos - BLOQUEANDO');
      toast.error('Erro: Dados do prédio não estão disponíveis. Tente recarregar a página.');
      return;
    }

    console.log('✅ [ASSIGNMENT WRAPPER] Permitindo mudança de estado do dialog');
    onOpenChange(newOpen);
  };

  // CORREÇÃO CRÍTICA: Interceptar sucesso e garantir callback
  const handleSuccess = () => {
    console.log('✅ [ASSIGNMENT WRAPPER] handleSuccess - Atribuição realizada');
    
    try {
      onSuccess();
      console.log('✅ [ASSIGNMENT WRAPPER] Callback de sucesso executado');
    } catch (error) {
      console.error('❌ [ASSIGNMENT WRAPPER] Erro no callback de sucesso:', error);
    }
  };

  // INVESTIGAÇÃO: Early return com log detalhado
  if (!open) {
    console.log('🚫 [ASSIGNMENT WRAPPER] Dialog fechado - não renderizando componente');
    return null;
  }

  if (!validateBuildingData()) {
    console.error('❌ [ASSIGNMENT WRAPPER] Dados inválidos - renderizando dialog de erro');
    return (
      <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50">
        <div className="bg-white p-6 rounded-lg max-w-md mx-4">
          <h3 className="text-lg font-semibold text-red-600 mb-2">Erro de Dados</h3>
          <p className="text-gray-600 mb-4">
            Os dados do prédio não estão disponíveis. Isso pode acontecer durante transições rápidas.
          </p>
          <button
            onClick={() => handleOpenChange(false)}
            className="bg-red-600 text-white px-4 py-2 rounded hover:bg-red-700"
          >
            Fechar e Tentar Novamente
          </button>
        </div>
      </div>
    );
  }

  console.log('✅ [ASSIGNMENT WRAPPER] Renderizando PanelAssignmentDialog com dados válidos');
  
  return (
    <PanelAssignmentDialog
      open={open}
      onOpenChange={handleOpenChange}
      buildingId={building.id}
      buildingName={building.nome}
      onSuccess={handleSuccess}
    />
  );
};

export default BuildingAssignmentDialogWrapper;
