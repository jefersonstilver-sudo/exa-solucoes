
import React from 'react';
import { Dialog, DialogContent } from '@/components/ui/dialog';
import { useDataValidation } from '@/hooks/useDataValidation';
import ErrorBoundary from '@/components/ui/ErrorBoundary';
import LoadingOverlay from '@/components/ui/LoadingOverlay';
import BuildingDetailsDialog from '../BuildingDetailsDialog';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Building2, AlertTriangle } from 'lucide-react';

interface SafeBuildingDetailsDialogProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  building?: any;
}

const SafeBuildingDetailsDialog: React.FC<SafeBuildingDetailsDialogProps> = ({
  open,
  onOpenChange,
  building
}) => {
  console.log('🛡️ [SAFE BUILDING DETAILS] Renderização:', { 
    open, 
    building: building?.nome || 'null',
    buildingId: building?.id || 'null'
  });

  // CORREÇÃO: Early return mais específico - só retorna se dialog não está aberto
  if (!open) {
    console.log('🚫 [SAFE BUILDING DETAILS] Dialog fechado - não renderizando');
    return null;
  }

  // CORREÇÃO: Validar dados do prédio mas permitir estados temporários durante transições
  const buildingValidation = useDataValidation(
    building,
    (data) => {
      const isValid = !!(data?.id && data?.nome);
      console.log('🔍 [SAFE BUILDING DETAILS] Validação do building:', {
        hasId: !!data?.id,
        hasNome: !!data?.nome,
        isValid
      });
      return isValid;
    },
    {
      required: false,
      timeout: 1000,    // Timeout mais curto para ser mais responsivo
      retryAttempts: 0, // Sem tentativas para evitar delays
      enabled: open && !!building
    }
  );

  console.log('🔍 [SAFE BUILDING DETAILS] Estado da validação:', {
    isLoading: buildingValidation.isLoading,
    isValid: buildingValidation.isValid,
    error: buildingValidation.error,
    hasBuilding: !!building
  });

  // CORREÇÃO: Se não há building, mostrar erro específico
  if (!building) {
    console.warn('⚠️ [SAFE BUILDING DETAILS] Building não fornecido');
    return (
      <Dialog open={open} onOpenChange={onOpenChange}>
        <DialogContent className="max-w-md">
          <Card>
            <CardHeader>
              <CardTitle className="flex items-center text-orange-600">
                <AlertTriangle className="h-5 w-5 mr-2" />
                Prédio não Selecionado
              </CardTitle>
            </CardHeader>
            <CardContent>
              <p className="text-gray-600 mb-4">
                Nenhum prédio foi selecionado para visualização.
              </p>
              <p className="text-sm text-gray-500">
                Feche este dialog e selecione um prédio válido.
              </p>
            </CardContent>
          </Card>
        </DialogContent>
      </Dialog>
    );
  }

  // CORREÇÃO: Se há building mas dados inválidos, mostrar erro
  if (!buildingValidation.isLoading && !buildingValidation.isValid && buildingValidation.error) {
    console.warn('⚠️ [SAFE BUILDING DETAILS] Dados do building inválidos');
    return (
      <Dialog open={open} onOpenChange={onOpenChange}>
        <DialogContent className="max-w-md">
          <Card>
            <CardHeader>
              <CardTitle className="flex items-center text-red-600">
                <AlertTriangle className="h-5 w-5 mr-2" />
                Erro ao Carregar Prédio
              </CardTitle>
            </CardHeader>
            <CardContent>
              <p className="text-gray-600 mb-4">
                Não foi possível carregar os dados do prédio "{building?.nome || 'Desconhecido'}".
              </p>
              <p className="text-sm text-gray-500">
                Tente fechar este dialog e selecionar o prédio novamente.
              </p>
            </CardContent>
          </Card>
        </DialogContent>
      </Dialog>
    );
  }

  // Loading state mais curto
  if (buildingValidation.isLoading) {
    return (
      <Dialog open={open} onOpenChange={onOpenChange}>
        <DialogContent className="max-w-md">
          <LoadingOverlay isLoading={true} message="Carregando dados do prédio...">
            <Card>
              <CardHeader>
                <CardTitle className="flex items-center">
                  <Building2 className="h-5 w-5 mr-2" />
                  {building?.nome || 'Carregando...'}
                </CardTitle>
              </CardHeader>
              <CardContent>
                <div className="h-32 flex items-center justify-center">
                  <span className="text-gray-500">Aguarde...</span>
                </div>
              </CardContent>
            </Card>
          </LoadingOverlay>
        </DialogContent>
      </Dialog>
    );
  }

  // CORREÇÃO: Dados válidos - renderizar o dialog original
  console.log('✅ [SAFE BUILDING DETAILS] Renderizando dialog principal para:', building.nome);
  return (
    <ErrorBoundary
      onError={(error) => {
        console.error('🚨 [SAFE BUILDING DETAILS] Erro no dialog:', error);
        onOpenChange(false);
      }}
    >
      <BuildingDetailsDialog
        open={open}
        onOpenChange={onOpenChange}
        building={building}
      />
    </ErrorBoundary>
  );
};

export default SafeBuildingDetailsDialog;
