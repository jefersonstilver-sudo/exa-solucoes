
import React, { useCallback, useRef, useEffect } from 'react';
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
  const confirmClickedRef = useRef(false);

  console.log('🚨 [SIMPLE PANEL REMOVAL ALERT] Estado:', { 
    open, 
    panelCode, 
    buildingName,
    loading,
    isProcessing: isProcessingRef.current,
    confirmClicked: confirmClickedRef.current
  });

  // Reset refs quando o dialog abre
  useEffect(() => {
    if (open) {
      isProcessingRef.current = false;
      confirmClickedRef.current = false;
      console.log('🔄 [SIMPLE PANEL REMOVAL ALERT] Dialog aberto, resetando flags');
    }
  }, [open]);

  const handleOpenChange = useCallback((newOpen: boolean) => {
    console.log('🔄 [SIMPLE PANEL REMOVAL ALERT] Mudança de estado solicitada:', {
      from: open,
      to: newOpen,
      loading,
      isProcessing: isProcessingRef.current,
      confirmClicked: confirmClickedRef.current
    });

    // Prevenir fechamento se estiver processando ou loading
    if (!newOpen && (loading || isProcessingRef.current)) {
      console.log('⏳ [SIMPLE PANEL REMOVAL ALERT] Prevenindo fechamento - operação em andamento');
      return;
    }

    // Prevenir fechamento acidental após confirmação
    if (!newOpen && confirmClickedRef.current && !loading) {
      console.log('⚠️ [SIMPLE PANEL REMOVAL ALERT] Prevenindo fechamento acidental após confirmação');
      return;
    }

    onOpenChange(newOpen);
  }, [open, loading, onOpenChange]);

  const handleConfirm = useCallback((e: React.MouseEvent) => {
    e.preventDefault();
    e.stopPropagation();

    if (isProcessingRef.current || loading || confirmClickedRef.current) {
      console.log('⏳ [SIMPLE PANEL REMOVAL ALERT] Confirmação ignorada - já processando');
      return;
    }

    console.log('✅ [SIMPLE PANEL REMOVAL ALERT] Confirmação de remoção iniciada');
    
    isProcessingRef.current = true;
    confirmClickedRef.current = true;

    // Timeout de segurança
    timeoutRef.current = setTimeout(() => {
      console.warn('⏰ [SIMPLE PANEL REMOVAL ALERT] Timeout na operação');
      isProcessingRef.current = false;
      confirmClickedRef.current = false;
    }, 30000); // 30 segundos

    try {
      onConfirm();
    } catch (error) {
      console.error('❌ [SIMPLE PANEL REMOVAL ALERT] Erro na confirmação:', error);
      isProcessingRef.current = false;
      confirmClickedRef.current = false;
      if (timeoutRef.current) {
        clearTimeout(timeoutRef.current);
      }
    }
  }, [onConfirm, loading]);

  const handleCancel = useCallback((e: React.MouseEvent) => {
    e.preventDefault();
    e.stopPropagation();

    console.log('❌ [SIMPLE PANEL REMOVAL ALERT] Cancelamento solicitado');
    
    // Limpar timeout
    if (timeoutRef.current) {
      clearTimeout(timeoutRef.current);
    }
    
    // Reset flags
    isProcessingRef.current = false;
    confirmClickedRef.current = false;
    
    // Só fechar se não estiver carregando
    if (!loading) {
      onOpenChange(false);
    }
  }, [loading, onOpenChange]);

  // Cleanup
  useEffect(() => {
    if (!open) {
      if (timeoutRef.current) {
        clearTimeout(timeoutRef.current);
      }
      // Reset flags quando fecha
      setTimeout(() => {
        isProcessingRef.current = false;
        confirmClickedRef.current = false;
      }, 100);
    }

    return () => {
      if (timeoutRef.current) {
        clearTimeout(timeoutRef.current);
      }
    };
  }, [open]);

  // Não renderizar se dados essenciais estão ausentes
  if (!panelCode) {
    console.warn('⚠️ [SIMPLE PANEL REMOVAL ALERT] panelCode ausente');
    return null;
  }

  return (
    <AlertDialog open={open} onOpenChange={handleOpenChange}>
      <AlertDialogContent>
        <AlertDialogHeader>
          <AlertDialogTitle>
            {loading ? 'Removendo Painel...' : 'Remover Painel'}
          </AlertDialogTitle>
          <AlertDialogDescription>
            {loading ? (
              <>
                Removendo o painel "{panelCode}"
                {buildingName && ` do prédio "${buildingName}"`}.
                <br />
                <strong>Aguarde, esta operação pode levar alguns segundos...</strong>
              </>
            ) : (
              <>
                Tem certeza que deseja remover o painel "{panelCode}"
                {buildingName && ` do prédio "${buildingName}"`}?
                <br /><br />
                <strong>O painel será desvinculado e ficará disponível para atribuição a outros prédios.</strong>
                <br />
                Esta ação não pode ser desfeita.
              </>
            )}
          </AlertDialogDescription>
        </AlertDialogHeader>
        <AlertDialogFooter>
          <AlertDialogCancel 
            disabled={loading || isProcessingRef.current}
            onClick={handleCancel}
          >
            Cancelar
          </AlertDialogCancel>
          <AlertDialogAction 
            onClick={handleConfirm}
            disabled={loading || isProcessingRef.current || confirmClickedRef.current}
            className="bg-red-600 hover:bg-red-700 disabled:opacity-50 disabled:cursor-not-allowed"
          >
            {loading ? 'Removendo...' : 'Remover Painel'}
          </AlertDialogAction>
        </AlertDialogFooter>
      </AlertDialogContent>
    </AlertDialog>
  );
};

export default SimplePanelRemovalAlert;
