import React, { useState } from 'react';
import { Button } from '@/components/ui/button';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Calendar } from '@/components/ui/calendar';
import { Popover, PopoverContent, PopoverTrigger } from '@/components/ui/popover';
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger,
  DropdownMenuSeparator,
  DropdownMenuLabel
} from '@/components/ui/dropdown-menu';
import { RefreshCw, Filter, ChevronDown, ChevronUp, CalendarIcon, Download, UserCircle } from 'lucide-react';
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
  const [isExpanded, setIsExpanded] = useState(false); // Inicia colapsado
  const [isImporting, setIsImporting] = useState(false);
  const [dateRange, setDateRange] = useState<DateRange | undefined>();
  const [datePreset, setDatePreset] = useState<string>('all');
  const { contactTypes } = useContactTypes();

  const handleImportHistorico = async () => {
    setIsImporting(true);
    try {
      const agentKey = filters.agentKey || 'all';
      const { data, error } = await supabase.functions.invoke('import-historico-zapi', {
        body: { agentKey }
      });

      if (error) throw error;

      toast.success(`${data.importedCount} conversas importadas com sucesso!`);
      onRefresh();
    } catch (error: any) {
      toast.error(`Erro ao importar: ${error.message}`);
    } finally {
      setIsImporting(false);
    }
  };

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

  const handleCustomDateRange = (range: DateRange | undefined) => {
    setDateRange(range);
    if (range?.from && range?.to) {
      setDatePreset('custom');
      onFilterChange({ ...filters, dateFrom: range.from, dateTo: range.to });
    }
  };

  // Contador de filtros ativos
  const activeFiltersCount = [
    filters.agentKey,
    filters.unreadOnly,
    filters.criticalOnly,
    filters.hotLeadsOnly,
    filters.sentiment,
    filters.contactType
  ].filter(Boolean).length;

  return (
    <div className={cn(
      "bg-white/50 backdrop-blur-sm border border-gray-200 rounded-xl overflow-hidden transition-all duration-300",
      isExpanded ? "shadow-md" : "shadow-sm"
    )}>
      {/* Header minimalista elegante */}
      <div className="flex items-center justify-between px-3 py-2.5">
        <div className="flex items-center gap-2 flex-1 min-w-0">
          {/* Botão de expansão elegante */}
          <Button
            variant="ghost"
            size="sm"
            onClick={() => setIsExpanded(!isExpanded)}
            className="h-7 px-2 gap-1.5 text-gray-600 hover:text-gray-900 hover:bg-gray-100 rounded-lg"
          >
            <Filter className="w-3.5 h-3.5" />
            <span className="text-xs font-medium">Filtros</span>
            {activeFiltersCount > 0 && (
              <span className="ml-1 px-1.5 py-0.5 text-[10px] font-semibold bg-[var(--exa-accent)] text-white rounded-full">
                {activeFiltersCount}
              </span>
            )}
            {isExpanded ? <ChevronUp className="w-3.5 h-3.5" /> : <ChevronDown className="w-3.5 h-3.5" />}
          </Button>
          
          {/* Badges minimalistas quando colapsado */}
          {!isExpanded && activeFiltersCount > 0 && (
            <div className="flex items-center gap-1.5 overflow-x-auto scrollbar-hide">
              {filters.agentKey && (
                <span className="text-[10px] px-2 py-0.5 rounded-full bg-gray-100 text-gray-700 whitespace-nowrap">
                  {filters.agentKey === 'sofia' ? '🤖 Sofia' : '👤 Eduardo'}
                </span>
              )}
              {filters.contactType && (
                <span className="text-[10px] px-2 py-0.5 rounded-full bg-gray-100 text-gray-700 whitespace-nowrap flex items-center gap-1">
                  {contactTypes.find(t => t.name === filters.contactType)?.icon || '📋'}
                  {contactTypes.find(t => t.name === filters.contactType)?.label || filters.contactType}
                </span>
              )}
              {filters.unreadOnly && (
                <span className="text-[10px] px-2 py-0.5 rounded-full bg-gray-100 text-gray-700 whitespace-nowrap">
                  💬 Não lidas
                </span>
              )}
              {filters.criticalOnly && (
                <span className="text-[10px] px-2 py-0.5 rounded-full bg-red-100 text-red-700 whitespace-nowrap">
                  🔴 Críticas
                </span>
              )}
            </div>
          )}
        </div>
        
        <Button
          variant="ghost"
          size="sm"
          onClick={onRefresh}
          className="h-7 w-7 p-0 text-gray-600 hover:text-gray-900 hover:bg-gray-100 rounded-lg flex-shrink-0"
          title="Atualizar"
        >
          <RefreshCw className="w-3.5 h-3.5" />
        </Button>
      </div>

      {/* Conteúdo dos filtros - expansível */}
      {isExpanded && (
        <div className="px-3 pb-3 pt-2 space-y-2.5 border-t border-gray-100 animate-in slide-in-from-top-2 duration-200">
          {/* Filtros principais em grid */}
          <div className="grid grid-cols-3 gap-2">
            {/* Agente */}
            <Select
              value={filters.agentKey || 'all'}
              onValueChange={(value) => onFilterChange({ ...filters, agentKey: value === 'all' ? undefined : value })}
            >
              <SelectTrigger className="bg-white border-gray-200 h-8 text-xs">
                <SelectValue placeholder="Agente" />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="all">Todos</SelectItem>
                <SelectItem value="sofia">🤖 Sofia</SelectItem>
                <SelectItem value="eduardo">👤 Eduardo</SelectItem>
              </SelectContent>
            </Select>

            {/* Sentimento */}
            <Select
              value={filters.sentiment || 'all'}
              onValueChange={(value) => onFilterChange({ ...filters, sentiment: value === 'all' ? undefined : value })}
            >
              <SelectTrigger className="bg-white border-gray-200 h-8 text-xs">
                <SelectValue placeholder="Humor" />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="all">Todos</SelectItem>
                <SelectItem value="positive">😊 Positivo</SelectItem>
                <SelectItem value="neutral">😐 Neutro</SelectItem>
                <SelectItem value="negative">😞 Negativo</SelectItem>
              </SelectContent>
            </Select>

            {/* Período */}
            <Select value={datePreset} onValueChange={handleDatePresetChange}>
              <SelectTrigger className="bg-white border-gray-200 h-8 text-xs">
                <SelectValue placeholder="Período" />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="all">Todos</SelectItem>
                <SelectItem value="today">Hoje</SelectItem>
                <SelectItem value="yesterday">Ontem</SelectItem>
                <SelectItem value="7days">7 dias</SelectItem>
                <SelectItem value="30days">30 dias</SelectItem>
              </SelectContent>
            </Select>
          </div>

          {/* Filtros rápidos elegantes */}
          <div className="flex flex-wrap gap-1.5">
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
            
            {/* Dropdown de Tipos de Contato */}
            <DropdownMenu>
              <DropdownMenuTrigger asChild>
                <Button
                  variant={filters.contactType ? 'default' : 'ghost'}
                  size="sm"
                  className={cn(
                    'h-7 text-[11px] px-2.5 gap-1',
                    filters.contactType 
                      ? 'bg-[var(--exa-accent)] hover:bg-[var(--exa-accent-hover)] text-white' 
                      : 'text-gray-600 hover:bg-gray-100'
                  )}
                >
                  {filters.contactType ? (
                    <>
                      {contactTypes.find(t => t.name === filters.contactType)?.icon || '📋'}
                      {contactTypes.find(t => t.name === filters.contactType)?.label || 'Tipo'}
                    </>
                  ) : (
                    <>
                      <UserCircle className="w-3 h-3" />
                      Tipo
                    </>
                  )}
                  <ChevronDown className="w-3 h-3" />
                </Button>
              </DropdownMenuTrigger>
              <DropdownMenuContent align="start" className="bg-white border-gray-200 min-w-[160px]">
                <DropdownMenuLabel className="text-[10px] text-gray-500">
                  Tipo de Contato
                </DropdownMenuLabel>
                <DropdownMenuSeparator />
                
                <DropdownMenuItem
                  onClick={() => onFilterChange({ ...filters, contactType: undefined })}
                  className={cn(
                    'cursor-pointer text-xs',
                    !filters.contactType && 'bg-gray-100'
                  )}
                >
                  Todos
                </DropdownMenuItem>
                
                <DropdownMenuSeparator />
                
                {contactTypes.map((type) => (
                  <DropdownMenuItem
                    key={type.id}
                    onClick={() => onFilterChange({ ...filters, contactType: type.name })}
                    className={cn(
                      'cursor-pointer flex items-center gap-2 text-xs',
                      filters.contactType === type.name && 'bg-gray-100'
                    )}
                  >
                    <span className="text-sm">{type.icon}</span>
                    <span>{type.label}</span>
                  </DropdownMenuItem>
                ))}
              </DropdownMenuContent>
            </DropdownMenu>
          </div>
        </div>
      )}
    </div>
  );
};
