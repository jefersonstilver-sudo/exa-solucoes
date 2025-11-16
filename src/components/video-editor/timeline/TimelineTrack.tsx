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
    setIsDragOver(false);

    try {
      const data = JSON.parse(e.dataTransfer.getData('application/json'));
      
      // Calculate drop position
      const rect = e.currentTarget.getBoundingClientRect();
      const x = e.clientX - rect.left;
      const startTime = Math.max(0, x / pixelsPerSecond);
      
      // Only accept matching asset types
      const acceptedTypes = {
        'video': ['video'],
        'image': ['image'],
        'text': ['text'],
        'shape': ['shape']
      };

      if (!acceptedTypes[trackType].includes(data.assetType)) {
        toast.error(`Arraste ${data.assetType === 'video' ? 'vídeos' : data.assetType === 'image' ? 'imagens' : 'áudio'} para a trilha correta`);
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
        position: { x: 100, y: 100 },
        size: { 
          width: data.metadata?.width || 640, 
          height: data.metadata?.height || 360 
        },
        rotation: 0,
        asset_id: data.assetId,
      };

      addLayer(newLayer);
      toast.success('Asset adicionado à timeline!');
    } catch (error) {
      console.error('Error parsing drop data:', error);
      toast.error('Erro ao adicionar asset');
    }
  };

  const handleDragOver = (e: React.DragEvent) => {
    e.preventDefault();
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
      {isDragOver && (
        <div className="absolute inset-0 flex items-center justify-center pointer-events-none">
          <span className="text-xs text-primary font-medium bg-background/90 px-2 py-1 rounded">
            Solte aqui
          </span>
        </div>
      )}
    </div>
  );
};
