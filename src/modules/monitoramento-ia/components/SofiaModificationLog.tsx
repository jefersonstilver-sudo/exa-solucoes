import { useState, useEffect } from 'react';
import { History, X } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Dialog, DialogContent, DialogHeader, DialogTitle } from '@/components/ui/dialog';
import { ScrollArea } from '@/components/ui/scroll-area';
import { supabase } from '@/integrations/supabase/client';
import { format } from 'date-fns';
import { ptBR } from 'date-fns/locale';
import { useModuleTheme, getThemeClass } from '@/modules/monitoramento-ia/hooks/useModuleTheme';
import { cn } from '@/lib/utils';

interface ModificationLog {
  id: string;
  agent_key: string;
  section: string;
  field_modified: string;
  old_value: string | null;
  new_value: string | null;
  modified_by: string | null;
  created_at: string;
}

export const SofiaModificationLog = () => {
  const [isOpen, setIsOpen] = useState(false);
  const [logs, setLogs] = useState<ModificationLog[]>([]);
  const [loading, setLoading] = useState(false);
  const { theme } = useModuleTheme();

  const loadLogs = async () => {
    setLoading(true);
    try {
      const { data, error } = await supabase
        .from('agent_modification_logs')
        .select('*')
        .eq('agent_key', 'sofia')
        .order('created_at', { ascending: false })
        .limit(50);

      if (error) throw error;
      setLogs(data || []);
    } catch (error) {
      console.error('Erro ao carregar logs:', error);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    if (isOpen) {
      loadLogs();
    }
  }, [isOpen]);

  const getSectionLabel = (section: string) => {
    const labels: Record<string, string> = {
      perfil: '👤 Perfil',
      faq: '❓ FAQ',
      regras_basicas: '📋 Regras Básicas',
      regras_consulta: '🔍 Consulta',
      tom_voz: '🗣️ Tom de Voz',
    };
    return labels[section] || section;
  };

  return (
    <>
      {/* Botão Flutuante */}
      <button
        onClick={() => setIsOpen(true)}
        className="fixed bottom-6 right-6 z-50 bg-module-accent hover:bg-module-accent-hover text-white rounded-full p-4 shadow-lg transition-all hover:scale-110"
        title="Ver modificações da Sofia"
      >
        <History className="w-6 h-6" />
      </button>

      {/* Modal de Logs */}
      <Dialog open={isOpen} onOpenChange={setIsOpen}>
        <DialogContent className={cn(getThemeClass(theme), "max-w-4xl max-h-[80vh] bg-module-card border-module")}>
          <DialogHeader>
            <DialogTitle className="flex items-center gap-2">
              <History className="w-5 h-5" />
              Log de Modificações - Sofia
            </DialogTitle>
          </DialogHeader>

          <ScrollArea className="h-[60vh]">
            {loading ? (
              <div className="flex items-center justify-center py-12">
                <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-module-accent" />
              </div>
            ) : logs.length === 0 ? (
              <div className="text-center py-12 text-module-secondary">
                Nenhuma modificação registrada ainda
              </div>
            ) : (
              <div className="space-y-4">
                {logs.map((log) => (
                  <div
                    key={log.id}
                    className="bg-module-card border border-module rounded-lg p-4 space-y-3"
                  >
                    <div className="flex items-center justify-between">
                      <div className="flex items-center gap-2">
                        <span className="text-sm font-medium">
                          {getSectionLabel(log.section)}
                        </span>
                        <span className="text-xs text-module-tertiary">
                          {log.field_modified}
                        </span>
                      </div>
                      <span className="text-xs text-module-tertiary">
                        {format(new Date(log.created_at), "dd/MM/yy 'às' HH:mm", { locale: ptBR })}
                      </span>
                    </div>

                    {log.old_value && (
                      <div className="space-y-1">
                        <div className="text-xs text-module-tertiary">Antes:</div>
                        <div className="bg-red-500/10 border border-red-500/20 rounded p-2 text-sm text-red-600 dark:text-red-400">
                          {log.old_value}
                        </div>
                      </div>
                    )}

                    {log.new_value && (
                      <div className="space-y-1">
                        <div className="text-xs text-module-tertiary">Depois:</div>
                        <div className="bg-green-500/10 border border-green-500/20 rounded p-2 text-sm text-green-600 dark:text-green-400">
                          {log.new_value}
                        </div>
                      </div>
                    )}

                    {log.modified_by && (
                      <div className="text-xs text-module-tertiary">
                        Modificado por: {log.modified_by}
                      </div>
                    )}
                  </div>
                ))}
              </div>
            )}
          </ScrollArea>
        </DialogContent>
      </Dialog>
    </>
  );
};
