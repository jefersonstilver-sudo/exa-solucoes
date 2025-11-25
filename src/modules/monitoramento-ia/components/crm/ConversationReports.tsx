import React, { useState, useEffect } from 'react';
import { supabase } from '@/integrations/supabase/client';
import { Button } from '@/components/ui/button';
import { FileText, Trash2 } from 'lucide-react';
import { toast } from 'sonner';
import { format } from 'date-fns';
import { ptBR } from 'date-fns/locale';

interface ConversationReportsProps {
  conversationId: string | null;
}

interface Report {
  id: string;
  created_at: string;
  summary: string;
}

export const ConversationReports: React.FC<ConversationReportsProps> = ({ conversationId }) => {
  const [reports, setReports] = useState<Report[]>([]);
  const [loading, setLoading] = useState(false);

  const fetchReports = async () => {
    if (!conversationId) return;

    setLoading(true);
    try {
      const { data, error } = await supabase
        .from('conversation_reports')
        .select('id, created_at, summary')
        .eq('conversation_id', conversationId)
        .order('created_at', { ascending: false })
        .limit(5);

      if (error) throw error;
      setReports(data || []);
    } catch (error) {
      console.error('Error fetching reports:', error);
    } finally {
      setLoading(false);
    }
  };

  const deleteReport = async (reportId: string) => {
    try {
      const { error } = await supabase
        .from('conversation_reports')
        .delete()
        .eq('id', reportId);

      if (error) throw error;
      
      toast.success('Relatório removido');
      await fetchReports();
    } catch (error) {
      console.error('Error deleting report:', error);
      toast.error('Erro ao remover relatório');
    }
  };

  const viewReport = (reportId: string) => {
    // TODO: Abrir drawer com relatório completo
    console.log('View report:', reportId);
  };

  useEffect(() => {
    fetchReports();
  }, [conversationId]);

  if (loading) {
    return <p className="text-sm text-muted-foreground">Carregando...</p>;
  }

  if (reports.length === 0) {
    return (
      <p className="text-sm text-muted-foreground">
        Nenhum relatório gerado ainda
      </p>
    );
  }

  return (
    <div className="space-y-2">
      <p className="text-xs text-muted-foreground font-semibold">HISTÓRICO</p>
      <div className="space-y-2">
        {reports.map((report) => (
          <div
            key={report.id}
            className="flex items-center justify-between p-2 rounded border border-module-border hover:bg-accent/50 transition-colors"
          >
            <div className="flex-1 min-w-0">
              <div className="flex items-center gap-2">
                <FileText className="w-3 h-3 text-muted-foreground flex-shrink-0" />
                <span className="text-xs text-muted-foreground">
                  {format(new Date(report.created_at), "dd/MM/yyyy 'às' HH:mm", { locale: ptBR })}
                </span>
              </div>
              {report.summary && (
                <p className="text-xs mt-1 truncate">{report.summary}</p>
              )}
            </div>
            <div className="flex items-center gap-1 ml-2">
              <Button
                variant="ghost"
                size="icon"
                className="h-7 w-7"
                onClick={() => viewReport(report.id)}
              >
                <FileText className="w-3 h-3" />
              </Button>
              <Button
                variant="ghost"
                size="icon"
                className="h-7 w-7 text-destructive hover:text-destructive"
                onClick={() => deleteReport(report.id)}
              >
                <Trash2 className="w-3 h-3" />
              </Button>
            </div>
          </div>
        ))}
      </div>
    </div>
  );
};
