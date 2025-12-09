import React from 'react';
import { Input } from '@/components/ui/input';
import { Search, X } from 'lucide-react';
import { cn } from '@/lib/utils';

interface MobileBuildingsFiltersProps {
  searchTerm: string;
  onSearchChange: (value: string) => void;
  statusFilter: string;
  onStatusFilterChange: (status: string) => void;
  totalCount: number;
  activeCount: number;
  inactiveCount: number;
}

const MobileBuildingsFilters: React.FC<MobileBuildingsFiltersProps> = ({
  searchTerm,
  onSearchChange,
  statusFilter,
  onStatusFilterChange,
  totalCount,
  activeCount,
  inactiveCount
}) => {
  const filters = [
    { key: 'all', label: 'Todos', count: totalCount },
    { key: 'ativo', label: 'Ativos', count: activeCount },
    { key: 'inativo', label: 'Inativos', count: inactiveCount },
  ];

  return (
    <div className="space-y-3">
      {/* Search Input */}
      <div className="relative">
        <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
        <Input
          placeholder="Buscar prédio..."
          value={searchTerm}
          onChange={(e) => onSearchChange(e.target.value)}
          className="pl-9 pr-9 h-10 bg-white/80 backdrop-blur-sm border-gray-200 rounded-xl"
        />
        {searchTerm && (
          <button
            onClick={() => onSearchChange('')}
            className="absolute right-3 top-1/2 -translate-y-1/2 text-muted-foreground hover:text-foreground"
          >
            <X className="h-4 w-4" />
          </button>
        )}
      </div>

      {/* Filter Pills */}
      <div className="flex gap-2 overflow-x-auto pb-1 -mx-1 px-1 scrollbar-hide">
        {filters.map((filter) => (
          <button
            key={filter.key}
            onClick={() => onStatusFilterChange(filter.key)}
            className={cn(
              "flex-shrink-0 px-3 py-1.5 rounded-full text-xs font-medium transition-all duration-200",
              statusFilter === filter.key
                ? "bg-[#9C1E1E] text-white shadow-sm"
                : "bg-white/80 text-muted-foreground border border-gray-200 hover:border-gray-300"
            )}
          >
            {filter.label}
            <span className="ml-1.5 opacity-70">{filter.count}</span>
          </button>
        ))}
      </div>
    </div>
  );
};

export default MobileBuildingsFilters;
