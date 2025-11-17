import { useEffect, useRef } from 'react';
import { useEditorState } from '@/hooks/video-editor/useEditorState';
import { Button } from '@/components/ui/button';
import { Slider } from '@/components/ui/slider';
import { ZoomIn, ZoomOut, Maximize2, Play, Pause, SkipBack, SkipForward, Volume2 } from 'lucide-react';
import { FitModeSelector } from './FitModeSelector';

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
    isPlaying,
    setIsPlaying,
    setCurrentTime,
    duration,
    fitMode
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

  // Canvas fixo em 16:9 (1280x720)
  const canvasSize = {
    width: 1280,
    height: 720
  };

  // Playback loop
  useEffect(() => {
    if (!isPlaying) return;

    const interval = setInterval(() => {
      const newTime = currentTime + 0.033; // ~30fps
      if (newTime >= duration) {
        setIsPlaying(false);
        setCurrentTime(duration);
      } else {
        setCurrentTime(newTime);
      }
    }, 33);

    return () => clearInterval(interval);
  }, [isPlaying, currentTime, duration, setCurrentTime, setIsPlaying]);

  const formatTime = (time: number) => {
    const minutes = Math.floor(time / 60);
    const seconds = Math.floor(time % 60);
    return `${minutes.toString().padStart(2, '0')}:${seconds.toString().padStart(2, '0')}`;
  };

  const handleSeek = (value: number[]) => {
    setCurrentTime(value[0]);
  };

  // Calculate layer style - SEMPRE horizontal 16:9
  const calculateLayerStyle = (layer: typeof layers[0]) => {
    let style: React.CSSProperties = {
      position: 'absolute',
      width: '100%',
      height: '100%',
      transform: `rotate(${layer.rotation}deg)`,
      opacity: layer.opacity,
      zIndex: layer.z_index,
    };

    // Sempre usar contain para manter aspect ratio correto
    style.objectFit = 'contain';

    // Aplicar posição do layer
    style.left = `${layer.position.x}px`;
    style.top = `${layer.position.y}px`;

    return style;
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
    <div className="flex flex-col h-full bg-background">
      {/* Controls */}
      <div className="flex items-center justify-between gap-2 p-3 border-b bg-background/95 flex-shrink-0">
        <div className="flex items-center gap-2">
          <div className="bg-muted/30 rounded-md px-3 py-1.5">
            <span className="text-sm font-medium">{canvasSize.width} × {canvasSize.height}</span>
          </div>
          <FitModeSelector />
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

      {/* Player Container - SEMPRE 16:9 */}
      <div 
        ref={containerRef}
        className="flex-1 flex items-center justify-center p-8 overflow-auto"
        style={{ background: 'radial-gradient(circle, hsl(var(--muted)) 0%, hsl(var(--background)) 100%)' }}
      >
        <div 
          style={{
            width: `${canvasSize.width * canvasZoom}px`,
            height: `${canvasSize.height * canvasZoom}px`,
            position: 'relative',
            backgroundColor: '#000000',
            boxShadow: '0 4px 20px rgba(0,0,0,0.15), 0 0 0 1px rgba(0,0,0,0.1)'
          }}
          className="relative rounded-sm overflow-hidden"
        >
          {/* Canvas dimensions badge */}
          <div className="absolute top-2 left-2 bg-background/90 backdrop-blur-sm px-2 py-1 rounded text-xs font-medium text-muted-foreground border z-50">
            {canvasSize.width} × {canvasSize.height}
          </div>
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
                  top: 0,
                  left: 0,
                  width: '100%',
                  height: '100%',
                  cursor: 'pointer',
                  border: selectedLayerId === layer.id ? '3px solid #3b82f6' : 'none',
                  zIndex: layer.z_index,
                  opacity: layer.opacity,
                }}
              >
                {layer.type === 'video' && layer.asset_id ? (
                  <video
                    ref={(el) => {
                      if (el) videoRefs.current.set(layer.id, el);
                      else videoRefs.current.delete(layer.id);
                    }}
                    src={layer.asset_id}
                    style={{ 
                      width: '100%', 
                      height: '100%', 
                      objectFit: 'contain'
                    }}
                    muted
                    playsInline
                  />
                ) : layer.type === 'image' && layer.asset_id ? (
                  <img
                    src={layer.asset_id}
                    alt="Layer"
                    style={{ 
                      width: '100%', 
                      height: '100%', 
                      objectFit: 'contain'
                    }}
                  />
                ) : null}
              </div>
            ))
          )}
        </div>
      </div>

      {/* Playback Controls */}
      <div className="h-16 border-t bg-background flex items-center gap-4 px-6 flex-shrink-0">
        {/* Play Controls */}
        <div className="flex items-center gap-2">
          <Button
            variant="ghost"
            size="icon"
            onClick={() => setCurrentTime(Math.max(0, currentTime - 1))}
          >
            <SkipBack className="h-4 w-4" />
          </Button>
          
          <Button
            variant="default"
            size="icon"
            className="h-9 w-9"
            onClick={() => setIsPlaying(!isPlaying)}
          >
            {isPlaying ? (
              <Pause className="h-4 w-4" />
            ) : (
              <Play className="h-4 w-4" />
            )}
          </Button>

          <Button
            variant="ghost"
            size="icon"
            onClick={() => setCurrentTime(Math.min(duration, currentTime + 1))}
          >
            <SkipForward className="h-4 w-4" />
          </Button>
        </div>

        {/* Time Display */}
        <div className="text-sm font-mono text-muted-foreground min-w-[100px]">
          {formatTime(currentTime)} / {formatTime(duration)}
        </div>

        {/* Seek Bar */}
        <div className="flex-1 flex items-center gap-3">
          <Slider
            value={[currentTime]}
            onValueChange={handleSeek}
            max={duration}
            step={0.1}
            className="flex-1"
          />
        </div>

        {/* Volume */}
        <div className="flex items-center gap-2 min-w-[120px]">
          <Button variant="ghost" size="icon">
            <Volume2 className="h-4 w-4" />
          </Button>
          <Slider
            defaultValue={[80]}
            max={100}
            step={1}
            className="w-20"
          />
        </div>
      </div>
    </div>
  );
};
