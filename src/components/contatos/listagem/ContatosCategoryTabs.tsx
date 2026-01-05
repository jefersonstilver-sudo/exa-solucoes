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
            'flex items-center gap-2 px-4 py-2 rounded-xl text-xs font-medium transition-all duration-300',
            'backdrop-blur-sm border shadow-sm',
            selectedCategory === null
              ? 'bg-primary/90 text-primary-foreground border-primary/30 shadow-lg shadow-primary/20 scale-[1.02]'
              : 'bg-white/60 hover:bg-white/80 text-muted-foreground border-white/40 hover:shadow-md hover:scale-[1.01]'
          )}
        >
          <span className={cn(
            'w-1.5 h-1.5 rounded-full transition-colors',
            selectedCategory === null ? 'bg-white' : 'bg-muted-foreground/50'
          )} />
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
                'flex items-center gap-2 px-4 py-2 rounded-xl text-xs font-medium transition-all duration-300 whitespace-nowrap',
                'backdrop-blur-sm border shadow-sm',
                isSelected
                  ? `${config.bgColor} text-white border-white/20 shadow-lg scale-[1.02]`
                  : 'bg-white/60 hover:bg-white/80 text-muted-foreground border-white/40 hover:shadow-md hover:scale-[1.01]'
              )}
            >
              <span className={cn(
                'w-1.5 h-1.5 rounded-full transition-colors',
                isSelected ? 'bg-white/80' : config.bgColor.replace('bg-', 'bg-') + '/50'
              )} />
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
