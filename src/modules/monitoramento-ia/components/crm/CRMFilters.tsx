import React, { useState } from 'react';
import { Button } from '@/components/ui/button';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Calendar } from '@/components/ui/calendar';
import { Popover, PopoverContent, PopoverTrigger } from '@/components/ui/popover';
import { RefreshCw, Filter, ChevronDown, ChevronUp, CalendarIcon, Download } from 'lucide-react';
import { cn } from '@/lib/utils';
import { format, subDays, startOfDay, endOfDay } from 'date-fns';
import { ptBR } from 'date-fns/locale';
import { DateRange } from 'react-day-picker';
import { supabase } from '@/integrations/supabase/client';
import { toast } from 'sonner';

interface CRMFiltersProps {
  filters: any;
  onFilterChange: (filters: any) => void;
  onRefresh: () => void;
}

export const CRMFilters = ({ filters, onFilterChange, onRefresh }: CRMFiltersProps) => {
  const [isExpanded, setIsExpanded] = useState(true);
  const [isImporting, setIsImporting] = useState(false);
  const [dateRange, setDateRange] = useState<DateRange | undefined>();
  const [datePreset, setDatePreset] = useState<string>('all');

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

  return (
    <div className={cn(
      "backdrop-blur-xl bg-gradient-to-r from-[var(--exa-accent)]/5 via-transparent to-transparent border border-[var(--exa-border)] rounded-2xl shadow-lg overflow-hidden transition-all",
      isExpanded ? "max-h-96" : "max-h-14"
    )}>
      {/* Header minimalista com botão de collapse */}
      <div className="flex items-center justify-between px-4 py-3">
        <div className="flex items-center gap-3 flex-1">
          <Filter className="w-4 h-4 text-muted-foreground" />
          <h3 className="font-medium text-foreground text-sm">Filtros</h3>
          
          {/* Quick filters quando colapsado */}
          {!isExpanded && (
            <div className="flex items-center gap-2 ml-auto">
              {filters.agentKey && (
                <span className="text-xs px-2 py-1 rounded-full bg-[var(--exa-accent-light)] text-[var(--exa-accent)]">
                  {filters.agentKey === 'sofia' ? '🤖 Sofia' : '👤 Eduardo'}
                </span>
              )}
              {filters.unreadOnly && (
                <span className="text-xs px-2 py-1 rounded-full bg-[var(--exa-accent-light)] text-[var(--exa-accent)]">
                  Não lidas
                </span>
              )}
              {filters.criticalOnly && (
                <span className="text-xs px-2 py-1 rounded-full bg-[var(--exa-accent-light)] text-[var(--exa-accent)]">
                  Críticas
                </span>
              )}
            </div>
          )}
        </div>
        
        <div className="flex items-center gap-2">
          <Button
            variant="ghost"
            size="sm"
            onClick={onRefresh}
            className="h-8 w-8 p-0"
            title="Atualizar"
          >
            <RefreshCw className="w-4 h-4" />
          </Button>
          <Button
            variant="ghost"
            size="sm"
            onClick={() => setIsExpanded(!isExpanded)}
            className="h-8 w-8 p-0"
          >
            {isExpanded ? <ChevronUp className="w-4 h-4" /> : <ChevronDown className="w-4 h-4" />}
          </Button>
        </div>
      </div>

      {/* Conteúdo dos filtros */}
      {isExpanded && (
        <div className="px-4 pb-4 space-y-3 border-t border-[var(--exa-border)]/50 pt-3">
          <div className="grid grid-cols-3 gap-2">
            {/* Filtro de Agente */}
            <Select
              value={filters.agentKey || 'all'}
              onValueChange={(value) => onFilterChange({ ...filters, agentKey: value === 'all' ? undefined : value })}
            >
              <SelectTrigger className="bg-[var(--exa-bg-card)] border-[var(--exa-border)] h-9 text-sm">
                <SelectValue placeholder="Agente" />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="all">Todos Agentes</SelectItem>
                <SelectItem value="sofia">🤖 Sofia</SelectItem>
                <SelectItem value="eduardo">👤 Eduardo</SelectItem>
              </SelectContent>
            </Select>

            {/* Filtro de Sentimento */}
            <Select
              value={filters.sentiment || 'all'}
              onValueChange={(value) => onFilterChange({ ...filters, sentiment: value === 'all' ? undefined : value })}
            >
              <SelectTrigger className="bg-[var(--exa-bg-card)] border-[var(--exa-border)] h-9 text-sm">
                <SelectValue placeholder="Sentimento" />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="all">Todos</SelectItem>
                <SelectItem value="positive">😊 Positivo</SelectItem>
                <SelectItem value="neutral">😐 Neutro</SelectItem>
                <SelectItem value="negative">😞 Negativo</SelectItem>
              </SelectContent>
            </Select>

            {/* Filtro de Período */}
            <Select value={datePreset} onValueChange={handleDatePresetChange}>
              <SelectTrigger className="bg-[var(--exa-bg-card)] border-[var(--exa-border)] h-9 text-sm">
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

          {/* Botões de filtro rápido minimalistas */}
          <div className="flex flex-wrap gap-2">
            <Button
              variant={filters.unreadOnly ? 'default' : 'outline'}
              size="sm"
              onClick={() => onFilterChange({ ...filters, unreadOnly: !filters.unreadOnly })}
              className={cn(
                'h-8 text-xs border-[var(--exa-border)]',
                filters.unreadOnly && 'bg-[var(--exa-accent)] hover:bg-[var(--exa-accent-hover)] text-white border-transparent'
              )}
            >
              Não lidas
            </Button>
            <Button
              variant={filters.criticalOnly ? 'default' : 'outline'}
              size="sm"
              onClick={() => onFilterChange({ ...filters, criticalOnly: !filters.criticalOnly })}
              className={cn(
                'h-8 text-xs border-[var(--exa-border)]',
                filters.criticalOnly && 'bg-[var(--exa-accent)] hover:bg-[var(--exa-accent-hover)] text-white border-transparent'
              )}
            >
              Críticas
            </Button>
            <Button
              variant={filters.hotLeadsOnly ? 'default' : 'outline'}
              size="sm"
              onClick={() => onFilterChange({ ...filters, hotLeadsOnly: !filters.hotLeadsOnly })}
              className={cn(
                'h-8 text-xs border-[var(--exa-border)]',
                filters.hotLeadsOnly && 'bg-[var(--exa-accent)] hover:bg-[var(--exa-accent-hover)] text-white border-transparent'
              )}
            >
              Hot Leads
            </Button>
          </div>
        </div>
      )}
    </div>
  );
};
