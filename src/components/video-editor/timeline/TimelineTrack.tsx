import { TimelineLayer } from '@/types/videoEditor';
import { TimelineClip } from './TimelineClip';

interface TimelineTrackProps {
  layers: TimelineLayer[];
  trackType: 'video' | 'image' | 'text' | 'shape';
  pixelsPerSecond: number;
}

export const TimelineTrack = ({ layers, trackType, pixelsPerSecond }: TimelineTrackProps) => {
  return (
    <div className="h-16 border-b relative bg-muted/20 hover:bg-muted/30 transition-colors">
      {layers.map((layer) => (
        <TimelineClip
          key={layer.id}
          layer={layer}
          pixelsPerSecond={pixelsPerSecond}
        />
      ))}
    </div>
  );
};
