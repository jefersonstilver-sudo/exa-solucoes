import React from 'react';

interface SidebarResizeHandleProps {
  onMouseDown: (e: React.MouseEvent) => void;
  onDoubleClick: () => void;
  isDragging: boolean;
}

export const SidebarResizeHandle = ({ 
  onMouseDown, 
  onDoubleClick,
  isDragging 
}: SidebarResizeHandleProps) => {
  return (
    <div
      className={`
        absolute right-0 top-0 bottom-0 w-1.5 z-50
        cursor-col-resize group
        transition-colors duration-200
        ${isDragging ? 'bg-amber-500/40' : 'bg-transparent hover:bg-red-500/20'}
      `}
      onMouseDown={onMouseDown}
      onDoubleClick={onDoubleClick}
      title="Arraste para redimensionar • Duplo clique para colapsar"
    >
      {/* Visual indicator pill */}
      <div 
        className={`
          absolute right-0 top-1/2 -translate-y-1/2 
          w-1 h-12 rounded-full
          transition-all duration-200 ease-out
          ${isDragging 
            ? 'bg-amber-500/70 scale-y-100' 
            : 'bg-red-500/40 scale-y-75 opacity-0 group-hover:opacity-100 group-hover:scale-y-100'
          }
        `}
      />
      
      {/* Wider invisible hit area */}
      <div className="absolute -left-1 -right-1 top-0 bottom-0" />
    </div>
  );
};

export default SidebarResizeHandle;
