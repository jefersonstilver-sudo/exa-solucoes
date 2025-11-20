import React, { useState } from 'react';
import { Input } from '@/components/ui/input';
import { Button } from '@/components/ui/button';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Filter, RefreshCw, Download } from 'lucide-react';
import { CRMMetrics, CRMFilters } from '../../types/crmTypes';

interface CRMHeaderProps {
  metrics: CRMMetrics;
  filters: CRMFilters;
  onFilterChange: (filters: Partial<CRMFilters>) => void;
  onRefresh: () => void;
}

export const CRMHeader: React.FC<CRMHeaderProps> = ({
  metrics,
  filters,
  onFilterChange,
  onRefresh
}) => {
  return (
    <div className="bg-card rounded-lg border p-6">
      {/* Header with metrics */}
      <div className="flex items-center justify-between mb-6">
        <div>
          <h1 className="text-2xl lg:text-3xl font-bold mb-2">
            💬 CRM de Conversas
          </h1>
          <p className="text-muted-foreground">
            Gerencie todas as conversas dos seus agentes IA
          </p>
        </div>

        {/* Quick Metrics */}
        <div className="flex gap-6">
          <div className="text-center">
            <div className="text-3xl font-bold text-primary">{metrics.total}</div>
            <div className="text-xs text-muted-foreground">Conversas</div>
          </div>
          <div className="text-center">
            <div className="text-3xl font-bold text-green-500">{metrics.unread}</div>
            <div className="text-xs text-muted-foreground">Não Lidas</div>
          </div>
          <div className="text-center">
            <div className="text-3xl font-bold text-blue-500">{metrics.today}</div>
            <div className="text-xs text-muted-foreground">Hoje</div>
          </div>
        </div>
      </div>

      {/* Filters */}
      <div className="flex gap-3 flex-wrap">
        <Input
          placeholder="🔍 Buscar por telefone, nome ou mensagem..."
          value={filters.search || ''}
          onChange={(e) => onFilterChange({ search: e.target.value })}
          className="flex-1 min-w-[300px]"
        />

        <Select 
          value={filters.agentKey || 'all'} 
          onValueChange={(v) => onFilterChange({ agentKey: v === 'all' ? undefined : v })}
        >
          <SelectTrigger className="w-[200px]">
            <SelectValue placeholder="Todos os agentes" />
          </SelectTrigger>
          <SelectContent>
            <SelectItem value="all">Todos os agentes</SelectItem>
            <SelectItem value="sofia">Sofia - Vendas</SelectItem>
            <SelectItem value="iris">IRIS - Diretoria</SelectItem>
            <SelectItem value="exa_alert">EXA Alert</SelectItem>
            <SelectItem value="eduardo">Eduardo - Criativo</SelectItem>
          </SelectContent>
        </Select>

        <Button 
          variant={filters.unreadOnly ? 'default' : 'outline'}
          onClick={() => onFilterChange({ unreadOnly: !filters.unreadOnly })}
        >
          {filters.unreadOnly ? '📩 Todas' : '📧 Não Lidas'}
        </Button>

        <Button variant="outline" onClick={onRefresh}>
          <RefreshCw className="w-4 h-4 mr-2" />
          Atualizar
        </Button>
      </div>
    </div>
  );
};
