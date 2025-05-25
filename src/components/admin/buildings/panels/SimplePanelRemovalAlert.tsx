
import React, { useCallback, useRef } from 'react';
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
  const timeoutRef = useRef<NodeJS.Timeout>();
  const isProcessingRef = useRef(false);

  console.log('🚨 [PANEL REMOVAL ALERT] Renderizando:', { 
    open, 
    panelCode, 
    buildingName,
    loading,
    isProcessing: isProcessingRef.current 
  });

  const handleConfirm = useCallback(() => {
    if (isProcessingRef.current || loading) {
      console.log('⏳ [PANEL REMOVAL ALERT] Operação já em andamento, ignorando');
      return;
    }

    console.log('✅ [PANEL REMOVAL ALERT] Confirmação de remoção');
    isProcessingRef.current = true;

    // Timeout de segurança para operação de remoção
    timeoutRef.current = setTimeout(() => {
      console.warn('⏰ [PANEL REMOVAL ALERT] Timeout na operação de remoção');
      isProcessingRef.current = false;
      onOpenChange(false);
    }, 15000); // 15 segundos

    try {
      onConfirm();
    } catch (error) {
      console.error('❌ [PANEL REMOVAL ALERT] Erro na confirmação:', error);
      isProcessingRef.current = false;
      if (timeoutRef.current) {
        clearTimeout(timeoutRef.current);
      }
    }
  }, [onConfirm, loading, onOpenChange]);

  const handleCancel = useCallback(() => {
    console.log('❌ [PANEL REMOVAL ALERT] Cancelamento de remoção');
    
    // Limpar timeout se existir
    if (timeoutRef.current) {
      clearTimeout(timeoutRef.current);
    }
    
    isProcessingRef.current = false;
    
    if (!loading) {
      onOpenChange(false);
    }
  }, [loading, onOpenChange]);

  // Cleanup ao desmontar ou fechar
  React.useEffect(() => {
    if (!open) {
      isProcessingRef.current = false;
      if (timeoutRef.current) {
        clearTimeout(timeoutRef.current);
      }
    }

    return () => {
      if (timeoutRef.current) {
        clearTimeout(timeoutRef.current);
      }
    };
  }, [open]);

  // Não renderizar se dados essenciais estão ausentes
  if (!panelCode || !buildingName) {
    console.warn('⚠️ [PANEL REMOVAL ALERT] Dados essenciais ausentes:', { panelCode, buildingName });
    return null;
  }

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
            disabled={loading || isProcessingRef.current}
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
