import React from 'react';
import { BuildingStore } from '@/services/buildingStoreService';
import { Badge } from '@/components/ui/badge';
import { Card, CardContent, CardHeader } from '@/components/ui/card';
import { MapPin, DollarSign, Calendar, Users, Building2, X } from 'lucide-react';
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

  return (
    <div className="fixed bottom-4 left-4 right-4 z-50 animate-in slide-in-from-bottom-full duration-300">
      <Card className="bg-white shadow-2xl border-border/50 max-h-[50vh] overflow-hidden">
        <CardHeader className="p-3 bg-gradient-to-r from-primary to-primary/90 text-primary-foreground">
          <div className="flex items-start justify-between">
            <div className="flex-1 min-w-0">
              <h3 className="font-semibold text-sm leading-tight">{building.nome}</h3>
              <div className="flex items-center gap-1 mt-1 text-xs opacity-90">
                <MapPin className="w-3 h-3 flex-shrink-0" />
                <span className="truncate">{building.endereco}, {building.bairro}</span>
              </div>
            </div>
            <Button 
              variant="ghost" 
              size="sm" 
              onClick={onClose}
              className="text-primary-foreground hover:bg-white/20 h-8 w-8 p-0 flex-shrink-0"
            >
              <X className="w-4 h-4" />
            </Button>
          </div>
        </CardHeader>
        
        <CardContent className="p-3 space-y-3">
          {/* Status */}
          <div className="flex items-center justify-between">
            <span className="text-xs text-muted-foreground">Status:</span>
            <Badge variant="outline" className={`text-xs px-2 py-1 ${getStatusColor(building.status)}`}>
              {getDisplayStatus(building.status)}
            </Badge>
          </div>

          {/* Price */}
          <div className="flex items-center justify-between">
            <span className="text-xs text-muted-foreground flex items-center gap-1">
              <DollarSign className="w-3 h-3" />
              Preço Base:
            </span>
            <span className="font-semibold text-sm text-primary">
              {formatPrice(building.preco_base || 0)}
            </span>
          </div>

          {/* Views */}
          {building.visualizacoes_mes && (
            <div className="flex items-center justify-between">
              <span className="text-xs text-muted-foreground flex items-center gap-1">
                <Users className="w-3 h-3" />
                Views/mês:
              </span>
              <span className="text-sm font-medium">
                {building.visualizacoes_mes.toLocaleString('pt-BR')}
              </span>
            </div>
          )}

          {/* Building Type */}
          {building.venue_type && (
            <div className="flex items-center justify-between">
              <span className="text-xs text-muted-foreground flex items-center gap-1">
                <Building2 className="w-3 h-3" />
                Tipo:
              </span>
              <span className="text-sm">{building.venue_type}</span>
            </div>
          )}

          {/* Amenities */}
          {building.amenities && building.amenities.length > 0 && (
            <div className="space-y-2">
              <span className="text-xs text-muted-foreground">Facilidades:</span>
              <div className="flex flex-wrap gap-1">
                {building.amenities.slice(0, 3).map((amenity, index) => (
                  <Badge key={index} variant="secondary" className="text-xs px-2 py-0.5">
                    {amenity}
                  </Badge>
                ))}
                {building.amenities.length > 3 && (
                  <Badge variant="outline" className="text-xs px-2 py-0.5">
                    +{building.amenities.length - 3}
                  </Badge>
                )}
              </div>
            </div>
          )}
        </CardContent>
      </Card>
    </div>
  );
};

export default MobileBuildingInfoCard;