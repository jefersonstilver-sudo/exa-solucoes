import { useEditorState } from '@/hooks/video-editor/useEditorState';
import { TimelineLayer } from '@/types/videoEditor';
import { Film, Image, Type, Square } from 'lucide-react';

interface TimelineClipProps {
  layer: TimelineLayer;
  pixelsPerSecond: number;
}

export const TimelineClip = ({ layer, pixelsPerSecond }: TimelineClipProps) => {
  const { selectedLayerId, setSelectedLayerId, updateLayer } = useEditorState();
  
  const left = layer.start_time * pixelsPerSecond;
  const width = layer.duration * pixelsPerSecond;
  const isSelected = selectedLayerId === layer.id;

  const handleClick = (e: React.MouseEvent) => {
    e.stopPropagation();
    setSelectedLayerId(layer.id);
  };

  const getIcon = () => {
    switch (layer.type) {
      case 'video':
        return <Film className="h-3 w-3" />;
      case 'image':
        return <Image className="h-3 w-3" />;
      case 'text':
        return <Type className="h-3 w-3" />;
      case 'shape':
        return <Square className="h-3 w-3" />;
    }
  };

  const getColor = () => {
    switch (layer.type) {
      case 'video':
        return 'bg-blue-500/80';
      case 'image':
        return 'bg-green-500/80';
      case 'text':
        return 'bg-purple-500/80';
      case 'shape':
        return 'bg-orange-500/80';
    }
  };

  return (
    <div
      className={`
        absolute top-1 h-14 rounded cursor-move
        ${getColor()}
        ${isSelected ? 'ring-2 ring-primary ring-offset-1' : ''}
        hover:brightness-110 transition-all
        flex items-center gap-2 px-2 overflow-hidden
      `}
      style={{ left, width: Math.max(width, 40) }}
      onClick={handleClick}
    >
      {getIcon()}
      <span className="text-xs text-white font-medium truncate">
        {layer.content || layer.type}
      </span>
    </div>
  );
};
