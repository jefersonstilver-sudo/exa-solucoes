import React, { useState } from 'react';
import { ChevronDown, ChevronUp } from 'lucide-react';
import { Card } from '@/components/ui/card';
import { cn } from '@/lib/utils';

interface CollapsibleCardProps {
  children: React.ReactNode;
  preview: React.ReactNode;
  className?: string;
  defaultExpanded?: boolean;
  borderColor?: string;
}

export const CollapsibleCard: React.FC<CollapsibleCardProps> = ({
  children,
  preview,
  className,
  defaultExpanded = false,
  borderColor = 'border-[#9C1E1E]',
}) => {
  const [isExpanded, setIsExpanded] = useState(defaultExpanded);

  return (
    <Card
      className={cn(
        'transition-all duration-300 cursor-pointer',
        isExpanded && `border-l-4 ${borderColor}`,
        className
      )}
      onClick={() => setIsExpanded(!isExpanded)}
    >
      <div className="p-4">
        {/* Preview Content */}
        <div className="space-y-2">
          {preview}
        </div>

        {/* Expanded Content */}
        {isExpanded && (
          <div className="mt-4 pt-4 border-t animate-fade-in">
            {children}
          </div>
        )}

        {/* Toggle Button */}
        <button
          className="w-full mt-3 flex items-center justify-center gap-2 text-sm text-muted-foreground hover:text-foreground transition-colors"
          onClick={(e) => {
            e.stopPropagation();
            setIsExpanded(!isExpanded);
          }}
        >
          <span>{isExpanded ? 'Recolher' : 'Expandir'}</span>
          {isExpanded ? (
            <ChevronUp className="h-4 w-4" />
          ) : (
            <ChevronDown className="h-4 w-4" />
          )}
        </button>
      </div>
    </Card>
  );
};
