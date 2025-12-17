import React from 'react';

interface SidebarResizeHandleProps {
  onMouseDown: (e: React.MouseEvent) => void;
  onTouchStart: (e: React.TouchEvent) => void;
  isDragging: boolean;
}

export const SidebarResizeHandle = ({ 
  onMouseDown, 
  onTouchStart, 
  isDragging 
}: SidebarResizeHandleProps) => {
  return (
    <div
      onMouseDown={onMouseDown}
      onTouchStart={onTouchStart}
      className={`
        absolute right-0 top-0 bottom-0 w-2 z-50
        cursor-col-resize group
        touch-none
        ${isDragging ? 'bg-red-500/20' : 'bg-transparent hover:bg-red-500/10'}
      `}
      style={{
        transition: isDragging ? 'none' : 'background-color 150ms ease',
      }}
    >
      {/* Visual indicator line */}
      <div 
        className={`
          absolute right-0 top-0 bottom-0 w-[2px]
          ${isDragging 
            ? 'bg-red-500 shadow-[0_0_12px_rgba(239,68,68,0.6)]' 
            : 'bg-transparent group-hover:bg-red-500/60'
          }
        `}
        style={{
          transition: isDragging ? 'none' : 'all 200ms cubic-bezier(0.25, 0.1, 0.25, 1)',
        }}
      />
      
      {/* Drag handle indicator (3 dots) - visible on hover */}
      <div 
        className={`
          absolute top-1/2 -translate-y-1/2 right-0 
          flex flex-col gap-[3px] p-1
          transition-opacity duration-200
          ${isDragging ? 'opacity-100' : 'opacity-0 group-hover:opacity-100'}
        `}
      >
        <div className={`w-1 h-1 rounded-full ${isDragging ? 'bg-red-400' : 'bg-red-400/70'}`} />
        <div className={`w-1 h-1 rounded-full ${isDragging ? 'bg-red-400' : 'bg-red-400/70'}`} />
        <div className={`w-1 h-1 rounded-full ${isDragging ? 'bg-red-400' : 'bg-red-400/70'}`} />
      </div>

      {/* Expanded touch target area for mobile */}
      <div 
        className="absolute -left-2 -right-2 top-0 bottom-0 md:hidden"
        onTouchStart={onTouchStart}
      />
    </div>
  );
};

export default SidebarResizeHandle;
