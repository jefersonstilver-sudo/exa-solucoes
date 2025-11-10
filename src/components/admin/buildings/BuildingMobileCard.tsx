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
    return status === 'ativo' ? 'bg-green-500' : 'bg-gray-500';
  };

  const getStatusText = (status: string) => {
    return status === 'ativo' ? 'Ativo' : 'Inativo';
  };

  const preview = (
    <>
      <div className="flex items-center justify-between">
        <div className="flex items-center gap-2">
          <Building2 className="h-5 w-5 text-[#9C1E1E] flex-shrink-0" />
          <span className="font-semibold text-foreground truncate">{building.nome}</span>
        </div>
        <Badge className={`${getStatusColor(building.status)} text-white border-0`}>
          {getStatusText(building.status)}
        </Badge>
      </div>
      <div className="flex items-center gap-2">
        <MapPin className="h-4 w-4 text-muted-foreground flex-shrink-0" />
        <span className="text-sm text-muted-foreground truncate">
          {building.bairro}, {building.cidade}
        </span>
      </div>
      <div className="flex items-center gap-4 text-sm flex-wrap">
        {building.quantidade_telas && (
          <div className="flex items-center gap-1">
            <Tv className="h-4 w-4 text-[#9C1E1E]" />
            <span className="font-medium">{building.quantidade_telas} painéis</span>
          </div>
        )}
        {building.publico_estimado && (
          <div className="flex items-center gap-1">
            <Users className="h-4 w-4 text-[#9C1E1E]" />
            <span className="font-medium">{building.publico_estimado.toLocaleString()}</span>
          </div>
        )}
        {typeof videoCount === 'number' && videoCount > 0 && (
          <div className="flex items-center gap-1 px-2 py-0.5 bg-green-600 rounded text-white">
            <Video className="h-3 w-3" />
            <span className="font-semibold text-xs">{videoCount} no AR</span>
          </div>
        )}
      </div>
    </>
  );

  const expandedContent = (
    <div className="space-y-4" onClick={(e) => e.stopPropagation()}>
      {/* Building Details */}
      <div className="space-y-2">
        <div>
          <p className="text-xs text-muted-foreground">Endereço Completo</p>
          <p className="text-sm text-foreground">{building.endereco}</p>
          <p className="text-sm text-muted-foreground">
            {building.bairro} - {building.cidade}/{building.estado}
          </p>
          <p className="text-sm text-muted-foreground">CEP: {building.cep}</p>
        </div>

        {building.codigo_predio && (
          <div>
            <p className="text-xs text-muted-foreground">Código do Prédio</p>
            <p className="font-mono font-semibold text-foreground">{building.codigo_predio}</p>
          </div>
        )}

        <div className="grid grid-cols-2 gap-3">
          {building.quantidade_telas && (
            <div>
              <p className="text-xs text-muted-foreground">Painéis</p>
              <p className="font-semibold text-foreground">{building.quantidade_telas}</p>
            </div>
          )}
          {building.numero_elevadores && (
            <div>
              <p className="text-xs text-muted-foreground">Elevadores</p>
              <p className="font-semibold text-foreground">{building.numero_elevadores}</p>
            </div>
          )}
          {building.towers && (
            <div>
              <p className="text-xs text-muted-foreground">Torres</p>
              <p className="font-semibold text-foreground">{building.towers}</p>
            </div>
          )}
          {building.apartments && (
            <div>
              <p className="text-xs text-muted-foreground">Apartamentos</p>
              <p className="font-semibold text-foreground">{building.apartments}</p>
            </div>
          )}
        </div>

        {building.publico_estimado && (
          <div>
            <p className="text-xs text-muted-foreground">Público Estimado (mensal)</p>
            <p className="font-semibold text-foreground">
              {building.publico_estimado.toLocaleString()} pessoas
            </p>
          </div>
        )}
      </div>

      {/* Actions */}
      <div className="pt-3 border-t grid grid-cols-2 gap-2">
        <Button
          variant="outline"
          size="sm"
          onClick={() => onView(building)}
          className="w-full"
        >
          Ver
        </Button>
        <Button
          variant="outline"
          size="sm"
          onClick={() => onEdit(building)}
          className="w-full"
        >
          Editar
        </Button>
        <Button
          variant="outline"
          size="sm"
          onClick={() => onImageManager(building)}
          className="w-full"
        >
          Imagens
        </Button>
        <Button
          variant="default"
          size="sm"
          onClick={() => onViewPlaylist(building)}
          className="w-full bg-[#9C1E1E] hover:bg-[#7A1818] text-white"
        >
          Playlist
        </Button>
        <Button
          variant="secondary"
          size="sm"
          onClick={() => {
            const buildingCode = building.codigo_predio || '000';
            const url = generatePublicUrl(generatePanelPath(building.nome, buildingCode));
            navigator.clipboard.writeText(url);
            import('sonner').then(({ toast }) => {
              toast.success('Link copiado!', {
                description: `Painel de ${building.nome}`,
                duration: 3000,
              });
            });
          }}
          className="w-full col-span-2"
        >
          Copiar Link do Painel
        </Button>
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
