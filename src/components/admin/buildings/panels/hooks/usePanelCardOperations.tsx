
import { useCallback, useRef } from 'react';

interface UsePanelCardOperationsProps {
  panelId: string;
  panelCode: string;
  onRemove: (panel: any) => void;
  onSync: (panelId: string) => void;
  onViewDetails: (panelId: string) => void;
  disabled: boolean;
}

export const usePanelCardOperations = ({
  panelId,
  panelCode,
  onRemove,
  onSync,
  onViewDetails,
  disabled
}: UsePanelCardOperationsProps) => {
  const operationInProgressRef = useRef(false);
  const lastActionTimeRef = useRef(0);

  // Debounce function para evitar cliques múltiplos
  const debounceAction = useCallback((action: () => void, actionName: string) => {
    const now = Date.now();
    const timeSinceLastAction = now - lastActionTimeRef.current;
    
    if (timeSinceLastAction < 1000) { // 1 segundo de debounce
      console.log(`⏳ [PANEL CARD] Ação "${actionName}" ignorada por debounce`);
      return;
    }

    if (operationInProgressRef.current) {
      console.log(`⏳ [PANEL CARD] Ação "${actionName}" ignorada - operação em andamento`);
      return;
    }

    lastActionTimeRef.current = now;
    operationInProgressRef.current = true;
    
    console.log(`🚀 [PANEL CARD] Executando ação "${actionName}" para painel:`, panelCode);
    
    // Reset flag após um tempo
    setTimeout(() => {
      operationInProgressRef.current = false;
    }, 2000);
    
    action();
  }, [panelCode]);

  const handleRemove = useCallback((panel: any) => {
    if (disabled) return;
    
    debounceAction(() => {
      console.log('🗑️ [PANEL CARD] Iniciando remoção:', panel);
      onRemove(panel);
    }, 'REMOVE');
  }, [disabled, onRemove, debounceAction]);

  const handleSync = useCallback(() => {
    if (disabled) return;
    
    debounceAction(() => {
      console.log('🔄 [PANEL CARD] Iniciando sincronização:', panelId);
      onSync(panelId);
    }, 'SYNC');
  }, [disabled, panelId, onSync, debounceAction]);

  const handleViewDetails = useCallback(() => {
    if (disabled) return;
    
    debounceAction(() => {
      console.log('👁️ [PANEL CARD] Visualizando detalhes:', panelId);
      onViewDetails(panelId);
    }, 'VIEW_DETAILS');
  }, [disabled, panelId, onViewDetails, debounceAction]);

  const isActionDisabled = disabled || operationInProgressRef.current;

  return {
    handleRemove,
    handleSync,
    handleViewDetails,
    isActionDisabled
  };
};
