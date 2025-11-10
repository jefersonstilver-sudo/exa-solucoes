
import React from 'react';
import { Button } from '@/components/ui/button';
import { Eye, Edit, Camera, Trash2, Monitor, Video, Code } from 'lucide-react';
import { toast } from '@/hooks/use-toast';
import VideosPopover from '../VideosPopover';
import { generateCommercialPath, generatePanelPath, generateEmbedPath } from '@/utils/buildingSlugUtils';
import { generatePublicUrl } from '@/config/domain';

interface BuildingActionsProps {
  building: any;
  onView: (building: any) => void;
  onEdit: (building: any) => void;
  onImageManager: (building: any) => void;
  onDelete: (building: any) => void;
  videoCount?: number;
}

const BuildingActions: React.FC<BuildingActionsProps> = ({
  building,
  onView,
  onEdit,
  onImageManager,
  onDelete,
  videoCount
}) => {
  return (
    <div className="space-y-3 mt-auto">
      {/* Contador de vídeos e links de painel */}
      {typeof videoCount === 'number' && (
        <div className="space-y-2 p-3 bg-gray-50 rounded-lg border border-gray-200">
          {videoCount > 0 ? (
            <>
              <div className="flex items-center gap-2 text-sm">
                <VideosPopover buildingId={building.id} videoCount={videoCount}>
                  <div className="flex items-center gap-1 px-2 py-1 bg-green-50 border border-green-200 rounded text-green-700 text-xs font-medium cursor-pointer hover:bg-green-100 transition-colors">
                    <Video className="h-3 w-3" />
                    <span>{videoCount} vídeo{videoCount > 1 ? 's' : ''} no AR</span>
                  </div>
                </VideosPopover>
              </div>
              <div className="flex gap-2">
                <button
                  onClick={() => {
                    const buildingCode = building.codigo_predio || '000';
                    const url = generatePublicUrl(generatePanelPath(building.nome, buildingCode));
                    window.open(url, '_blank');
                    navigator.clipboard.writeText(url);
                    toast({
                      title: "Link Limpo aberto!",
                      description: "Link copiado para área de transferência",
                    });
                  }}
                  className="flex-1 flex items-center justify-center gap-1 px-2 py-1.5 text-xs bg-slate-100 hover:bg-slate-200 text-slate-700 rounded transition-colors font-medium border border-slate-300"
                >
                  <svg className="h-3 w-3" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M13.828 10.172a4 4 0 00-5.656 0l-4 4a4 4 0 105.656 5.656l1.102-1.101m-.758-4.899a4 4 0 005.656 0l4-4a4 4 0 00-5.656-5.656l-1.1 1.1" />
                  </svg>
                  Limpo
                </button>
                <button
                  onClick={() => {
                    const buildingCode = building.codigo_predio || '000';
                    const url = generatePublicUrl(generateEmbedPath(building.nome, buildingCode));
                    const embedCode = `<iframe src="${url}" width="100%" height="100%" frameborder="0" allowfullscreen></iframe>`;
                    navigator.clipboard.writeText(embedCode);
                    toast({
                      title: "Código Embed copiado!",
                      description: "Cole em qualquer site",
                    });
                  }}
                  className="flex-1 flex items-center justify-center gap-1 px-2 py-1.5 text-xs bg-purple-100 hover:bg-purple-200 text-purple-700 rounded transition-colors font-medium border border-purple-300"
                >
                  <Code className="h-3 w-3" />
                  Embed
                </button>
                <button
                  onClick={() => {
                    const buildingCode = building.codigo_predio || '000';
                    const url = generatePublicUrl(generateCommercialPath(building.nome, buildingCode));
                    window.open(url, '_blank');
                    navigator.clipboard.writeText(url);
                    toast({
                      title: "Link Comercial aberto!",
                      description: "Link copiado para área de transferência",
                    });
                  }}
                  className="flex-1 flex items-center justify-center gap-1 px-2 py-1.5 text-xs bg-blue-100 hover:bg-blue-200 text-blue-700 rounded transition-colors font-medium border border-blue-300"
                >
                  <Monitor className="h-3 w-3" />
                  UI
                </button>
              </div>
            </>
          ) : (
            <div className="flex items-center gap-1 px-2 py-1 bg-gray-100 rounded text-gray-600 text-xs">
              <Video className="h-3 w-3" />
              <span>Sem vídeos no momento</span>
            </div>
          )}
        </div>
      )}

      {/* Ações principais */}
      <div className="flex items-center flex-wrap gap-2">
        <Button
          size="sm"
          variant="outline"
          onClick={() => onView(building)}
          className="flex items-center space-x-1 text-xs"
        >
          <Eye className="h-3 w-3" />
          <span>Ver</span>
        </Button>
        <Button
          size="sm"
          variant="outline"
          onClick={() => onEdit(building)}
          className="flex items-center space-x-1 text-xs"
        >
          <Edit className="h-3 w-3" />
          <span>Editar</span>
        </Button>
        <Button
          size="sm"
          variant="outline"
          onClick={() => onImageManager(building)}
          className="flex items-center space-x-1 text-xs"
        >
          <Camera className="h-3 w-3" />
          <span>Fotos</span>
        </Button>
      </div>
    </div>
  );
};

export default BuildingActions;
