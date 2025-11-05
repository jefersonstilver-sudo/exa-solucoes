import React from 'react';
import { X } from 'lucide-react';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';

interface FilterChip {
  key: string;
  label: string;
  value: string;
}

interface FilterChipsProps {
  chips: FilterChip[];
  onRemove: (key: string) => void;
  onClearAll?: () => void;
}

export const FilterChips: React.FC<FilterChipsProps> = ({
  chips,
  onRemove,
  onClearAll,
}) => {
  if (chips.length === 0) return null;

  return (
    <div className="flex items-center gap-2 overflow-x-auto px-4 py-2 bg-accent/50">
      <span className="text-xs text-muted-foreground font-medium whitespace-nowrap">
        Filtros:
      </span>
      {chips.map((chip) => (
        <Badge
          key={chip.key}
          variant="secondary"
          className="gap-1 whitespace-nowrap bg-[#9C1E1E]/10 text-[#9C1E1E] border border-[#9C1E1E]/20"
        >
          {chip.label}
          <Button
            variant="ghost"
            size="sm"
            onClick={() => onRemove(chip.key)}
            className="h-auto p-0 hover:bg-transparent"
          >
            <X className="h-3 w-3" />
          </Button>
        </Badge>
      ))}
      {chips.length > 1 && onClearAll && (
        <Button
          variant="ghost"
          size="sm"
          onClick={onClearAll}
          className="text-xs text-muted-foreground hover:text-foreground whitespace-nowrap"
        >
          Limpar tudo
        </Button>
      )}
    </div>
  );
};
