import { Search, X } from 'lucide-react';
import { Input } from '@/components/ui/input';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Button } from '@/components/ui/button';
import { PeriodSelector, PeriodType } from './PeriodSelector';
import type { AlertFilters } from '../utils/alerts';
import { startOfDay, endOfDay, subDays, startOfYesterday, endOfYesterday, startOfWeek } from 'date-fns';
import { ptBR } from 'date-fns/locale';

interface AlertsFiltersProps {
  filters: AlertFilters;
  condominios: string[];
  onFiltersChange: (filters: AlertFilters) => void;
  onClearFilters: () => void;
}

export const AlertsFilters = ({ 
  filters, 
  condominios, 
  onFiltersChange,
  onClearFilters 
}: AlertsFiltersProps) => {
  const handlePeriodChange = (period: PeriodType, customStart?: Date, customEnd?: Date) => {
    let startDate: Date | undefined;
    let endDate: Date | undefined;

    switch (period) {
      case 'hoje':
        startDate = startOfDay(new Date());
        endDate = endOfDay(new Date());
        break;
      case 'ontem':
        startDate = startOfYesterday();
        endDate = endOfYesterday();
        break;
      case 'esta-semana':
        startDate = startOfWeek(new Date(), { locale: ptBR });
        endDate = endOfDay(new Date());
        break;
      case '7dias':
        startDate = startOfDay(subDays(new Date(), 7));
        endDate = endOfDay(new Date());
        break;
      case '30dias':
        startDate = startOfDay(subDays(new Date(), 30));
        endDate = endOfDay(new Date());
        break;
      case 'personalizado':
        startDate = customStart ? startOfDay(customStart) : undefined;
        endDate = customEnd ? endOfDay(customEnd) : undefined;
        break;
    }

    onFiltersChange({ ...filters, startDate, endDate });
  };

  const getCurrentPeriod = (): PeriodType => {
    if (!filters.startDate) return 'hoje';
    
    const today = startOfDay(new Date());
    const filterStart = startOfDay(filters.startDate);
    
    if (filterStart.getTime() === today.getTime()) return 'hoje';
    if (filterStart.getTime() === startOfYesterday().getTime()) return 'ontem';
    if (filterStart.getTime() === startOfWeek(new Date(), { locale: ptBR }).getTime()) return 'esta-semana';
    if (filterStart.getTime() === startOfDay(subDays(new Date(), 7)).getTime()) return '7dias';
    if (filterStart.getTime() === startOfDay(subDays(new Date(), 30)).getTime()) return '30dias';
    
    return 'personalizado';
  };

  return (
    <div className="bg-module-card rounded-xl p-4 mb-6 space-y-4 border border-module">
      {/* Search and Period */}
      <div className="flex gap-3">
        <div className="relative flex-1">
          <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-module-muted" />
          <Input
            placeholder="Buscar por painel, condomínio ou tipo..."
            value={filters.search || ''}
            onChange={(e) => onFiltersChange({ ...filters, search: e.target.value })}
            className="pl-10 bg-module-input border-module border text-module-primary placeholder-module-muted"
          />
        </div>
        <PeriodSelector
          value={getCurrentPeriod()}
          onChange={handlePeriodChange}
          customStartDate={filters.startDate}
          customEndDate={filters.endDate}
        />
      </div>

      {/* Filters Row */}
      <div className="grid grid-cols-1 md:grid-cols-6 gap-4">
        {/* Status */}
        <Select
          value={filters.status?.[0] || 'all'}
          onValueChange={(value) => 
            onFiltersChange({ 
              ...filters, 
              status: value === 'all' ? undefined : [value] 
            })
          }
        >
          <SelectTrigger className="bg-module-input border-module border text-module-primary">
            <SelectValue placeholder="Status" />
          </SelectTrigger>
          <SelectContent className="bg-module-card border-module border z-50">
            <SelectItem value="all">Todos os status</SelectItem>
            <SelectItem value="open">Abertos</SelectItem>
            <SelectItem value="scheduled">Agendados</SelectItem>
            <SelectItem value="resolved">Resolvidos</SelectItem>
          </SelectContent>
        </Select>

        {/* Severity */}
        <Select
          value={filters.severity?.[0] || 'all'}
          onValueChange={(value) => 
            onFiltersChange({ 
              ...filters, 
              severity: value === 'all' ? undefined : [value] 
            })
          }
        >
          <SelectTrigger className="bg-module-input border-module border text-module-primary">
            <SelectValue placeholder="Severidade" />
          </SelectTrigger>
          <SelectContent className="bg-module-card border-module border z-50">
            <SelectItem value="all">Todas as severidades</SelectItem>
            <SelectItem value="high">Alta</SelectItem>
            <SelectItem value="medium">Média</SelectItem>
            <SelectItem value="low">Baixa</SelectItem>
          </SelectContent>
        </Select>

        {/* Condominio */}
        <Select
          value={filters.condominio || 'all'}
          onValueChange={(value) => 
            onFiltersChange({ 
              ...filters, 
              condominio: value === 'all' ? undefined : value 
            })
          }
        >
          <SelectTrigger className="bg-module-input border-module border text-module-primary">
            <SelectValue placeholder="Condomínio" />
          </SelectTrigger>
          <SelectContent className="bg-module-card border-module border z-50">
            <SelectItem value="all">Todos os condomínios</SelectItem>
            {condominios.map((cond) => (
              <SelectItem key={cond} value={cond}>{cond}</SelectItem>
            ))}
          </SelectContent>
        </Select>

        {/* Provider */}
        <Select
          value={filters.provider || 'all'}
          onValueChange={(value) => 
            onFiltersChange({ 
              ...filters, 
              provider: value === 'all' ? undefined : value 
            })
          }
        >
          <SelectTrigger className="bg-module-input border-module border text-module-primary">
            <SelectValue placeholder="Provedor" />
          </SelectTrigger>
          <SelectContent className="bg-module-card border-module border z-50">
            <SelectItem value="all">Todos os provedores</SelectItem>
            <SelectItem value="AnyDesk">AnyDesk</SelectItem>
            <SelectItem value="String">String</SelectItem>
            <SelectItem value="Manual">Manual</SelectItem>
          </SelectContent>
        </Select>

        {/* Duração */}
        <Select
          value={filters.minDuration?.toString() || 'all'}
          onValueChange={(value) => 
            onFiltersChange({ 
              ...filters, 
              minDuration: value === 'all' ? undefined : parseInt(value)
            })
          }
        >
          <SelectTrigger className="bg-module-input border-module border text-module-primary">
            <SelectValue placeholder="Duração" />
          </SelectTrigger>
          <SelectContent className="bg-module-card border-module border z-50">
            <SelectItem value="all">Todos</SelectItem>
            <SelectItem value="300">Acima de 5 minutos</SelectItem>
            <SelectItem value="1800">Acima de 30 minutos</SelectItem>
            <SelectItem value="3600">Acima de 1 hora</SelectItem>
          </SelectContent>
        </Select>

        {/* Order By */}
        <Select
          value={filters.orderBy || 'opened_at'}
          onValueChange={(value) => 
            onFiltersChange({ 
              ...filters, 
              orderBy: value as AlertFilters['orderBy']
            })
          }
        >
          <SelectTrigger className="bg-module-input border-module border text-module-primary">
            <SelectValue placeholder="Ordenar por" />
          </SelectTrigger>
          <SelectContent className="bg-module-card border-module border z-50">
            <SelectItem value="severity">Severidade</SelectItem>
            <SelectItem value="opened_at">Tempo aberto</SelectItem>
            <SelectItem value="status">Status</SelectItem>
            <SelectItem value="name">Nome do painel</SelectItem>
            <SelectItem value="provider">Provedor</SelectItem>
          </SelectContent>
        </Select>
      </div>

      {/* Clear Filters */}
      <Button
        variant="outline"
        size="sm"
        onClick={onClearFilters}
        className="w-full md:w-auto bg-module-input border-module border text-module-primary hover:bg-module-accent-hover"
      >
        <X className="w-4 h-4 mr-2" />
        Limpar filtros
      </Button>
    </div>
  );
};
