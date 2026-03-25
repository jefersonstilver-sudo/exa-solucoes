import React from 'react';
import { Popover, PopoverContent, PopoverTrigger } from '@/components/ui/popover';
import { Button } from '@/components/ui/button';
import { FolderOpen, Plus, Check } from 'lucide-react';
import { OrderGroup } from '@/hooks/useOrderGroups';

interface MoveToGroupMenuProps {
  groups: OrderGroup[];
  currentGroupId?: string | null;
  onMove: (groupId: string | null) => void;
  onCreateNew: () => void;
  children?: React.ReactNode;
}

export const MoveToGroupMenu: React.FC<MoveToGroupMenuProps> = ({
  groups,
  currentGroupId,
  onMove,
  onCreateNew,
  children,
}) => {
  return (
    <Popover>
      <PopoverTrigger asChild>
        {children || (
          <Button variant="ghost" size="sm" className="text-xs min-h-[36px]">
            <FolderOpen className="h-3.5 w-3.5 mr-1" />
            Mover para grupo
          </Button>
        )}
      </PopoverTrigger>
      <PopoverContent className="w-56 p-2" align="start">
        <div className="space-y-1">
          <p className="text-xs font-medium text-muted-foreground px-2 py-1">Mover para</p>

          {/* Sem grupo */}
          <button
            className="w-full flex items-center gap-2 px-2 py-1.5 text-sm rounded-md hover:bg-muted transition-colors text-left"
            onClick={() => onMove(null)}
          >
            <div className="w-3 h-3 rounded-full bg-muted-foreground/30" />
            <span className="flex-1 truncate">Sem grupo</span>
            {!currentGroupId && <Check className="h-3.5 w-3.5 text-primary" />}
          </button>

          {groups.map((group) => (
            <button
              key={group.id}
              className="w-full flex items-center gap-2 px-2 py-1.5 text-sm rounded-md hover:bg-muted transition-colors text-left"
              onClick={() => onMove(group.id)}
            >
              <div
                className="w-3 h-3 rounded-full flex-shrink-0"
                style={{ backgroundColor: group.cor }}
              />
              <span className="flex-1 truncate">{group.nome}</span>
              {currentGroupId === group.id && <Check className="h-3.5 w-3.5 text-primary" />}
            </button>
          ))}

          <div className="border-t my-1" />
          <button
            className="w-full flex items-center gap-2 px-2 py-1.5 text-sm rounded-md hover:bg-muted transition-colors text-left text-primary"
            onClick={onCreateNew}
          >
            <Plus className="h-3.5 w-3.5" />
            <span>Novo grupo</span>
          </button>
        </div>
      </PopoverContent>
    </Popover>
  );
};
