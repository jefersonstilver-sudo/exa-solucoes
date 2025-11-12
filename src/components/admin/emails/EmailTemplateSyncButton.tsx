import { useState } from 'react';
import { Button } from '@/components/ui/button';
import { Progress } from '@/components/ui/progress';
import { RefreshCw, CheckCircle2, XCircle } from 'lucide-react';
import { toast } from 'sonner';
import { supabase } from '@/integrations/supabase/client';

interface SyncResult {
  templateId: string;
  templateName: string;
  status: 'success' | 'error';
  error?: string;
}

interface SyncResponse {
  success: boolean;
  summary: {
    total: number;
    success: number;
    errors: number;
  };
  results: SyncResult[];
  timestamp: string;
}

export function EmailTemplateSyncButton() {
  const [isSyncing, setIsSyncing] = useState(false);
  const [progress, setProgress] = useState(0);
  const [currentTemplate, setCurrentTemplate] = useState('');
  const [results, setResults] = useState<SyncResult[]>([]);

  const handleSync = async () => {
    setIsSyncing(true);
    setProgress(0);
    setResults([]);
    setCurrentTemplate('Iniciando sincronização...');

    try {
      console.log('🔄 Iniciando sincronização de templates de email...');
      
      // Simular progresso inicial
      setProgress(10);
      setCurrentTemplate('Conectando ao servidor...');
      
      const { data, error } = await supabase.functions.invoke('sync-email-templates', {
        body: {}
      });

      if (error) {
        throw error;
      }

      const response = data as SyncResponse;
      
      if (response.success) {
        setResults(response.results);
        setProgress(100);
        setCurrentTemplate('Sincronização concluída!');
        
        toast.success(
          `Templates sincronizados com sucesso! ${response.summary.success}/${response.summary.total} atualizados`,
          {
            description: response.summary.errors > 0 
              ? `${response.summary.errors} template(s) com erro`
              : 'Todos os templates foram atualizados'
          }
        );
      } else {
        throw new Error('Falha na sincronização');
      }

    } catch (error: any) {
      console.error('❌ Erro na sincronização:', error);
      setCurrentTemplate('Erro na sincronização');
      toast.error('Erro ao sincronizar templates', {
        description: error.message
      });
    } finally {
      setTimeout(() => {
        setIsSyncing(false);
        setCurrentTemplate('');
        setProgress(0);
      }, 3000);
    }
  };

  return (
    <div className="space-y-4">
      <Button
        onClick={handleSync}
        disabled={isSyncing}
        className="w-full sm:w-auto"
      >
        <RefreshCw className={`mr-2 h-4 w-4 ${isSyncing ? 'animate-spin' : ''}`} />
        {isSyncing ? 'Sincronizando...' : 'Sincronizar Templates'}
      </Button>

      {isSyncing && (
        <div className="space-y-2">
          <div className="flex items-center justify-between text-sm">
            <span className="text-muted-foreground">{currentTemplate}</span>
            <span className="font-medium">{Math.round(progress)}%</span>
          </div>
          <Progress value={progress} className="h-2" />
        </div>
      )}

      {results.length > 0 && (
        <div className="space-y-2 max-h-60 overflow-y-auto">
          <p className="text-sm font-medium">Resultados:</p>
          {results.map((result, index) => (
            <div
              key={index}
              className="flex items-center gap-2 text-sm p-2 rounded-lg bg-muted/50"
            >
              {result.status === 'success' ? (
                <CheckCircle2 className="h-4 w-4 text-green-500 flex-shrink-0" />
              ) : (
                <XCircle className="h-4 w-4 text-destructive flex-shrink-0" />
              )}
              <span className="flex-1">{result.templateName}</span>
              {result.error && (
                <span className="text-xs text-destructive">{result.error}</span>
              )}
            </div>
          ))}
        </div>
      )}
    </div>
  );
}
