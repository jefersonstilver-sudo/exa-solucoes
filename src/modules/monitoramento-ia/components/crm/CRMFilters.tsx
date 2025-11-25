import React, { useState } from 'react';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { RefreshCw, Filter, Download } from 'lucide-react';
import { useModuleTheme, getThemeClass } from '../../hooks/useModuleTheme';
import { cn } from '@/lib/utils';
import { supabase } from '@/integrations/supabase/client';
import { toast } from 'sonner';

interface CRMFiltersProps {
  filters: any;
  onFilterChange: (filters: any) => void;
  onRefresh: () => void;
}

export const CRMFilters: React.FC<CRMFiltersProps> = ({ filters, onFilterChange, onRefresh }) => {
  const { theme } = useModuleTheme();
  const [importing, setImporting] = useState(false);

  const handleImportHistory = async () => {
    setImporting(true);
    try {
      // Se nenhum agente selecionado, buscar todos os agentes com Z-API
      if (!filters.agentKey) {
        const { data: agents } = await supabase
          .from('agents')
          .select('key')
          .eq('whatsapp_provider', 'zapi')
          .eq('is_active', true);

        if (!agents || agents.length === 0) {
          toast.error('❌ Nenhum agente com Z-API configurado');
          return;
        }

        let totalConversations = 0;
        let totalMessages = 0;

        for (const agent of agents) {
          toast.info(`📥 Importando de ${agent.key}...`);
          const { data, error } = await supabase.functions.invoke('zapi-import-history', {
            body: { agentKey: agent.key }
          });

          if (!error && data) {
            totalConversations += data.conversationsImported || 0;
            totalMessages += data.messagesImported || 0;
          }
        }

        toast.success(`✅ Total importado: ${totalConversations} conversas, ${totalMessages} mensagens`);
      } else {
        // Importar apenas do agente selecionado
        const { data, error } = await supabase.functions.invoke('zapi-import-history', {
          body: { agentKey: filters.agentKey }
        });

        if (error) throw error;

        toast.success(`✅ Histórico importado: ${data.conversationsImported} conversas, ${data.messagesImported} mensagens`);
      }

      onRefresh();
    } catch (error) {
      console.error('Import error:', error);
      toast.error('❌ Erro ao importar histórico: ' + (error as Error).message);
    } finally {
      setImporting(false);
    }
  };

  return (
    <div className="bg-white/70 backdrop-blur-xl border border-white/20 shadow-lg rounded-xl p-4 flex items-center gap-4 flex-wrap">
      <div className="flex items-center gap-2">
        <Filter className="w-4 h-4 text-muted-foreground" />
        <span className="text-sm font-medium">Filtros:</span>
      </div>

      {/* Agente */}
      <Select
        value={filters.agentKey || 'all'}
        onValueChange={(value) =>
          onFilterChange({ ...filters, agentKey: value === 'all' ? undefined : value })
        }
      >
        <SelectTrigger className="w-[180px] bg-white/50 border-white/30 text-module-primary">
          <SelectValue placeholder="Todos os agentes" />
        </SelectTrigger>
        <SelectContent className={cn(getThemeClass(theme), "bg-module-card border-module text-module-primary z-50")}>
          <SelectItem value="all" className="hover:bg-module-secondary/50 focus:bg-module-secondary/50">Todos os agentes</SelectItem>
          <SelectItem value="sofia" className="hover:bg-module-secondary/50 focus:bg-module-secondary/50">Sofia (IA Vendas)</SelectItem>
          <SelectItem value="eduardo" className="hover:bg-module-secondary/50 focus:bg-module-secondary/50">Eduardo (Humano)</SelectItem>
          <SelectItem value="iris" className="hover:bg-module-secondary/50 focus:bg-module-secondary/50">IRIS (IA Diretoria)</SelectItem>
          <SelectItem value="exa_alert" className="hover:bg-module-secondary/50 focus:bg-module-secondary/50">EXA Alert</SelectItem>
        </SelectContent>
      </Select>

      {/* Sentimento */}
      <Select
        value={filters.sentiment || 'all'}
        onValueChange={(value) =>
          onFilterChange({ ...filters, sentiment: value === 'all' ? undefined : value })
        }
      >
        <SelectTrigger className="w-[180px] bg-white/50 border-white/30 text-module-primary">
          <SelectValue placeholder="Todos os sentimentos" />
        </SelectTrigger>
        <SelectContent className={cn(getThemeClass(theme), "bg-module-card border-module text-module-primary z-50")}>
          <SelectItem value="all" className="hover:bg-module-secondary/50 focus:bg-module-secondary/50">Todos</SelectItem>
          <SelectItem value="positive" className="hover:bg-module-secondary/50 focus:bg-module-secondary/50">Positivo</SelectItem>
          <SelectItem value="neutral" className="hover:bg-module-secondary/50 focus:bg-module-secondary/50">Neutro</SelectItem>
          <SelectItem value="negative" className="hover:bg-module-secondary/50 focus:bg-module-secondary/50">Negativo</SelectItem>
          <SelectItem value="angry" className="hover:bg-module-secondary/50 focus:bg-module-secondary/50">Irritado</SelectItem>
        </SelectContent>
      </Select>

      {/* Toggles */}
      <div className="flex gap-2">
        <Button
          size="sm"
          onClick={() => onFilterChange({ ...filters, unreadOnly: !filters.unreadOnly })}
          className={filters.unreadOnly 
            ? 'bg-module-accent text-white hover:bg-module-accent/90' 
            : 'bg-white/50 border-white/30 text-module-primary hover:bg-white/70'}
        >
          Não Lidas
        </Button>
        <Button
          size="sm"
          onClick={() => onFilterChange({ ...filters, criticalOnly: !filters.criticalOnly })}
          className={filters.criticalOnly 
            ? 'bg-red-500 text-white hover:bg-red-600' 
            : 'bg-white/50 border-white/30 text-module-primary hover:bg-white/70'}
        >
          Críticas
        </Button>
        <Button
          size="sm"
          onClick={() => onFilterChange({ ...filters, hotLeadsOnly: !filters.hotLeadsOnly })}
          className={filters.hotLeadsOnly 
            ? 'bg-orange-500 text-white hover:bg-orange-600' 
            : 'bg-white/50 border-white/30 text-module-primary hover:bg-white/70'}
        >
          Leads Quentes
        </Button>
      </div>
    </div>
  );
};
