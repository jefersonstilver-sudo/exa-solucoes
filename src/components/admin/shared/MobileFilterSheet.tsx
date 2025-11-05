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
          {/* Header */}
          <SheetHeader className="px-6 py-4 border-b bg-gradient-to-r from-[#9C1E1E] to-[#DC2626] text-white">
            <div className="flex items-center justify-between">
              <div className="flex items-center gap-3">
                <SheetTitle className="text-white text-lg font-semibold">
                  Filtros
                </SheetTitle>
                {activeFiltersCount > 0 && (
                  <Badge variant="secondary" className="bg-white text-[#9C1E1E]">
                    {activeFiltersCount}
                  </Badge>
                )}
              </div>
              <Button
                variant="ghost"
                size="sm"
                onClick={onClose}
                className="text-white hover:bg-white/20"
              >
                <X className="h-5 w-5" />
              </Button>
            </div>
            <SheetDescription className="text-white/80 text-sm">
              Refine sua busca com os filtros abaixo
            </SheetDescription>
          </SheetHeader>

          {/* Content */}
          <div className="flex-1 overflow-y-auto px-6 py-4 space-y-6">
            {/* Search */}
            <div className="space-y-2">
              <Label className="text-sm font-medium">Busca Rápida</Label>
              <div className="relative">
                <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 h-4 w-4 text-muted-foreground" />
                <Input
                  placeholder="Buscar por ID, cliente, email..."
                  value={localFilters.search || ''}
                  onChange={(e) => updateFilter('search', e.target.value)}
                  className="pl-10"
                />
              </div>
            </div>

            <Separator />

            {/* Filter Categories */}
            {categories.map((category) => (
              <div key={category.id} className="space-y-3">
                <Label className="text-sm font-medium flex items-center gap-2">
                  {category.title}
                </Label>
                <RadioGroup
                  value={localFilters[category.id] || 'all'}
                  onValueChange={(value) => updateFilter(category.id, value)}
                  className="space-y-2"
                >
                  {category.options.map((option) => (
                    <div
                      key={option.value}
                      className="flex items-center justify-between space-x-2 p-3 rounded-lg hover:bg-accent transition-colors"
                    >
                      <div className="flex items-center space-x-3 flex-1">
                        <RadioGroupItem value={option.value} id={`${category.id}-${option.value}`} />
                        <Label
                          htmlFor={`${category.id}-${option.value}`}
                          className="text-sm font-normal cursor-pointer flex-1"
                        >
                          {option.label}
                        </Label>
                      </div>
                      {option.count !== undefined && (
                        <Badge variant="secondary" className="text-xs">
                          {option.count}
                        </Badge>
                      )}
                    </div>
                  ))}
                </RadioGroup>
                <Separator />
              </div>
            ))}
          </div>

          {/* Footer Actions */}
          <div className="border-t bg-background p-4 space-y-2">
            <Button
              onClick={handleApply}
              className="w-full bg-gradient-to-r from-[#9C1E1E] to-[#DC2626] hover:from-[#7F1D1D] hover:to-[#9C1E1E] text-white font-semibold h-12"
            >
              Aplicar Filtros
            </Button>
            <Button
              onClick={handleClearAll}
              variant="outline"
              className="w-full"
            >
              Limpar Tudo
            </Button>
          </div>
        </div>
      </SheetContent>
    </Sheet>
  );
};
