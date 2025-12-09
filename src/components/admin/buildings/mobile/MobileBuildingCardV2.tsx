import React, { useState } from 'react';
import { ChevronRight, MapPin, Video, Monitor, Eye, Edit, Image, Trash2 } from 'lucide-react';
import { supabase } from '@/integrations/supabase/client';
import { Building } from '@/services/buildingsDataService';
import { BuildingVideoPlaylistPreview } from '../BuildingVideoPlaylistPreview';
import { BuildingPanelsStatus } from '@/hooks/useBuildingPanelsStatus';
import { cn } from '@/lib/utils';
import {
  Sheet,
  SheetContent,
  SheetHeader,
  SheetTitle,
} from '@/components/ui/sheet';
import { Button } from '@/components/ui/button';

interface MobileBuildingCardV2Props {
  building: Building;
  videoCount?: number;
  panelsStatus?: BuildingPanelsStatus;
  panelsStatusLoading?: boolean;
  onView: (building: Building) => void;
  onEdit: (building: Building) => void;
  onImageManager: (building: Building) => void;
  onDelete: (building: Building) => void;
}

const MobileBuildingCardV2: React.FC<MobileBuildingCardV2Props> = ({
  building,
  videoCount = 0,
  panelsStatus,
  panelsStatusLoading,
  onView,
  onEdit,
  onImageManager,
  onDelete
}) => {
  const [showSheet, setShowSheet] = useState(false);
  const [isPlaylistOpen, setIsPlaylistOpen] = useState(false);

  const getImageUrl = (path: string) => {
    if (!path) return null;
    if (path.startsWith('http')) return path;
    return supabase.storage.from('building-images').getPublicUrl(path).data.publicUrl;
  };

  const formatPrice = (value: number | null | undefined) => {
    if (!value) return '—';
    return `R$${Math.round(value).toLocaleString('pt-BR')}`;
  };

  const imageUrl = getImageUrl(building.imagem_principal || '');
  const isActive = building.status === 'ativo';
  
  // Panel status
  const online = panelsStatus?.onlineCount ?? 0;
  const total = panelsStatus?.totalPanels ?? 0;
  const hasAWS = !!building.codigo_predio;

  return (
    <>
      <BuildingVideoPlaylistPreview
        buildingId={building.id}
        buildingName={building.nome}
        buildingCode={building.codigo_predio || '000'}
        isOpen={isPlaylistOpen}
        onClose={() => setIsPlaylistOpen(false)}
      />

      {/* Card */}
      <button
        onClick={() => setShowSheet(true)}
        className="w-full bg-white rounded-xl p-2.5 flex items-center gap-2.5 active:scale-[0.98] transition-transform"
      >
        {/* Thumbnail 32x32 */}
        <div className="w-8 h-8 rounded-lg overflow-hidden bg-gray-100 flex-shrink-0">
          {imageUrl ? (
            <img src={imageUrl} alt="" className="w-full h-full object-cover" />
          ) : (
            <div className="w-full h-full flex items-center justify-center text-gray-300">
              <MapPin className="h-3.5 w-3.5" />
            </div>
          )}
        </div>

        {/* Info */}
        <div className="flex-1 min-w-0 text-left">
          <div className="flex items-center gap-1.5">
            <span className="text-[13px] font-semibold text-foreground truncate">
              {building.nome}
            </span>
            {building.codigo_predio && (
              <span className="text-[9px] text-muted-foreground font-mono">
                #{building.codigo_predio}
              </span>
            )}
          </div>
          
          {/* Metrics row */}
          <div className="flex items-center gap-2 mt-0.5 text-[10px] text-muted-foreground">
            <span>{building.bairro}</span>
            <span>•</span>
            {/* Panels */}
            {panelsStatusLoading ? (
              <span className="text-muted-foreground/50">...</span>
            ) : total > 0 ? (
              <span className={online === total ? 'text-green-600' : online > 0 ? 'text-amber-500' : 'text-red-500'}>
                <Monitor className="h-2.5 w-2.5 inline mr-0.5" />
                {online}/{total}
              </span>
            ) : (
              <span className="text-muted-foreground/50">
                <Monitor className="h-2.5 w-2.5 inline mr-0.5" />—
              </span>
            )}
            <span>•</span>
            {/* Videos */}
            <span className={videoCount > 0 ? 'text-green-600' : 'text-muted-foreground/50'}>
              <Video className="h-2.5 w-2.5 inline mr-0.5" />
              {videoCount}
            </span>
            <span>•</span>
            {/* Price */}
            <span className="text-[#9C1E1E] font-medium">{formatPrice(building.preco_base)}</span>
          </div>
        </div>

        {/* Right side */}
        <div className="flex items-center gap-1.5 flex-shrink-0">
          {hasAWS && (
            <span className="text-[8px] bg-blue-100 text-blue-600 px-1 py-0.5 rounded font-medium">
              AWS
            </span>
          )}
          <span className={cn(
            "text-[8px] px-1.5 py-0.5 rounded font-medium",
            isActive ? "bg-green-100 text-green-700" : "bg-gray-100 text-gray-500"
          )}>
            {isActive ? 'ON' : 'OFF'}
          </span>
          <ChevronRight className="h-4 w-4 text-muted-foreground/30" />
        </div>
      </button>

      {/* Bottom Sheet */}
      <Sheet open={showSheet} onOpenChange={setShowSheet}>
        <SheetContent side="bottom" className="rounded-t-3xl max-h-[85vh] overflow-y-auto">
          <SheetHeader className="text-left pb-4">
            <SheetTitle className="flex items-center gap-2">
              <span className="text-lg">{building.nome}</span>
              {building.codigo_predio && (
                <span className="text-xs text-muted-foreground font-mono">#{building.codigo_predio}</span>
              )}
            </SheetTitle>
            <p className="text-xs text-muted-foreground flex items-center gap-1">
              <MapPin className="h-3 w-3" />
              {building.endereco}, {building.bairro}
            </p>
          </SheetHeader>

          {/* Quick Stats */}
          <div className="grid grid-cols-4 gap-2 mb-4">
            <div className="bg-gray-50 rounded-lg p-2 text-center">
              <p className="text-[9px] text-muted-foreground uppercase">Telas</p>
              <p className="text-sm font-bold">{building.quantidade_telas || 0}</p>
            </div>
            <div className="bg-gray-50 rounded-lg p-2 text-center">
              <p className="text-[9px] text-muted-foreground uppercase">Painéis</p>
              <p className={cn(
                "text-sm font-bold",
                total > 0 && online === total ? "text-green-600" : 
                online > 0 ? "text-amber-500" : "text-muted-foreground"
              )}>
                {total > 0 ? `${online}/${total}` : '—'}
              </p>
            </div>
            <div className="bg-gray-50 rounded-lg p-2 text-center">
              <p className="text-[9px] text-muted-foreground uppercase">Vídeos</p>
              <p className={cn("text-sm font-bold", videoCount > 0 ? "text-green-600" : "text-muted-foreground")}>
                {videoCount}
              </p>
            </div>
            <div className="bg-gray-50 rounded-lg p-2 text-center">
              <p className="text-[9px] text-muted-foreground uppercase">Base</p>
              <p className="text-sm font-bold text-[#9C1E1E]">{formatPrice(building.preco_base)}</p>
            </div>
          </div>

          {/* Prices */}
          <div className="bg-green-50 rounded-xl p-3 mb-4">
            <p className="text-[10px] font-medium text-green-700 mb-2">Preços por Mês</p>
            <div className="grid grid-cols-4 gap-2 text-center text-xs">
              <div>
                <p className="text-muted-foreground text-[9px]">Base</p>
                <p className="font-bold text-[#9C1E1E]">{formatPrice(building.preco_base)}</p>
              </div>
              <div>
                <p className="text-muted-foreground text-[9px]">3M</p>
                <p className="font-bold text-[#9C1E1E]">
                  {building.preco_trimestral ? formatPrice(building.preco_trimestral / 3) : '—'}
                </p>
              </div>
              <div>
                <p className="text-muted-foreground text-[9px]">6M</p>
                <p className="font-bold text-[#9C1E1E]">
                  {building.preco_semestral ? formatPrice(building.preco_semestral / 6) : '—'}
                </p>
              </div>
              <div>
                <p className="text-muted-foreground text-[9px]">12M</p>
                <p className="font-bold text-[#9C1E1E]">
                  {building.preco_anual ? formatPrice(building.preco_anual / 12) : '—'}
                </p>
              </div>
            </div>
          </div>

          {/* Actions */}
          <div className="grid grid-cols-2 gap-2 mb-4">
            <Button
              variant="outline"
              size="sm"
              onClick={() => { setShowSheet(false); onView(building); }}
              className="h-10 text-xs"
            >
              <Eye className="h-3.5 w-3.5 mr-1.5" />
              Ver Detalhes
            </Button>
            <Button
              variant="outline"
              size="sm"
              onClick={() => { setShowSheet(false); onEdit(building); }}
              className="h-10 text-xs"
            >
              <Edit className="h-3.5 w-3.5 mr-1.5" />
              Editar
            </Button>
            <Button
              variant="outline"
              size="sm"
              onClick={() => { setShowSheet(false); onImageManager(building); }}
              className="h-10 text-xs"
            >
              <Image className="h-3.5 w-3.5 mr-1.5" />
              Fotos
            </Button>
            {videoCount > 0 && (
              <Button
                variant="outline"
                size="sm"
                onClick={() => { setShowSheet(false); setIsPlaylistOpen(true); }}
                className="h-10 text-xs text-green-600 border-green-200"
              >
                <Video className="h-3.5 w-3.5 mr-1.5" />
                Playlist
              </Button>
            )}
          </div>

          {/* Danger Zone */}
          <Button
            variant="ghost"
            size="sm"
            onClick={() => { setShowSheet(false); onDelete(building); }}
            className="w-full h-9 text-xs text-red-500 hover:text-red-600 hover:bg-red-50"
          >
            <Trash2 className="h-3.5 w-3.5 mr-1.5" />
            Excluir Prédio
          </Button>
        </SheetContent>
      </Sheet>
    </>
  );
};

export default MobileBuildingCardV2;
