
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
  console.log('🛡️ [SAFE BUILDING DETAILS] Renderização:', { open, building: building?.nome || 'null' });

  // CRÍTICO: Early return se dialog não está aberto
  if (!open) {
    console.log('🚫 [SAFE BUILDING DETAILS] Dialog fechado - não renderizando');
    return null;
  }

  // Validar dados do prédio apenas quando dialog está aberto
  const buildingValidation = useDataValidation(
    building,
    (data) => {
      return !!(data?.id && data?.nome);
    },
    {
      required: false, // Não obrigatório para evitar loops
      timeout: 2000,   // Timeout mais curto
      retryAttempts: 1, // Menos tentativas
      enabled: open && !!building // Só habilitar se dialog aberto e há building
    }
  );

  console.log('🔍 [SAFE BUILDING DETAILS] Resultado da validação:', {
    ...buildingValidation,
    hasBuilding: !!building
  });

  // Se não há dados do prédio, não renderizar
  if (!building) {
    console.log('🚫 [SAFE BUILDING DETAILS] Sem dados de prédio - não renderizando');
    return null;
  }

  // Fallback para dados inválidos apenas se há building mas validação falhou
  if (!buildingValidation.isLoading && !buildingValidation.isValid && building && buildingValidation.error) {
    console.warn('⚠️ [SAFE BUILDING DETAILS] Dados inválidos detectados');
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
                Não foi possível carregar os dados do prédio selecionado.
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

  // Loading state apenas se realmente necessário
  if (buildingValidation.isLoading) {
    return (
      <Dialog open={open} onOpenChange={onOpenChange}>
        <DialogContent className="max-w-md">
          <LoadingOverlay isLoading={true} message="Carregando dados do prédio...">
            <Card>
              <CardHeader>
                <CardTitle className="flex items-center">
                  <Building2 className="h-5 w-5 mr-2" />
                  Carregando...
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

  // Dados válidos - renderizar o dialog original
  console.log('✅ [SAFE BUILDING DETAILS] Renderizando dialog principal');
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
