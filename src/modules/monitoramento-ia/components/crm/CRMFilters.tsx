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
    <div className="backdrop-blur-xl bg-white/60 border border-white/30 rounded-xl shadow-lg overflow-hidden">
      {/* Header com botão de collapse */}
      <div className="flex items-center justify-between p-3 border-b border-white/20">
        <div className="flex items-center gap-2">
          <Filter className="w-4 h-4 text-primary" />
          <h3 className="font-semibold text-primary text-sm">Filtros</h3>
        </div>
        <Button
          variant="ghost"
          size="icon"
          onClick={() => setIsExpanded(!isExpanded)}
          className="h-8 w-8"
        >
          {isExpanded ? <ChevronUp className="w-4 h-4" /> : <ChevronDown className="w-4 h-4" />}
        </Button>
      </div>

      {/* Conteúdo dos filtros */}
      {isExpanded && (
        <div className="p-3 space-y-3">
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-3">
            {/* Filtro de Período */}
            <div className="space-y-2">
              <label className="text-xs font-medium text-gray-700">Período</label>
              <Select value={datePreset} onValueChange={handleDatePresetChange}>
                <SelectTrigger className="bg-white/80">
                  <SelectValue placeholder="Selecione o período" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="all">Todos</SelectItem>
                  <SelectItem value="today">Hoje</SelectItem>
                  <SelectItem value="yesterday">Ontem</SelectItem>
                  <SelectItem value="7days">Últimos 7 dias</SelectItem>
                  <SelectItem value="30days">Últimos 30 dias</SelectItem>
                  <SelectItem value="custom">Personalizado</SelectItem>
                </SelectContent>
              </Select>
            </div>

            {/* Date Range Picker - Apenas se custom */}
            {datePreset === 'custom' && (
              <div className="space-y-2">
                <label className="text-xs font-medium text-gray-700">Datas</label>
                <Popover>
                  <PopoverTrigger asChild>
                    <Button variant="outline" className="w-full justify-start text-left font-normal bg-white/80">
                      <CalendarIcon className="mr-2 h-4 w-4" />
                      {dateRange?.from ? (
                        dateRange.to ? (
                          <>
                            {format(dateRange.from, 'dd/MM/yy')} - {format(dateRange.to, 'dd/MM/yy')}
                          </>
                        ) : (
                          format(dateRange.from, 'dd/MM/yyyy')
                        )
                      ) : (
                        <span>Selecione as datas</span>
                      )}
                    </Button>
                  </PopoverTrigger>
                  <PopoverContent className="w-auto p-0" align="start">
                    <Calendar
                      mode="range"
                      selected={dateRange}
                      onSelect={handleCustomDateRange}
                      numberOfMonths={2}
                      locale={ptBR}
                      className="pointer-events-auto"
                    />
                  </PopoverContent>
                </Popover>
              </div>
            )}

            {/* Filtro de Agente */}
            <div className="space-y-2">
              <label className="text-xs font-medium text-gray-700">Agente</label>
              <Select
                value={filters.agentKey || 'all'}
                onValueChange={(value) => onFilterChange({ ...filters, agentKey: value === 'all' ? undefined : value })}
              >
                <SelectTrigger className="bg-white/80">
                  <SelectValue placeholder="Todos" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="all">Todos</SelectItem>
                  <SelectItem value="sofia">Sofia</SelectItem>
                  <SelectItem value="eduardo">Eduardo</SelectItem>
                </SelectContent>
              </Select>
            </div>

            {/* Filtro de Sentimento */}
            <div className="space-y-2">
              <label className="text-xs font-medium text-gray-700">Sentimento</label>
              <Select
                value={filters.sentiment || 'all'}
                onValueChange={(value) => onFilterChange({ ...filters, sentiment: value === 'all' ? undefined : value })}
              >
                <SelectTrigger className="bg-white/80">
                  <SelectValue placeholder="Todos" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="all">Todos</SelectItem>
                  <SelectItem value="positive">😊 Positivo</SelectItem>
                  <SelectItem value="neutral">😐 Neutro</SelectItem>
                  <SelectItem value="negative">😞 Negativo</SelectItem>
                </SelectContent>
              </Select>
            </div>
          </div>

          {/* Botões de filtro rápido */}
          <div className="flex flex-wrap gap-2">
            <Button
              variant={filters.unreadOnly ? 'default' : 'outline'}
              size="sm"
              onClick={() => onFilterChange({ ...filters, unreadOnly: !filters.unreadOnly })}
              className={cn(filters.unreadOnly && 'bg-primary text-white')}
            >
              Não lidas
            </Button>
            <Button
              variant={filters.criticalOnly ? 'default' : 'outline'}
              size="sm"
              onClick={() => onFilterChange({ ...filters, criticalOnly: !filters.criticalOnly })}
              className={cn(filters.criticalOnly && 'bg-red-500 text-white hover:bg-red-600')}
            >
              Críticas
            </Button>
            <Button
              variant={filters.hotLeadsOnly ? 'default' : 'outline'}
              size="sm"
              onClick={() => onFilterChange({ ...filters, hotLeadsOnly: !filters.hotLeadsOnly })}
              className={cn(filters.hotLeadsOnly && 'bg-orange-500 text-white hover:bg-orange-600')}
            >
              Hot Leads
            </Button>

            <div className="ml-auto flex gap-2">
              <Button
                variant="outline"
                size="sm"
                onClick={handleImportHistorico}
                disabled={isImporting}
                className="bg-white/80"
              >
                {isImporting ? (
                  <RefreshCw className="w-4 h-4 animate-spin mr-2" />
                ) : (
                  <Download className="w-4 h-4 mr-2" />
                )}
                Importar Histórico
              </Button>
              <Button
                variant="outline"
                size="sm"
                onClick={onRefresh}
                className="bg-white/80"
              >
                <RefreshCw className="w-4 h-4 mr-2" />
                Atualizar
              </Button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};
