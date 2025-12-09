import React, { useState } from 'react';
import { Card, CardContent } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { Eye, Edit, Image, MapPin, Monitor, DollarSign, Video, Play, Hash, Link2 } from 'lucide-react';
import { supabase } from '@/integrations/supabase/client';
import { Building } from '@/services/buildingsDataService';
import { BuildingVideoPlaylistPreview } from './BuildingVideoPlaylistPreview';
import BuildingPanelStatusBadge from './BuildingPanelStatusBadge';
import BuildingActionsDropdown from './BuildingActionsDropdown';
import { DeviceStatus } from '@/hooks/useBuildingDeviceStatus';

interface AdminBuildingCardProps {
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

const AdminBuildingCard: React.FC<AdminBuildingCardProps> = ({
  building,
  onView,
  onEdit,
  onImageManager,
  onDelete,
  videoCount
}) => {
  const [isPlaylistModalOpen, setIsPlaylistModalOpen] = useState(false);

  const getImageUrl = (path: string) => {
    if (!path) return null;
    if (path.startsWith('http')) return path;
    return `${supabase.storage.from('building-images').getPublicUrl(path).data.publicUrl}`;
  };

  // Status do prédio (exposição pública) - MANUAL
  const getBuildingStatusBadge = (status: string) => {
    switch (status) {
      case 'ativo':
        return <Badge className="bg-green-500/90 text-white text-xs">Ativo</Badge>;
      case 'manutenção':
        return <Badge className="bg-orange-500/90 text-white text-xs">Manutenção</Badge>;
      case 'instalação':
        return <Badge className="bg-blue-500/90 text-white text-xs">Instalação</Badge>;
      default:
        return <Badge className="bg-gray-500/90 text-white text-xs">Inativo</Badge>;
    }
  };

  // Verificar se tem conexão AWS (codigo_predio configurado)
  const hasAWSConnection = Boolean(building.codigo_predio);

  // Status do device (painel físico) - AUTOMÁTICO
  const deviceStatus: DeviceStatus = building.device_status || 'not_connected';
  const deviceId = building.device_id || null;

  const formatPrice = (value: number | null | undefined) => {
    if (!value) return '—';
    return new Intl.NumberFormat('pt-BR', {
      style: 'currency',
      currency: 'BRL',
      minimumFractionDigits: 0,
      maximumFractionDigits: 0
    }).format(value);
  };

  return (
    <>
      <BuildingVideoPlaylistPreview
        buildingId={building.id}
        buildingName={building.nome}
        buildingCode={building.codigo_predio || '000'}
        isOpen={isPlaylistModalOpen}
        onClose={() => setIsPlaylistModalOpen(false)}
      />

      <Card className="bg-white/80 backdrop-blur-sm border border-gray-200/60 shadow-md hover:shadow-lg transition-all duration-300 rounded-2xl overflow-hidden">
        <CardContent className="p-0">
          <div className="flex flex-col lg:flex-row">
            {/* Image Section */}
            <div className="lg:w-48 xl:w-56 flex-shrink-0">
              <div className="aspect-[4/3] lg:aspect-square bg-gray-100 relative">
                {building.imagem_principal ? (
                  <img
                    src={getImageUrl(building.imagem_principal)}
                    alt={building.nome}
                    className="w-full h-full object-cover"
                  />
                ) : (
                  <div className="w-full h-full flex items-center justify-center text-gray-400">
                    <Image className="h-8 w-8" />
                  </div>
                )}

                {/* Video count overlay */}
                {typeof videoCount === 'number' && videoCount > 0 && (
                  <button
                    type="button"
                    onClick={(e) => {
                      e.preventDefault();
                      e.stopPropagation();
                      setIsPlaylistModalOpen(true);
                    }}
                    className="absolute bottom-2 left-2 right-2 bg-slate-900/90 backdrop-blur-sm rounded-lg px-3 py-2 flex items-center gap-2 hover:bg-slate-800/90 transition-colors"
                  >
                    <div className="relative">
                      <div className="absolute inset-0 bg-red-500/30 rounded-full animate-ping" />
                      <Video className="h-4 w-4 text-white relative" />
                    </div>
                    <span className="text-white text-xs font-medium flex-1 text-left">
                      {videoCount} {videoCount === 1 ? 'vídeo' : 'vídeos'} ao vivo
                    </span>
                    <Play className="h-3 w-3 text-white/70" />
                  </button>
                )}
              </div>
            </div>

            {/* Content Section */}
            <div className="flex-1 p-4 lg:p-5">
              {/* Header */}
              <div className="flex items-start justify-between gap-3 mb-3">
                <div className="flex-1 min-w-0">
                  <div className="flex items-center gap-2 flex-wrap mb-1">
                    <h3 className="text-lg font-bold text-gray-900 truncate">{building.nome}</h3>
                    {building.codigo_predio && (
                      <Badge variant="outline" className="text-[10px] font-mono bg-slate-100 border-slate-300 text-slate-600 px-1.5 py-0">
                        <Hash className="h-2.5 w-2.5 mr-0.5" />
                        {building.codigo_predio}
                      </Badge>
                    )}
                  </div>
                  <div className="flex items-center text-gray-500 text-sm">
                    <MapPin className="h-3.5 w-3.5 mr-1 flex-shrink-0" />
                    <span className="truncate">{building.endereco}, {building.bairro}</span>
                  </div>
                </div>

                {/* Status Badges */}
                <div className="flex flex-col items-end gap-1.5 flex-shrink-0">
                  {/* Status do Prédio (exposição pública) - MANUAL */}
                  {getBuildingStatusBadge(building.status)}
                  
                  {/* Status do Painel (device) - AUTOMÁTICO */}
                  <BuildingPanelStatusBadge
                    deviceId={deviceId}
                    status={deviceStatus}
                    showOutageHistory={true}
                  />

                  {/* AWS Connection Badge */}
                  {hasAWSConnection && (
                    <Badge variant="outline" className="text-[10px] bg-blue-50 text-blue-600 border-blue-200">
                      <Link2 className="h-2.5 w-2.5 mr-1" />
                      AWS
                    </Badge>
                  )}
                </div>
              </div>

              {/* Metrics Grid */}
              <div className="grid grid-cols-4 gap-2 mb-4">
                <div className="bg-gray-50 rounded-lg p-2 text-center">
                  <div className="text-xs text-gray-500">Telas</div>
                  <div className="font-bold text-gray-900">{building.numero_elevadores || 0}</div>
                </div>
                <div className="bg-gray-50 rounded-lg p-2 text-center">
                  <div className="text-xs text-gray-500">Público</div>
                  <div className="font-bold text-gray-900">{building.publico_estimado || '—'}</div>
                </div>
                <div className="bg-gray-50 rounded-lg p-2 text-center">
                  <div className="text-xs text-gray-500">Views/Mês</div>
                  <div className="font-bold text-gray-900">
                    {((building.visualizacoes_mes || 0) / 1000).toFixed(0)}k
                  </div>
                </div>
                <div className="bg-gray-50 rounded-lg p-2 text-center">
                  <div className="text-xs text-gray-500">Vendas</div>
                  <div className="font-bold text-gray-900">{building.vendas_mes_atual || 0}</div>
                </div>
              </div>

              {/* Prices Grid */}
              <div className="bg-gradient-to-r from-emerald-50 to-green-50 rounded-xl p-3 mb-4 border border-green-100">
                <div className="flex items-center gap-1.5 mb-2">
                  <DollarSign className="h-3.5 w-3.5 text-green-600" />
                  <span className="text-xs font-medium text-green-700">Preços por Mês</span>
                </div>
                <div className="grid grid-cols-4 gap-2 text-center">
                  <div>
                    <div className="text-[10px] text-gray-500 uppercase">Base</div>
                    <div className="text-sm font-bold text-green-700">{formatPrice(building.preco_base)}</div>
                  </div>
                  <div>
                    <div className="text-[10px] text-gray-500 uppercase">3 meses</div>
                    <div className="text-sm font-bold text-green-700">{formatPrice(building.preco_trimestral)}</div>
                  </div>
                  <div>
                    <div className="text-[10px] text-gray-500 uppercase">6 meses</div>
                    <div className="text-sm font-bold text-green-700">{formatPrice(building.preco_semestral)}</div>
                  </div>
                  <div>
                    <div className="text-[10px] text-gray-500 uppercase">12 meses</div>
                    <div className="text-sm font-bold text-green-700">{formatPrice(building.preco_anual)}</div>
                  </div>
                </div>
              </div>

              {/* Actions */}
              <div className="flex items-center gap-2 flex-wrap">
                <Button
                  variant="outline"
                  size="sm"
                  onClick={() => onView(building)}
                  className="h-8 text-xs"
                >
                  <Eye className="h-3.5 w-3.5 mr-1" />
                  Ver
                </Button>
                <Button
                  variant="outline"
                  size="sm"
                  onClick={() => onEdit(building)}
                  className="h-8 text-xs"
                >
                  <Edit className="h-3.5 w-3.5 mr-1" />
                  Editar
                </Button>
                <Button
                  variant="outline"
                  size="sm"
                  onClick={() => onImageManager(building)}
                  className="h-8 text-xs"
                >
                  <Image className="h-3.5 w-3.5 mr-1" />
                  Fotos
                </Button>

                <div className="ml-auto">
                  <BuildingActionsDropdown
                    buildingName={building.nome}
                    buildingCode={building.codigo_predio || '000'}
                    onDelete={() => onDelete(building)}
                  />
                </div>
              </div>
            </div>
          </div>
        </CardContent>
      </Card>
    </>
  );
};

export default AdminBuildingCard;
