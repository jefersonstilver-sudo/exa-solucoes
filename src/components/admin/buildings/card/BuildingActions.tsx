
import React from 'react';
import { Button } from '@/components/ui/button';
import { Eye, Edit, Camera, Trash2, Monitor, Video, Code } from 'lucide-react';
import { toast } from '@/hooks/use-toast';
import VideosPopover from '../VideosPopover';
import { generateCommercialPath, generatePanelPath, generateEmbedPath } from '@/utils/buildingSlugUtils';

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
                  <div className="flex items-center gap-1 px-2 py-1 bg-gradient-to-r from-green-500 to-emerald-500 rounded text-white text-xs font-semibold cursor-pointer hover:from-green-600 hover:to-emerald-600 transition-all">
                    <Video className="h-3 w-3 animate-pulse" />
                    <span>{videoCount} vídeo{videoCount > 1 ? 's' : ''} no AR</span>
                  </div>
                </VideosPopover>
              </div>
              <div className="flex gap-2">
                <button
                  onClick={() => {
                    const buildingCode = building.codigo_predio || '000';
                    const url = `${window.location.origin}${generatePanelPath(building.nome, buildingCode)}`;
                    navigator.clipboard.writeText(url);
                    toast({
                      title: "Link Limpo copiado!",
                      description: `${url}`,
                    });
                  }}
                  className="flex-1 flex items-center justify-center gap-1 px-2 py-1.5 text-xs bg-gradient-to-r from-slate-600 to-slate-700 hover:from-slate-700 hover:to-slate-800 text-white rounded transition-all font-semibold"
                >
                  <svg className="h-3 w-3" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M13.828 10.172a4 4 0 00-5.656 0l-4 4a4 4 0 105.656 5.656l1.102-1.101m-.758-4.899a4 4 0 005.656 0l4-4a4 4 0 00-5.656-5.656l-1.1 1.1" />
                  </svg>
                  Limpo
                </button>
                <button
                  onClick={() => {
                    const buildingCode = building.codigo_predio || '000';
                    const url = `${window.location.origin}${generateEmbedPath(building.nome, buildingCode)}`;
                    const embedCode = `<iframe src="${url}" width="100%" height="100%" frameborder="0" allowfullscreen></iframe>`;
                    navigator.clipboard.writeText(embedCode);
                    toast({
                      title: "Código Embed copiado!",
                      description: "Cole em qualquer site",
                    });
                  }}
                  className="flex-1 flex items-center justify-center gap-1 px-2 py-1.5 text-xs bg-gradient-to-r from-purple-600 to-purple-700 hover:from-purple-700 hover:to-purple-800 text-white rounded transition-all font-semibold"
                >
                  <Code className="h-3 w-3" />
                  Embed
                </button>
                <button
                  onClick={() => {
                    const buildingCode = building.codigo_predio || '000';
                    const url = `${window.location.origin}${generateCommercialPath(building.nome, buildingCode)}`;
                    navigator.clipboard.writeText(url);
                    toast({
                      title: "Link Comercial copiado!",
                      description: `${url}`,
                    });
                  }}
                  className="flex-1 flex items-center justify-center gap-1 px-2 py-1.5 text-xs bg-gradient-to-r from-blue-600 to-blue-700 hover:from-blue-700 hover:to-blue-800 text-white rounded transition-all font-semibold"
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
          className="flex items-center space-x-1"
        >
          <Eye className="h-3 w-3" />
          <span>Ver</span>
        </Button>
        <Button
          size="sm"
          variant="outline"
          onClick={() => onEdit(building)}
          className="flex items-center space-x-1"
        >
          <Edit className="h-3 w-3" />
          <span>Editar</span>
        </Button>
        <Button
          size="sm"
          variant="outline"
          onClick={() => onImageManager(building)}
          className="flex items-center space-x-1"
        >
          <Camera className="h-3 w-3" />
          <span>Fotos</span>
        </Button>
      </div>
    </div>
  );
};

export default BuildingActions;
