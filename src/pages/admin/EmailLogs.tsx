import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { useEmailAuditLogs } from '@/hooks/useEmailAuditLogs';
import { RefreshCw, Mail, CheckCircle, XCircle, Clock, AlertTriangle } from 'lucide-react';
import { format } from 'date-fns';
import { ptBR } from 'date-fns/locale';

export default function EmailLogs() {
  const { logs, loading, stats, refetch } = useEmailAuditLogs();

  const getStatusBadge = (status: string) => {
    switch (status) {
      case 'sent':
        return <Badge className="bg-green-500"><CheckCircle className="w-3 h-3 mr-1" />Enviado</Badge>;
      case 'failed':
        return <Badge variant="destructive"><XCircle className="w-3 h-3 mr-1" />Falhou</Badge>;
      case 'pending':
        return <Badge variant="secondary"><Clock className="w-3 h-3 mr-1" />Pendente</Badge>;
      default:
        return <Badge variant="outline">{status}</Badge>;
    }
  };

  const getEmailTypeLabel = (type: string) => {
    const types: Record<string, string> = {
      confirmation: '✉️ Confirmação',
      password_recovery: '🔒 Recuperação',
      video_submitted: '🎬 Vídeo Enviado',
      video_approved: '🎉 Vídeo Aprovado',
      video_rejected: '⚠️ Vídeo Rejeitado',
    };
    return types[type] || type;
  };

  return (
    <div className="container mx-auto p-6 space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-3xl font-bold">Logs de Emails</h1>
          <p className="text-muted-foreground">Monitore todos os emails enviados pelo sistema</p>
        </div>
        <Button onClick={refetch} disabled={loading}>
          <RefreshCw className={`w-4 h-4 mr-2 ${loading ? 'animate-spin' : ''}`} />
          Atualizar
        </Button>
      </div>

      {/* Stats Cards */}
      <div className="grid grid-cols-1 md:grid-cols-5 gap-4">
        <Card>
          <CardHeader className="pb-2">
            <CardTitle className="text-sm font-medium text-muted-foreground">Total</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="flex items-center">
              <Mail className="w-4 h-4 mr-2 text-primary" />
              <span className="text-2xl font-bold">{stats.total}</span>
            </div>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="pb-2">
            <CardTitle className="text-sm font-medium text-muted-foreground">Enviados</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="flex items-center">
              <CheckCircle className="w-4 h-4 mr-2 text-green-500" />
              <span className="text-2xl font-bold text-green-500">{stats.sent}</span>
            </div>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="pb-2">
            <CardTitle className="text-sm font-medium text-muted-foreground">Falhados</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="flex items-center">
              <XCircle className="w-4 h-4 mr-2 text-destructive" />
              <span className="text-2xl font-bold text-destructive">{stats.failed}</span>
            </div>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="pb-2">
            <CardTitle className="text-sm font-medium text-muted-foreground">Pendentes</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="flex items-center">
              <Clock className="w-4 h-4 mr-2 text-yellow-500" />
              <span className="text-2xl font-bold text-yellow-500">{stats.pending}</span>
            </div>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="pb-2">
            <CardTitle className="text-sm font-medium text-muted-foreground">Taxa de Sucesso</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="flex items-center">
              <span className="text-2xl font-bold">{stats.successRate}%</span>
            </div>
          </CardContent>
        </Card>
      </div>

      {/* Alert for low success rate */}
      {stats.successRate < 90 && stats.total > 10 && (
        <Card className="border-yellow-500 bg-yellow-50 dark:bg-yellow-950">
          <CardHeader>
            <CardTitle className="flex items-center text-yellow-700 dark:text-yellow-400">
              <AlertTriangle className="w-5 h-5 mr-2" />
              Taxa de Sucesso Baixa
            </CardTitle>
            <CardDescription>
              A taxa de sucesso de emails está abaixo de 90%. Verifique os logs de erro abaixo.
            </CardDescription>
          </CardHeader>
        </Card>
      )}

      {/* Logs Table */}
      <Card>
        <CardHeader>
          <CardTitle>Últimos 100 Emails</CardTitle>
          <CardDescription>Histórico detalhado de envios</CardDescription>
        </CardHeader>
        <CardContent>
          {loading ? (
            <div className="flex items-center justify-center py-8">
              <RefreshCw className="w-6 h-6 animate-spin" />
            </div>
          ) : (
            <div className="overflow-x-auto">
              <table className="w-full">
                <thead>
                  <tr className="border-b">
                    <th className="text-left p-2">Data/Hora</th>
                    <th className="text-left p-2">Tipo</th>
                    <th className="text-left p-2">Destinatário</th>
                    <th className="text-left p-2">Status</th>
                    <th className="text-left p-2">Tentativas</th>
                    <th className="text-left p-2">Resend ID</th>
                    <th className="text-left p-2">Erro</th>
                  </tr>
                </thead>
                <tbody>
                  {logs.map((log) => (
                    <tr key={log.id} className="border-b hover:bg-muted/50">
                      <td className="p-2 text-sm">
                        {format(new Date(log.created_at), 'dd/MM/yyyy HH:mm', { locale: ptBR })}
                      </td>
                      <td className="p-2 text-sm">{getEmailTypeLabel(log.email_type)}</td>
                      <td className="p-2 text-sm">
                        <div>
                          <div className="font-medium">{log.recipient_name || 'N/A'}</div>
                          <div className="text-xs text-muted-foreground">{log.recipient_email}</div>
                        </div>
                      </td>
                      <td className="p-2">{getStatusBadge(log.status)}</td>
                      <td className="p-2 text-sm">{log.retry_count}</td>
                      <td className="p-2 text-xs font-mono text-muted-foreground">
                        {log.resend_email_id ? (
                          <a
                            href={`https://resend.com/emails/${log.resend_email_id}`}
                            target="_blank"
                            rel="noopener noreferrer"
                            className="hover:underline"
                          >
                            {log.resend_email_id.substring(0, 12)}...
                          </a>
                        ) : (
                          '-'
                        )}
                      </td>
                      <td className="p-2 text-xs text-destructive max-w-xs truncate">
                        {log.error_message || '-'}
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>

              {logs.length === 0 && (
                <div className="text-center py-8 text-muted-foreground">
                  Nenhum log de email encontrado
                </div>
              )}
            </div>
          )}
        </CardContent>
      </Card>
    </div>
  );
}