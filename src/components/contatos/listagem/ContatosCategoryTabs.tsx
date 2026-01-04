import React from 'react';
import { cn } from '@/lib/utils';
import { CATEGORIAS_CONFIG, CATEGORIAS_ORDER, CategoriaContato } from '@/types/contatos';
import { ScrollArea, ScrollBar } from '@/components/ui/scroll-area';

interface ContatosCategoryTabsProps {
  selectedCategory: CategoriaContato | null;
  onSelectCategory: (category: CategoriaContato | null) => void;
  counts: Record<string, number>;
}

export const ContatosCategoryTabs: React.FC<ContatosCategoryTabsProps> = ({
  selectedCategory,
  onSelectCategory,
  counts
}) => {
  const totalCount = Object.values(counts).reduce((sum, c) => sum + c, 0);

  return (
    <ScrollArea className="w-full whitespace-nowrap">
      <div className="flex space-x-2 pb-3">
        {/* Tab "Todos" */}
        <button
          onClick={() => onSelectCategory(null)}
          className={cn(
            'flex items-center gap-2 px-3 py-1.5 rounded-md text-sm font-medium transition-colors',
            selectedCategory === null
              ? 'bg-primary text-primary-foreground shadow-sm ring-2 ring-offset-1 ring-primary ring-offset-background'
              : 'bg-muted hover:bg-muted/80 text-muted-foreground'
          )}
        >
          <span className="w-2 h-2 rounded-full bg-current opacity-70" />
          Todos ({totalCount})
        </button>

        {/* Tabs por categoria */}
        {CATEGORIAS_ORDER.map((cat) => {
          const config = CATEGORIAS_CONFIG[cat];
          const count = counts[cat] || 0;
          const isSelected = selectedCategory === cat;

          return (
            <button
              key={cat}
              onClick={() => onSelectCategory(cat)}
              className={cn(
                'flex items-center gap-2 px-3 py-1.5 rounded-md text-sm font-medium transition-colors whitespace-nowrap',
                isSelected
                  ? `${config.bgColor} text-white shadow-sm ring-2 ring-offset-1 ring-offset-background`
                  : 'bg-muted hover:bg-muted/80 text-muted-foreground'
              )}
              style={isSelected ? { '--tw-ring-color': config.bgColor.replace('bg-', '') } as any : undefined}
            >
              {config.label} ({count})
            </button>
          );
        })}
      </div>
      <ScrollBar orientation="horizontal" />
    </ScrollArea>
  );
};

export default ContatosCategoryTabs;
