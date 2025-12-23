import { useState, useEffect } from 'react';
import { Dialog, DialogContent, DialogHeader, DialogTitle } from '@/components/ui/dialog';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from '@/components/ui/table';
import { ScrollArea } from '@/components/ui/scroll-area';
import { 
  History, 
  CheckCircle2, 
  XCircle, 
  Clock, 
  RefreshCw,
  AlertTriangle,
  Phone,
  User,
  Calendar,
  Loader2
} from 'lucide-react';
import { supabase } from '@/integrations/supabase/client';
import { format } from 'date-fns';
import { ptBR } from 'date-fns/locale';

interface AlertLog {
  id: string;
  alert_key: string;
  event_type: string;
  phone: string;
  recipient_name: string | null;
  provider: string;
  status: string;
  message_preview: string | null;
  provider_message_id: string | null;
  error_message: string | null;
  metadata: Record<string, any> | null;
  created_at: string;
}

interface AlertHistoryDialogProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  alertKey: string;
  alertTitle: string;
}

export const AlertHistoryDialog = ({ 
  open, 
  onOpenChange, 
  alertKey, 
  alertTitle 
}: AlertHistoryDialogProps) => {
  const [logs, setLogs] = useState<AlertLog[]>([]);
  const [loading, setLoading] = useState(true);
  const [filter, setFilter] = useState<'all' | 'success' | 'error'>('all');

  useEffect(() => {
    if (open) {
      loadLogs();
    }
  }, [open, alertKey]);

  const loadLogs = async () => {
    setLoading(true);
    try {
      const { data, error } = await supabase
        .from('exa_alerts_message_logs')
        .select('*')
        .eq('alert_key', alertKey)
        .order('created_at', { ascending: false })
        .limit(100);

      if (error) throw error;
      setLogs((data || []) as AlertLog[]);
    } catch (error) {
      console.error('Error loading alert logs:', error);
    } finally {
      setLoading(false);
    }
  };

  const filteredLogs = logs.filter(log => {
    if (filter === 'all') return true;
    if (filter === 'success') return log.status === 'success';
    if (filter === 'error') return log.status === 'error' || log.status === 'failed';
    return true;
  });

  const getStatusIcon = (status: string) => {
    switch (status) {
      case 'success':
        return <CheckCircle2 className="w-4 h-4 text-emerald-500" />;
      case 'error':
      case 'failed':
        return <XCircle className="w-4 h-4 text-red-500" />;
      case 'pending':
        return <Clock className="w-4 h-4 text-amber-500" />;
      default:
        return <AlertTriangle className="w-4 h-4 text-gray-400" />;
    }
  };

  const getStatusBadge = (status: string) => {
    switch (status) {
      case 'success':
        return (
          <Badge className="bg-emerald-100 dark:bg-emerald-900/30 text-emerald-600 dark:text-emerald-400 text-[10px]">
            Sucesso
          </Badge>
        );
      case 'error':
      case 'failed':
        return (
          <Badge className="bg-red-100 dark:bg-red-900/30 text-red-600 dark:text-red-400 text-[10px]">
            Erro
          </Badge>
        );
      case 'pending':
        return (
          <Badge className="bg-amber-100 dark:bg-amber-900/30 text-amber-600 dark:text-amber-400 text-[10px]">
            Pendente
          </Badge>
        );
      default:
        return (
          <Badge variant="outline" className="text-[10px]">
            {status}
          </Badge>
        );
    }
  };

  const formatPhone = (phone: string) => {
    const cleaned = phone.replace(/\D/g, '');
    if (cleaned.startsWith('55') && cleaned.length >= 12) {
      const ddd = cleaned.slice(2, 4);
      const part1 = cleaned.slice(4, 9);
      const part2 = cleaned.slice(9);
      return `(${ddd}) ${part1}-${part2}`;
    }
    return phone;
  };

  const successCount = logs.filter(l => l.status === 'success').length;
  const errorCount = logs.filter(l => l.status === 'error' || l.status === 'failed').length;

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="max-w-4xl max-h-[85vh]">
        <DialogHeader>
          <DialogTitle className="flex items-center gap-2">
            <History className="w-5 h-5 text-muted-foreground" />
            Histórico de Envios - {alertTitle}
          </DialogTitle>
        </DialogHeader>

        <div className="space-y-4">
          {/* Stats & Filters */}
          <div className="flex flex-wrap items-center justify-between gap-3">
            <div className="flex items-center gap-2">
              <Badge variant="outline" className="text-xs">
                📊 {logs.length} total
              </Badge>
              <Badge className="bg-emerald-100 dark:bg-emerald-900/30 text-emerald-600 text-xs">
                ✅ {successCount} sucesso
              </Badge>
              <Badge className="bg-red-100 dark:bg-red-900/30 text-red-600 text-xs">
                ❌ {errorCount} erros
              </Badge>
            </div>
            <div className="flex items-center gap-2">
              <Button
                variant={filter === 'all' ? 'default' : 'outline'}
                size="sm"
                onClick={() => setFilter('all')}
                className="text-xs h-7"
              >
                Todos
              </Button>
              <Button
                variant={filter === 'success' ? 'default' : 'outline'}
                size="sm"
                onClick={() => setFilter('success')}
                className="text-xs h-7"
              >
                Sucesso
              </Button>
              <Button
                variant={filter === 'error' ? 'default' : 'outline'}
                size="sm"
                onClick={() => setFilter('error')}
                className="text-xs h-7"
              >
                Erros
              </Button>
              <Button
                variant="ghost"
                size="sm"
                onClick={loadLogs}
                disabled={loading}
                className="h-7"
              >
                <RefreshCw className={`w-3 h-3 ${loading ? 'animate-spin' : ''}`} />
              </Button>
            </div>
          </div>

          {/* Table */}
          <ScrollArea className="h-[500px] rounded-lg border">
            {loading ? (
              <div className="flex items-center justify-center h-32">
                <Loader2 className="w-6 h-6 animate-spin text-muted-foreground" />
              </div>
            ) : filteredLogs.length === 0 ? (
              <div className="flex flex-col items-center justify-center h-32 text-muted-foreground">
                <History className="w-8 h-8 mb-2 opacity-50" />
                <p className="text-sm">Nenhum registro encontrado</p>
              </div>
            ) : (
              <Table>
                <TableHeader>
                  <TableRow>
                    <TableHead className="w-[50px]">Status</TableHead>
                    <TableHead>Destinatário</TableHead>
                    <TableHead>Telefone</TableHead>
                    <TableHead>Tipo</TableHead>
                    <TableHead>Provider</TableHead>
                    <TableHead>Data/Hora</TableHead>
                    <TableHead>Detalhes</TableHead>
                  </TableRow>
                </TableHeader>
                <TableBody>
                  {filteredLogs.map((log) => (
                    <TableRow key={log.id} className="text-xs">
                      <TableCell>
                        <div className="flex items-center gap-1">
                          {getStatusIcon(log.status)}
                        </div>
                      </TableCell>
                      <TableCell>
                        <div className="flex items-center gap-1">
                          <User className="w-3 h-3 text-muted-foreground" />
                          <span className="font-medium">
                            {log.recipient_name || '-'}
                          </span>
                        </div>
                      </TableCell>
                      <TableCell>
                        <div className="flex items-center gap-1">
                          <Phone className="w-3 h-3 text-muted-foreground" />
                          <span className="font-mono text-[11px]">
                            {formatPhone(log.phone)}
                          </span>
                        </div>
                      </TableCell>
                      <TableCell>
                        <Badge variant="outline" className="text-[10px]">
                          {log.event_type === 'test_send' ? '🧪 Teste' : '📤 Agendado'}
                        </Badge>
                      </TableCell>
                      <TableCell>
                        <Badge 
                          variant="outline" 
                          className={`text-[10px] ${
                            log.provider === 'zapi' 
                              ? 'border-green-500/30 text-green-600' 
                              : 'border-blue-500/30 text-blue-600'
                          }`}
                        >
                          {log.provider.toUpperCase()}
                        </Badge>
                      </TableCell>
                      <TableCell>
                        <div className="flex items-center gap-1 text-muted-foreground">
                          <Calendar className="w-3 h-3" />
                          <span>
                            {format(new Date(log.created_at), "dd/MM HH:mm", { locale: ptBR })}
                          </span>
                        </div>
                      </TableCell>
                      <TableCell>
                        {log.error_message ? (
                          <span className="text-red-500 text-[10px] truncate max-w-[150px] block" title={log.error_message}>
                            {log.error_message.substring(0, 40)}...
                          </span>
                        ) : log.provider_message_id ? (
                          <span className="text-emerald-600 text-[10px] font-mono" title={log.provider_message_id}>
                            ID: {log.provider_message_id.substring(0, 12)}...
                          </span>
                        ) : (
                          <span className="text-muted-foreground">-</span>
                        )}
                      </TableCell>
                    </TableRow>
                  ))}
                </TableBody>
              </Table>
            )}
          </ScrollArea>
        </div>
      </DialogContent>
    </Dialog>
  );
};
