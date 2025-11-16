import { useEffect, useRef, useState } from 'react';
import { useEditorState } from '@/hooks/video-editor/useEditorState';
import { Button } from '@/components/ui/button';
import { ZoomIn, ZoomOut, Maximize2 } from 'lucide-react';

export const VideoCanvas = () => {
  const canvasRef = useRef<HTMLCanvasElement>(null);
  const containerRef = useRef<HTMLDivElement>(null);
  const { 
    layers, 
    currentTime, 
    selectedLayerId, 
    setSelectedLayerId,
    canvasZoom,
    setCanvasZoom,
    currentProject 
  } = useEditorState();
  
  const [canvasSize, setCanvasSize] = useState({ width: 1920, height: 1080 });

  // Initialize canvas size from project
  useEffect(() => {
    if (currentProject?.project_data.canvas) {
      setCanvasSize({
        width: currentProject.project_data.canvas.width,
        height: currentProject.project_data.canvas.height,
      });
    }
  }, [currentProject]);

  // Render canvas
  useEffect(() => {
    const canvas = canvasRef.current;
    if (!canvas) return;

    const ctx = canvas.getContext('2d');
    if (!ctx) return;

    // Clear canvas
    ctx.clearRect(0, 0, canvas.width, canvas.height);
    
    // Draw background
    ctx.fillStyle = currentProject?.project_data.canvas.background_color || '#000000';
    ctx.fillRect(0, 0, canvas.width, canvas.height);

    // Draw grid
    ctx.strokeStyle = 'rgba(255, 255, 255, 0.1)';
    ctx.lineWidth = 1;
    const gridSize = 50;
    for (let x = 0; x < canvas.width; x += gridSize) {
      ctx.beginPath();
      ctx.moveTo(x, 0);
      ctx.lineTo(x, canvas.height);
      ctx.stroke();
    }
    for (let y = 0; y < canvas.height; y += gridSize) {
      ctx.beginPath();
      ctx.moveTo(0, y);
      ctx.lineTo(canvas.width, y);
      ctx.stroke();
    }

    // Draw layers that are visible at current time
    const visibleLayers = layers
      .filter(layer => currentTime >= layer.start_time && currentTime <= layer.end_time)
      .sort((a, b) => a.z_index - b.z_index);

    visibleLayers.forEach(layer => {
      ctx.save();
      
      // Apply transformations
      ctx.globalAlpha = layer.opacity;
      ctx.translate(layer.position.x + layer.size.width / 2, layer.position.y + layer.size.height / 2);
      ctx.rotate((layer.rotation * Math.PI) / 180);
      ctx.translate(-(layer.position.x + layer.size.width / 2), -(layer.position.y + layer.size.height / 2));

      // Draw based on type
      if (layer.type === 'text' && layer.content) {
        ctx.fillStyle = layer.style?.color || '#ffffff';
        ctx.font = `${layer.style?.fontSize || 48}px ${layer.style?.fontFamily || 'Arial'}`;
        ctx.textAlign = 'left';
        ctx.textBaseline = 'top';
        ctx.fillText(layer.content, layer.position.x, layer.position.y);
      } else if (layer.type === 'shape') {
        ctx.fillStyle = layer.style?.fill || '#ffffff';
        ctx.fillRect(layer.position.x, layer.position.y, layer.size.width, layer.size.height);
      } else if (layer.type === 'image' || layer.type === 'video') {
        // Placeholder for media
        ctx.fillStyle = 'rgba(100, 100, 100, 0.5)';
        ctx.fillRect(layer.position.x, layer.position.y, layer.size.width, layer.size.height);
        ctx.strokeStyle = '#666';
        ctx.lineWidth = 2;
        ctx.strokeRect(layer.position.x, layer.position.y, layer.size.width, layer.size.height);
        
        // Draw label
        ctx.fillStyle = '#ffffff';
        ctx.font = '16px Arial';
        ctx.textAlign = 'center';
        ctx.fillText(
          layer.type.toUpperCase(),
          layer.position.x + layer.size.width / 2,
          layer.position.y + layer.size.height / 2
        );
      }

      // Draw selection border
      if (layer.id === selectedLayerId) {
        ctx.strokeStyle = '#3b82f6';
        ctx.lineWidth = 3;
        ctx.strokeRect(layer.position.x - 2, layer.position.y - 2, layer.size.width + 4, layer.size.height + 4);
        
        // Draw resize handles
        const handleSize = 8;
        ctx.fillStyle = '#3b82f6';
        const handles = [
          { x: layer.position.x - handleSize / 2, y: layer.position.y - handleSize / 2 },
          { x: layer.position.x + layer.size.width - handleSize / 2, y: layer.position.y - handleSize / 2 },
          { x: layer.position.x - handleSize / 2, y: layer.position.y + layer.size.height - handleSize / 2 },
          { x: layer.position.x + layer.size.width - handleSize / 2, y: layer.position.y + layer.size.height - handleSize / 2 },
        ];
        handles.forEach(handle => {
          ctx.fillRect(handle.x, handle.y, handleSize, handleSize);
        });
      }

      ctx.restore();
    });
  }, [layers, currentTime, selectedLayerId, currentProject, canvasSize]);

  // Handle click to select layer
  const handleCanvasClick = (e: React.MouseEvent<HTMLCanvasElement>) => {
    const canvas = canvasRef.current;
    if (!canvas) return;

    const rect = canvas.getBoundingClientRect();
    const scaleX = canvas.width / rect.width;
    const scaleY = canvas.height / rect.height;
    const x = (e.clientX - rect.left) * scaleX;
    const y = (e.clientY - rect.top) * scaleY;

    // Find clicked layer (reverse order to prioritize top layers)
    const visibleLayers = layers
      .filter(layer => currentTime >= layer.start_time && currentTime <= layer.end_time)
      .sort((a, b) => b.z_index - a.z_index);

    const clickedLayer = visibleLayers.find(layer => 
      x >= layer.position.x &&
      x <= layer.position.x + layer.size.width &&
      y >= layer.position.y &&
      y <= layer.position.y + layer.size.height
    );

    setSelectedLayerId(clickedLayer?.id || null);
  };

  return (
    <div className="flex flex-col h-full bg-muted/30">
      {/* Canvas Controls */}
      <div className="flex items-center justify-between p-2 border-b bg-background/95">
        <div className="flex items-center gap-2">
          <span className="text-sm text-muted-foreground">
            {canvasSize.width} x {canvasSize.height}
          </span>
        </div>
        <div className="flex items-center gap-2">
          <Button
            variant="ghost"
            size="icon"
            onClick={() => setCanvasZoom(canvasZoom - 0.1)}
          >
            <ZoomOut className="h-4 w-4" />
          </Button>
          <span className="text-sm font-medium min-w-[60px] text-center">
            {Math.round(canvasZoom * 100)}%
          </span>
          <Button
            variant="ghost"
            size="icon"
            onClick={() => setCanvasZoom(canvasZoom + 0.1)}
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

      {/* Canvas Container */}
      <div 
        ref={containerRef}
        className="flex-1 flex items-center justify-center p-8 overflow-auto"
      >
        <div 
          style={{ 
            transform: `scale(${canvasZoom})`,
            transformOrigin: 'center',
          }}
        >
          <canvas
            ref={canvasRef}
            width={canvasSize.width}
            height={canvasSize.height}
            className="border border-border shadow-2xl bg-background cursor-crosshair"
            onClick={handleCanvasClick}
          />
        </div>
      </div>
    </div>
  );
};
