import React from 'react';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Label } from '@/components/ui/label';
import { DateRangePicker } from '../DateRangePicker';
import { PeriodType } from '../../../hooks/useLeadMetricsDetailed';
import { Filter } from 'lucide-react';

interface FilterBarProps {
  selectedAgent: string;
  onAgentChange: (agent: string) => void;
  period: PeriodType;
  onPeriodChange: (period: PeriodType) => void;
  customStart?: Date;
  customEnd?: Date;
  onCustomDatesChange: (start: Date | undefined, end: Date | undefined) => void;
  currentAgentKey: string | null;
}

export const FilterBar: React.FC<FilterBarProps> = ({
  selectedAgent,
  onAgentChange,
  period,
  onPeriodChange,
  customStart,
  customEnd,
  onCustomDatesChange,
  currentAgentKey
}) => {
  // Auto agent = agente da conversa atual
  const autoAgentLabel = currentAgentKey || 'Agente Atual';

  return (
    <div className="glass-card p-4 rounded-xl space-y-4">
      <div className="flex items-center gap-2 mb-2">
        <Filter className="w-4 h-4 text-primary" />
        <h4 className="font-semibold text-sm">Filtros</h4>
      </div>
      
      <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
        {/* Filtro de Agente */}
        <div className="space-y-2">
          <Label className="text-xs font-medium text-muted-foreground">
            Perspectiva do Agente
          </Label>
          <Select value={selectedAgent} onValueChange={onAgentChange}>
            <SelectTrigger className="w-full">
              <SelectValue placeholder="Selecione o agente" />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="auto">Auto ({autoAgentLabel})</SelectItem>
              <SelectItem value="sofia">Sofia</SelectItem>
              <SelectItem value="eduardo">Eduardo</SelectItem>
              <SelectItem value="all">Todos os Agentes</SelectItem>
            </SelectContent>
          </Select>
        </div>

        {/* Filtro de Período */}
        <div className="space-y-2">
          <Label className="text-xs font-medium text-muted-foreground">
            Período
          </Label>
          <DateRangePicker
            period={period}
            onPeriodChange={onPeriodChange}
            customStart={customStart}
            customEnd={customEnd}
            onCustomDatesChange={onCustomDatesChange}
          />
        </div>
      </div>
    </div>
  );
};
