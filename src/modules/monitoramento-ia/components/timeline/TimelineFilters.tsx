import { Calendar, Filter, Building2, AlertCircle } from 'lucide-react';
import { Button } from '@/components/ui/button';
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select';

interface TimelineFiltersProps {
  period: string;
  onPeriodChange: (period: string) => void;
  condominium: string;
  onCondominiumChange: (condominium: string) => void;
  condominiums: Array<{ id: string; name: string }>;
  statusFilter: string;
  onStatusFilterChange: (status: string) => void;
  showOnlyWithIssues: boolean;
  onToggleShowOnlyWithIssues: () => void;
}

export const TimelineFilters = ({
  period,
  onPeriodChange,
  condominium,
  onCondominiumChange,
  condominiums,
  statusFilter,
  onStatusFilterChange,
  showOnlyWithIssues,
  onToggleShowOnlyWithIssues,
}: TimelineFiltersProps) => {
  return (
    <div className="flex flex-wrap gap-3 p-4 bg-background/60 backdrop-blur-sm border-b border-border/20">
      {/* Period Filter */}
      <Select value={period} onValueChange={onPeriodChange}>
        <SelectTrigger className="w-[160px] h-9">
          <Calendar className="w-4 h-4 mr-2" />
          <SelectValue />
        </SelectTrigger>
        <SelectContent>
          <SelectItem value="today">Hoje</SelectItem>
          <SelectItem value="yesterday">Ontem</SelectItem>
          <SelectItem value="current_month">Este mês</SelectItem>
          <SelectItem value="7d">Últimos 7 dias</SelectItem>
          <SelectItem value="30d">Últimos 30 dias</SelectItem>
        </SelectContent>
      </Select>

      {/* Condominium Filter */}
      <Select value={condominium} onValueChange={onCondominiumChange}>
        <SelectTrigger className="w-[200px] h-9">
          <Building2 className="w-4 h-4 mr-2" />
          <SelectValue />
        </SelectTrigger>
        <SelectContent>
          <SelectItem value="all">Todos os condomínios</SelectItem>
          {condominiums.map((c) => (
            <SelectItem key={c.id} value={c.id}>
              {c.name}
            </SelectItem>
          ))}
        </SelectContent>
      </Select>

      {/* Status Filter */}
      <Select value={statusFilter} onValueChange={onStatusFilterChange}>
        <SelectTrigger className="w-[160px] h-9">
          <Filter className="w-4 h-4 mr-2" />
          <SelectValue />
        </SelectTrigger>
        <SelectContent>
          <SelectItem value="all">Todos os status</SelectItem>
          <SelectItem value="offline">Apenas offline</SelectItem>
          <SelectItem value="online">Apenas online</SelectItem>
        </SelectContent>
      </Select>

      {/* Toggle: Show only with issues */}
      <Button
        variant={showOnlyWithIssues ? "default" : "outline"}
        size="sm"
        onClick={onToggleShowOnlyWithIssues}
        className="h-9"
      >
        <AlertCircle className="w-4 h-4 mr-2" />
        {showOnlyWithIssues ? 'Mostrando com quedas' : 'Todos os painéis'}
      </Button>
    </div>
  );
};
