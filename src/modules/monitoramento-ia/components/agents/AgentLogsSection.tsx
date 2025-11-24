import { useState, useEffect } from 'react';
import { supabase } from '@/integrations/supabase/client';
import { ScrollArea } from '@/components/ui/scroll-area';
import { Calendar, User, FileEdit, Loader2, Filter } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Agent } from '../../hooks/useAgentConfig';

interface ModificationLog {
  id: string;
  section: string;
  field_modified: string;
  old_value: string | null;
  new_value: string | null;
  modified_by: string | null;
  created_at: string;
}

interface AgentLogsSectionProps {
  agent: Agent;
}

export const AgentLogsSection = ({ agent }: AgentLogsSectionProps) => {
  const [logs, setLogs] = useState<ModificationLog[]>([]);
  const [loading, setLoading] = useState(true);
  const [filter, setFilter] = useState<'all' | '24h' | '7d'>('all');

  useEffect(() => {
    loadLogs();
  }, [agent.key, filter]);

  const loadLogs = async () => {
    try {
      setLoading(true);
      
      let query = supabase
        .from('agent_modification_logs')
        .select('*')
        .eq('agent_key', agent.key)
        .order('created_at', { ascending: false })
        .limit(50);

      // Aplicar filtro de data
      if (filter === '24h') {
        const yesterday = new Date();
        yesterday.setDate(yesterday.getDate() - 1);
        query = query.gte('created_at', yesterday.toISOString());
      } else if (filter === '7d') {
        const lastWeek = new Date();
        lastWeek.setDate(lastWeek.getDate() - 7);
        query = query.gte('created_at', lastWeek.toISOString());
      }

      const { data, error } = await query;

      if (error) throw error;
      setLogs(data || []);
    } catch (error) {
      console.error('Erro ao carregar logs:', error);
    } finally {
      setLoading(false);
    }
  };

  const getSectionLabel = (section: string) => {
    const labels: Record<string, string> = {
      'profile': 'Perfil',
      'personality': 'Personalidade',
      'faq': 'FAQ',
      'knowledge': 'Base de Conhecimento',
      'config': 'Configurações',
      'rules': 'Regras',
      'tools': 'Ferramentas',
      'connections': 'Conexões'
    };
    return labels[section] || section;
  };

  const formatDate = (dateString: string) => {
    const date = new Date(dateString);
    const now = new Date();
    const diffInHours = Math.floor((now.getTime() - date.getTime()) / (1000 * 60 * 60));

    if (diffInHours < 1) {
      const diffInMinutes = Math.floor((now.getTime() - date.getTime()) / (1000 * 60));
      return `há ${diffInMinutes} minutos`;
    } else if (diffInHours < 24) {
      return `há ${diffInHours} horas`;
    } else {
      return date.toLocaleDateString('pt-BR', { 
        day: '2-digit', 
        month: 'short',
        hour: '2-digit',
        minute: '2-digit'
      });
    }
  };

  return (
    <div className="space-y-4">
      <div className="flex items-center justify-between">
        <div>
          <h3 className="text-lg font-semibold text-module-primary">Logs & Histórico</h3>
          <p className="text-sm text-module-secondary mt-1">Modificações recentes no agente</p>
        </div>
        <div className="flex items-center gap-2">
          <Filter className="w-4 h-4 text-module-tertiary" />
          <div className="flex gap-1">
            <Button
              size="sm"
              variant={filter === 'all' ? 'default' : 'outline'}
              onClick={() => setFilter('all')}
              className={filter === 'all' ? 'bg-module-accent text-white' : ''}
            >
              Todos
            </Button>
            <Button
              size="sm"
              variant={filter === '24h' ? 'default' : 'outline'}
              onClick={() => setFilter('24h')}
              className={filter === '24h' ? 'bg-module-accent text-white' : ''}
            >
              24h
            </Button>
            <Button
              size="sm"
              variant={filter === '7d' ? 'default' : 'outline'}
              onClick={() => setFilter('7d')}
              className={filter === '7d' ? 'bg-module-accent text-white' : ''}
            >
              7 dias
            </Button>
          </div>
        </div>
      </div>

      {loading ? (
        <div className="flex items-center justify-center py-12">
          <Loader2 className="w-6 h-6 animate-spin text-module-accent" />
        </div>
      ) : logs.length === 0 ? (
        <div className="bg-module-card rounded-lg border border-module p-8 text-center">
          <FileEdit className="w-12 h-12 text-module-tertiary mx-auto mb-3 opacity-50" />
          <p className="text-module-secondary">Nenhuma modificação registrada</p>
          <p className="text-xs text-module-tertiary mt-1">
            As alterações feitas no agente aparecerão aqui
          </p>
        </div>
      ) : (
        <ScrollArea className="h-[600px] rounded-lg border border-module bg-module-card p-4">
          <div className="space-y-3">
            {logs.map((log) => (
              <div 
                key={log.id}
                className="p-4 rounded-lg border border-module bg-module-input hover:border-module-accent/50 transition-colors"
              >
                <div className="flex items-start justify-between mb-2">
                  <div className="flex items-center gap-2">
                    <span className="px-2 py-1 bg-module-accent/20 text-module-accent text-xs rounded font-medium">
                      {getSectionLabel(log.section)}
                    </span>
                    <span className="text-sm font-medium text-module-primary">
                      {log.field_modified}
                    </span>
                  </div>
                  <div className="flex items-center gap-2 text-xs text-module-tertiary">
                    <Calendar className="w-3 h-3" />
                    {formatDate(log.created_at)}
                  </div>
                </div>

                {log.old_value !== log.new_value && (
                  <div className="grid grid-cols-2 gap-3 mt-3 text-sm">
                    <div className="p-2 rounded bg-red-500/5 border border-red-500/20">
                      <p className="text-xs text-red-400 mb-1 font-medium">Antes:</p>
                      <p className="text-module-secondary text-xs line-clamp-2">
                        {log.old_value || '(vazio)'}
                      </p>
                    </div>
                    <div className="p-2 rounded bg-green-500/5 border border-green-500/20">
                      <p className="text-xs text-green-400 mb-1 font-medium">Depois:</p>
                      <p className="text-module-primary text-xs line-clamp-2">
                        {log.new_value || '(vazio)'}
                      </p>
                    </div>
                  </div>
                )}

                {log.modified_by && (
                  <div className="flex items-center gap-1 mt-2 text-xs text-module-tertiary">
                    <User className="w-3 h-3" />
                    Modificado por: <span className="text-module-secondary">{log.modified_by}</span>
                  </div>
                )}
              </div>
            ))}
          </div>
        </ScrollArea>
      )}
    </div>
  );
};
