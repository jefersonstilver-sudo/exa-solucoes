
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
  return (
    <AlertDialog open={open} onOpenChange={onOpenChange}>
      <AlertDialogContent>
        <AlertDialogHeader>
          <AlertDialogTitle>Remover Painel do Prédio</AlertDialogTitle>
          <AlertDialogDescription>
            Tem certeza que deseja remover o painel "{panelCode}" do prédio "{buildingName}"?
            <br /><br />
            O painel será desvinculado e ficará disponível para atribuição a outros prédios.
          </AlertDialogDescription>
        </AlertDialogHeader>
        <AlertDialogFooter>
          <AlertDialogCancel disabled={loading}>
            Cancelar
          </AlertDialogCancel>
          <AlertDialogAction 
            onClick={onConfirm}
            disabled={loading}
            className="bg-red-600 hover:bg-red-700"
          >
            {loading ? 'Removendo...' : 'Remover'}
          </AlertDialogAction>
        </AlertDialogFooter>
      </AlertDialogContent>
    </AlertDialog>
  );
};

export default SimplePanelRemovalAlert;
