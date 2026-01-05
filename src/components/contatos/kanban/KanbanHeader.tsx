import React from 'react';
import { Search, Filter, LayoutGrid, List, GitBranch, RefreshCw } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { 
  Select, 
  SelectContent, 
  SelectItem, 
  SelectTrigger, 
  SelectValue 
} from '@/components/ui/select';
import { ToggleGroup, ToggleGroupItem } from '@/components/ui/toggle-group';
import { Badge } from '@/components/ui/badge';
import { cn } from '@/lib/utils';
import type { KanbanGroupBy } from '@/hooks/contatos/useKanbanContatos';

interface KanbanHeaderProps {
  viewMode: 'list' | 'kanban';
  onViewModeChange: (mode: 'list' | 'kanban') => void;
  groupBy: KanbanGroupBy;
  onGroupByChange: (groupBy: KanbanGroupBy) => void;
  search: string;
  onSearchChange: (search: string) => void;
  onOpenFilters: () => void;
  activeFiltersCount: number;
  onRefresh: () => void;
  isRefreshing?: boolean;
  totalContacts: number;
}

export const KanbanHeader: React.FC<KanbanHeaderProps> = ({
  viewMode,
  onViewModeChange,
  groupBy,
  onGroupByChange,
  search,
  onSearchChange,
  onOpenFilters,
  activeFiltersCount,
  onRefresh,
  isRefreshing,
  totalContacts,
}) => {
  return (
    <div className="bg-white/60 backdrop-blur-sm rounded-xl border border-border/50 p-3 space-y-3">
      {/* Row 1: View Toggle + Group By + Actions */}
      <div className="flex flex-col md:flex-row md:items-center justify-between gap-3">
        <div className="flex items-center gap-3">
          {/* View Mode Toggle */}
          <ToggleGroup 
            type="single" 
            value={viewMode}
            onValueChange={(value) => value && onViewModeChange(value as 'list' | 'kanban')}
            className="bg-muted/50 p-0.5 rounded-lg"
          >
            <ToggleGroupItem 
              value="list" 
              aria-label="Lista"
              className={cn(
                "h-8 px-3 text-xs gap-1.5",
                viewMode === 'list' && "bg-white shadow-sm"
              )}
            >
              <List className="h-3.5 w-3.5" />
              Lista
            </ToggleGroupItem>
            <ToggleGroupItem 
              value="kanban" 
              aria-label="Kanban"
              className={cn(
                "h-8 px-3 text-xs gap-1.5",
                viewMode === 'kanban' && "bg-white shadow-sm"
              )}
            >
              <LayoutGrid className="h-3.5 w-3.5" />
              Kanban
            </ToggleGroupItem>
          </ToggleGroup>

          {/* Group By Selector (only in Kanban mode) */}
          {viewMode === 'kanban' && (
            <Select value={groupBy} onValueChange={(v) => onGroupByChange(v as KanbanGroupBy)}>
              <SelectTrigger className="w-[160px] h-8 text-xs bg-white">
                <GitBranch className="h-3.5 w-3.5 mr-1.5 text-muted-foreground" />
                <SelectValue placeholder="Agrupar por" />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="categoria">Por Categoria</SelectItem>
                <SelectItem value="temperatura">Por Temperatura</SelectItem>
                <SelectItem value="status">Por Status</SelectItem>
              </SelectContent>
            </Select>
          )}

          {/* Total Badge */}
          <Badge variant="outline" className="text-xs h-6 px-2">
            {totalContacts} contatos
          </Badge>
        </div>

        <div className="flex items-center gap-2">
          <Button
            variant="ghost"
            size="sm"
            onClick={onRefresh}
            disabled={isRefreshing}
            className="h-8 text-xs"
          >
            <RefreshCw className={cn("h-3.5 w-3.5 mr-1", isRefreshing && "animate-spin")} />
            Atualizar
          </Button>
        </div>
      </div>

      {/* Row 2: Search + Filters */}
      <div className="flex items-center gap-2">
        <div className="relative flex-1 max-w-md">
          <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 text-muted-foreground h-4 w-4" />
          <Input
            placeholder="Buscar por nome, empresa, telefone..."
            value={search}
            onChange={(e) => onSearchChange(e.target.value)}
            className="pl-9 h-9 text-sm bg-white"
          />
        </div>
        
        <Button 
          variant="outline" 
          size="sm" 
          onClick={onOpenFilters}
          className="h-9 text-xs relative"
        >
          <Filter className="h-3.5 w-3.5 mr-1" />
          Filtros
          {activeFiltersCount > 0 && (
            <span className="absolute -top-1 -right-1 w-4 h-4 bg-primary text-primary-foreground text-[10px] rounded-full flex items-center justify-center">
              {activeFiltersCount}
            </span>
          )}
        </Button>
      </div>
    </div>
  );
};
