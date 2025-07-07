
import React from 'react';
import { Button } from '@/components/ui/button';
import { RefreshCw } from 'lucide-react';
import { useSimpleBuildingStore } from '@/hooks/useSimpleBuildingStore';
import { toast } from 'sonner';

const BuildingStoreRefreshButton = () => {
  const { forceRefresh, isLoading } = useSimpleBuildingStore();

  const handleRefresh = async () => {
    console.log('🔄 [REFRESH] Forçando atualização dos prédios...');
    toast.info('Atualizando dados dos prédios...');
    try {
      await forceRefresh();
      toast.success('Dados atualizados com sucesso!');
    } catch (error) {
      console.error('❌ [REFRESH] Erro ao atualizar:', error);
      toast.error('Erro ao atualizar dados');
    }
  };

  return (
    <Button 
      onClick={handleRefresh}
      disabled={isLoading}
      variant="outline"
      size="sm"
      className="gap-2"
    >
      <RefreshCw className={`h-4 w-4 ${isLoading ? 'animate-spin' : ''}`} />
      {isLoading ? 'Atualizando...' : 'Atualizar'}
    </Button>
  );
};

export default BuildingStoreRefreshButton;
