import { useRef } from 'react';
import { useEditorState } from '@/hooks/video-editor/useEditorState';
import { TimelineTrack } from './TimelineTrack';
import { Playhead } from './Playhead';
import { TimelineRuler } from './TimelineRuler';
import { TimelineMarker } from './TimelineMarker';
import { Button } from '@/components/ui/button';
import { ZoomIn, ZoomOut, Undo2, Redo2, Magnet, Flag } from 'lucide-react';

export const Timeline = () => {
  const timelineRef = useRef<HTMLDivElement>(null);
  const { 
    layers, 
    duration, 
    currentTime,
    timelineZoom,
    setTimelineZoom,
    setCurrentTime,
    markers,
    addMarker,
    snapEnabled,
    setSnapEnabled,
    undo,
    redo,
    canUndo,
    canRedo
  } = useEditorState();

  const pixelsPerSecond = 100 * timelineZoom;
  const timelineWidth = duration * pixelsPerSecond;

  // Group layers by type for tracks
  const videoLayers = layers.filter(l => l.type === 'video');
  const imageLayers = layers.filter(l => l.type === 'image');
  const textLayers = layers.filter(l => l.type === 'text');
  const shapeLayers = layers.filter(l => l.type === 'shape');

  const handleTimelineClick = (e: React.MouseEvent<HTMLDivElement>) => {
    const rect = e.currentTarget.getBoundingClientRect();
    const x = e.clientX - rect.left;
    const time = (x / pixelsPerSecond);
    setCurrentTime(Math.max(0, Math.min(duration, time)));
  };

  const handleAddMarker = () => {
    addMarker({
      id: `marker-${Date.now()}`,
      time: currentTime,
      label: `Marcador ${markers.length + 1}`,
      color: 'bg-yellow-500'
    });
  };

  return (
    <div className="flex flex-col h-full bg-background border-t">
      {/* Timeline Controls */}
      <div className="flex items-center justify-between p-3 border-b bg-muted/30">
        <div className="flex items-center gap-2">
          <span className="text-sm font-semibold">Timeline</span>
          <div className="h-4 w-px bg-border mx-1" />
          <Button
            variant="ghost"
            size="icon"
            onClick={() => undo()}
            disabled={!canUndo()}
            title="Desfazer (Ctrl+Z)"
          >
            <Undo2 className="h-4 w-4" />
          </Button>
          <Button
            variant="ghost"
            size="icon"
            onClick={() => redo()}
            disabled={!canRedo()}
            title="Refazer (Ctrl+Y)"
          >
            <Redo2 className="h-4 w-4" />
          </Button>
        </div>
        <div className="flex items-center gap-2">
          <Button
            variant={snapEnabled ? "default" : "ghost"}
            size="icon"
            onClick={() => setSnapEnabled(!snapEnabled)}
            title="Snap to Grid"
          >
            <Magnet className="h-4 w-4" />
          </Button>
          <Button
            variant="ghost"
            size="icon"
            onClick={handleAddMarker}
            title="Adicionar Marcador"
          >
            <Flag className="h-4 w-4" />
          </Button>
          <div className="h-4 w-px bg-border mx-1" />
          <Button
            variant="ghost"
            size="icon"
            onClick={() => setTimelineZoom(timelineZoom - 0.2)}
          >
            <ZoomOut className="h-4 w-4" />
          </Button>
          <span className="text-sm font-medium min-w-[60px] text-center">
            {Math.round(timelineZoom * 100)}%
          </span>
          <Button
            variant="ghost"
            size="icon"
            onClick={() => setTimelineZoom(timelineZoom + 0.2)}
          >
            <ZoomIn className="h-4 w-4" />
          </Button>
        </div>
      </div>

      {/* Timeline Content */}
      <div className="flex-1 overflow-auto">
        <div className="flex">
          {/* Track Labels */}
          <div className="w-32 flex-shrink-0 border-r bg-muted/30">
            <div className="h-12 border-b" />
            {/* Always show primary tracks */}
            <div className="h-16 border-b flex items-center px-3">
              <span className="text-sm font-medium">Video</span>
            </div>
            <div className="h-16 border-b flex items-center px-3">
              <span className="text-sm font-medium">Images</span>
            </div>
            <div className="h-16 border-b flex items-center px-3">
              <span className="text-sm font-medium">Text</span>
            </div>
          </div>

          {/* Timeline Tracks */}
          <div 
            ref={timelineRef}
            className="flex-1 relative"
            style={{ minWidth: timelineWidth }}
            onClick={handleTimelineClick}
          >
            {/* Ruler */}
            <TimelineRuler 
              duration={duration} 
              pixelsPerSecond={pixelsPerSecond} 
            />

            {/* Tracks - Always render primary tracks */}
            <TimelineTrack
              layers={videoLayers}
              trackType="video"
              pixelsPerSecond={pixelsPerSecond}
            />
            <TimelineTrack
              layers={imageLayers}
              trackType="image"
              pixelsPerSecond={pixelsPerSecond}
            />
            <TimelineTrack
              layers={textLayers}
              trackType="text"
              pixelsPerSecond={pixelsPerSecond}
            />

            {/* Markers */}
            {markers.map(marker => (
              <TimelineMarker
                key={marker.id}
                markerId={marker.id}
                pixelsPerSecond={pixelsPerSecond}
              />
            ))}

            {/* Playhead */}
            <Playhead 
              currentTime={currentTime} 
              pixelsPerSecond={pixelsPerSecond} 
            />
          </div>
        </div>
      </div>
    </div>
  );
};
