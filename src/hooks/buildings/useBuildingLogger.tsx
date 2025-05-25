
export const useBuildingLogger = () => {
  const logStateChange = (action: string, newState: any) => {
    console.log(`🔍 [BUILDING ACTIONS - ${action}] Estado atual:`, {
      timestamp: new Date().toISOString(),
      selectedBuilding: newState.selectedBuilding ? {
        id: newState.selectedBuilding.id,
        nome: newState.selectedBuilding.nome
      } : null,
      isDetailsOpen: newState.isDetailsOpen,
      isFormOpen: newState.isFormOpen,
      isImageManagerOpen: newState.isImageManagerOpen,
      operationLoading: newState.operationLoading
    });
  };

  return { logStateChange };
};
