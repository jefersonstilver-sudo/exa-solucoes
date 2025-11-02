import React from 'react';
import { BuildingStore } from '@/services/buildingStoreService';
import { Badge } from '@/components/ui/badge';
import { Card, CardContent, CardHeader } from '@/components/ui/card';
import { MapPin, DollarSign, Calendar, Users, Building2, X, Eye, Monitor } from 'lucide-react';
import { Button } from '@/components/ui/button';

interface MobileBuildingInfoCardProps {
  building: BuildingStore;
  onClose: () => void;
}

const MobileBuildingInfoCard: React.FC<MobileBuildingInfoCardProps> = ({ building, onClose }) => {
  const formatPrice = (price: number) => {
    return new Intl.NumberFormat('pt-BR', {
      style: 'currency',
      currency: 'BRL',
      minimumFractionDigits: 0,
      maximumFractionDigits: 0,
    }).format(price);
  };

  const getDisplayStatus = (status: string) => {
    const normalizedStatus = status?.toLowerCase();
    if (normalizedStatus === 'instalação' || normalizedStatus === 'instalacao') {
      return 'PRE VENDA';
    }
    return status || 'N/A';
  };

  const getStatusColor = (status: string) => {
    const normalizedStatus = status?.toLowerCase();
    switch (normalizedStatus) {
      case 'ativo':
        return 'bg-green-100 text-green-800 border-green-200';
      case 'instalação':
      case 'instalacao':
        return 'bg-blue-100 text-blue-800 border-blue-200';
      case 'inativo':
        return 'bg-red-100 text-red-800 border-red-200';
      case 'manutencao':
        return 'bg-yellow-100 text-yellow-800 border-yellow-200';
      default:
        return 'bg-gray-100 text-gray-800 border-gray-200';
    }
  };

  const formatNumber = (num: number) => {
    return num.toLocaleString('pt-BR');
  };

  return (
    <div className="fixed bottom-4 left-4 right-4 z-50 animate-in slide-in-from-bottom-full duration-300">
      <Card className="bg-white shadow-2xl border-gray-200 max-h-[50vh] overflow-hidden">
        <CardHeader className="p-4 bg-gray-50 border-b border-gray-200">
          <div className="flex items-start justify-between">
            <div className="flex-1 min-w-0">
              <h3 className="font-bold text-base text-gray-900 leading-tight">{building.nome}</h3>
              <div className="flex items-center gap-1 mt-1.5 text-xs text-gray-600">
                <MapPin className="w-3.5 h-3.5 flex-shrink-0" />
                <span className="truncate">{building.bairro}</span>
              </div>
            </div>
            <Button 
              variant="ghost" 
              size="sm" 
              onClick={onClose}
              className="text-gray-500 hover:bg-gray-200 h-8 w-8 p-0 flex-shrink-0"
            >
              <X className="w-4 h-4" />
            </Button>
          </div>
        </CardHeader>
        
        <CardContent className="p-4 space-y-3">
          {/* Status */}
          <div className="flex items-center justify-between py-2 border-b border-gray-100">
            <span className="text-xs text-gray-600 font-medium">Status</span>
            <Badge variant="outline" className={`text-xs px-2.5 py-1 font-medium ${getStatusColor(building.status)}`}>
              {getDisplayStatus(building.status)}
            </Badge>
          </div>

          {/* Métricas em Grid */}
          <div className="grid grid-cols-3 gap-3 py-2">
            <div className="text-center">
              <div className="flex items-center justify-center mb-1">
                <Users className="w-4 h-4 text-gray-500" />
              </div>
              <p className="text-xs text-gray-600 mb-0.5">Público</p>
              <p className="text-sm font-bold text-gray-900">
                {formatNumber(building.publico_estimado || 0)}
              </p>
            </div>

            <div className="text-center border-l border-r border-gray-200">
              <div className="flex items-center justify-center mb-1">
                <Eye className="w-4 h-4 text-gray-500" />
              </div>
              <p className="text-xs text-gray-600 mb-0.5">Exibições</p>
              <p className="text-sm font-bold text-gray-900">
                {formatNumber(building.visualizacoes_mes || 0)}
              </p>
            </div>

            <div className="text-center">
              <div className="flex items-center justify-center mb-1">
                <Monitor className="w-4 h-4 text-gray-500" />
              </div>
              <p className="text-xs text-gray-600 mb-0.5">Telas</p>
              <p className="text-sm font-bold text-gray-900">
                {building.numero_elevadores || 0}
              </p>
            </div>
          </div>

          {/* Price */}
          <div className="flex items-center justify-between py-2 border-t border-gray-100">
            <span className="text-xs text-gray-600 font-medium">A partir de</span>
            <span className="font-bold text-lg text-[#9C1E1E]">
              {formatPrice(building.preco_base || 0)}<span className="text-sm text-gray-500 font-normal">/mês</span>
            </span>
          </div>
        </CardContent>
      </Card>
    </div>
  );
};

export default MobileBuildingInfoCard;