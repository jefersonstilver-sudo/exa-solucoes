import React from 'react';
import { X, Search } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { RadioGroup, RadioGroupItem } from '@/components/ui/radio-group';
import {
  Sheet,
  SheetContent,
  SheetDescription,
  SheetHeader,
  SheetTitle,
} from '@/components/ui/sheet';
import { Badge } from '@/components/ui/badge';
import { Separator } from '@/components/ui/separator';

interface FilterOption {
  value: string;
  label: string;
  count?: number;
}

interface FilterCategory {
  id: string;
  title: string;
  options: FilterOption[];
}

interface MobileFilterSheetProps {
  isOpen: boolean;
  onClose: () => void;
  filters: {
    search?: string;
    status?: string;
    type?: string;
    period?: string;
    coupon?: string;
    [key: string]: any;
  };
  onFiltersChange: (filters: any) => void;
  categories: FilterCategory[];
  activeFiltersCount?: number;
}

export const MobileFilterSheet: React.FC<MobileFilterSheetProps> = ({
  isOpen,
  onClose,
  filters,
  onFiltersChange,
  categories,
  activeFiltersCount = 0,
}) => {
  const [localFilters, setLocalFilters] = React.useState(filters);

  React.useEffect(() => {
    setLocalFilters(filters);
  }, [filters, isOpen]);

  const handleApply = () => {
    onFiltersChange(localFilters);
    onClose();
  };

  const handleClearAll = () => {
    const clearedFilters = {
      search: '',
      status: 'all',
      type: 'all',
      period: 'current_month',
      coupon: 'all',
    };
    setLocalFilters(clearedFilters);
    onFiltersChange(clearedFilters);
  };

  const updateFilter = (key: string, value: any) => {
    setLocalFilters((prev) => ({ ...prev, [key]: value }));
  };

  return (
    <Sheet open={isOpen} onOpenChange={onClose}>
      <SheetContent 
        side="bottom" 
        className="h-[85vh] rounded-t-3xl bg-background p-0 overflow-hidden"
      >
        <div className="flex flex-col h-full">
          {/* Header - Clean glassmorphism style */}
          <SheetHeader className="px-4 py-3 border-b border-border/50 bg-white/95 backdrop-blur-xl">
            <div className="flex items-center justify-between">
              <div className="flex items-center gap-2.5">
                <SheetTitle className="text-foreground text-base font-semibold">
                  Filtros
                </SheetTitle>
                {activeFiltersCount > 0 && (
                  <Badge variant="secondary" className="bg-[#9C1E1E]/10 text-[#9C1E1E] text-[10px] h-5">
                    {activeFiltersCount}
                  </Badge>
                )}
              </div>
              <Button
                variant="ghost"
                size="sm"
                onClick={onClose}
                className="h-8 w-8 p-0 text-muted-foreground hover:bg-accent"
              >
                <X className="h-4 w-4" />
              </Button>
            </div>
            <SheetDescription className="text-muted-foreground text-xs">
              Refine sua busca
            </SheetDescription>
          </SheetHeader>

          {/* Content */}
          <div className="flex-1 overflow-y-auto px-4 py-3 space-y-4">
            {/* Search */}
            <div className="space-y-1.5">
              <Label className="text-xs font-medium text-muted-foreground">Busca Rápida</Label>
              <div className="relative">
                <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 h-3.5 w-3.5 text-muted-foreground" />
                <Input
                  placeholder="Buscar por ID, cliente, email..."
                  value={localFilters.search || ''}
                  onChange={(e) => updateFilter('search', e.target.value)}
                  className="pl-9 h-9 text-sm"
                />
              </div>
            </div>

            <Separator className="bg-border/50" />

            {/* Filter Categories */}
            {categories.map((category) => (
              <div key={category.id} className="space-y-2">
                <Label className="text-xs font-medium text-muted-foreground flex items-center gap-1.5">
                  {category.title}
                </Label>
                <RadioGroup
                  value={localFilters[category.id] || 'all'}
                  onValueChange={(value) => updateFilter(category.id, value)}
                  className="space-y-1"
                >
                  {category.options.map((option) => (
                    <div
                      key={option.value}
                      className="flex items-center justify-between space-x-2 p-2.5 rounded-lg hover:bg-accent/50 transition-colors"
                    >
                      <div className="flex items-center space-x-2.5 flex-1">
                        <RadioGroupItem value={option.value} id={`${category.id}-${option.value}`} className="h-4 w-4" />
                        <Label
                          htmlFor={`${category.id}-${option.value}`}
                          className="text-sm font-normal cursor-pointer flex-1"
                        >
                          {option.label}
                        </Label>
                      </div>
                      {option.count !== undefined && (
                        <Badge variant="secondary" className="text-[10px] h-5 bg-muted">
                          {option.count}
                        </Badge>
                      )}
                    </div>
                  ))}
                </RadioGroup>
                <Separator className="bg-border/30" />
              </div>
            ))}
          </div>

          {/* Footer Actions - Clean style */}
          <div className="border-t border-border/50 bg-white/95 backdrop-blur-xl p-3 space-y-2">
            <Button
              onClick={handleApply}
              className="w-full bg-[#9C1E1E] hover:bg-[#7A1818] text-white font-medium h-10"
            >
              Aplicar Filtros
            </Button>
            <Button
              onClick={handleClearAll}
              variant="ghost"
              className="w-full h-9 text-muted-foreground"
            >
              Limpar Tudo
            </Button>
          </div>
        </div>
      </SheetContent>
    </Sheet>
  );
};
