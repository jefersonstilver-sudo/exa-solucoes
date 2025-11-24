import React, { useState } from 'react';
import { Filter, ChevronDown } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Sheet, SheetContent, SheetHeader, SheetTitle, SheetTrigger } from '@/components/ui/sheet';
import { Switch } from '@/components/ui/switch';
import { Label } from '@/components/ui/label';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';

interface MobileCRMFiltersProps {
  filters: any;
  onFilterChange: (filters: any) => void;
  agents: Array<{ key: string; display_name: string }>;
}

export const MobileCRMFilters: React.FC<MobileCRMFiltersProps> = ({
  filters,
  onFilterChange,
  agents
}) => {
  const [open, setOpen] = useState(false);

  const activeFilterCount = [
    filters.unreadOnly,
    filters.criticalOnly,
    filters.hotLeadsOnly,
    filters.awaitingOnly,
    filters.agentKey,
    filters.sentiment
  ].filter(Boolean).length;

  const quickFilters = [
    { key: 'unreadOnly', label: '💬 Não Lidas', active: filters.unreadOnly },
    { key: 'criticalOnly', label: '🔴 Crítico', active: filters.criticalOnly },
    { key: 'hotLeadsOnly', label: '🔥 Hot', active: filters.hotLeadsOnly },
    { key: 'awaitingOnly', label: '⏰ Aguardando', active: filters.awaitingOnly }
  ];

  const toggleQuickFilter = (key: string) => {
    onFilterChange({ ...filters, [key]: !filters[key] });
  };

  return (
    <div className="bg-module-secondary/30 border-b border-module-border">
      {/* Chips Horizontais */}
      <div className="flex gap-2 px-4 py-3 overflow-x-auto no-scrollbar">
        {quickFilters.map((filter) => (
          <Button
            key={filter.key}
            variant={filter.active ? 'default' : 'outline'}
            size="sm"
            onClick={() => toggleQuickFilter(filter.key)}
            className={`shrink-0 touch-manipulation h-8 text-xs ${
              filter.active ? 'bg-[#25D366] hover:bg-[#20bd5a]' : ''
            }`}
          >
            {filter.label}
          </Button>
        ))}

        {/* Filtros Avançados */}
        <Sheet open={open} onOpenChange={setOpen}>
          <SheetTrigger asChild>
            <Button
              variant="outline"
              size="sm"
              className="shrink-0 touch-manipulation h-8 relative"
            >
              <Filter className="w-4 h-4 mr-1" />
              Filtros
              {activeFilterCount > 0 && (
                <Badge className="ml-2 h-4 min-w-4 px-1 bg-[#25D366] text-white text-xs">
                  {activeFilterCount}
                </Badge>
              )}
            </Button>
          </SheetTrigger>
          
          <SheetContent side="bottom" className="pb-safe rounded-t-3xl max-h-[80vh] overflow-y-auto">
            <SheetHeader>
              <SheetTitle>Filtros Avançados</SheetTitle>
            </SheetHeader>
            
            <div className="space-y-6 mt-6">
              {/* Agente */}
              <div className="space-y-2">
                <Label>Agente</Label>
                <Select
                  value={filters.agentKey || 'all'}
                  onValueChange={(value) =>
                    onFilterChange({ ...filters, agentKey: value === 'all' ? undefined : value })
                  }
                >
                  <SelectTrigger className="touch-manipulation h-12 text-base">
                    <SelectValue placeholder="Todos os agentes" />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="all">Todos os agentes</SelectItem>
                    {agents.map((agent) => (
                      <SelectItem key={agent.key} value={agent.key}>
                        {agent.display_name}
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>

              {/* Sentimento */}
              <div className="space-y-2">
                <Label>Sentimento</Label>
                <Select
                  value={filters.sentiment || 'all'}
                  onValueChange={(value) =>
                    onFilterChange({ ...filters, sentiment: value === 'all' ? undefined : value })
                  }
                >
                  <SelectTrigger className="touch-manipulation h-12 text-base">
                    <SelectValue placeholder="Todos os sentimentos" />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="all">Todos</SelectItem>
                    <SelectItem value="positive">😊 Positivo</SelectItem>
                    <SelectItem value="neutral">😐 Neutro</SelectItem>
                    <SelectItem value="negative">😟 Negativo</SelectItem>
                    <SelectItem value="angry">😡 Irritado</SelectItem>
                  </SelectContent>
                </Select>
              </div>

              {/* Switches */}
              <div className="space-y-4">
                <div className="flex items-center justify-between">
                  <Label htmlFor="unread">Apenas não lidas</Label>
                  <Switch
                    id="unread"
                    checked={filters.unreadOnly}
                    onCheckedChange={(checked) =>
                      onFilterChange({ ...filters, unreadOnly: checked })
                    }
                  />
                </div>
                <div className="flex items-center justify-between">
                  <Label htmlFor="critical">Apenas críticas</Label>
                  <Switch
                    id="critical"
                    checked={filters.criticalOnly}
                    onCheckedChange={(checked) =>
                      onFilterChange({ ...filters, criticalOnly: checked })
                    }
                  />
                </div>
                <div className="flex items-center justify-between">
                  <Label htmlFor="hot">Apenas hot leads</Label>
                  <Switch
                    id="hot"
                    checked={filters.hotLeadsOnly}
                    onCheckedChange={(checked) =>
                      onFilterChange({ ...filters, hotLeadsOnly: checked })
                    }
                  />
                </div>
                <div className="flex items-center justify-between">
                  <Label htmlFor="awaiting">Aguardando resposta</Label>
                  <Switch
                    id="awaiting"
                    checked={filters.awaitingOnly}
                    onCheckedChange={(checked) =>
                      onFilterChange({ ...filters, awaitingOnly: checked })
                    }
                  />
                </div>
              </div>

              {/* Botão Limpar */}
              <Button
                variant="outline"
                className="w-full touch-manipulation h-12"
                onClick={() => {
                  onFilterChange({
                    agentKey: undefined,
                    unreadOnly: false,
                    criticalOnly: false,
                    hotLeadsOnly: false,
                    awaitingOnly: false,
                    sentiment: undefined
                  });
                  setOpen(false);
                }}
              >
                Limpar Filtros
              </Button>
            </div>
          </SheetContent>
        </Sheet>
      </div>
    </div>
  );
};
