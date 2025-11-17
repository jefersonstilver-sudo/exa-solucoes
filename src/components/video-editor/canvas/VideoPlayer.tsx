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

  const canvasSize = {
    width: currentProject?.project_data.canvas.width || 1920,
    height: currentProject?.project_data.canvas.height || 1080
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

  // Calculate layer transform based on fit mode
  const calculateLayerStyle = (layer: typeof layers[0]) => {
    const layerAspect = layer.size.width / layer.size.height;
    const canvasAspect = canvasSize.width / canvasSize.height;

    let style: React.CSSProperties = {
      position: 'absolute',
      transform: `rotate(${layer.rotation}deg)`,
      opacity: layer.opacity,
      zIndex: layer.z_index,
    };

    switch (fitMode) {
      case 'fit': {
        const scale = layerAspect > canvasAspect 
          ? canvasSize.width / layer.size.width 
          : canvasSize.height / layer.size.height;
        const width = layer.size.width * scale;
        const height = layer.size.height * scale;
        style.width = `${width * canvasZoom}px`;
        style.height = `${height * canvasZoom}px`;
        style.left = `${((canvasSize.width - width) / 2 + layer.position.x) * canvasZoom}px`;
        style.top = `${((canvasSize.height - height) / 2 + layer.position.y) * canvasZoom}px`;
        style.objectFit = 'contain';
        break;
      }
      case 'fill': {
        const scale = layerAspect > canvasAspect
          ? canvasSize.height / layer.size.height
          : canvasSize.width / layer.size.width;
        const width = layer.size.width * scale;
        const height = layer.size.height * scale;
        style.width = `${width * canvasZoom}px`;
        style.height = `${height * canvasZoom}px`;
        style.left = `${((canvasSize.width - width) / 2 + layer.position.x) * canvasZoom}px`;
        style.top = `${((canvasSize.height - height) / 2 + layer.position.y) * canvasZoom}px`;
        style.objectFit = 'cover';
        break;
      }
      case 'stretch': {
        style.width = `${canvasSize.width * canvasZoom}px`;
        style.height = `${canvasSize.height * canvasZoom}px`;
        style.left = `${layer.position.x * canvasZoom}px`;
        style.top = `${layer.position.y * canvasZoom}px`;
        style.objectFit = 'fill';
        break;
      }
      case 'original': {
        style.width = `${layer.size.width * canvasZoom}px`;
        style.height = `${layer.size.height * canvasZoom}px`;
        style.left = `${layer.position.x * canvasZoom}px`;
        style.top = `${layer.position.y * canvasZoom}px`;
        style.objectFit = 'none';
        break;
      }
    }

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

      {/* Player Container */}
      <div 
        ref={containerRef}
        className="flex-1 flex items-center justify-center p-8 overflow-auto"
        style={{ background: 'radial-gradient(circle, hsl(var(--muted)) 0%, hsl(var(--background)) 100%)' }}
      >
        <div 
          style={{ 
            width: canvasSize.width,
            height: canvasSize.height,
            transform: `scale(${canvasZoom})`,
            transformOrigin: 'center',
            position: 'relative',
            backgroundColor: currentProject?.project_data.canvas.background_color || '#000000',
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
            visibleLayers.map((layer) => {
              const layerStyle = calculateLayerStyle(layer);
              return (
                <div
                  key={layer.id}
                  onClick={() => setSelectedLayerId(layer.id)}
                  style={{
                    ...layerStyle,
                    cursor: 'pointer',
                    border: selectedLayerId === layer.id ? '3px solid #3b82f6' : 'none',
                  }}
                >
                  {layer.type === 'video' && layer.asset_id ? (
                    <video
                      ref={(el) => {
                        if (el) videoRefs.current.set(layer.id, el);
                        else videoRefs.current.delete(layer.id);
                      }}
                      src={layer.asset_id}
                      style={{ width: '100%', height: '100%', objectFit: layerStyle.objectFit as any }}
                      muted
                      playsInline
                    />
                  ) : layer.type === 'image' && layer.asset_id ? (
                    <img
                      src={layer.asset_id}
                      alt="Layer"
                      style={{ width: '100%', height: '100%', objectFit: layerStyle.objectFit as any }}
                    />
                  ) : null}
                </div>
              );
            })
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
