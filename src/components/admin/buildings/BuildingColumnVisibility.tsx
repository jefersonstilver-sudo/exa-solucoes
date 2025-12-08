import React from 'react';
import { Button } from '@/components/ui/button';
import { Checkbox } from '@/components/ui/checkbox';
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuLabel,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from '@/components/ui/dropdown-menu';
import { Settings2, Eye, EyeOff, RotateCcw } from 'lucide-react';
import { useBuildingColumnVisibility, ALL_BUILDING_COLUMNS } from '@/hooks/useBuildingColumnVisibility';
import { ScrollArea } from '@/components/ui/scroll-area';

const CATEGORY_LABELS: Record<string, string> = {
  basic: 'Informações Básicas',
  status: 'Status',
  metrics: 'Métricas',
  contact: 'Contato',
  notion: 'Campos Notion',
};

const CATEGORY_ORDER = ['basic', 'status', 'metrics', 'contact', 'notion'];

export function BuildingColumnVisibility() {
  const {
    visibilityMap,
    loading,
    saving,
    toggleColumn,
    showAll,
    hideAll,
    resetToDefaults,
    isColumnVisible,
  } = useBuildingColumnVisibility();

  // Group columns by category
  const columnsByCategory = React.useMemo(() => {
    const grouped: Record<string, typeof ALL_BUILDING_COLUMNS> = {};
    
    ALL_BUILDING_COLUMNS.forEach(col => {
      if (!grouped[col.category]) {
        grouped[col.category] = [];
      }
      grouped[col.category].push(col);
    });
    
    return grouped;
  }, []);

  const visibleCount = ALL_BUILDING_COLUMNS.filter(col => isColumnVisible(col.key)).length;

  return (
    <DropdownMenu>
      <DropdownMenuTrigger asChild>
        <Button 
          variant="outline" 
          size="sm"
          className="h-8 gap-1.5 text-xs bg-white/80 backdrop-blur-sm border-border/50"
          disabled={loading}
        >
          <Settings2 className="h-3.5 w-3.5" />
          <span className="hidden sm:inline">Colunas</span>
          <span className="text-muted-foreground">({visibleCount}/{ALL_BUILDING_COLUMNS.length})</span>
        </Button>
      </DropdownMenuTrigger>
      <DropdownMenuContent 
        align="end" 
        className="w-72 bg-white/95 backdrop-blur-sm border-border/50 shadow-lg"
      >
        <DropdownMenuLabel className="flex items-center justify-between py-2">
          <span className="text-sm font-medium">Visibilidade de Colunas</span>
        </DropdownMenuLabel>
        
        <div className="flex items-center gap-1 px-2 pb-2">
          <Button
            variant="ghost"
            size="sm"
            className="h-7 text-xs flex-1 gap-1"
            onClick={showAll}
            disabled={saving}
          >
            <Eye className="h-3 w-3" />
            Mostrar Todas
          </Button>
          <Button
            variant="ghost"
            size="sm"
            className="h-7 text-xs flex-1 gap-1"
            onClick={hideAll}
            disabled={saving}
          >
            <EyeOff className="h-3 w-3" />
            Ocultar
          </Button>
          <Button
            variant="ghost"
            size="sm"
            className="h-7 w-7 p-0"
            onClick={resetToDefaults}
            disabled={saving}
            title="Restaurar padrão"
          >
            <RotateCcw className="h-3 w-3" />
          </Button>
        </div>
        
        <DropdownMenuSeparator />
        
        <ScrollArea className="h-[320px]">
          <div className="p-1">
            {CATEGORY_ORDER.map(category => {
              const columns = columnsByCategory[category];
              if (!columns || columns.length === 0) return null;
              
              return (
                <div key={category} className="mb-2">
                  <div className="px-2 py-1.5">
                    <span className="text-[10px] font-semibold text-muted-foreground uppercase tracking-wider">
                      {CATEGORY_LABELS[category]}
                    </span>
                  </div>
                  
                  {columns.map(col => (
                    <label
                      key={col.key}
                      className="flex items-center gap-2 px-2 py-1.5 hover:bg-accent/50 rounded-md cursor-pointer transition-colors"
                    >
                      <Checkbox
                        checked={isColumnVisible(col.key)}
                        onCheckedChange={() => toggleColumn(col.key)}
                        disabled={col.key === 'nome'} // Nome is always visible
                        className="h-3.5 w-3.5"
                      />
                      <span className="text-sm flex-1">{col.label}</span>
                      {col.key === 'nome' && (
                        <span className="text-[10px] text-muted-foreground">sempre visível</span>
                      )}
                    </label>
                  ))}
                </div>
              );
            })}
          </div>
        </ScrollArea>
      </DropdownMenuContent>
    </DropdownMenu>
  );
}
