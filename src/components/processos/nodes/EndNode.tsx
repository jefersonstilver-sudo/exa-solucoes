import React, { memo } from 'react';
import { Handle, Position, NodeProps } from '@xyflow/react';
import { StopCircle } from 'lucide-react';

const EndNode = memo(({ data, selected }: NodeProps) => {
  return (
    <div 
      className={`
        flex items-center justify-center
        w-16 h-16 rounded-full
        bg-gradient-to-br from-red-400 to-red-600
        shadow-lg shadow-red-200
        transition-all duration-200
        ${selected ? 'ring-4 ring-red-300 ring-opacity-50 scale-110' : ''}
      `}
    >
      <Handle
        type="target"
        position={Position.Top}
        className="w-3 h-3 !bg-red-600 !border-2 !border-white"
      />
      <StopCircle className="h-6 w-6 text-white" />
    </div>
  );
});

EndNode.displayName = 'EndNode';

export default EndNode;
