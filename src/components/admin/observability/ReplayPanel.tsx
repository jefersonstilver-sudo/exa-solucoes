import React, { useState } from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Textarea } from '@/components/ui/textarea';
import { Badge } from '@/components/ui/badge';
import { ScrollArea } from '@/components/ui/scroll-area';
import { 
  RefreshCw, 
  Search, 
  Play, 
  Clock, 
  User,
  CheckCircle,
  XCircle,
  Loader2,
  AlertCircle
} from 'lucide-react';
import { ReplayAuditEntry, MessageWithTrace } from '@/hooks/useObservabilityData';
import { formatDistanceToNow, format } from 'date-fns';
import { ptBR } from 'date-fns/locale';
import { UseMutationResult } from '@tanstack/react-query';
import { supabase } from '@/integrations/supabase/client';
import { toast } from 'sonner';

interface ReplayPanelProps {
  replays: ReplayAuditEntry[];
  isLoading: boolean;
  executeReplay: UseMutationResult<any, Error, { messageId: string; reason: string }, unknown>;
}

export const ReplayPanel: React.FC<ReplayPanelProps> = ({
  replays,
  isLoading,
  executeReplay,
}) => {
  const [searchId, setSearchId] = useState('');
  const [reason, setReason] = useState('');
  const [foundMessage, setFoundMessage] = useState<MessageWithTrace | null>(null);
  const [isSearching, setIsSearching] = useState(false);

  const handleSearch = async () => {
    if (!searchId.trim()) {
      toast.error('Digite um ID de mensagem para buscar');
      return;
    }

    setIsSearching(true);
    try {
      const { data, error } = await supabase
        .from('messages')
        .select('id, conversation_id, body, direction, delivery_status, delivery_retry_count, created_at, external_message_id, agent_key')
        .or(`id.eq.${searchId},external_message_id.eq.${searchId}`)
        .single();

      if (error || !data) {
        toast.error('Mensagem não encontrada');
        setFoundMessage(null);
        return;
      }

      setFoundMessage(data as MessageWithTrace);
    } catch (error) {
      toast.error('Erro ao buscar mensagem');
    } finally {
      setIsSearching(false);
    }
  };

  const handleReplay = () => {
    if (!foundMessage) {
      toast.error('Busque uma mensagem primeiro');
      return;
    }
    if (!reason.trim()) {
      toast.error('Informe o motivo do replay');
      return;
    }
    if (foundMessage.direction !== 'inbound') {
      toast.error('Apenas mensagens inbound podem ser replayed');
      return;
    }

    executeReplay.mutate({
      messageId: foundMessage.id,
      reason: reason.trim(),
    }, {
      onSuccess: () => {
        setSearchId('');
        setReason('');
        setFoundMessage(null);
      }
    });
  };

  const getStatusBadge = (status: string) => {
    switch (status) {
      case 'success':
        return <Badge className="bg-green-500/10 text-green-600 border-green-500/20">Sucesso</Badge>;
      case 'failed':
        return <Badge variant="destructive">Falhou</Badge>;
      case 'pending':
        return <Badge variant="secondary">Pendente</Badge>;
      default:
        return <Badge variant="outline">{status}</Badge>;
    }
  };

  return (
    <div className="grid gap-6 lg:grid-cols-2">
      {/* Formulário de Replay */}
      <Card>
        <CardHeader>
          <CardTitle className="text-lg flex items-center gap-2">
            <RefreshCw className="h-5 w-5 text-cyan-500" />
            Executar Replay Manual
          </CardTitle>
        </CardHeader>
        <CardContent className="space-y-4">
          <div className="space-y-2">
            <Label htmlFor="message-id">ID da Mensagem</Label>
            <div className="flex gap-2">
              <Input
                id="message-id"
                placeholder="Digite o ID da mensagem..."
                value={searchId}
                onChange={(e) => setSearchId(e.target.value)}
                className="flex-1"
              />
              <Button
                onClick={handleSearch}
                disabled={isSearching || !searchId.trim()}
                variant="outline"
              >
                {isSearching ? (
                  <Loader2 className="h-4 w-4 animate-spin" />
                ) : (
                  <Search className="h-4 w-4" />
                )}
              </Button>
            </div>
          </div>

          {foundMessage && (
            <div className="p-4 rounded-lg bg-muted/50 border space-y-3">
              <div className="flex items-center justify-between">
                <span className="text-sm font-medium">Mensagem Encontrada</span>
                <Badge variant={foundMessage.direction === 'inbound' ? 'default' : 'secondary'}>
                  {foundMessage.direction}
                </Badge>
              </div>
              <p className="text-sm text-muted-foreground line-clamp-3">
                {foundMessage.body || '(sem conteúdo)'}
              </p>
              <div className="flex flex-wrap gap-2 text-xs text-muted-foreground">
                <span>Agente: {foundMessage.agent_key || 'N/A'}</span>
                <span>•</span>
                <span>
                  {format(new Date(foundMessage.created_at), 'dd/MM/yyyy HH:mm', { locale: ptBR })}
                </span>
              </div>
              {foundMessage.direction !== 'inbound' && (
                <div className="flex items-center gap-2 text-amber-600 text-sm">
                  <AlertCircle className="h-4 w-4" />
                  <span>Apenas mensagens inbound podem ser replayed</span>
                </div>
              )}
            </div>
          )}

          <div className="space-y-2">
            <Label htmlFor="reason">Motivo do Replay *</Label>
            <Textarea
              id="reason"
              placeholder="Descreva o motivo do replay..."
              value={reason}
              onChange={(e) => setReason(e.target.value)}
              rows={3}
            />
          </div>

          <Button
            onClick={handleReplay}
            disabled={!foundMessage || !reason.trim() || foundMessage.direction !== 'inbound' || executeReplay.isPending}
            className="w-full gap-2"
          >
            {executeReplay.isPending ? (
              <Loader2 className="h-4 w-4 animate-spin" />
            ) : (
              <Play className="h-4 w-4" />
            )}
            Executar Replay
          </Button>
        </CardContent>
      </Card>

      {/* Histórico de Replays */}
      <Card>
        <CardHeader>
          <CardTitle className="text-lg flex items-center gap-2">
            <Clock className="h-5 w-5 text-muted-foreground" />
            Histórico de Replays
          </CardTitle>
        </CardHeader>
        <CardContent>
          {isLoading ? (
            <div className="flex items-center justify-center h-40">
              <Loader2 className="h-6 w-6 animate-spin text-muted-foreground" />
            </div>
          ) : replays.length === 0 ? (
            <div className="flex flex-col items-center justify-center h-40 text-muted-foreground">
              <RefreshCw className="h-10 w-10 mb-2 opacity-50" />
              <p className="text-sm">Nenhum replay executado</p>
            </div>
          ) : (
            <ScrollArea className="h-[400px] pr-4">
              <div className="space-y-3">
                {replays.map((replay) => (
                  <div
                    key={replay.id}
                    className="p-4 rounded-lg border bg-card"
                  >
                    <div className="flex items-start justify-between gap-3">
                      <div className="flex-1 min-w-0">
                        <div className="flex items-center gap-2">
                          {replay.status === 'success' ? (
                            <CheckCircle className="h-4 w-4 text-green-500" />
                          ) : (
                            <XCircle className="h-4 w-4 text-red-500" />
                          )}
                          <span className="text-sm font-medium truncate">
                            {replay.original_message_id.substring(0, 8)}...
                          </span>
                          {getStatusBadge(replay.status)}
                        </div>
                        <p className="text-sm text-muted-foreground mt-1 line-clamp-2">
                          {replay.reason}
                        </p>
                        {replay.error_message && (
                          <p className="text-xs text-red-500 mt-1">
                            Erro: {replay.error_message}
                          </p>
                        )}
                        <div className="flex items-center gap-2 mt-2 text-xs text-muted-foreground">
                          <User className="h-3 w-3" />
                          <span>{replay.replayed_by.substring(0, 8)}...</span>
                          <span>•</span>
                          <Clock className="h-3 w-3" />
                          <span>
                            {formatDistanceToNow(new Date(replay.created_at), {
                              addSuffix: true,
                              locale: ptBR,
                            })}
                          </span>
                        </div>
                      </div>
                    </div>
                  </div>
                ))}
              </div>
            </ScrollArea>
          )}
        </CardContent>
      </Card>
    </div>
  );
};
