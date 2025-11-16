import React, { useState, useRef } from 'react';
import { TimelineLayer } from '@/types/videoEditor';
import { useEditorState } from '@/hooks/video-editor/useEditorState';

interface CanvasElementProps {
  layer: TimelineLayer;
  isSelected: boolean;
  zoom: number;
}

export const CanvasElement = ({ layer, isSelected, zoom }: CanvasElementProps) => {
  const { updateLayer } = useEditorState();
  const [isDragging, setIsDragging] = useState(false);
  const dragStart = useRef({ x: 0, y: 0 });
  const posStart = useRef({ x: 0, y: 0 });

  const handleMouseDown = (e: React.MouseEvent) => {
    if (e.button !== 0) return;
    e.stopPropagation();
    setIsDragging(true);
    dragStart.current = { x: e.clientX, y: e.clientY };
    posStart.current = layer.position;
  };

  const handleMouseMove = (e: MouseEvent) => {
    if (!isDragging) return;
    const dx = (e.clientX - dragStart.current.x) / zoom;
    const dy = (e.clientY - dragStart.current.y) / zoom;
    updateLayer(layer.id, {
      position: {
        x: posStart.current.x + dx,
        y: posStart.current.y + dy,
      },
    });
  };

  const handleMouseUp = () => {
    setIsDragging(false);
  };

  React.useEffect(() => {
    if (isDragging) {
      window.addEventListener('mousemove', handleMouseMove);
      window.addEventListener('mouseup', handleMouseUp);
      return () => {
        window.removeEventListener('mousemove', handleMouseMove);
        window.removeEventListener('mouseup', handleMouseUp);
      };
    }
  }, [isDragging]);

  return (
    <div
      className={`absolute ${isDragging ? 'cursor-grabbing' : 'cursor-grab'}`}
      style={{
        left: layer.position.x * zoom,
        top: layer.position.y * zoom,
        width: layer.size.width * zoom,
        height: layer.size.height * zoom,
        transform: `rotate(${layer.rotation}deg)`,
        opacity: layer.opacity,
      }}
      onMouseDown={handleMouseDown}
    >
      {isSelected && (
        <div className="absolute inset-0 border-2 border-primary pointer-events-none">
          <div className="absolute -top-1 -left-1 w-2 h-2 bg-primary rounded-full" />
          <div className="absolute -top-1 -right-1 w-2 h-2 bg-primary rounded-full" />
          <div className="absolute -bottom-1 -left-1 w-2 h-2 bg-primary rounded-full" />
          <div className="absolute -bottom-1 -right-1 w-2 h-2 bg-primary rounded-full" />
        </div>
      )}
    </div>
  );
};
