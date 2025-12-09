import React from 'react';
import { Building2, MapPin, Tv, Users, Video, MoreVertical, Link2, Eye, Edit, Image, Play, Trash2, ExternalLink } from 'lucide-react';
import { CollapsibleCard } from '@/components/admin/shared/CollapsibleCard';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from '@/components/ui/dropdown-menu';
import { generatePanelPath } from '@/utils/buildingSlugUtils';
import { generatePublicUrl } from '@/config/domain';
import { toast } from 'sonner';
import { BuildingPanelIndicator } from './BuildingPanelIndicator';
import { BuildingPanelsStatus } from '@/hooks/useBuildingPanelsStatus';

interface BuildingMobileCardProps {
  building: any;
  videoCount?: number;
  panelsStatus?: BuildingPanelsStatus;
  panelsStatusLoading?: boolean;
  onView: (building: any) => void;
  onEdit: (building: any) => void;
  onImageManager: (building: any) => void;
  onViewPlaylist: (building: any) => void;
  onDelete?: (building: any) => void;
}

export const BuildingMobileCard: React.FC<BuildingMobileCardProps> = ({
  building,
  videoCount,
  panelsStatus,
  panelsStatusLoading,
  onView,
  onEdit,
  onImageManager,
  onViewPlaylist,
  onDelete,
}) => {
  const getStatusColor = (status: string) => {
    return status === 'ativo' 
      ? 'bg-green-500/10 text-green-600 border-green-500/30' 
      : 'bg-muted text-muted-foreground border-muted-foreground/30';
  };

  const getStatusText = (status: string) => {
    return status === 'ativo' ? 'Ativo' : 'Inativo';
  };

  const handleCopyLink = (type: 'panel' | 'commercial' | 'embed') => {
    const buildingCode = building.codigo_predio || '000';
    let url = '';
    
    if (type === 'panel') {
      url = generatePublicUrl(generatePanelPath(building.nome, buildingCode));
    } else if (type === 'commercial') {
      url = generatePublicUrl(`/predio/${building.id}`);
    } else if (type === 'embed') {
      url = `<iframe src="${generatePublicUrl(generatePanelPath(building.nome, buildingCode))}" width="100%" height="600" frameborder="0"></iframe>`;
    }
    
    navigator.clipboard.writeText(url);
    toast.success('Copiado!', {
      description: type === 'embed' ? 'Código embed copiado' : 'Link copiado para área de transferência',
      duration: 2000,
    });
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

  const preview = (
    <div className="space-y-3">
      {/* Header with name, status badges */}
      <div className="flex items-start justify-between gap-2">
        <div className="flex items-start gap-2 flex-1 min-w-0">
          <Building2 className="h-4 w-4 text-[#9C1E1E] flex-shrink-0 mt-0.5" />
          <div className="flex-1 min-w-0">
            <h3 className="font-semibold text-foreground text-sm truncate">{building.nome}</h3>
            <div className="flex items-center gap-1 mt-0.5">
              <MapPin className="h-3 w-3 text-muted-foreground flex-shrink-0" />
              <span className="text-xs text-muted-foreground truncate">
                {building.bairro}
              </span>
            </div>
          </div>
        </div>
        
        {/* Status badges row */}
        <div className="flex items-center gap-1.5 flex-shrink-0">
          {/* Panel status indicator */}
          <BuildingPanelIndicator 
            panelsStatus={panelsStatus} 
            isLoading={panelsStatusLoading}
            compact
          />
          
          {/* AWS badge */}
          {building.codigo_predio && (
            <Badge variant="outline" className="bg-blue-500/10 text-blue-600 border-blue-500/30 text-[10px] px-1.5">
              <Link2 className="h-2.5 w-2.5 mr-0.5" />
              AWS
            </Badge>
          )}
          
          {/* Building status badge */}
          <Badge className={`${getStatusColor(building.status)} border text-[10px] px-1.5`}>
            {getStatusText(building.status)}
          </Badge>
        </div>
      </div>
      
      {/* Dashboard Stats - Single Row */}
      <div className="grid grid-cols-4 gap-1.5 text-center">
        <div className="bg-muted/50 rounded-lg py-1.5 px-1">
          <p className="text-[9px] text-muted-foreground uppercase">Telas</p>
          <p className="font-bold text-base text-foreground">{building.quantidade_telas || 0}</p>
        </div>
        <div className="bg-muted/50 rounded-lg py-1.5 px-1">
          <p className="text-[9px] text-muted-foreground uppercase">Público</p>
          <p className="font-bold text-base text-foreground">{(building.publico_estimado || 0).toLocaleString()}</p>
        </div>
        <div className="bg-muted/50 rounded-lg py-1.5 px-1">
          <p className="text-[9px] text-muted-foreground uppercase">Views/Mês</p>
          <p className="font-bold text-base text-foreground">{formatViews(building.visualizacoes_mes)}</p>
        </div>
        <div className="bg-muted/50 rounded-lg py-1.5 px-1">
          <p className="text-[9px] text-muted-foreground uppercase">Vendas</p>
          <p className="font-bold text-base text-foreground">{videoCount || 0}</p>
        </div>
      </div>
    </div>
  );

  const expandedContent = (
    <div className="space-y-3" onClick={(e) => e.stopPropagation()}>
      {/* Prices Grid - Green Section */}
      <div className="bg-green-50 border border-green-200 rounded-lg p-3">
        <div className="flex items-center gap-1.5 mb-2">
          <span className="text-green-600 font-bold">$</span>
          <p className="text-sm font-semibold text-green-700">Preços por Mês</p>
        </div>
        <div className="grid grid-cols-4 gap-2 text-center">
          <div>
            <p className="text-[10px] text-muted-foreground font-medium uppercase">Base</p>
            <p className="font-bold text-sm text-[#9C1E1E]">{formatPrice(building.preco_base)}</p>
          </div>
          <div>
            <p className="text-[10px] text-muted-foreground font-medium uppercase">3 Meses</p>
            <p className="font-bold text-sm text-[#9C1E1E]">{getMonthlyPrice(building.preco_trimestral, 3)}</p>
          </div>
          <div>
            <p className="text-[10px] text-muted-foreground font-medium uppercase">6 Meses</p>
            <p className="font-bold text-sm text-[#9C1E1E]">{getMonthlyPrice(building.preco_semestral, 6)}</p>
          </div>
          <div>
            <p className="text-[10px] text-muted-foreground font-medium uppercase">12 Meses</p>
            <p className="font-bold text-sm text-[#9C1E1E]">{getMonthlyPrice(building.preco_anual, 12)}</p>
          </div>
        </div>
      </div>

      {/* Address */}
      <div className="bg-muted/30 rounded-lg p-3">
        <p className="text-xs font-medium text-muted-foreground mb-1">Endereço</p>
        <p className="text-sm text-foreground">{building.endereco}</p>
        <p className="text-xs text-muted-foreground mt-0.5">
          {building.bairro} - {building.cidade || 'Foz do Iguaçu'}
        </p>
      </div>

      {/* Building details grid */}
      <div className="grid grid-cols-3 gap-2">
        {building.quantidade_telas && (
          <div className="bg-muted/30 rounded-lg p-2 text-center">
            <p className="text-[10px] text-muted-foreground">Painéis</p>
            <p className="font-bold text-lg text-foreground">{building.quantidade_telas}</p>
          </div>
        )}
        {building.numero_elevadores && (
          <div className="bg-muted/30 rounded-lg p-2 text-center">
            <p className="text-[10px] text-muted-foreground">Elevadores</p>
            <p className="font-bold text-lg text-foreground">{building.numero_elevadores}</p>
          </div>
        )}
        {building.publico_estimado && (
          <div className="bg-muted/30 rounded-lg p-2 text-center">
            <p className="text-[10px] text-muted-foreground">Público</p>
            <p className="font-bold text-lg text-foreground">{building.publico_estimado.toLocaleString()}</p>
          </div>
        )}
      </div>

      {/* Panel devices status if multiple */}
      {panelsStatus && panelsStatus.totalPanels > 0 && (
        <div className="bg-muted/30 rounded-lg p-3">
          <p className="text-xs font-medium text-muted-foreground mb-2">
            Status dos Painéis ({panelsStatus.onlineCount}/{panelsStatus.totalPanels} online)
          </p>
          <div className="space-y-1.5">
            {panelsStatus.devices.map((device) => (
              <div
                key={device.id}
                className="flex items-center justify-between p-2 rounded bg-background/50"
              >
                <div className="flex items-center gap-2">
                  <span
                    className={`h-2 w-2 rounded-full ${
                      device.status === 'online' ? 'bg-green-500' : 'bg-red-500'
                    }`}
                  />
                  <span className="text-xs font-medium">{device.name}</span>
                </div>
                <span className={`text-xs ${device.status === 'online' ? 'text-green-600' : 'text-red-600'}`}>
                  {device.status === 'online' ? 'Online' : 'Offline'}
                </span>
              </div>
            ))}
          </div>
        </div>
      )}

      {/* Primary Actions */}
      <div className="pt-2 border-t space-y-2">
        <div className="grid grid-cols-2 gap-2">
          <Button
            variant="outline"
            size="sm"
            onClick={() => onView(building)}
            className="w-full text-xs h-9"
          >
            <Eye className="h-3 w-3 mr-1" />
            Detalhes
          </Button>
          <Button
            variant="outline"
            size="sm"
            onClick={() => onEdit(building)}
            className="w-full text-xs h-9"
          >
            <Edit className="h-3 w-3 mr-1" />
            Editar
          </Button>
        </div>
        
        <div className="grid grid-cols-2 gap-2">
          <Button
            variant="outline"
            size="sm"
            onClick={() => onImageManager(building)}
            className="w-full text-xs h-9"
          >
            <Image className="h-3 w-3 mr-1" />
            Fotos
          </Button>
          <Button
            variant="default"
            size="sm"
            onClick={() => onViewPlaylist(building)}
            className="w-full bg-[#9C1E1E] hover:bg-[#7A1818] text-white text-xs h-9"
          >
            <Play className="h-3 w-3 mr-1" />
            Playlist
          </Button>
        </div>
      </div>

      {/* Secondary Actions Dropdown */}
      <div className="pt-2 border-t">
        <DropdownMenu>
          <DropdownMenuTrigger asChild>
            <Button variant="outline" size="sm" className="w-full text-xs h-9">
              <MoreVertical className="h-3 w-3 mr-1" />
              Mais Ações
            </Button>
          </DropdownMenuTrigger>
          <DropdownMenuContent align="center" className="w-48">
            <DropdownMenuItem onClick={() => handleCopyLink('panel')}>
              <Link2 className="h-4 w-4 mr-2" />
              Copiar Link Painel
            </DropdownMenuItem>
            <DropdownMenuItem onClick={() => handleCopyLink('commercial')}>
              <ExternalLink className="h-4 w-4 mr-2" />
              Copiar Link Comercial
            </DropdownMenuItem>
            <DropdownMenuItem onClick={() => handleCopyLink('embed')}>
              <ExternalLink className="h-4 w-4 mr-2" />
              Copiar Embed
            </DropdownMenuItem>
            <DropdownMenuSeparator />
            <DropdownMenuItem 
              onClick={() => {
                const url = generatePublicUrl(generatePanelPath(building.nome, building.codigo_predio || '000'));
                window.open(url, '_blank');
              }}
            >
              <ExternalLink className="h-4 w-4 mr-2" />
              Abrir Painel
            </DropdownMenuItem>
            {onDelete && (
              <>
                <DropdownMenuSeparator />
                <DropdownMenuItem 
                  onClick={() => onDelete(building)}
                  className="text-red-600 focus:text-red-600"
                >
                  <Trash2 className="h-4 w-4 mr-2" />
                  Excluir
                </DropdownMenuItem>
              </>
            )}
          </DropdownMenuContent>
        </DropdownMenu>
      </div>
    </div>
  );

  return (
    <CollapsibleCard
      preview={preview}
      borderColor="border-l-[#9C1E1E]"
      className="shadow-md hover:shadow-lg transition-shadow bg-white/80 backdrop-blur-sm"
    >
      {expandedContent}
    </CollapsibleCard>
  );
};
