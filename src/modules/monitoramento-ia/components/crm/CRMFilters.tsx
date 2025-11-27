import React, { useState } from 'react';
import { Button } from '@/components/ui/button';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Popover, PopoverContent, PopoverTrigger } from '@/components/ui/popover';
import { Checkbox } from '@/components/ui/checkbox';
import { RefreshCw, Filter, ChevronDown, UserCircle, X } from 'lucide-react';
import { cn } from '@/lib/utils';
import { format, subDays, startOfDay, endOfDay } from 'date-fns';
import { ptBR } from 'date-fns/locale';
import { DateRange } from 'react-day-picker';
import { supabase } from '@/integrations/supabase/client';
import { toast } from 'sonner';
import { useContactTypes } from '../../hooks/useContactTypes';

interface CRMFiltersProps {
  filters: any;
  onFilterChange: (filters: any) => void;
  onRefresh: () => void;
}

export const CRMFilters = ({ filters, onFilterChange, onRefresh }: CRMFiltersProps) => {
  const [isOpen, setIsOpen] = useState(false);
  const [dateRange, setDateRange] = useState<DateRange | undefined>();
  const [datePreset, setDatePreset] = useState<string>('all');
  const { contactTypes } = useContactTypes();

  const handleDatePresetChange = (preset: string) => {
    setDatePreset(preset);
    const today = new Date();
    
    switch (preset) {
      case 'today':
        setDateRange({ from: startOfDay(today), to: endOfDay(today) });
        onFilterChange({ ...filters, dateFrom: startOfDay(today), dateTo: endOfDay(today) });
        break;
      case 'yesterday':
        const yesterday = subDays(today, 1);
        setDateRange({ from: startOfDay(yesterday), to: endOfDay(yesterday) });
        onFilterChange({ ...filters, dateFrom: startOfDay(yesterday), dateTo: endOfDay(yesterday) });
        break;
      case '7days':
        setDateRange({ from: subDays(today, 7), to: today });
        onFilterChange({ ...filters, dateFrom: subDays(today, 7), dateTo: today });
        break;
      case '30days':
        setDateRange({ from: subDays(today, 30), to: today });
        onFilterChange({ ...filters, dateFrom: subDays(today, 30), dateTo: today });
        break;
      case 'all':
        setDateRange(undefined);
        onFilterChange({ ...filters, dateFrom: undefined, dateTo: undefined });
        break;
    }
  };

  // Toggle de tipo de contato (múltiplo)
  const toggleContactType = (typeName: string) => {
    const currentTypes = filters.contactTypes || [];
    const isSelected = currentTypes.includes(typeName);
    
    if (isSelected) {
      onFilterChange({ 
        ...filters, 
        contactTypes: currentTypes.filter((t: string) => t !== typeName) 
      });
    } else {
      onFilterChange({ 
        ...filters, 
        contactTypes: [...currentTypes, typeName] 
      });
    }
  };

  // Contador de filtros ativos
  const activeFiltersCount = [
    filters.agentKey,
    filters.unreadOnly,
    filters.criticalOnly,
    filters.hotLeadsOnly,
    filters.sentiment,
    (filters.contactTypes && filters.contactTypes.length > 0)
  ].filter(Boolean).length;

  // Limpar todos os filtros
  const clearAllFilters = () => {
    onFilterChange({
      agentKey: undefined,
      unreadOnly: false,
      criticalOnly: false,
      hotLeadsOnly: false,
      awaitingOnly: false,
      sentiment: undefined,
      contactTypes: []
    });
  };

  return (
    <>
      {/* Botão Flutuante Elegante - Sempre visível */}
      <div className="fixed top-20 left-4 z-40">
        <Popover open={isOpen} onOpenChange={setIsOpen}>
          <PopoverTrigger asChild>
            <Button
              size="sm"
              className={cn(
                "h-9 px-3 gap-2 shadow-lg transition-all duration-300",
                isOpen 
                  ? "bg-[var(--exa-accent)] hover:bg-[var(--exa-accent-hover)] text-white" 
                  : activeFiltersCount > 0
                  ? "bg-[var(--exa-accent)] hover:bg-[var(--exa-accent-hover)] text-white"
                  : "bg-white hover:bg-gray-50 text-gray-700 border border-gray-200"
              )}
            >
              <Filter className="w-3.5 h-3.5" />
              <span className="text-xs font-medium">Filtros</span>
              {activeFiltersCount > 0 && (
                <span className={cn(
                  "ml-0.5 px-1.5 py-0.5 text-[10px] font-bold rounded-full",
                  isOpen || activeFiltersCount > 0 ? "bg-white/20 text-white" : "bg-gray-200 text-gray-700"
                )}>
                  {activeFiltersCount}
                </span>
              )}
              <ChevronDown className={cn(
                "w-3 h-3 transition-transform duration-200",
                isOpen && "rotate-180"
              )} />
            </Button>
          </PopoverTrigger>
          
          <PopoverContent 
            align="start" 
            className="w-[340px] p-3 bg-white border-gray-200 shadow-xl"
            sideOffset={8}
          >
            {/* Header com clear */}
            <div className="flex items-center justify-between mb-3 pb-2 border-b border-gray-100">
              <h3 className="text-sm font-semibold text-gray-900">Filtros Avançados</h3>
              <div className="flex items-center gap-1">
                {activeFiltersCount > 0 && (
                  <Button
                    variant="ghost"
                    size="sm"
                    onClick={clearAllFilters}
                    className="h-7 px-2 text-[11px] text-gray-600 hover:text-gray-900"
                  >
                    Limpar
                  </Button>
                )}
                <Button
                  variant="ghost"
                  size="sm"
                  onClick={onRefresh}
                  className="h-7 w-7 p-0"
                  title="Atualizar"
                >
                  <RefreshCw className="w-3.5 h-3.5" />
                </Button>
              </div>
            </div>

            <div className="space-y-3">
              {/* Filtros principais */}
              <div className="grid grid-cols-2 gap-2">
                <Select
                  value={filters.agentKey || 'all'}
                  onValueChange={(value) => onFilterChange({ ...filters, agentKey: value === 'all' ? undefined : value })}
                >
                  <SelectTrigger className="h-8 text-xs bg-gray-50 border-gray-200">
                    <SelectValue placeholder="Agente" />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="all">Todos</SelectItem>
                    <SelectItem value="sofia">🤖 Sofia</SelectItem>
                    <SelectItem value="eduardo">👤 Eduardo</SelectItem>
                  </SelectContent>
                </Select>

                <Select
                  value={filters.sentiment || 'all'}
                  onValueChange={(value) => onFilterChange({ ...filters, sentiment: value === 'all' ? undefined : value })}
                >
                  <SelectTrigger className="h-8 text-xs bg-gray-50 border-gray-200">
                    <SelectValue placeholder="Humor" />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="all">Todos</SelectItem>
                    <SelectItem value="positive">😊 Positivo</SelectItem>
                    <SelectItem value="neutral">😐 Neutro</SelectItem>
                    <SelectItem value="negative">😞 Negativo</SelectItem>
                  </SelectContent>
                </Select>
              </div>

              {/* Tipos de Contato - Seleção Múltipla */}
              <div className="space-y-2">
                <label className="text-xs font-medium text-gray-700 flex items-center gap-1.5">
                  <UserCircle className="w-3.5 h-3.5" />
                  Tipos de Contato
                </label>
                <div className="grid grid-cols-2 gap-2 max-h-[200px] overflow-y-auto p-2 bg-gray-50 rounded-lg border border-gray-200">
                  {contactTypes.map((type) => {
                    const isSelected = filters.contactTypes?.includes(type.name);
                    return (
                      <div
                        key={type.id}
                        onClick={() => toggleContactType(type.name)}
                        className={cn(
                          "flex items-center gap-2 p-2 rounded-md cursor-pointer transition-all",
                          isSelected 
                            ? "bg-[var(--exa-accent)]/10 border-2 border-[var(--exa-accent)]" 
                            : "bg-white border border-gray-200 hover:border-gray-300"
                        )}
                      >
                        <Checkbox 
                          checked={isSelected}
                          className="pointer-events-none"
                        />
                        <span className="text-sm">{type.icon}</span>
                        <span className="text-xs font-medium truncate flex-1">{type.label}</span>
                      </div>
                    );
                  })}
                </div>
                {filters.contactTypes && filters.contactTypes.length > 0 && (
                  <div className="flex flex-wrap gap-1 mt-2">
                    {filters.contactTypes.map((typeName: string) => {
                      const type = contactTypes.find(t => t.name === typeName);
                      return type ? (
                        <span 
                          key={typeName}
                          className="inline-flex items-center gap-1 px-2 py-0.5 bg-[var(--exa-accent)] text-white text-[10px] font-medium rounded-full"
                        >
                          {type.icon} {type.label}
                          <X 
                            className="w-3 h-3 cursor-pointer hover:bg-white/20 rounded-full" 
                            onClick={() => toggleContactType(typeName)}
                          />
                        </span>
                      ) : null;
                    })}
                  </div>
                )}
              </div>

              {/* Filtros rápidos */}
              <div className="flex flex-wrap gap-1.5 pt-2 border-t border-gray-100">
                <Button
                  variant={filters.unreadOnly ? 'default' : 'ghost'}
                  size="sm"
                  onClick={() => onFilterChange({ ...filters, unreadOnly: !filters.unreadOnly })}
                  className={cn(
                    'h-7 text-[11px] px-2.5',
                    filters.unreadOnly ? 'bg-[var(--exa-accent)] hover:bg-[var(--exa-accent-hover)] text-white' : 'text-gray-600 hover:bg-gray-100'
                  )}
                >
                  💬 Não lidas
                </Button>
                
                <Button
                  variant={filters.criticalOnly ? 'default' : 'ghost'}
                  size="sm"
                  onClick={() => onFilterChange({ ...filters, criticalOnly: !filters.criticalOnly })}
                  className={cn(
                    'h-7 text-[11px] px-2.5',
                    filters.criticalOnly ? 'bg-red-500 hover:bg-red-600 text-white' : 'text-gray-600 hover:bg-gray-100'
                  )}
                >
                  🔴 Críticas
                </Button>
                
                <Button
                  variant={filters.hotLeadsOnly ? 'default' : 'ghost'}
                  size="sm"
                  onClick={() => onFilterChange({ ...filters, hotLeadsOnly: !filters.hotLeadsOnly })}
                  className={cn(
                    'h-7 text-[11px] px-2.5',
                    filters.hotLeadsOnly ? 'bg-orange-500 hover:bg-orange-600 text-white' : 'text-gray-600 hover:bg-gray-100'
                  )}
                >
                  🔥 Hot Leads
                </Button>
              </div>
            </div>
          </PopoverContent>
        </Popover>
      </div>
    </>
  );
};
