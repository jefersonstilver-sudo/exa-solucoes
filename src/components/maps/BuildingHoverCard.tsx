import React from 'react';
import { HoverCard, HoverCardContent, HoverCardTrigger } from '@/components/ui/hover-card';
import { Badge } from '@/components/ui/badge';
import { MapPin, Building2, Users, Clock } from 'lucide-react';
import type { BuildingStore } from '@/services/buildingStoreService';

interface BuildingHoverCardProps {
  building: BuildingStore;
  children: React.ReactNode;
  side?: 'top' | 'right' | 'bottom' | 'left';
}

const BuildingHoverCard: React.FC<BuildingHoverCardProps> = ({
  building,
  children,
  side = 'top'
}) => {
  const getStatusVariant = (status: string) => {
    switch (status?.toLowerCase()) {
      case 'ativo': return 'default';
      case 'manutenção': return 'secondary';
      case 'inativo': return 'destructive';
      default: return 'outline';
    }
  };

  const getStatusLabel = (status: string) => {
    switch (status?.toLowerCase()) {
      case 'ativo': return 'Ativo';
      case 'manutenção': return 'Manutenção';
      case 'inativo': return 'Inativo';
      default: return 'Status não definido';
    }
  };

  const formatPrice = (price: number | null | undefined) => {
    if (!price) return 'Sob consulta';
    return new Intl.NumberFormat('pt-BR', {
      style: 'currency',
      currency: 'BRL',
      minimumFractionDigits: 0,
      maximumFractionDigits: 0,
    }).format(price);
  };

  return (
    <HoverCard openDelay={300} closeDelay={150}>
      <HoverCardTrigger asChild>
        {children}
      </HoverCardTrigger>
      <HoverCardContent 
        side={side} 
        sideOffset={10}
        className="w-80 p-0 overflow-hidden border-0 shadow-xl bg-card"
      >
        <div className="relative">
          {/* Building Image */}
          <div className="relative h-32 bg-gradient-to-br from-primary/10 to-primary/20 overflow-hidden">
            {building.imagem_principal ? (
              <img
                src={building.imagem_principal}
                alt={building.nome}
                className="w-full h-full object-cover transition-transform duration-300 hover:scale-105"
                onError={(e) => {
                  const target = e.target as HTMLImageElement;
                  target.style.display = 'none';
                }}
              />
            ) : (
              <div className="flex items-center justify-center h-full">
                <Building2 className="h-12 w-12 text-primary/40" />
              </div>
            )}
            
            {/* Status Badge Overlay */}
            <div className="absolute top-3 right-3">
              <Badge variant={getStatusVariant(building.status)} className="shadow-sm">
                {getStatusLabel(building.status)}
              </Badge>
            </div>
          </div>

          {/* Content */}
          <div className="p-4 space-y-3">
            {/* Title and Location */}
            <div>
              <h3 className="font-semibold text-lg text-foreground leading-tight mb-1">
                {building.nome}
              </h3>
              <div className="flex items-center text-sm text-muted-foreground">
                <MapPin className="h-3 w-3 mr-1 flex-shrink-0" />
                <span className="truncate">
                  {building.endereco}
                  {building.bairro && `, ${building.bairro}`}
                </span>
              </div>
            </div>

            {/* Stats Grid */}
            <div className="grid grid-cols-2 gap-3 pt-2 border-t border-border/50">
              {/* Audience */}
              <div className="flex items-center space-x-2">
                <Users className="h-4 w-4 text-primary" />
                <div>
                  <p className="text-xs text-muted-foreground">Público</p>
                  <p className="text-sm font-medium">
                    {building.publico_estimado ? 
                      building.publico_estimado.toLocaleString('pt-BR') : 
                      'N/A'}
                  </p>
                </div>
              </div>

              {/* Panel Count */}
              <div className="flex items-center space-x-2">
                <Building2 className="h-4 w-4 text-primary" />
                <div>
                  <p className="text-xs text-muted-foreground">Painéis</p>
                  <p className="text-sm font-medium">
                    {building.quantidade_telas || 0}
                  </p>
                </div>
              </div>

              {/* Price */}
              <div className="flex items-center space-x-2">
                <Clock className="h-4 w-4 text-primary" />
                <div>
                  <p className="text-xs text-muted-foreground">Preço/mês</p>
                  <p className="text-sm font-medium text-primary">
                    {formatPrice(building.preco_base)}
                  </p>
                </div>
              </div>

              {/* Venue Type */}
              <div className="flex items-center space-x-2">
                <div className="h-4 w-4 rounded-full bg-primary/20 flex items-center justify-center">
                  <div className="h-2 w-2 rounded-full bg-primary" />
                </div>
                <div>
                  <p className="text-xs text-muted-foreground">Tipo</p>
                  <p className="text-sm font-medium capitalize">
                    {building.venue_type || 'Residencial'}
                  </p>
                </div>
              </div>
            </div>

            {/* Amenities */}
            {building.amenities && building.amenities.length > 0 && (
              <div className="pt-2 border-t border-border/50">
                <p className="text-xs text-muted-foreground mb-2">Comodidades</p>
                <div className="flex flex-wrap gap-1">
                  {building.amenities.slice(0, 3).map((amenity, index) => (
                    <Badge key={index} variant="outline" className="text-xs px-2 py-0">
                      {amenity}
                    </Badge>
                  ))}
                  {building.amenities.length > 3 && (
                    <Badge variant="outline" className="text-xs px-2 py-0">
                      +{building.amenities.length - 3}
                    </Badge>
                  )}
                </div>
              </div>
            )}
          </div>
        </div>
      </HoverCardContent>
    </HoverCard>
  );
};

export default BuildingHoverCard;