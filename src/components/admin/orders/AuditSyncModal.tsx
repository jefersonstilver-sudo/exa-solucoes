import React, { useState } from 'react';
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogDescription } from '@/components/ui/dialog';
import { Button } from '@/components/ui/button';
import { Progress } from '@/components/ui/progress';
import { ShieldCheck, CheckCircle, XCircle, SkipForward, Crown, RefreshCw } from 'lucide-react';
import { supabase } from '@/integrations/supabase/client';
import { toast } from 'sonner';
import { ScrollArea } from '@/components/ui/scroll-area';

interface AuditDetail {
  pedido_id: string;
  status: 'success' | 'error' | 'skipped';
  message?: string;
  error?: string;
  buildings?: number;
  synced_videos?: number;
  is_master?: boolean;
}

interface AuditResult {
  total_orders: number;
  synced: number;
  failed: number;
  details: AuditDetail[];
}

interface AuditSyncModalProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
}

const AuditSyncModal: React.FC<AuditSyncModalProps> = ({ open, onOpenChange }) => {
  const [running, setRunning] = useState(false);
  const [result, setResult] = useState<AuditResult | null>(null);
  const [progress, setProgress] = useState(0);

  const startAudit = async () => {
    setRunning(true);
    setResult(null);
    setProgress(10);

    try {
      const { data: userData } = await supabase.auth.getUser();
      
      // Simulate progress while waiting
      const progressInterval = setInterval(() => {
        setProgress(prev => Math.min(prev + 5, 85));
      }, 2000);

      const { data, error } = await supabase.functions.invoke('audit-sync-all-active-orders', {
        body: { source: 'audit', executed_by: userData.user?.id }
      });

      clearInterval(progressInterval);
      setProgress(100);

      if (error) {
        console.error('❌ [AUDIT MODAL] Error:', error);
        toast.error('Erro ao executar auditoria');
        return;
      }

      setResult(data as AuditResult);
      
      if (data?.failed === 0) {
        toast.success(`Auditoria concluída! ${data.synced} pedidos sincronizados.`);
      } else {
        toast.warning(`Auditoria concluída com ${data.failed} erro(s).`);
      }
    } catch (err: any) {
      console.error('💥 [AUDIT MODAL] Exception:', err);
      toast.error(`Erro: ${err.message}`);
    } finally {
      setRunning(false);
    }
  };

  const handleClose = () => {
    if (!running) {
      setResult(null);
      setProgress(0);
      onOpenChange(false);
    }
  };

  const StatusIcon = ({ status }: { status: string }) => {
    switch (status) {
      case 'success': return <CheckCircle className="h-4 w-4 text-emerald-500" />;
      case 'error': return <XCircle className="h-4 w-4 text-red-500" />;
      case 'skipped': return <SkipForward className="h-4 w-4 text-muted-foreground" />;
      default: return null;
    }
  };

  return (
    <Dialog open={open} onOpenChange={handleClose}>
      <DialogContent className="sm:max-w-lg">
        <DialogHeader>
          <DialogTitle className="flex items-center gap-2">
            <ShieldCheck className="h-5 w-5 text-blue-600" />
            Auditoria Geral API (AWS)
          </DialogTitle>
          <DialogDescription>
            Verifica e sincroniza todos os pedidos ativos com a API externa AWS.
          </DialogDescription>
        </DialogHeader>

        <div className="space-y-4">
          {/* Progress */}
          {running && (
            <div className="space-y-2">
              <div className="flex items-center justify-between text-sm">
                <span className="text-muted-foreground">Sincronizando pedidos...</span>
                <span className="font-medium">{progress}%</span>
              </div>
              <Progress value={progress} className="h-2" />
            </div>
          )}

          {/* Results */}
          {result && (
            <div className="space-y-3">
              {/* Summary */}
              <div className="grid grid-cols-3 gap-2">
                <div className="bg-muted/50 rounded-lg p-3 text-center">
                  <div className="text-2xl font-bold">{result.total_orders}</div>
                  <div className="text-xs text-muted-foreground">Total</div>
                </div>
                <div className="bg-emerald-50 rounded-lg p-3 text-center">
                  <div className="text-2xl font-bold text-emerald-600">{result.synced}</div>
                  <div className="text-xs text-emerald-600">Sincronizados</div>
                </div>
                <div className="bg-red-50 rounded-lg p-3 text-center">
                  <div className="text-2xl font-bold text-red-600">{result.failed}</div>
                  <div className="text-xs text-red-600">Erros</div>
                </div>
              </div>

              {/* Detail List */}
              <ScrollArea className="h-[250px] rounded-md border p-2">
                <div className="space-y-1.5">
                  {result.details.map((d, i) => (
                    <div key={i} className="flex items-center gap-2 text-sm py-1.5 px-2 rounded hover:bg-muted/50">
                      <StatusIcon status={d.status} />
                      <span className="font-mono text-xs truncate flex-1">
                        {d.pedido_id.substring(0, 8)}...
                      </span>
                      {d.is_master && <Crown className="h-3.5 w-3.5 text-amber-500" />}
                      <span className="text-xs text-muted-foreground">
                        {d.buildings || 0} prédios
                      </span>
                      {d.error && (
                        <span className="text-xs text-red-500 truncate max-w-[120px]" title={d.error}>
                          {d.error}
                        </span>
                      )}
                    </div>
                  ))}
                </div>
              </ScrollArea>
            </div>
          )}

          {/* Actions */}
          <div className="flex gap-2 justify-end">
            {!running && !result && (
              <Button onClick={startAudit} className="bg-blue-600 hover:bg-blue-700">
                <ShieldCheck className="h-4 w-4 mr-2" />
                Iniciar Auditoria
              </Button>
            )}
            {!running && result && (
              <>
                <Button variant="outline" onClick={handleClose}>Fechar</Button>
                <Button onClick={startAudit} variant="outline" className="border-blue-600 text-blue-600 hover:bg-blue-50">
                  <RefreshCw className="h-4 w-4 mr-2" />
                  Executar Novamente
                </Button>
              </>
            )}
            {running && (
              <Button disabled variant="outline">
                <RefreshCw className="h-4 w-4 mr-2 animate-spin" />
                Processando...
              </Button>
            )}
          </div>
        </div>
      </DialogContent>
    </Dialog>
  );
};

export default AuditSyncModal;
