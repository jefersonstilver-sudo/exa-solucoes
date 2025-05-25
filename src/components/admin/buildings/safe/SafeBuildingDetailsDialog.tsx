
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
  console.log('🛡️ [SAFE BUILDING DETAILS] Iniciando validação:', { open, building });

  // Validar dados do prédio
  const buildingValidation = useDataValidation(
    building,
    (data) => {
      return !!(data?.id && data?.nome);
    },
    {
      required: true,
      timeout: 8000,
      retryAttempts: 3
    }
  );

  console.log('🔍 [SAFE BUILDING DETAILS] Resultado da validação:', buildingValidation);

  // Se o dialog não está aberto, não renderizar nada
  if (!open) {
    return null;
  }

  // Fallback para dados inválidos
  if (!buildingValidation.isLoading && !buildingValidation.isValid) {
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
                {buildingValidation.error || 'Não foi possível carregar os dados do prédio.'}
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

  // Loading state
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
        building={buildingValidation.data}
      />
    </ErrorBoundary>
  );
};

export default SafeBuildingDetailsDialog;
