import React from 'react';
import { Input } from '@/components/ui/input';
import { Search, Building2, CheckCircle, XCircle, Wrench, Clock } from 'lucide-react';

interface BuildingsFilters3Props {
  searchTerm: string;
  onSearchChange: (term: string) => void;
  filters: {
    status: string;
    bairro: string;
    padrao_publico: string;
  };
  onFiltersChange: (filters: any) => void;
  buildings: any[];
}

const BuildingsFilters3: React.FC<BuildingsFilters3Props> = ({
  searchTerm,
  onSearchChange,
  filters,
  onFiltersChange,
  buildings
}) => {
  const statusCounts = {
    all: buildings.length,
    ativo: buildings.filter(b => b.status === 'ativo').length,
    inativo: buildings.filter(b => b.status === 'inativo').length,
    manutencao: buildings.filter(b => b.status === 'manutenção').length,
    instalacao: buildings.filter(b => b.status === 'instalação').length,
  };

  const statusOptions = [
    { value: 'all', label: 'Todos', count: statusCounts.all, icon: Building2, color: 'gray' },
    { value: 'ativo', label: 'Ativos', count: statusCounts.ativo, icon: CheckCircle, color: 'emerald' },
    { value: 'inativo', label: 'Inativos', count: statusCounts.inativo, icon: XCircle, color: 'gray' },
    { value: 'manutenção', label: 'Manutenção', count: statusCounts.manutencao, icon: Wrench, color: 'amber' },
    { value: 'instalação', label: 'Instalação', count: statusCounts.instalacao, icon: Clock, color: 'blue' },
  ];

  return (
    <div className="bg-white/80 backdrop-blur-sm rounded-2xl border border-gray-100 p-4">
      <div className="flex flex-col sm:flex-row gap-4">
        {/* Search */}
        <div className="relative flex-1 max-w-md">
          <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-gray-400" />
          <Input
            placeholder="Buscar por nome, endereço, bairro..."
            value={searchTerm}
            onChange={(e) => onSearchChange(e.target.value)}
            className="pl-9 h-9 bg-white border-gray-200 text-sm"
          />
        </div>

        {/* Status Pills */}
        <div className="flex items-center gap-2 overflow-x-auto pb-1 scrollbar-hide">
          {statusOptions.map((option) => {
            const isActive = filters.status === option.value;
            const Icon = option.icon;
            
            return (
              <button
                key={option.value}
                onClick={() => onFiltersChange({ ...filters, status: option.value })}
                className={`
                  flex items-center gap-1.5 px-3 py-1.5 rounded-full text-xs font-medium whitespace-nowrap
                  transition-all duration-200
                  ${isActive 
                    ? option.color === 'emerald'
                      ? 'bg-emerald-100 text-emerald-700 ring-1 ring-emerald-300'
                      : option.color === 'amber'
                      ? 'bg-amber-100 text-amber-700 ring-1 ring-amber-300'
                      : option.color === 'blue'
                      ? 'bg-blue-100 text-blue-700 ring-1 ring-blue-300'
                      : 'bg-gray-100 text-gray-700 ring-1 ring-gray-300'
                    : 'bg-gray-50 text-gray-600 hover:bg-gray-100'
                  }
                `}
              >
                <Icon className="h-3 w-3" />
                {option.label}
                <span className={`
                  px-1.5 py-0.5 rounded-full text-[10px]
                  ${isActive ? 'bg-white/50' : 'bg-gray-200/50'}
                `}>
                  {option.count}
                </span>
              </button>
            );
          })}
        </div>
      </div>
    </div>
  );
};

export default BuildingsFilters3;
