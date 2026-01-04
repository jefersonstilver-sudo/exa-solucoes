import React from 'react';
import { HardDrive } from 'lucide-react';
import { cn } from '@/lib/utils';

interface StorageIndicatorProps {
  usedBytes: number;
  totalBytes: number;
  showLabel?: boolean;
}

export const StorageIndicator: React.FC<StorageIndicatorProps> = ({
  usedBytes,
  totalBytes,
  showLabel = true
}) => {
  const formatSize = (bytes: number) => {
    if (bytes < 1024) return `${bytes} B`;
    if (bytes < 1024 * 1024) return `${(bytes / 1024).toFixed(1)} KB`;
    if (bytes < 1024 * 1024 * 1024) return `${(bytes / (1024 * 1024)).toFixed(1)} MB`;
    return `${(bytes / (1024 * 1024 * 1024)).toFixed(1)} GB`;
  };

  const percentage = Math.min((usedBytes / totalBytes) * 100, 100);
  const isHigh = percentage > 80;
  const isMedium = percentage > 50;

  return (
    <div className="flex items-center gap-3">
      <HardDrive className="w-4 h-4 text-muted-foreground" />
      <div className="flex-1">
        {showLabel && (
          <div className="flex items-center justify-between mb-1">
            <span className="text-xs text-muted-foreground">Armazenamento</span>
            <span className="text-xs font-medium">
              {formatSize(usedBytes)} / {formatSize(totalBytes)}
            </span>
          </div>
        )}
        <div className="h-1.5 bg-gray-100 rounded-full overflow-hidden">
          <div 
            className={cn(
              "h-full rounded-full transition-all",
              isHigh ? "bg-red-500" : isMedium ? "bg-amber-500" : "bg-emerald-500"
            )}
            style={{ width: `${percentage}%` }}
          />
        </div>
      </div>
    </div>
  );
};

export default StorageIndicator;
