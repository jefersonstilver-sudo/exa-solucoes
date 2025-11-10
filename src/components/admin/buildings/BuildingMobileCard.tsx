import React from 'react';
import { Building2, MapPin, Tv, Users, Video } from 'lucide-react';
import { CollapsibleCard } from '@/components/admin/shared/CollapsibleCard';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { generatePanelPath } from '@/utils/buildingSlugUtils';
import { generatePublicUrl } from '@/config/domain';

interface BuildingMobileCardProps {
  building: any;
  videoCount?: number;
  onView: (building: any) => void;
  onEdit: (building: any) => void;
  onImageManager: (building: any) => void;
  onViewPlaylist: (building: any) => void;
}

export const BuildingMobileCard: React.FC<BuildingMobileCardProps> = ({
  building,
  videoCount,
  onView,
  onEdit,
  onImageManager,
  onViewPlaylist,
}) => {
  const getStatusColor = (status: string) => {
    return status === 'ativo' ? 'bg-green-50 text-green-700 border-green-200' : 'bg-gray-50 text-gray-700 border-gray-200';
  };

  const getStatusText = (status: string) => {
    return status === 'ativo' ? 'Ativo' : 'Inativo';
  };

  const preview = (
    <div className="space-y-3">
      <div className="flex items-start justify-between gap-3">
        <div className="flex items-start gap-2 flex-1 min-w-0">
          <Building2 className="h-5 w-5 text-[#9C1E1E] flex-shrink-0 mt-0.5" />
          <div className="flex-1 min-w-0">
            <h3 className="font-semibold text-foreground text-base truncate">{building.nome}</h3>
            <div className="flex items-center gap-1 mt-1">
              <MapPin className="h-3 w-3 text-muted-foreground flex-shrink-0" />
              <span className="text-xs text-muted-foreground truncate">
                {building.bairro}, {building.cidade}
              </span>
            </div>
          </div>
        </div>
        <Badge className={`${getStatusColor(building.status)} border flex-shrink-0`}>
          {getStatusText(building.status)}
        </Badge>
      </div>
      
      <div className="flex items-center gap-3 flex-wrap">
        {building.quantidade_telas && (
          <div className="flex items-center gap-1 px-2 py-1 bg-muted/50 rounded">
            <Tv className="h-3 w-3 text-[#9C1E1E]" />
            <span className="text-xs font-medium">{building.quantidade_telas} painéis</span>
          </div>
        )}
        {building.publico_estimado && (
          <div className="flex items-center gap-1 px-2 py-1 bg-muted/50 rounded">
            <Users className="h-3 w-3 text-[#9C1E1E]" />
            <span className="text-xs font-medium">{building.publico_estimado.toLocaleString()}</span>
          </div>
        )}
        {typeof videoCount === 'number' && videoCount > 0 && (
          <div className="flex items-center gap-1 px-2 py-1 bg-green-50 border border-green-200 rounded text-green-700">
            <Video className="h-3 w-3" />
            <span className="font-medium text-xs">{videoCount} no AR</span>
          </div>
        )}
      </div>
    </div>
  );

  const expandedContent = (
    <div className="space-y-3" onClick={(e) => e.stopPropagation()}>
      {/* Building Details */}
      <div className="space-y-3">
        <div className="bg-muted/30 rounded-lg p-3">
          <p className="text-xs font-medium text-muted-foreground mb-1">Endereço</p>
          <p className="text-sm text-foreground font-medium">{building.endereco}</p>
          <p className="text-xs text-muted-foreground mt-1">
            {building.bairro} - {building.cidade}/{building.estado} • CEP: {building.cep}
          </p>
        </div>

        {building.codigo_predio && (
          <div className="bg-muted/30 rounded-lg p-3">
            <p className="text-xs font-medium text-muted-foreground mb-1">Código do Prédio</p>
            <p className="font-mono font-semibold text-foreground text-sm">{building.codigo_predio}</p>
          </div>
        )}

        <div className="grid grid-cols-2 gap-2">
          {building.quantidade_telas && (
            <div className="bg-muted/30 rounded-lg p-3">
              <p className="text-xs text-muted-foreground">Painéis</p>
              <p className="font-semibold text-foreground text-lg">{building.quantidade_telas}</p>
            </div>
          )}
          {building.numero_elevadores && (
            <div className="bg-muted/30 rounded-lg p-3">
              <p className="text-xs text-muted-foreground">Elevadores</p>
              <p className="font-semibold text-foreground text-lg">{building.numero_elevadores}</p>
            </div>
          )}
          {building.towers && (
            <div className="bg-muted/30 rounded-lg p-3">
              <p className="text-xs text-muted-foreground">Torres</p>
              <p className="font-semibold text-foreground text-lg">{building.towers}</p>
            </div>
          )}
          {building.apartments && (
            <div className="bg-muted/30 rounded-lg p-3">
              <p className="text-xs text-muted-foreground">Apartamentos</p>
              <p className="font-semibold text-foreground text-lg">{building.apartments}</p>
            </div>
          )}
        </div>

        {building.publico_estimado && (
          <div className="bg-muted/30 rounded-lg p-3">
            <p className="text-xs font-medium text-muted-foreground mb-1">Público Estimado (mensal)</p>
            <p className="font-semibold text-foreground text-lg">
              {building.publico_estimado.toLocaleString()} pessoas
            </p>
          </div>
        )}
      </div>

      {/* Actions */}
      <div className="pt-2 border-t space-y-2">
        <div className="grid grid-cols-2 gap-2">
          <Button
            variant="outline"
            size="sm"
            onClick={() => onView(building)}
            className="w-full text-xs h-9"
          >
            Ver Detalhes
          </Button>
          <Button
            variant="outline"
            size="sm"
            onClick={() => onEdit(building)}
            className="w-full text-xs h-9"
          >
            Editar Prédio
          </Button>
        </div>
        
        <Button
          variant="outline"
          size="sm"
          onClick={() => onImageManager(building)}
          className="w-full text-xs h-9"
        >
          Gerenciar Imagens
        </Button>
        
        <Button
          variant="default"
          size="sm"
          onClick={() => onViewPlaylist(building)}
          className="w-full bg-[#9C1E1E] hover:bg-[#7A1818] text-white text-xs h-9"
        >
          Ver Playlist de Vídeos
        </Button>
        
        <div className="pt-2 border-t">
          <p className="text-xs font-medium text-muted-foreground mb-2">Links de Acesso</p>
          <div className="space-y-2">
            <Button
              variant="outline"
              size="sm"
              onClick={() => {
                const buildingCode = building.codigo_predio || '000';
                const url = generatePublicUrl(generatePanelPath(building.nome, buildingCode));
                navigator.clipboard.writeText(url);
                import('sonner').then(({ toast }) => {
                  toast.success('Link copiado!', {
                    description: 'Link do painel copiado',
                    duration: 3000,
                  });
                });
              }}
              className="w-full text-xs h-9"
            >
              📋 Copiar Link do Painel
            </Button>
          </div>
        </div>
      </div>
    </div>
  );

  return (
    <CollapsibleCard
      preview={preview}
      borderColor="border-[#9C1E1E]"
      className="shadow-md hover:shadow-lg transition-shadow"
    >
      {expandedContent}
    </CollapsibleCard>
  );
};
