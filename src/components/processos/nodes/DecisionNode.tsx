import React, { memo } from 'react';
import { Handle, Position, NodeProps } from '@xyflow/react';
import { HelpCircle } from 'lucide-react';

const DecisionNode = memo(({ data, selected }: NodeProps) => {
  const label = typeof data?.label === 'string' ? data.label : 'Decisão';

  return (
    <div 
      className={`
        relative
        w-32 h-32
        transition-all duration-200
        ${selected ? 'scale-110' : ''}
      `}
    >
      {/* Diamond shape using CSS transform */}
      <div 
        className={`
          absolute inset-2
          bg-gradient-to-br from-amber-400 to-amber-600
          shadow-lg shadow-amber-200
          transform rotate-45
          rounded-lg
          ${selected ? 'ring-4 ring-amber-300 ring-opacity-50' : ''}
        `}
      />
      
      {/* Content (counter-rotated) */}
      <div className="absolute inset-0 flex items-center justify-center">
        <div className="text-center">
          <HelpCircle className="h-5 w-5 text-white mx-auto mb-1" />
          <span className="text-xs font-medium text-white px-2 line-clamp-2">
            {label}
          </span>
        </div>
      </div>

      <Handle
        type="target"
        position={Position.Top}
        className="w-3 h-3 !bg-amber-600 !border-2 !border-white"
      />
      
      {/* Left handle for "No" */}
      <Handle
        type="source"
        position={Position.Left}
        id="no"
        className="w-3 h-3 !bg-red-500 !border-2 !border-white"
      />
      
      {/* Right handle for "Yes" */}
      <Handle
        type="source"
        position={Position.Right}
        id="yes"
        className="w-3 h-3 !bg-emerald-500 !border-2 !border-white"
      />
      
      {/* Bottom handle (default) */}
      <Handle
        type="source"
        position={Position.Bottom}
        id="default"
        className="w-3 h-3 !bg-amber-600 !border-2 !border-white"
      />
    </div>
  );
});

DecisionNode.displayName = 'DecisionNode';

export default DecisionNode;
