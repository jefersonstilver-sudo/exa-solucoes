
import { toast } from 'sonner';

export const useBuildingValidation = () => {
  const validateBuildingData = (building: any, action: string): boolean => {
    if (!building || !building.id) {
      console.error(`❌ [BUILDING VALIDATION] Tentativa de ${action} com dados inválidos:`, building);
      toast.error('Erro: Dados do prédio inválidos');
      return false;
    }

    if (!building.nome) {
      console.error(`❌ [BUILDING VALIDATION] Tentativa de ${action} sem nome do prédio`);
      toast.error('Erro: Nome do prédio não encontrado');
      return false;
    }

    return true;
  };

  return { validateBuildingData };
};
