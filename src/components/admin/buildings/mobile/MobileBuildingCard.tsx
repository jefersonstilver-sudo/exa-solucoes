import React, { useState } from 'react';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { 
  MapPin, Eye, Edit, Image, MoreHorizontal, Video, Play, 
  ChevronDown, ChevronUp, Link2, Hash
} from 'lucide-react';
import { supabase } from '@/integrations/supabase/client';
import { Building } from '@/services/buildingsDataService';
import { BuildingVideoPlaylistPreview } from '../BuildingVideoPlaylistPreview';
import { BuildingPanelIndicator } from '../BuildingPanelIndicator';
import BuildingActionsDropdown from '../BuildingActionsDropdown';
import { BuildingPanelsStatus } from '@/hooks/useBuildingPanelsStatus';
import { cn } from '@/lib/utils';

interface MobileBuildingCardProps {
  building: Building;
  videoCount?: number;
  panelsStatus?: BuildingPanelsStatus;
  panelsStatusLoading?: boolean;
  onView: (building: Building) => void;
  onEdit: (building: Building) => void;
  onImageManager: (building: Building) => void;
  onDelete: (building: Building) => void;
}

const MobileBuildingCard: React.FC<MobileBuildingCardProps> = ({
  building,
  videoCount = 0,
  panelsStatus,
  panelsStatusLoading,
  onView,
  onEdit,
  onImageManager,
  onDelete
}) => {
  const [expanded, setExpanded] = useState(false);
  const [isPlaylistOpen, setIsPlaylistOpen] = useState(false);

  const getImageUrl = (path: string) => {
    if (!path) return null;
    if (path.startsWith('http')) return path;
    return supabase.storage.from('building-images').getPublicUrl(path).data.publicUrl;
  };

  const formatPrice = (value: number | null | undefined) => {
    if (!value) return '—';
    return `R$ ${value.toLocaleString('pt-BR', { minimumFractionDigits: 0 })}`;
  };

  const getMonthlyPrice = (totalPrice: number | null | undefined, months: number) => {
    if (!totalPrice) return '—';
    const monthly = totalPrice / months;
    return `R$ ${Math.round(monthly).toLocaleString('pt-BR')}`;
  };

  const formatViews = (views: number | null | undefined) => {
    if (!views) return '0';
    if (views >= 1000) return `${(views / 1000).toFixed(0)}k`;
    return views.toString();
  };

  const imageUrl = getImageUrl(building.imagem_principal || '');

  return (
    <>
      <BuildingVideoPlaylistPreview
        buildingId={building.id}
        buildingName={building.nome}
        buildingCode={building.codigo_predio || '000'}
        isOpen={isPlaylistOpen}
        onClose={() => setIsPlaylistOpen(false)}
      />

      <div className="bg-white/90 backdrop-blur-sm rounded-2xl shadow-sm border border-gray-100 overflow-hidden transition-all duration-300 hover:shadow-md">
        {/* Card Header - Always visible */}
        <div 
          className="p-3 cursor-pointer"
          onClick={() => setExpanded(!expanded)}
        >
          <div className="flex gap-3">
            {/* Thumbnail */}
            <div className="w-16 h-16 rounded-xl overflow-hidden bg-gray-100 flex-shrink-0">
              {imageUrl ? (
                <img 
                  src={imageUrl} 
                  alt={building.nome}
                  className="w-full h-full object-cover"
                />
              ) : (
                <div className="w-full h-full flex items-center justify-center text-gray-300">
                  <Image className="h-6 w-6" />
                </div>
              )}
              {/* Video overlay */}
              {videoCount > 0 && (
                <button
                  onClick={(e) => {
                    e.stopPropagation();
                    setIsPlaylistOpen(true);
                  }}
                  className="absolute inset-0 bg-black/50 flex items-center justify-center"
                >
                  <Video className="h-4 w-4 text-white" />
                </button>
              )}
            </div>

            {/* Info */}
            <div className="flex-1 min-w-0">
              <div className="flex items-start justify-between gap-2">
                <div className="min-w-0 flex-1">
                  <div className="flex items-center gap-1.5 mb-0.5">
                    <h3 className="font-semibold text-sm text-foreground truncate">
                      {building.nome}
                    </h3>
                    {building.codigo_predio && (
                      <span className="text-[10px] text-muted-foreground font-mono">
                        #{building.codigo_predio}
                      </span>
                    )}
                  </div>
                  <div className="flex items-center gap-1 text-xs text-muted-foreground">
                    <MapPin className="h-3 w-3 flex-shrink-0" />
                    <span className="truncate">{building.bairro}</span>
                  </div>
                </div>

                {/* Right side badges */}
                <div className="flex items-center gap-1.5 flex-shrink-0">
                  <BuildingPanelIndicator 
                    panelsStatus={panelsStatus} 
                    isLoading={panelsStatusLoading}
                    compact
                  />
                  {building.codigo_predio && (
                    <Badge variant="outline" className="bg-blue-50 text-blue-600 border-blue-200 text-[9px] px-1 py-0 h-4">
                      AWS
                    </Badge>
                  )}
                  <Badge 
                    className={cn(
                      "text-[9px] px-1.5 py-0 h-4",
                      building.status === 'ativo' 
                        ? "bg-green-500 text-white" 
                        : "bg-gray-400 text-white"
                    )}
                  >
                    {building.status === 'ativo' ? 'Ativo' : 'Inativo'}
                  </Badge>
                </div>
              </div>

              {/* Quick metrics row */}
              <div className="flex items-center gap-3 mt-2 text-[11px]">
                <span className="text-muted-foreground">
                  <span className="font-medium text-foreground">{building.quantidade_telas || 0}</span> telas
                </span>
                <span className="text-muted-foreground">
                  <span className="font-medium text-foreground">{formatViews(building.visualizacoes_mes)}</span> views
                </span>
                {videoCount > 0 && (
                  <span className="text-green-600 font-medium">
                    {videoCount} ao vivo
                  </span>
                )}
                <ChevronDown className={cn(
                  "h-4 w-4 text-muted-foreground ml-auto transition-transform duration-200",
                  expanded && "rotate-180"
                )} />
              </div>
            </div>
          </div>
        </div>

        {/* Expanded Content */}
        {expanded && (
          <div className="px-3 pb-3 space-y-3 animate-fade-in">
            {/* Full address */}
            <div className="text-xs text-muted-foreground bg-gray-50 rounded-lg p-2">
              <MapPin className="h-3 w-3 inline mr-1" />
              {building.endereco}, {building.bairro}
            </div>

            {/* Stats Grid */}
            <div className="grid grid-cols-4 gap-2">
              <div className="bg-gray-50 rounded-lg py-1.5 px-1 text-center">
                <p className="text-[9px] text-muted-foreground uppercase">Telas</p>
                <p className="font-bold text-sm text-foreground">{building.quantidade_telas || 0}</p>
              </div>
              <div className="bg-gray-50 rounded-lg py-1.5 px-1 text-center">
                <p className="text-[9px] text-muted-foreground uppercase">Público</p>
                <p className="font-bold text-sm text-foreground">{(building.publico_estimado || 0).toLocaleString()}</p>
              </div>
              <div className="bg-gray-50 rounded-lg py-1.5 px-1 text-center">
                <p className="text-[9px] text-muted-foreground uppercase">Views/Mês</p>
                <p className="font-bold text-sm text-foreground">{formatViews(building.visualizacoes_mes)}</p>
              </div>
              <div className="bg-gray-50 rounded-lg py-1.5 px-1 text-center">
                <p className="text-[9px] text-muted-foreground uppercase">Vendas</p>
                <p className="font-bold text-sm text-foreground">{videoCount}</p>
              </div>
            </div>

            {/* Prices - MONTHLY values */}
            <div className="bg-green-50 border border-green-100 rounded-xl p-2.5">
              <div className="flex items-center gap-1.5 mb-2">
                <span className="text-green-600 font-bold text-sm">$</span>
                <span className="text-xs font-medium text-green-700">Preços por Mês</span>
              </div>
              <div className="grid grid-cols-4 gap-1.5 text-center">
                <div>
                  <p className="text-[9px] text-muted-foreground uppercase">Base</p>
                  <p className="font-bold text-xs text-[#9C1E1E]">{formatPrice(building.preco_base)}</p>
                </div>
                <div>
                  <p className="text-[9px] text-muted-foreground uppercase">3 Meses</p>
                  <p className="font-bold text-xs text-[#9C1E1E]">{getMonthlyPrice(building.preco_trimestral, 3)}</p>
                </div>
                <div>
                  <p className="text-[9px] text-muted-foreground uppercase">6 Meses</p>
                  <p className="font-bold text-xs text-[#9C1E1E]">{getMonthlyPrice(building.preco_semestral, 6)}</p>
                </div>
                <div>
                  <p className="text-[9px] text-muted-foreground uppercase">12 Meses</p>
                  <p className="font-bold text-xs text-[#9C1E1E]">{getMonthlyPrice(building.preco_anual, 12)}</p>
                </div>
              </div>
            </div>

            {/* Actions */}
            <div className="flex items-center gap-2">
              <Button
                variant="outline"
                size="sm"
                onClick={() => onView(building)}
                className="flex-1 h-8 text-xs"
              >
                <Eye className="h-3 w-3 mr-1" />
                Ver
              </Button>
              <Button
                variant="outline"
                size="sm"
                onClick={() => onEdit(building)}
                className="flex-1 h-8 text-xs"
              >
                <Edit className="h-3 w-3 mr-1" />
                Editar
              </Button>
              <Button
                variant="outline"
                size="sm"
                onClick={() => onImageManager(building)}
                className="flex-1 h-8 text-xs"
              >
                <Image className="h-3 w-3 mr-1" />
                Fotos
              </Button>
              <BuildingActionsDropdown
                buildingName={building.nome}
                buildingCode={building.codigo_predio || '000'}
                onDelete={() => onDelete(building)}
              />
            </div>
          </div>
        )}
      </div>
    </>
  );
};

export default MobileBuildingCard;
