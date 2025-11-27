import React, { useState } from 'react';
import { Filter, ChevronDown, User, Users } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Sheet, SheetContent, SheetHeader, SheetTitle, SheetTrigger } from '@/components/ui/sheet';
import { Switch } from '@/components/ui/switch';
import { Label } from '@/components/ui/label';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { motion } from 'framer-motion';

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
    filters.sentiment,
    filters.clientType
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
    <div className="bg-white border-b border-border shadow-sm">
      {/* Filtros Principais - Estilo iOS */}
      <div className="px-4 py-3 space-y-2">
        {/* Agente Filter - Chips estilo iOS */}
        <div className="flex items-center gap-2">
          <User className="w-4 h-4 text-muted-foreground" />
          <div className="flex gap-2 overflow-x-auto no-scrollbar">
            {['all', ...agents.map(a => a.key)].map((agentKey) => {
              const agent = agents.find(a => a.key === agentKey);
              const label = agentKey === 'all' ? 'Todos' : agent?.display_name || agentKey;
              const isActive = filters.agentKey === agentKey || (!filters.agentKey && agentKey === 'all');
              
              return (
                <motion.button
                  key={agentKey}
                  onClick={() => onFilterChange({ ...filters, agentKey: agentKey === 'all' ? undefined : agentKey })}
                  className={`px-4 py-1.5 rounded-full text-xs font-medium transition-all shrink-0 ${
                    isActive 
                      ? 'bg-gradient-to-r from-[#9C1E1E] to-[#D72638] text-white shadow-md' 
                      : 'bg-muted text-muted-foreground hover:bg-muted/80'
                  }`}
                  whileTap={{ scale: 0.95 }}
                >
                  {label}
                </motion.button>
              );
            })}
          </div>
        </div>

        {/* Cliente Type Filter */}
        <div className="flex items-center gap-2">
          <Users className="w-4 h-4 text-muted-foreground" />
          <div className="flex gap-2 overflow-x-auto no-scrollbar">
            {[
              { value: undefined, label: 'Todos' },
              { value: 'sindico', label: 'Síndico' },
              { value: 'prestador', label: 'Prestador' },
              { value: 'anunciante', label: 'Anunciante' }
            ].map((type) => {
              const isActive = filters.clientType === type.value || (!filters.clientType && !type.value);
              
              return (
                <motion.button
                  key={type.label}
                  onClick={() => onFilterChange({ ...filters, clientType: type.value })}
                  className={`px-4 py-1.5 rounded-full text-xs font-medium transition-all shrink-0 ${
                    isActive 
                      ? 'bg-gradient-to-r from-[#9C1E1E] to-[#D72638] text-white shadow-md' 
                      : 'bg-muted text-muted-foreground hover:bg-muted/80'
                  }`}
                  whileTap={{ scale: 0.95 }}
                >
                  {type.label}
                </motion.button>
              );
            })}
          </div>
        </div>
      </div>

      {/* Quick Filters - Chips secundários */}
      <div className="flex gap-2 px-4 py-3 overflow-x-auto no-scrollbar bg-muted/30">
        {quickFilters.map((filter) => (
          <motion.button
            key={filter.key}
            onClick={() => toggleQuickFilter(filter.key)}
            className={`px-3 py-1.5 rounded-full text-xs font-medium transition-all shrink-0 ${
              filter.active 
                ? 'bg-[#25D366] text-white shadow-md' 
                : 'bg-white border text-muted-foreground hover:bg-muted/50'
            }`}
            whileTap={{ scale: 0.95 }}
          >
            {filter.label}
          </motion.button>
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
                    clientType: undefined,
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
