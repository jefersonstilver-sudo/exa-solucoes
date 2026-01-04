import React, { memo } from 'react';
import { Handle, Position, NodeProps } from '@xyflow/react';
import { Play } from 'lucide-react';

const StartNode = memo(({ data, selected }: NodeProps) => {
  return (
    <div 
      className={`
        flex items-center justify-center
        w-16 h-16 rounded-full
        bg-gradient-to-br from-emerald-400 to-emerald-600
        shadow-lg shadow-emerald-200
        transition-all duration-200
        ${selected ? 'ring-4 ring-emerald-300 ring-opacity-50 scale-110' : ''}
      `}
    >
      <Play className="h-6 w-6 text-white ml-0.5" />
      <Handle
        type="source"
        position={Position.Bottom}
        className="w-3 h-3 !bg-emerald-600 !border-2 !border-white"
      />
    </div>
  );
});

StartNode.displayName = 'StartNode';

export default StartNode;
