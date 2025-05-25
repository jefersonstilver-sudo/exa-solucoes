
import React from 'react';
import {
  AlertDialog,
  AlertDialogAction,
  AlertDialogCancel,
  AlertDialogContent,
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogHeader,
  AlertDialogTitle,
} from '@/components/ui/alert-dialog';

interface SimplePanelRemovalAlertProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  panelCode: string;
  buildingName: string;
  onConfirm: () => void;
  loading: boolean;
}

const SimplePanelRemovalAlert: React.FC<SimplePanelRemovalAlertProps> = ({
  open,
  onOpenChange,
  panelCode,
  buildingName,
  onConfirm,
  loading
}) => {
  console.log('🚨 [PANEL REMOVAL ALERT] Renderizando:', { open, panelCode, loading });

  // Não renderizar se não há código do painel
  if (!panelCode && open) {
    console.warn('⚠️ [PANEL REMOVAL ALERT] Código do painel ausente');
    return null;
  }

  const handleConfirm = () => {
    console.log('✅ [PANEL REMOVAL ALERT] Confirmação de remoção');
    onConfirm();
  };

  const handleCancel = () => {
    console.log('❌ [PANEL REMOVAL ALERT] Cancelamento de remoção');
    if (!loading) {
      onOpenChange(false);
    }
  };

  return (
    <AlertDialog open={open} onOpenChange={onOpenChange}>
      <AlertDialogContent>
        <AlertDialogHeader>
          <AlertDialogTitle>
            {loading ? 'Removendo Painel...' : 'Remover Painel do Prédio'}
          </AlertDialogTitle>
          <AlertDialogDescription>
            {loading ? (
              <>
                Removendo o painel "{panelCode}" do prédio "{buildingName}".
                <br />
                Aguarde, esta operação pode levar alguns segundos...
              </>
            ) : (
              <>
                Tem certeza que deseja remover o painel "{panelCode}" do prédio "{buildingName}"?
                <br /><br />
                O painel será desvinculado e ficará disponível para atribuição a outros prédios.
                Esta ação não pode ser desfeita.
              </>
            )}
          </AlertDialogDescription>
        </AlertDialogHeader>
        <AlertDialogFooter>
          <AlertDialogCancel 
            disabled={loading}
            onClick={handleCancel}
          >
            Cancelar
          </AlertDialogCancel>
          <AlertDialogAction 
            onClick={handleConfirm}
            disabled={loading}
            className="bg-red-600 hover:bg-red-700"
          >
            {loading ? 'Removendo...' : 'Remover Painel'}
          </AlertDialogAction>
        </AlertDialogFooter>
      </AlertDialogContent>
    </AlertDialog>
  );
};

export default SimplePanelRemovalAlert;
