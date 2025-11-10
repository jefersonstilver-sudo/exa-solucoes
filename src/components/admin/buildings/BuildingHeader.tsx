
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
    <div className="bg-white rounded-lg shadow-sm border border-gray-200 p-6 mb-6">
      <div className="flex flex-col md:flex-row md:items-center md:justify-between gap-4">
        <div className="flex-1">
          <div className="flex items-center gap-3 mb-2">
            <div className="flex items-center justify-center w-12 h-12 bg-[#9C1E1E]/10 rounded-lg">
              <Building2 className="h-6 w-6 text-[#9C1E1E]" />
            </div>
            <div>
              <h1 className="text-2xl md:text-3xl font-bold text-gray-900">
                Gerenciamento de Prédios
              </h1>
              <p className="text-sm text-gray-500 mt-0.5">
                Central de controle e administração
              </p>
            </div>
          </div>
        </div>
        <div className="flex items-center gap-2">
          <Button 
            variant="outline" 
            onClick={onRefresh} 
            disabled={loading}
            className="h-10"
          >
            <RefreshCw className={`h-4 w-4 mr-2 ${loading ? 'animate-spin' : ''}`} />
            Atualizar
          </Button>
          <Button 
            className="bg-[#9C1E1E] hover:bg-[#7A1818] h-10"
            onClick={onNewBuilding}
          >
            <Plus className="h-4 w-4 mr-2" />
            Novo Prédio
          </Button>
        </div>
      </div>
    </div>
  );
};

export default BuildingHeader;
