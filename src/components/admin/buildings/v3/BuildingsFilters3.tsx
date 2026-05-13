import React from 'react';
import { Input } from '@/components/ui/input';
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select';
import { Button } from '@/components/ui/button';
import {
  Search,
  Building2,
  CheckCircle,
  XCircle,
  Wrench,
  Clock,
  ArrowUpDown,
  X,
  EyeOff,
  Home,
} from 'lucide-react';

export type SortKey =
  | 'updated_desc'
  | 'created_desc'
  | 'name_asc'
  | 'audience_desc'
  | 'panels_desc';

export interface BuildingsFiltersState {
  status: string;
  airbnb: 'all' | 'with' | 'without';
  padrao_publico: string;
  paineis: 'all' | 'with' | 'without';
  device: 'all' | 'online' | 'offline' | 'none';
}

export const DEFAULT_BUILDINGS_FILTERS: BuildingsFiltersState = {
  status: 'all',
  airbnb: 'all',
  padrao_publico: 'all',
  paineis: 'all',
  device: 'all',
};

interface BuildingsFilters3Props {
  searchTerm: string;
  onSearchChange: (term: string) => void;
  filters: BuildingsFiltersState;
  onFiltersChange: (filters: BuildingsFiltersState) => void;
  sortBy: SortKey;
  onSortChange: (sort: SortKey) => void;
  buildings: any[];
}

const BuildingsFilters3: React.FC<BuildingsFilters3Props> = ({
  searchTerm,
  onSearchChange,
  filters,
  onFiltersChange,
  sortBy,
  onSortChange,
  buildings,
}) => {
  const statusCounts = {
    all: buildings.length,
    ativo: buildings.filter((b) => b.status === 'ativo').length,
    interno: buildings.filter((b) => b.status === 'interno').length,
    inativo: buildings.filter((b) => b.status === 'inativo').length,
    manutencao: buildings.filter((b) => b.status === 'manutencao' || b.status === 'manutenção').length,
    instalacao: buildings.filter((b) => b.status === 'instalacao' || b.status === 'instalação').length,
  };

  const airbnbCount = buildings.filter((b) => Boolean(b.tem_airbnb)).length;

  const statusOptions = [
    { value: 'all', label: 'Todos', count: statusCounts.all, icon: Building2, color: 'gray' },
    { value: 'ativo', label: 'Ativos', count: statusCounts.ativo, icon: CheckCircle, color: 'emerald' },
    { value: 'interno', label: 'Internos', count: statusCounts.interno, icon: EyeOff, color: 'purple' },
    { value: 'instalacao', label: 'Instalação', count: statusCounts.instalacao, icon: Clock, color: 'blue' },
    { value: 'manutencao', label: 'Manutenção', count: statusCounts.manutencao, icon: Wrench, color: 'amber' },
    { value: 'inativo', label: 'Inativos', count: statusCounts.inativo, icon: XCircle, color: 'gray' },
  ];

  const airbnbCycle: Record<BuildingsFiltersState['airbnb'], BuildingsFiltersState['airbnb']> = {
    all: 'with',
    with: 'without',
    without: 'all',
  };
  const airbnbLabel =
    filters.airbnb === 'all' ? 'Airbnb: Todos' : filters.airbnb === 'with' ? 'Com Airbnb' : 'Sem Airbnb';

  const hasActiveFilters =
    filters.status !== 'all' ||
    filters.airbnb !== 'all' ||
    filters.padrao_publico !== 'all' ||
    filters.paineis !== 'all' ||
    filters.device !== 'all';

  const clearAll = () => onFiltersChange(DEFAULT_BUILDINGS_FILTERS);

  return (
    <div className="bg-white/80 backdrop-blur-sm rounded-2xl border border-gray-100 p-4 space-y-3">
      {/* Linha 1: busca + ordenação */}
      <div className="flex flex-col sm:flex-row gap-3">
        <div className="relative flex-1 max-w-md">
          <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-gray-400" />
          <Input
            placeholder="Buscar por nome, endereço, bairro..."
            value={searchTerm}
            onChange={(e) => onSearchChange(e.target.value)}
            className="pl-9 h-9 bg-white border-gray-200 text-sm"
          />
        </div>

        <div className="flex items-center gap-2 sm:ml-auto">
          <ArrowUpDown className="h-4 w-4 text-gray-400" />
          <Select value={sortBy} onValueChange={(v) => onSortChange(v as SortKey)}>
            <SelectTrigger className="h-9 w-[220px] bg-white border-gray-200 text-sm">
              <SelectValue />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="updated_desc">Atualizado recentemente</SelectItem>
              <SelectItem value="created_desc">Mais recentes</SelectItem>
              <SelectItem value="name_asc">Nome (A→Z)</SelectItem>
              <SelectItem value="audience_desc">Maior público estimado</SelectItem>
              <SelectItem value="panels_desc">Mais painéis ativos</SelectItem>
            </SelectContent>
          </Select>
        </div>
      </div>

      {/* Linha 2: status pills (mantém destaque visual) */}
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
                ${
                  isActive
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
              <span
                className={`
                  px-1.5 py-0.5 rounded-full text-[10px]
                  ${isActive ? 'bg-white/50' : 'bg-gray-200/50'}
                `}
              >
                {option.count}
              </span>
            </button>
          );
        })}
      </div>

      {/* Linha 3: filtros refinados */}
      <div className="flex flex-wrap items-center gap-2">
        <Select
          value={filters.airbnb}
          onValueChange={(v) => onFiltersChange({ ...filters, airbnb: v as any })}
        >
          <SelectTrigger className="h-8 w-auto min-w-[140px] bg-white border-gray-200 text-xs">
            <SelectValue placeholder="Airbnb" />
          </SelectTrigger>
          <SelectContent>
            <SelectItem value="all">Airbnb: Todos</SelectItem>
            <SelectItem value="with">Com Airbnb</SelectItem>
            <SelectItem value="without">Sem Airbnb</SelectItem>
          </SelectContent>
        </Select>

        <Select
          value={filters.padrao_publico}
          onValueChange={(v) => onFiltersChange({ ...filters, padrao_publico: v })}
        >
          <SelectTrigger className="h-8 w-auto min-w-[150px] bg-white border-gray-200 text-xs">
            <SelectValue placeholder="Padrão" />
          </SelectTrigger>
          <SelectContent>
            <SelectItem value="all">Padrão: Todos</SelectItem>
            <SelectItem value="alto">Alto</SelectItem>
            <SelectItem value="medio">Médio</SelectItem>
            <SelectItem value="normal">Normal</SelectItem>
          </SelectContent>
        </Select>

        <Select
          value={filters.paineis}
          onValueChange={(v) => onFiltersChange({ ...filters, paineis: v as any })}
        >
          <SelectTrigger className="h-8 w-auto min-w-[150px] bg-white border-gray-200 text-xs">
            <SelectValue placeholder="Painéis" />
          </SelectTrigger>
          <SelectContent>
            <SelectItem value="all">Painéis: Todos</SelectItem>
            <SelectItem value="with">Com painéis ativos</SelectItem>
            <SelectItem value="without">Sem painéis</SelectItem>
          </SelectContent>
        </Select>

        <Select
          value={filters.device}
          onValueChange={(v) => onFiltersChange({ ...filters, device: v as any })}
        >
          <SelectTrigger className="h-8 w-auto min-w-[150px] bg-white border-gray-200 text-xs">
            <SelectValue placeholder="Device" />
          </SelectTrigger>
          <SelectContent>
            <SelectItem value="all">Device: Todos</SelectItem>
            <SelectItem value="online">Online</SelectItem>
            <SelectItem value="offline">Offline</SelectItem>
            <SelectItem value="none">Sem device</SelectItem>
          </SelectContent>
        </Select>

        {hasActiveFilters && (
          <Button
            variant="ghost"
            size="sm"
            onClick={clearAll}
            className="h-8 text-xs text-gray-500 hover:text-gray-700"
          >
            <X className="h-3 w-3 mr-1" />
            Limpar filtros
          </Button>
        )}
      </div>
    </div>
  );
};

export default BuildingsFilters3;
