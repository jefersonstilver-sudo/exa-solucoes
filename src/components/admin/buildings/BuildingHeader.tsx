
import React from 'react';
import { Button } from '@/components/ui/button';
import { Building2, Plus, RefreshCw } from 'lucide-react';

interface BuildingHeaderProps {
  loading: boolean;
  onRefresh: () => void;
  onNewBuilding: () => void;
}

const BuildingHeader: React.FC<BuildingHeaderProps> = ({
  loading,
  onRefresh,
  onNewBuilding
}) => {
  return (
    <div className="flex items-center justify-between">
      <div>
        <h1 className="text-3xl font-bold text-gray-900 flex items-center">
          <Building2 className="h-8 w-8 mr-3 text-[#9C1E1E]" />
          Sistema Completo de Prédios
        </h1>
        <p className="text-gray-600 mt-2">
          Gerenciamento completo com galeria de imagens, cálculos automáticos e integração total
        </p>
      </div>
      <div className="flex items-center space-x-3">
        <Button variant="outline" onClick={onRefresh} disabled={loading}>
          <RefreshCw className="h-4 w-4 mr-2" />
          Atualizar
        </Button>
        <Button 
          className="bg-[#9C1E1E] hover:bg-[#180A0A]"
          onClick={onNewBuilding}
        >
          <Plus className="h-4 w-4 mr-2" />
          Novo Prédio
        </Button>
      </div>
    </div>
  );
};

export default BuildingHeader;
