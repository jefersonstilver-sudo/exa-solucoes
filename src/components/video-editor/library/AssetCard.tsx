import { useState } from 'react';
import { motion } from 'framer-motion';
import { Film, Image as ImageIcon, Music, Trash2, MoreVertical } from 'lucide-react';
import { VideoEditorAsset } from '@/types/videoEditor';
import { cn } from '@/lib/utils';
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger,
} from '@/components/ui/dropdown-menu';
import { Button } from '@/components/ui/button';
import { useVideoEditorAssets } from '@/hooks/video-editor/useVideoEditorAssets';

interface AssetCardProps {
  asset: VideoEditorAsset;
  viewMode: 'grid' | 'list';
}

const AssetCard = ({ asset, viewMode }: AssetCardProps) => {
  const [isHovered, setIsHovered] = useState(false);
  const { deleteAsset, isDeleting } = useVideoEditorAssets();

  const handleDragStart = (e: React.DragEvent) => {
    e.dataTransfer.effectAllowed = 'copy';
    e.dataTransfer.setData('application/json', JSON.stringify({
      assetId: asset.id,
      assetType: asset.asset_type,
      fileUrl: asset.file_url,
      fileName: asset.file_name,
      metadata: asset.metadata
    }));
  };

  const getIcon = () => {
    switch (asset.asset_type) {
      case 'video':
        return <Film className="h-5 w-5" />;
      case 'image':
        return <ImageIcon className="h-5 w-5" />;
      case 'audio':
        return <Music className="h-5 w-5" />;
      default:
        return <Film className="h-5 w-5" />;
    }
  };

  const formatDuration = (seconds?: number) => {
    if (!seconds) return '';
    const mins = Math.floor(seconds / 60);
    const secs = Math.floor(seconds % 60);
    return `${mins}:${secs.toString().padStart(2, '0')}`;
  };

  const formatSize = (mb: number) => {
    if (mb < 1) return `${Math.round(mb * 1024)}KB`;
    return `${mb.toFixed(1)}MB`;
  };

  if (viewMode === 'list') {
    return (
      <div
        draggable
        onDragStart={handleDragStart}
        className="flex items-center gap-3 p-3 rounded-lg bg-card border hover:bg-accent/50 transition-colors cursor-grab active:cursor-grabbing hover:scale-[1.01]"
        onMouseEnter={() => setIsHovered(true)}
        onMouseLeave={() => setIsHovered(false)}
      >
        {/* Icon */}
        <div className="p-2 bg-muted rounded">
          {getIcon()}
        </div>

        {/* Info */}
        <div className="flex-1 min-w-0">
          <p className="text-sm font-medium truncate">{asset.file_name}</p>
          <div className="flex items-center gap-2 text-xs text-muted-foreground">
            <span>{formatSize(asset.file_size_mb)}</span>
            {asset.metadata.duration && (
              <>
                <span>•</span>
                <span>{formatDuration(asset.metadata.duration)}</span>
              </>
            )}
            {asset.metadata.width && asset.metadata.height && (
              <>
                <span>•</span>
                <span>{asset.metadata.width}×{asset.metadata.height}</span>
              </>
            )}
          </div>
        </div>

        {/* Actions */}
        <DropdownMenu>
          <DropdownMenuTrigger asChild>
            <Button variant="ghost" size="sm" className="h-8 w-8 p-0">
              <MoreVertical className="h-4 w-4" />
            </Button>
          </DropdownMenuTrigger>
          <DropdownMenuContent align="end">
            <DropdownMenuItem
              onClick={() => deleteAsset(asset.id)}
              disabled={isDeleting}
              className="text-destructive"
            >
              <Trash2 className="h-4 w-4 mr-2" />
              Excluir
            </DropdownMenuItem>
          </DropdownMenuContent>
        </DropdownMenu>
      </div>
    );
  }

  return (
    <div
      draggable
      onDragStart={handleDragStart}
      className={cn(
        "relative group rounded-lg overflow-hidden bg-card border cursor-grab active:cursor-grabbing",
        "hover:shadow-lg hover:scale-[1.02] transition-all duration-200"
      )}
      onMouseEnter={() => setIsHovered(true)}
      onMouseLeave={() => setIsHovered(false)}
    >
      {/* Preview */}
      <div className="aspect-video bg-muted flex items-center justify-center relative">
        {asset.asset_type === 'video' ? (
          <video
            src={asset.file_url}
            className="w-full h-full object-cover"
            muted
            loop
            onMouseEnter={(e) => e.currentTarget.play()}
            onMouseLeave={(e) => {
              e.currentTarget.pause();
              e.currentTarget.currentTime = 0;
            }}
          />
        ) : asset.asset_type === 'image' ? (
          <img
            src={asset.file_url}
            alt={asset.file_name}
            className="w-full h-full object-cover"
          />
        ) : (
          <div className="p-8">
            <Music className="h-12 w-12 text-muted-foreground" />
          </div>
        )}

        {/* Duration Badge */}
        {asset.metadata.duration && (
          <div className="absolute bottom-2 right-2 bg-black/80 text-white text-xs px-2 py-0.5 rounded">
            {formatDuration(asset.metadata.duration)}
          </div>
        )}

        {/* Hover Actions */}
        {isHovered && (
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            className="absolute inset-0 bg-black/50 flex items-center justify-center"
          >
            <Button
              variant="destructive"
              size="sm"
              onClick={(e) => {
                e.stopPropagation();
                deleteAsset(asset.id);
              }}
              disabled={isDeleting}
            >
              <Trash2 className="h-4 w-4 mr-2" />
              Excluir
            </Button>
          </motion.div>
        )}
      </div>

      {/* Info */}
      <div className="p-2">
        <p className="text-xs font-medium truncate">{asset.file_name}</p>
        <p className="text-xs text-muted-foreground">{formatSize(asset.file_size_mb)}</p>
      </div>
    </div>
  );
};

export default AssetCard;
