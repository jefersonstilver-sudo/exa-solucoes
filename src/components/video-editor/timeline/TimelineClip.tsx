import React, { useState, useRef } from 'react';
import { useEditorState } from '@/hooks/video-editor/useEditorState';
import { TimelineLayer } from '@/types/videoEditor';
import { Film, Image, Type, Square } from 'lucide-react';
import { useTimelineSnap } from '@/hooks/video-editor/useTimelineSnap';
import { ClipContextMenu } from './ClipContextMenu';

interface TimelineClipProps {
  layer: TimelineLayer;
  pixelsPerSecond: number;
}

export const TimelineClip = ({ layer, pixelsPerSecond }: TimelineClipProps) => {
  const { selectedLayerId, setSelectedLayerId, updateLayer } = useEditorState();
  const { snapToNearestPoint } = useTimelineSnap();
  const [isDragging, setIsDragging] = useState(false);
  const [isResizing, setIsResizing] = useState<'left' | 'right' | null>(null);
  const dragStartX = useRef(0);
  const dragStartTime = useRef(0);
  const resizeStartTime = useRef(0);
  const resizeStartDuration = useRef(0);

  const handleMouseDown = (e: React.MouseEvent) => {
    if (e.button !== 0) return;
    setIsDragging(true);
    dragStartX.current = e.clientX;
    dragStartTime.current = layer.start_time;
    e.stopPropagation();
  };

  const handleMouseMove = (e: MouseEvent) => {
    if (isDragging) {
      const deltaX = e.clientX - dragStartX.current;
      const deltaTime = deltaX / pixelsPerSecond;
      let newStartTime = Math.max(0, dragStartTime.current + deltaTime);
      newStartTime = snapToNearestPoint(newStartTime, layer.id);
      
      updateLayer(layer.id, { 
        start_time: newStartTime,
        end_time: newStartTime + layer.duration 
      });
    } else if (isResizing) {
      const deltaX = e.clientX - dragStartX.current;
      const deltaTime = deltaX / pixelsPerSecond;
      
      if (isResizing === 'left') {
        let newStartTime = Math.max(0, resizeStartTime.current + deltaTime);
        newStartTime = snapToNearestPoint(newStartTime, layer.id);
        const newDuration = layer.end_time - newStartTime;
        
        if (newDuration > 0.1) {
          updateLayer(layer.id, {
            start_time: newStartTime,
            duration: newDuration
          });
        }
      } else if (isResizing === 'right') {
        const newDuration = Math.max(0.1, resizeStartDuration.current + deltaTime);
        let newEndTime = layer.start_time + newDuration;
        newEndTime = snapToNearestPoint(newEndTime, layer.id);
        
        updateLayer(layer.id, {
          end_time: newEndTime,
          duration: newEndTime - layer.start_time
        });
      }
    }
  };

  const handleMouseUp = () => {
    setIsDragging(false);
    setIsResizing(null);
  };

  const handleResizeStart = (e: React.MouseEvent, side: 'left' | 'right') => {
    e.stopPropagation();
    setIsResizing(side);
    dragStartX.current = e.clientX;
    resizeStartTime.current = layer.start_time;
    resizeStartDuration.current = layer.duration;
  };

  React.useEffect(() => {
    if (isDragging || isResizing) {
      window.addEventListener('mousemove', handleMouseMove);
      window.addEventListener('mouseup', handleMouseUp);
      return () => {
        window.removeEventListener('mousemove', handleMouseMove);
        window.removeEventListener('mouseup', handleMouseUp);
      };
    }
  }, [isDragging, isResizing]);
  
  const left = layer.start_time * pixelsPerSecond;
  const width = layer.duration * pixelsPerSecond;
  const isSelected = selectedLayerId === layer.id;

  const handleClick = (e: React.MouseEvent) => {
    e.stopPropagation();
    setSelectedLayerId(layer.id);
  };

  const getIcon = () => {
    switch (layer.type) {
      case 'video':
        return <Film className="h-3 w-3" />;
      case 'image':
        return <Image className="h-3 w-3" />;
      case 'text':
        return <Type className="h-3 w-3" />;
      case 'shape':
        return <Square className="h-3 w-3" />;
    }
  };

  const getColor = () => {
    switch (layer.type) {
      case 'video':
        return 'bg-blue-500/80';
      case 'image':
        return 'bg-green-500/80';
      case 'text':
        return 'bg-purple-500/80';
      case 'shape':
        return 'bg-orange-500/80';
    }
  };

  return (
    <ClipContextMenu layer={layer}>
      <div
        className={`
          absolute top-1 h-14 rounded select-none group
          ${getColor()}
          ${isSelected ? 'ring-2 ring-primary ring-offset-1' : ''}
          ${isDragging ? 'opacity-70 cursor-grabbing' : isResizing ? 'opacity-70' : 'hover:brightness-110'}
          transition-all flex items-center gap-2 px-2 overflow-hidden
          ${!isResizing ? 'cursor-move' : ''}
        `}
        style={{ left, width: Math.max(width, 40) }}
        onClick={handleClick}
        onMouseDown={handleMouseDown}
      >
        {/* Left Resize Handle */}
        <div
          className="absolute left-0 top-0 bottom-0 w-2 cursor-ew-resize hover:bg-white/20 opacity-0 group-hover:opacity-100 transition-opacity"
          onMouseDown={(e) => handleResizeStart(e, 'left')}
        />
        
        {getIcon()}
        <span className="text-xs text-white font-medium truncate">
          {layer.content || layer.type}
        </span>

        {/* Right Resize Handle */}
        <div
          className="absolute right-0 top-0 bottom-0 w-2 cursor-ew-resize hover:bg-white/20 opacity-0 group-hover:opacity-100 transition-opacity"
          onMouseDown={(e) => handleResizeStart(e, 'right')}
        />
      </div>
    </ClipContextMenu>
  );
};
