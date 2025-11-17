import { useState } from 'react';
import { TimelineLayer } from '@/types/videoEditor';
import { TimelineClip } from './TimelineClip';
import { useEditorState } from '@/hooks/video-editor/useEditorState';
import { toast } from 'sonner';

interface TimelineTrackProps {
  layers: TimelineLayer[];
  trackType: 'video' | 'image' | 'text' | 'shape';
  pixelsPerSecond: number;
}

export const TimelineTrack = ({ layers, trackType, pixelsPerSecond }: TimelineTrackProps) => {
  const { addLayer, duration } = useEditorState();
  const [isDragOver, setIsDragOver] = useState(false);

  const handleDrop = (e: React.DragEvent) => {
    e.preventDefault();
    e.stopPropagation();
    setIsDragOver(false);

    console.log('🎬 [TIMELINE DROP] Recebendo drop event');

    try {
      const dataText = e.dataTransfer.getData('application/json');
      console.log('📦 [TIMELINE DROP] Data recebida:', dataText);
      
      if (!dataText) {
        console.error('❌ [TIMELINE DROP] Dados vazios');
        toast.error('Dados inválidos ao arrastar');
        return;
      }
      
      const data = JSON.parse(dataText);
      console.log('✅ [TIMELINE DROP] Data parseada:', data);
      
      // Calculate drop position
      const rect = e.currentTarget.getBoundingClientRect();
      const x = e.clientX - rect.left;
      const startTime = Math.max(0, x / pixelsPerSecond);
      
      console.log(`⏱️ [TIMELINE DROP] Start time calculado: ${startTime}s`);
      
      // Only accept matching asset types
      const acceptedTypes = {
        'video': ['video'],
        'image': ['image'],
        'text': ['text'],
        'shape': ['shape']
      };

      if (!acceptedTypes[trackType]?.includes(data.assetType)) {
        console.warn(`⚠️ [TIMELINE DROP] Tipo incompatível: ${data.assetType} para track ${trackType}`);
        toast.error(`Arraste ${data.assetType === 'video' ? 'vídeos' : data.assetType === 'image' ? 'imagens' : 'textos'} para a trilha correta`);
        return;
      }

      const newLayer: TimelineLayer = {
        id: `layer-${Date.now()}`,
        type: data.assetType,
        start_time: startTime,
        end_time: Math.min(startTime + (data.metadata?.duration || 5), duration),
        duration: data.metadata?.duration || 5,
        z_index: layers.length,
        opacity: 1,
        position: { x: 0, y: 0 },
        size: { 
          width: data.metadata?.width || 1280, 
          height: data.metadata?.height || 720
        },
        rotation: 0,
        asset_id: data.fileUrl,
      };

      console.log('🎯 [TIMELINE DROP] Novo layer criado:', newLayer);
      addLayer(newLayer);
      toast.success('Asset adicionado à timeline!');
    } catch (error) {
      console.error('❌ [TIMELINE DROP] Erro:', error);
      toast.error('Erro ao adicionar asset');
    }
  };

  const handleDragOver = (e: React.DragEvent) => {
    e.preventDefault();
    e.stopPropagation();
    e.dataTransfer.dropEffect = 'copy';
    setIsDragOver(true);
  };

  const handleDragLeave = () => {
    setIsDragOver(false);
  };

  return (
    <div 
      className={`h-16 border-b relative transition-colors ${
        isDragOver ? 'bg-primary/20 border-primary' : 'bg-muted/20 hover:bg-muted/30'
      }`}
      onDrop={handleDrop}
      onDragOver={handleDragOver}
      onDragLeave={handleDragLeave}
    >
      {layers.map((layer) => (
        <TimelineClip
          key={layer.id}
          layer={layer}
          pixelsPerSecond={pixelsPerSecond}
        />
      ))}
      {layers.length === 0 && !isDragOver && (
        <div className="absolute inset-0 flex items-center justify-center pointer-events-none">
          <span className="text-xs text-muted-foreground/60">
            Arraste {trackType === 'video' ? 'vídeos' : trackType === 'image' ? 'imagens' : 'textos'} aqui
          </span>
        </div>
      )}
      {isDragOver && (
        <div className="absolute inset-0 flex items-center justify-center pointer-events-none bg-primary/10">
          <span className="text-xs text-primary font-medium bg-background/90 px-3 py-1.5 rounded-md border border-primary/20">
            Solte aqui
          </span>
        </div>
      )}
    </div>
  );
};
