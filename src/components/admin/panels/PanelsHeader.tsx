
import React from 'react';
import { Button } from '@/components/ui/button';
import { Plus, RefreshCw } from 'lucide-react';

interface PanelsHeaderProps {
  onRefresh: () => void;
  onNewPanel: () => void;
  loading: boolean;
}

const PanelsHeader: React.FC<PanelsHeaderProps> = ({
  onRefresh,
  onNewPanel,
  loading
}) => {
  return (
    <div>
      <h1 className="text-3xl font-bold text-gray-900">Gerenciar Painéis</h1>
      <p className="text-gray-600 mt-2">Monitore e gerencie todos os painéis digitais</p>
      <div className="flex flex-col sm:flex-row gap-3 mt-4">
        <Button variant="outline" onClick={onRefresh} disabled={loading}>
          <RefreshCw className="h-4 w-4 mr-2" />
          Atualizar
        </Button>
        <Button 
          onClick={onNewPanel}
          className="bg-indexa-purple hover:bg-indexa-purple-dark text-white"
        >
          <Plus className="h-4 w-4 mr-2" />
          Novo Painel
        </Button>
      </div>
    </div>
  );
};

export default PanelsHeader;
