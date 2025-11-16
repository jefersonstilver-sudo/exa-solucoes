import { useEffect, useRef } from 'react';
import { useEditorState } from '@/hooks/video-editor/useEditorState';
import { Button } from '@/components/ui/button';
import { ZoomIn, ZoomOut, Maximize2 } from 'lucide-react';

export const VideoPlayer = () => {
  const containerRef = useRef<HTMLDivElement>(null);
  const videoRefs = useRef<Map<string, HTMLVideoElement>>(new Map());
  
  const { 
    layers, 
    currentTime, 
    selectedLayerId, 
    setSelectedLayerId,
    canvasZoom,
    setCanvasZoom,
    currentProject,
    isPlaying 
  } = useEditorState();
  
  // Sync video playback with currentTime
  useEffect(() => {
    videoRefs.current.forEach((video, layerId) => {
      const layer = layers.find(l => l.id === layerId);
      if (!layer) return;
      
      if (currentTime >= layer.start_time && currentTime <= layer.end_time) {
        const localTime = currentTime - layer.start_time;
        if (Math.abs(video.currentTime - localTime) > 0.1) {
          video.currentTime = localTime;
        }
        
        if (isPlaying && video.paused) {
          video.play().catch(e => console.log('Play error:', e));
        } else if (!isPlaying && !video.paused) {
          video.pause();
        }
      }
    });
  }, [currentTime, layers, isPlaying]);

  const canvasSize = {
    width: currentProject?.project_data.canvas.width || 1920,
    height: currentProject?.project_data.canvas.height || 1080
  };

  // Get visible video layers
  const visibleLayers = layers
    .filter(layer => 
      currentTime >= layer.start_time && 
      currentTime <= layer.end_time &&
      (layer.type === 'video' || layer.type === 'image')
    )
    .sort((a, b) => a.z_index - b.z_index);

  return (
    <div className="flex flex-col h-full bg-muted/30">
      {/* Controls */}
      <div className="flex items-center justify-between p-2 border-b bg-background/95 flex-shrink-0">
        <div className="flex items-center gap-2">
          <span className="text-sm text-muted-foreground">
            {canvasSize.width} x {canvasSize.height}
          </span>
        </div>
        <div className="flex items-center gap-2">
          <Button
            variant="ghost"
            size="icon"
            onClick={() => setCanvasZoom(Math.max(0.1, canvasZoom - 0.1))}
          >
            <ZoomOut className="h-4 w-4" />
          </Button>
          <span className="text-sm font-medium min-w-[60px] text-center">
            {Math.round(canvasZoom * 100)}%
          </span>
          <Button
            variant="ghost"
            size="icon"
            onClick={() => setCanvasZoom(Math.min(3, canvasZoom + 0.1))}
          >
            <ZoomIn className="h-4 w-4" />
          </Button>
          <Button
            variant="ghost"
            size="icon"
            onClick={() => setCanvasZoom(1)}
          >
            <Maximize2 className="h-4 w-4" />
          </Button>
        </div>
      </div>

      {/* Player Container */}
      <div 
        ref={containerRef}
        className="flex-1 flex items-center justify-center p-4 overflow-auto bg-black/5"
      >
        <div 
          style={{ 
            width: canvasSize.width,
            height: canvasSize.height,
            transform: `scale(${canvasZoom})`,
            transformOrigin: 'center',
            position: 'relative',
            backgroundColor: currentProject?.project_data.canvas.background_color || '#000000',
            boxShadow: '0 20px 60px rgba(0,0,0,0.3)'
          }}
          className="relative"
        >
          {visibleLayers.length === 0 ? (
            <div className="absolute inset-0 flex items-center justify-center text-muted-foreground">
              <div className="text-center space-y-2">
                <p className="text-lg font-medium">Canvas vazio</p>
                <p className="text-sm">Arraste vídeos ou imagens da biblioteca</p>
              </div>
            </div>
          ) : (
            visibleLayers.map((layer) => (
              <div
                key={layer.id}
                onClick={() => setSelectedLayerId(layer.id)}
                style={{
                  position: 'absolute',
                  left: layer.position.x,
                  top: layer.position.y,
                  width: layer.size.width,
                  height: layer.size.height,
                  transform: `rotate(${layer.rotation}deg)`,
                  opacity: layer.opacity,
                  cursor: 'pointer',
                  border: selectedLayerId === layer.id ? '3px solid #3b82f6' : 'none',
                  zIndex: layer.z_index
                }}
              >
                {layer.type === 'video' && layer.asset_id ? (
                  <video
                    ref={(el) => {
                      if (el) videoRefs.current.set(layer.id, el);
                      else videoRefs.current.delete(layer.id);
                    }}
                    src={layer.asset_id}
                    className="w-full h-full object-cover"
                    muted
                    playsInline
                  />
                ) : layer.type === 'image' && layer.asset_id ? (
                  <img
                    src={layer.asset_id}
                    alt="Layer"
                    className="w-full h-full object-cover"
                  />
                ) : (
                  <div className="w-full h-full bg-muted/50 flex items-center justify-center">
                    <span className="text-xs text-muted-foreground">
                      {layer.type}
                    </span>
                  </div>
                )}
              </div>
            ))
          )}
        </div>
      </div>
    </div>
  );
};
