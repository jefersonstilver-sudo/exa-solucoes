import { useEffect, useState } from 'react';
import { Dialog, DialogContent, DialogHeader, DialogTitle } from '@/components/ui/dialog';
import { supabase } from '@/integrations/supabase/client';
import { Clock, User } from 'lucide-react';
import { format } from 'date-fns';
import { ptBR } from 'date-fns/locale';
import { cn } from '@/lib/utils';
import { useModuleTheme, getThemeClass } from '../../hooks/useModuleTheme';

interface ModificationLog {
  id: string;
  created_at: string;
  modified_by: string;
  old_value: string;
  new_value: string;
}

interface KnowledgeItemHistoryModalProps {
  isOpen: boolean;
  onClose: () => void;
  itemId: string;
  itemTitle: string;
}

export const KnowledgeItemHistoryModal = ({
  isOpen,
  onClose,
  itemId,
  itemTitle
}: KnowledgeItemHistoryModalProps) => {
  const [logs, setLogs] = useState<ModificationLog[]>([]);
  const [loading, setLoading] = useState(false);
  const { theme } = useModuleTheme();

  useEffect(() => {
    if (isOpen && itemId) {
      loadHistory();
    }
  }, [isOpen, itemId]);

  const loadHistory = async () => {
    setLoading(true);
    try {
      const { data, error } = await supabase
        .from('agent_modification_logs')
        .select('*')
        .eq('field_modified', `knowledge_item_${itemId}`)
        .order('created_at', { ascending: false });

      if (error) throw error;
      setLogs(data || []);
    } catch (error) {
      console.error('Erro ao carregar histórico:', error);
    } finally {
      setLoading(false);
    }
  };

  return (
    <Dialog open={isOpen} onOpenChange={onClose}>
      <DialogContent className={cn(getThemeClass(theme), "max-w-4xl max-h-[80vh] bg-module-card border-2 border-module")}>
        <DialogHeader>
          <DialogTitle className="text-module-primary text-xl font-bold">
            📜 Histórico de Modificações
          </DialogTitle>
          <p className="text-sm text-module-secondary">
            {itemTitle}
          </p>
        </DialogHeader>

        <div className="overflow-y-auto max-h-[60vh] space-y-4 pr-2">
          {loading ? (
            <div className="text-center py-8 text-module-secondary">
              Carregando histórico...
            </div>
          ) : logs.length === 0 ? (
            <div className="text-center py-8 text-module-secondary">
              <Clock className="h-12 w-12 mx-auto mb-2 opacity-50" />
              <p>Nenhuma modificação registrada ainda</p>
            </div>
          ) : (
            logs.map((log, index) => (
              <div
                key={log.id}
                className="border border-module rounded-lg p-4 bg-module-secondary/30 space-y-3"
              >
                {/* Header do log */}
                <div className="flex items-center justify-between text-sm">
                  <div className="flex items-center gap-2 text-module-primary">
                    <User className="h-4 w-4" />
                    <span className="font-semibold">{log.modified_by || 'Sistema'}</span>
                  </div>
                  <div className="flex items-center gap-2 text-module-secondary">
                    <Clock className="h-4 w-4" />
                    <span>
                      {format(new Date(log.created_at), "dd/MM/yyyy 'às' HH:mm", { locale: ptBR })}
                    </span>
                  </div>
                </div>

                {/* Conteúdo anterior */}
                {log.old_value && (
                  <div>
                    <p className="text-xs font-semibold text-red-400 mb-1">❌ Antes:</p>
                    <div className="bg-red-500/10 border border-red-500/30 rounded p-2 text-xs text-module-primary whitespace-pre-wrap max-h-32 overflow-y-auto">
                      {log.old_value}
                    </div>
                  </div>
                )}

                {/* Conteúdo novo */}
                {log.new_value && (
                  <div>
                    <p className="text-xs font-semibold text-green-400 mb-1">✅ Depois:</p>
                    <div className="bg-green-500/10 border border-green-500/30 rounded p-2 text-xs text-module-primary whitespace-pre-wrap max-h-32 overflow-y-auto">
                      {log.new_value}
                    </div>
                  </div>
                )}
              </div>
            ))
          )}
        </div>
      </DialogContent>
    </Dialog>
  );
};
