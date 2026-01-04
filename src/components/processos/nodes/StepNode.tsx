import React, { memo } from 'react';
import { Handle, Position, NodeProps } from '@xyflow/react';
import { FileText } from 'lucide-react';

const StepNode = memo(({ data, selected }: NodeProps) => {
  const label = typeof data?.label === 'string' ? data.label : 'Etapa';
  const description = typeof data?.description === 'string' ? data.description : '';

  return (
    <div 
      className={`
        min-w-[180px] max-w-[280px]
        bg-white rounded-2xl
        border-2 border-blue-200
        shadow-lg shadow-blue-100/50
        transition-all duration-200
        ${selected ? 'ring-4 ring-blue-300 ring-opacity-50 scale-105 border-blue-400' : ''}
      `}
    >
      <Handle
        type="target"
        position={Position.Top}
        className="w-3 h-3 !bg-blue-500 !border-2 !border-white"
      />
      
      <div className="p-4">
        <div className="flex items-start gap-3">
          <div className="p-2 rounded-xl bg-blue-50">
            <FileText className="h-4 w-4 text-blue-600" />
          </div>
          <div className="flex-1 min-w-0">
            <h3 className="font-medium text-gray-900 text-sm truncate">
              {label}
            </h3>
            {description && (
              <p className="text-xs text-gray-500 mt-1 line-clamp-2">
                {description}
              </p>
            )}
          </div>
        </div>
      </div>

      <Handle
        type="source"
        position={Position.Bottom}
        className="w-3 h-3 !bg-blue-500 !border-2 !border-white"
      />
    </div>
  );
});

StepNode.displayName = 'StepNode';

export default StepNode;
