import React, { useState, useRef } from 'react';
import { useEditorState } from '@/hooks/video-editor/useEditorState';
import { X, Flag } from 'lucide-react';
import { Button } from '@/components/ui/button';

interface TimelineMarkerProps {
  markerId: string;
  pixelsPerSecond: number;
}

export const TimelineMarker = ({ markerId, pixelsPerSecond }: TimelineMarkerProps) => {
  const { markers, updateMarker, removeMarker } = useEditorState();
  const marker = markers.find(m => m.id === markerId);
  const [isDragging, setIsDragging] = useState(false);
  const dragStartX = useRef(0);
  const dragStartTime = useRef(0);

  if (!marker) return null;

  const handleMouseDown = (e: React.MouseEvent) => {
    if (e.button !== 0) return;
    e.stopPropagation();
    setIsDragging(true);
    dragStartX.current = e.clientX;
    dragStartTime.current = marker.time;
  };

  const handleMouseMove = (e: MouseEvent) => {
    if (!isDragging) return;
    const deltaX = e.clientX - dragStartX.current;
    const deltaTime = deltaX / pixelsPerSecond;
    const newTime = Math.max(0, dragStartTime.current + deltaTime);
    updateMarker(marker.id, { time: newTime });
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

  const left = marker.time * pixelsPerSecond;

  return (
    <div
      className="absolute top-0 bottom-0 w-px cursor-ew-resize z-20 group"
      style={{ left }}
      onMouseDown={handleMouseDown}
    >
      {/* Line */}
      <div 
        className={`w-px h-full ${marker.color || 'bg-yellow-500'} opacity-70 group-hover:opacity-100`}
      />
      
      {/* Flag */}
      <div 
        className={`absolute top-0 -left-2 flex items-center gap-1 ${marker.color || 'bg-yellow-500'} text-white px-1.5 py-0.5 rounded-sm text-xs font-medium shadow-lg opacity-0 group-hover:opacity-100 transition-opacity`}
      >
        <Flag className="h-3 w-3" />
        <span>{marker.label}</span>
        <Button
          variant="ghost"
          size="icon"
          className="h-4 w-4 p-0 hover:bg-white/20"
          onClick={(e) => {
            e.stopPropagation();
            removeMarker(marker.id);
          }}
        >
          <X className="h-3 w-3" />
        </Button>
      </div>
    </div>
  );
};
