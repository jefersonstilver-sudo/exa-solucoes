import { memo, useState } from 'react';
import { motion } from 'framer-motion';

interface TimelineSegment {
  id: string;
  startTime: Date;
  endTime?: Date;
  status: 'online' | 'offline';
  duration: number;
}

interface TimelineTrackRowProps {
  panelCode: string;
  condominiumName: string;
  segments: TimelineSegment[];
  pixelsPerHour: number;
  startHour: number;
  onSegmentHover?: (segment: TimelineSegment, position: { x: number; y: number }) => void;
  onSegmentLeave?: () => void;
  index: number;
}

export const TimelineTrackRow = memo(({ 
  panelCode, 
  condominiumName,
  segments, 
  pixelsPerHour, 
  startHour,
  onSegmentHover,
  onSegmentLeave,
  index
}: TimelineTrackRowProps) => {
  const [isHovered, setIsHovered] = useState(false);

  const getSegmentPosition = (time: Date) => {
    const hours = time.getHours();
    const minutes = time.getMinutes();
    const seconds = time.getSeconds();
    const totalHours = hours - startHour + minutes / 60 + seconds / 3600;
    return totalHours * pixelsPerHour;
  };

  const getSegmentWidth = (segment: TimelineSegment) => {
    return (segment.duration / 3600) * pixelsPerHour;
  };

  return (
    <motion.div
      className={`flex border-b border-border/10 transition-colors ${
        isHovered ? 'bg-muted/30' : 'bg-background/20'
      }`}
      initial={{ opacity: 0, x: -20 }}
      animate={{ opacity: 1, x: 0 }}
      transition={{ duration: 0.3, delay: index * 0.03 }}
      onMouseEnter={() => setIsHovered(true)}
      onMouseLeave={() => setIsHovered(false)}
    >
      {/* Panel Info - Fixed Left */}
      <div className="w-64 flex-shrink-0 px-4 py-3 border-r border-border/20 bg-background/40 backdrop-blur-sm sticky left-0 z-10">
        <div className="font-semibold text-sm">{panelCode}</div>
        <div className="text-xs text-muted-foreground truncate">{condominiumName}</div>
      </div>

      {/* Timeline Segments - Scrollable */}
      <div className="flex-1 relative h-16">
        {segments.map((segment) => {
          const left = getSegmentPosition(segment.startTime);
          const width = getSegmentWidth(segment);

          return (
            <motion.div
              key={segment.id}
              className={`absolute top-2 h-12 rounded cursor-pointer transition-all ${
                segment.status === 'offline'
                  ? 'bg-destructive/80 hover:bg-destructive border border-destructive/40'
                  : 'bg-primary/60 hover:bg-primary/80 border border-primary/30'
              }`}
              style={{ left, width: Math.max(width, 2) }}
              whileHover={{ scale: 1.05, y: -2 }}
              onMouseEnter={(e) => {
                if (onSegmentHover) {
                  const rect = e.currentTarget.getBoundingClientRect();
                  onSegmentHover(segment, { x: rect.left, y: rect.top });
                }
              }}
              onMouseLeave={onSegmentLeave}
            >
              {width > 40 && (
                <div className="px-2 py-1 text-xs text-white font-medium truncate">
                  {segment.status === 'offline' ? 'Offline' : 'Online'}
                </div>
              )}
            </motion.div>
          );
        })}
      </div>
    </motion.div>
  );
});

TimelineTrackRow.displayName = 'TimelineTrackRow';
