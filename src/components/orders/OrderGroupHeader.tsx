import React, { useState } from 'react';
import { ChevronDown, ChevronRight, Pencil, Trash2, GripVertical } from 'lucide-react';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { cn } from '@/lib/utils';
import { OrderGroup } from '@/hooks/useOrderGroups';

interface OrderGroupHeaderProps {
  group: OrderGroup | null; // null = "Sem grupo"
  count: number;
  isExpanded: boolean;
  onToggle: () => void;
  onEdit?: (group: OrderGroup) => void;
  onDelete?: (groupId: string) => void;
  isDragOver?: boolean;
  onDragOver?: (e: React.DragEvent) => void;
  onDragLeave?: (e: React.DragEvent) => void;
  onDrop?: (e: React.DragEvent) => void;
}

export const OrderGroupHeader: React.FC<OrderGroupHeaderProps> = ({
  group,
  count,
  isExpanded,
  onToggle,
  onEdit,
  onDelete,
  isDragOver,
  onDragOver,
  onDragLeave,
  onDrop,
}) => {
  const color = group?.cor || '#6B7280';
  const name = group?.nome || 'Sem grupo';

  return (
    <div
      className={cn(
        'flex items-center justify-between px-4 py-3 rounded-lg border transition-all cursor-pointer',
        'hover:bg-muted/40',
        isDragOver && 'ring-2 ring-primary bg-primary/5'
      )}
      style={{ borderLeftColor: color, borderLeftWidth: '4px' }}
      onClick={onToggle}
      onDragOver={onDragOver}
      onDragLeave={onDragLeave}
      onDrop={onDrop}
    >
      <div className="flex items-center gap-2 min-w-0">
        {isExpanded ? (
          <ChevronDown className="h-4 w-4 text-muted-foreground flex-shrink-0" />
        ) : (
          <ChevronRight className="h-4 w-4 text-muted-foreground flex-shrink-0" />
        )}
        <div
          className="w-3 h-3 rounded-full flex-shrink-0"
          style={{ backgroundColor: color }}
        />
        <span className="font-semibold text-sm text-foreground truncate">{name}</span>
        <Badge variant="secondary" className="text-xs flex-shrink-0">
          {count}
        </Badge>
      </div>

      {group && (
        <div className="flex items-center gap-1" onClick={(e) => e.stopPropagation()}>
          {onEdit && (
            <Button
              variant="ghost"
              size="icon"
              className="h-7 w-7"
              onClick={() => onEdit(group)}
            >
              <Pencil className="h-3.5 w-3.5" />
            </Button>
          )}
          {onDelete && (
            <Button
              variant="ghost"
              size="icon"
              className="h-7 w-7 text-destructive hover:text-destructive"
              onClick={() => onDelete(group.id)}
            >
              <Trash2 className="h-3.5 w-3.5" />
            </Button>
          )}
        </div>
      )}
    </div>
  );
};
