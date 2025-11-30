import { useState, useEffect } from 'react';
import { Dialog, DialogContent, DialogHeader, DialogTitle } from '@/components/ui/dialog';
import { ScrollArea } from '@/components/ui/scroll-area';
import { supabase } from '@/integrations/supabase/client';
import { format } from 'date-fns';
import { ptBR } from 'date-fns/locale';
import { Clock, User } from 'lucide-react';
import { toast } from 'sonner';

interface ModificationLog {
  id: string;
  created_at: string;
  field_modified: string;
  old_value: string | null;
  new_value: string | null;
  modified_by: string | null;
}

interface SectionHistoryModalProps {
  isOpen: boolean;
  onClose: () => void;
  agentKey: string;
  sectionNumber: number;
  sectionTitle: string;
}

export const SectionHistoryModal = ({
  isOpen,
  onClose,
  agentKey,
  sectionNumber,
  sectionTitle,
}: SectionHistoryModalProps) => {
  const [logs, setLogs] = useState<ModificationLog[]>([]);
  const [loading, setLoading] = useState(false);

  useEffect(() => {
    if (isOpen) {
      loadHistory();
    }
  }, [isOpen, agentKey, sectionNumber]);

  const loadHistory = async () => {
    try {
      setLoading(true);
      const { data, error } = await supabase
        .from('agent_modification_logs')
        .select('*')
        .eq('agent_key', agentKey)
        .eq('section', `section_${sectionNumber}`)
        .order('created_at', { ascending: false })
        .limit(50);

      if (error) throw error;
      setLogs(data || []);
    } catch (error) {
      console.error('Erro ao carregar histórico:', error);
      toast.error('Erro ao carregar histórico');
    } finally {
      setLoading(false);
    }
  };

  return (
    <Dialog open={isOpen} onOpenChange={onClose}>
      <DialogContent className="max-w-4xl max-h-[80vh] bg-module-card border-module">
        <DialogHeader>
          <DialogTitle className="text-module-primary flex items-center gap-2">
            <Clock className="h-5 w-5" />
            Histórico de Edições - {sectionTitle}
          </DialogTitle>
        </DialogHeader>

        <ScrollArea className="h-[600px] pr-4">
          {loading ? (
            <div className="flex items-center justify-center py-8">
              <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-module-accent"></div>
            </div>
          ) : logs.length === 0 ? (
            <div className="text-center py-8 text-module-secondary">
              Nenhuma edição registrada ainda
            </div>
          ) : (
            <div className="space-y-4">
              {logs.map((log) => (
                <div
                  key={log.id}
                  className="bg-module-input rounded-lg p-4 border border-module"
                >
                  <div className="flex items-center justify-between mb-3">
                    <div className="flex items-center gap-2 text-sm text-module-secondary">
                      <Clock className="h-4 w-4" />
                      {format(new Date(log.created_at), "dd/MM/yyyy 'às' HH:mm", {
                        locale: ptBR,
                      })}
                    </div>
                    {log.modified_by && (
                      <div className="flex items-center gap-2 text-sm text-module-secondary">
                        <User className="h-4 w-4" />
                        {log.modified_by}
                      </div>
                    )}
                  </div>

                  <div className="space-y-3">
                    <div className="text-sm font-medium text-module-primary">
                      Campo: {log.field_modified}
                    </div>

                    {log.old_value && (
                      <div>
                        <div className="text-xs font-medium text-red-500 mb-1">
                          ❌ Valor Anterior:
                        </div>
                        <div className="bg-red-500/10 border border-red-500/20 rounded p-3 text-sm text-module-primary font-mono whitespace-pre-wrap max-h-32 overflow-y-auto">
                          {log.old_value}
                        </div>
                      </div>
                    )}

                    {log.new_value && (
                      <div>
                        <div className="text-xs font-medium text-green-500 mb-1">
                          ✅ Novo Valor:
                        </div>
                        <div className="bg-green-500/10 border border-green-500/20 rounded p-3 text-sm text-module-primary font-mono whitespace-pre-wrap max-h-32 overflow-y-auto">
                          {log.new_value}
                        </div>
                      </div>
                    )}
                  </div>
                </div>
              ))}
            </div>
          )}
        </ScrollArea>
      </DialogContent>
    </Dialog>
  );
};
