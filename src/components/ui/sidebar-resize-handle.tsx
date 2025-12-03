import * as React from 'react';
import { cn } from '@/lib/utils';

interface SidebarResizeHandleProps {
  onMouseDown: (e: React.MouseEvent) => void;
  isDragging: boolean;
  className?: string;
}

export function SidebarResizeHandle({ 
  onMouseDown, 
  isDragging,
  className 
}: SidebarResizeHandleProps) {
  return (
    <div
      onMouseDown={onMouseDown}
      className={cn(
        "absolute top-0 right-0 w-1 h-full cursor-col-resize z-50 group/handle",
        "transition-all duration-150 ease-out",
        // Visual indicator
        "after:absolute after:inset-y-0 after:right-0 after:w-0.5",
        "after:bg-transparent after:transition-all after:duration-150",
        // Hover state
        "hover:after:bg-red-500/30 hover:after:w-1",
        // Dragging state
        isDragging && "after:bg-red-500/60 after:w-1.5 after:shadow-[0_0_8px_rgba(239,68,68,0.5)]",
        className
      )}
      style={{
        // Larger hit area for easier grabbing
        width: '8px',
        marginRight: '-4px'
      }}
    >
      {/* Center grip indicator - only visible on hover */}
      <div className={cn(
        "absolute top-1/2 right-0 -translate-y-1/2 w-1 h-8 rounded-full",
        "bg-red-500/0 transition-all duration-200",
        "group-hover/handle:bg-red-500/40",
        isDragging && "bg-red-500/60 h-12"
      )} />
    </div>
  );
}
