import React, { useState } from 'react';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { 
  Eye, Edit, Image, MapPin, Monitor, Video, Play, Hash, Link2, 
  MoreHorizontal, Trash2, ExternalLink, List, RefreshCw
} from 'lucide-react';
import { toast } from 'sonner';
import { syncBuildingWithExternalAPI } from '@/services/buildingSyncService';
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from '@/components/ui/dropdown-menu';
import { supabase } from '@/integrations/supabase/client';
import { Building } from '@/services/buildingsDataService';
import { BuildingVideoPlaylistPreview } from '../BuildingVideoPlaylistPreview';
import BuildingPanelStatusBadge from '../BuildingPanelStatusBadge';
import { DeviceStatus } from '@/hooks/useBuildingDeviceStatus';

interface BuildingCard3Props {
  building: Building & {
    device_id?: string | null;
    device_status?: DeviceStatus;
    device_last_online_at?: string | null;
  };
  onView: (building: Building) => void;
  onEdit: (building: Building) => void;
  onImageManager: (building: Building) => void;
  onDelete: (building: Building) => void;
  onViewCampaigns?: (building: Building) => void;
  onViewPlaylist?: (building: Building) => void;
  videoCount?: number;
}

const BuildingCard3: React.FC<BuildingCard3Props> = ({
  building,
  onView,
  onEdit,
  onImageManager,
  onDelete,
  videoCount = 0
}) => {
  const [syncing, setSyncing] = useState(false);

  const handleSyncAPI = async (e: React.MouseEvent) => {
    e.stopPropagation();
    setSyncing(true);
    try {
      const result = await syncBuildingWithExternalAPI(building.id);
      if (result.totalOrders === 0) {
        toast.info('Nenhum pedido ativo encontrado para este prédio');
      } else if (result.failed === 0) {
        toast.success(`Sync concluído! ${result.synced} pedido(s) sincronizado(s)`);
      } else {
        toast.warning(`Sync parcial: ${result.synced} OK, ${result.failed} erro(s)`);
      }
    } catch (err: any) {
      toast.error(`Erro ao sincronizar: ${err.message}`);
    } finally {
      setSyncing(false);
    }
  };

  const getImageUrl = (path: string) => {
    if (!path) return null;
    if (path.startsWith('http')) return path;
    return `${supabase.storage.from('building-images').getPublicUrl(path).data.publicUrl}`;
  };

  const getStatusColor = (status: string) => {
    switch (status) {
      case 'ativo': return 'bg-emerald-500/90 text-white';
      case 'manutenção': return 'bg-amber-500/90 text-white';
      case 'instalação': return 'bg-blue-500/90 text-white';
      default: return 'bg-gray-400/90 text-white';
    }
  };

  const formatPrice = (value: number | null | undefined) => {
    if (!value) return '—';
    return new Intl.NumberFormat('pt-BR', {
      style: 'currency',
      currency: 'BRL',
      minimumFractionDigits: 0,
      maximumFractionDigits: 0
    }).format(value);
  };

  const getMonthlyPrice = (totalPrice: number | null | undefined, months: number) => {
    if (!totalPrice) return '—';
    return formatPrice(totalPrice / months);
  };

  const hasAWSConnection = Boolean(building.codigo_predio);
  const deviceStatus: DeviceStatus = building.device_status || 'not_connected';
  const deviceId = building.device_id || null;

  return (
    <>
      <BuildingVideoPlaylistPreview
        buildingId={building.id}
        buildingName={building.nome}
        buildingCode={building.codigo_predio || '000'}
        isOpen={isPlaylistModalOpen}
        onClose={() => setIsPlaylistModalOpen(false)}
      />

      <div className="group bg-white/80 backdrop-blur-sm border border-gray-100 rounded-2xl p-4 hover:shadow-lg hover:scale-[1.01] transition-all duration-300 ease-out">
        <div className="flex gap-4">
          {/* Thumbnail compacto */}
          <div className="relative w-20 h-20 flex-shrink-0 rounded-xl overflow-hidden bg-gray-100">
            {building.imagem_principal ? (
              <img
                src={getImageUrl(building.imagem_principal) || ''}
                alt={building.nome}
                className="w-full h-full object-cover"
              />
            ) : (
              <div className="w-full h-full flex items-center justify-center text-gray-300">
                <Image className="h-6 w-6" />
              </div>
            )}
            
            {/* Video badge overlay */}
            {videoCount > 0 && (
              <button
                onClick={(e) => {
                  e.stopPropagation();
                  setIsPlaylistModalOpen(true);
                }}
                className="absolute inset-0 bg-black/60 flex items-center justify-center opacity-0 group-hover:opacity-100 transition-opacity"
              >
                <div className="flex items-center gap-1 text-white text-xs font-medium">
                  <Video className="h-3 w-3" />
                  {videoCount}
                </div>
              </button>
            )}
          </div>

          {/* Content */}
          <div className="flex-1 min-w-0">
            {/* Header row */}
            <div className="flex items-start justify-between gap-2 mb-2">
              <div className="min-w-0">
                <div className="flex items-center gap-2 flex-wrap">
                  <h3 className="text-sm font-semibold text-gray-900 truncate">{building.nome}</h3>
                  {building.codigo_predio && (
                    <Badge variant="outline" className="text-[9px] font-mono px-1.5 py-0 h-4 bg-slate-50 border-slate-200">
                      <Hash className="h-2 w-2 mr-0.5" />
                      {building.codigo_predio}
                    </Badge>
                  )}
                </div>
                <div className="flex items-center text-gray-500 text-xs mt-0.5">
                  <MapPin className="h-3 w-3 mr-1 flex-shrink-0" />
                  <span className="truncate">{building.bairro}</span>
                </div>
              </div>

              {/* Status badges */}
              <div className="flex items-center gap-1.5 flex-shrink-0">
                <Badge className={`${getStatusColor(building.status)} text-[10px] px-1.5 py-0 h-5`}>
                  {building.status}
                </Badge>
                <BuildingPanelStatusBadge
                  deviceId={deviceId}
                  status={deviceStatus}
                  buildingStatus={building.status}
                  showOutageHistory={true}
                />
                {hasAWSConnection && (
                  <Badge 
                    variant="outline" 
                    className="text-[9px] bg-blue-50 text-blue-600 border-blue-200 px-1 py-0 h-4 cursor-pointer hover:bg-blue-100 transition-colors"
                    onClick={(e) => {
                      e.stopPropagation();
                      window.open(`/predio/${building.id}`, '_blank');
                    }}
                    title="Abrir página pública do prédio"
                  >
                    <Link2 className="h-2 w-2" />
                  </Badge>
                )}
              </div>
            </div>

            {/* Metrics inline */}
            <div className="flex items-center gap-3 text-xs text-gray-600 mb-3">
              <span className="flex items-center gap-1">
                <Monitor className="h-3 w-3 text-gray-400" />
                {building.numero_elevadores || 0} telas
              </span>
              <span>•</span>
              <span>{building.publico_estimado || 0} pessoas</span>
              <span>•</span>
              <span className={videoCount > 0 ? 'text-emerald-600 font-medium' : 'text-gray-400'}>
                {videoCount > 0 ? `${videoCount} ao vivo` : '0 vídeos'}
              </span>
            </div>

            {/* Prices row */}
            <div className="flex items-center gap-2 bg-gradient-to-r from-emerald-50/80 to-green-50/80 rounded-lg px-3 py-2 mb-3">
              <div className="flex-1 grid grid-cols-4 gap-2 text-center">
                <div>
                  <div className="text-[9px] text-gray-500 uppercase">1M</div>
                  <div className="text-xs font-bold text-emerald-700">{formatPrice(building.preco_base)}</div>
                </div>
                <div>
                  <div className="text-[9px] text-gray-500 uppercase">3M</div>
                  <div className="text-xs font-bold text-emerald-700">{getMonthlyPrice(building.preco_trimestral, 3)}</div>
                </div>
                <div>
                  <div className="text-[9px] text-gray-500 uppercase">6M</div>
                  <div className="text-xs font-bold text-emerald-700">{getMonthlyPrice(building.preco_semestral, 6)}</div>
                </div>
                <div>
                  <div className="text-[9px] text-gray-500 uppercase">12M</div>
                  <div className="text-xs font-bold text-emerald-700">{getMonthlyPrice(building.preco_anual, 12)}</div>
                </div>
              </div>
            </div>

            {/* Actions */}
            <div className="flex items-center gap-1.5">
              <Button
                variant="ghost"
                size="sm"
                onClick={() => onView(building)}
                className="h-7 px-2 text-xs hover:bg-gray-100"
              >
                <Eye className="h-3 w-3 mr-1" />
                Ver
              </Button>
              <Button
                variant="ghost"
                size="sm"
                onClick={() => onEdit(building)}
                className="h-7 px-2 text-xs hover:bg-gray-100"
              >
                <Edit className="h-3 w-3 mr-1" />
                Editar
              </Button>
              <Button
                variant="ghost"
                size="sm"
                onClick={() => onImageManager(building)}
                className="h-7 px-2 text-xs hover:bg-gray-100"
              >
                <Image className="h-3 w-3 mr-1" />
                Fotos
              </Button>
              
              {videoCount > 0 && (
                <Button
                  variant="ghost"
                  size="sm"
                  onClick={() => setIsPlaylistModalOpen(true)}
                  className="h-7 px-2 text-xs text-emerald-600 hover:bg-emerald-50"
                >
                  <Play className="h-3 w-3 mr-1" />
                  Playlist
                </Button>
              )}

              <DropdownMenu>
                <DropdownMenuTrigger asChild>
                  <Button variant="ghost" size="sm" className="h-7 w-7 p-0 ml-auto">
                    <MoreHorizontal className="h-4 w-4" />
                  </Button>
                </DropdownMenuTrigger>
                <DropdownMenuContent align="end" className="w-48 bg-white">
                  <DropdownMenuItem onClick={() => onView(building)}>
                    <ExternalLink className="h-3.5 w-3.5 mr-2" />
                    Ver detalhes
                  </DropdownMenuItem>
                  <DropdownMenuItem onClick={() => setIsPlaylistModalOpen(true)}>
                    <List className="h-3.5 w-3.5 mr-2" />
                    Ver playlist
                  </DropdownMenuItem>
                  <DropdownMenuItem onClick={() => window.open(`/predio/${building.id}`, '_blank')}>
                    <Link2 className="h-3.5 w-3.5 mr-2" />
                    Link Público
                  </DropdownMenuItem>
                  <DropdownMenuSeparator />
                  <DropdownMenuItem 
                    onClick={() => onDelete(building)}
                    className="text-red-600 focus:text-red-600"
                  >
                    <Trash2 className="h-3.5 w-3.5 mr-2" />
                    Deletar prédio
                  </DropdownMenuItem>
                </DropdownMenuContent>
              </DropdownMenu>
            </div>
          </div>
        </div>
      </div>
    </>
  );
};

export default BuildingCard3;
