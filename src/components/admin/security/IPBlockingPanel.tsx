import { useState } from 'react';
import { Ban, Shield, Trash2, Clock, User } from 'lucide-react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Textarea } from '@/components/ui/textarea';
import { Badge } from '@/components/ui/badge';
import { ScrollArea } from '@/components/ui/scroll-area';
import { Separator } from '@/components/ui/separator';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { ipBlockingService } from '@/services/ipBlocking';
import { toast } from 'sonner';
import { formatDistanceToNow } from 'date-fns';
import { ptBR } from 'date-fns/locale';
import type { BlockedIP } from '@/types/security';

export const IPBlockingPanel = () => {
  const [ipAddress, setIpAddress] = useState('');
  const [reason, setReason] = useState('');
  const [expiresIn, setExpiresIn] = useState<string>('permanent');
  const queryClient = useQueryClient();

  const { data: blockedIPs = [], isLoading } = useQuery<BlockedIP[]>({
    queryKey: ['blocked-ips'],
    queryFn: () => ipBlockingService.getBlockedIPs(),
    refetchInterval: 30000
  });

  const blockMutation = useMutation({
    mutationFn: ({ ip, reason, expires }: { ip: string; reason: string; expires?: number }) =>
      ipBlockingService.blockIP(ip, reason, expires),
    onSuccess: (result) => {
      if (result.success) {
        toast.success('IP bloqueado com sucesso');
        setIpAddress('');
        setReason('');
        setExpiresIn('permanent');
        queryClient.invalidateQueries({ queryKey: ['blocked-ips'] });
      } else {
        toast.error(result.error || 'Erro ao bloquear IP');
      }
    }
  });

  const unblockMutation = useMutation({
    mutationFn: (id: string) => ipBlockingService.unblockIP(id),
    onSuccess: (result) => {
      if (result.success) {
        toast.success('IP desbloqueado com sucesso');
        queryClient.invalidateQueries({ queryKey: ['blocked-ips'] });
      } else {
        toast.error(result.error || 'Erro ao desbloquear IP');
      }
    }
  });

  const handleBlockIP = () => {
    if (!ipAddress || !reason) {
      toast.error('Preencha todos os campos obrigatórios');
      return;
    }

    const ipRegex = /^(\d{1,3}\.){3}\d{1,3}$/;
    if (!ipRegex.test(ipAddress)) {
      toast.error('Formato de IP inválido');
      return;
    }

    const expires = expiresIn === 'permanent' ? undefined : parseInt(expiresIn);
    blockMutation.mutate({ ip: ipAddress, reason, expires });
  };

  const handleUnblock = (id: string) => {
    unblockMutation.mutate(id);
  };

  return (
    <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
      {/* Formulário de Bloqueio */}
      <Card className="lg:col-span-1">
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <Ban className="h-5 w-5 text-destructive" />
            Bloquear IP
          </CardTitle>
        </CardHeader>
        <CardContent className="space-y-4">
          <div className="space-y-2">
            <Label htmlFor="ip-address">Endereço IP *</Label>
            <Input
              id="ip-address"
              placeholder="192.168.1.1"
              value={ipAddress}
              onChange={(e) => setIpAddress(e.target.value)}
            />
          </div>

          <div className="space-y-2">
            <Label htmlFor="reason">Motivo *</Label>
            <Textarea
              id="reason"
              placeholder="Descreva o motivo do bloqueio..."
              value={reason}
              onChange={(e) => setReason(e.target.value)}
              rows={3}
            />
          </div>

          <div className="space-y-2">
            <Label htmlFor="expires">Duração do Bloqueio</Label>
            <Select value={expiresIn} onValueChange={setExpiresIn}>
              <SelectTrigger id="expires">
                <SelectValue />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="1">1 hora</SelectItem>
                <SelectItem value="6">6 horas</SelectItem>
                <SelectItem value="24">24 horas</SelectItem>
                <SelectItem value="168">7 dias</SelectItem>
                <SelectItem value="720">30 dias</SelectItem>
                <SelectItem value="permanent">Permanente</SelectItem>
              </SelectContent>
            </Select>
          </div>

          <Button
            onClick={handleBlockIP}
            disabled={blockMutation.isPending}
            className="w-full"
            variant="destructive"
          >
            <Shield className="h-4 w-4 mr-2" />
            {blockMutation.isPending ? 'Bloqueando...' : 'Bloquear IP'}
          </Button>
        </CardContent>
      </Card>

      {/* Lista de IPs Bloqueados */}
      <Card className="lg:col-span-2">
        <CardHeader>
          <div className="flex items-center justify-between">
            <CardTitle className="flex items-center gap-2">
              <Shield className="h-5 w-5" />
              IPs Bloqueados ({blockedIPs.length})
            </CardTitle>
          </div>
        </CardHeader>
        <CardContent>
          <ScrollArea className="h-[500px] pr-4">
            <div className="space-y-3">
              {isLoading ? (
                <div className="text-center py-8 text-muted-foreground">
                  Carregando...
                </div>
              ) : blockedIPs.length === 0 ? (
                <div className="text-center py-8 text-muted-foreground">
                  Nenhum IP bloqueado
                </div>
              ) : (
                blockedIPs.map((blocked) => (
                  <div
                    key={blocked.id}
                    className="p-4 rounded-lg border bg-card hover:bg-muted/50 transition-colors"
                  >
                    <div className="flex items-start justify-between gap-4">
                      <div className="flex-1 space-y-2">
                        <div className="flex items-center gap-2">
                          <Badge variant="destructive" className="font-mono">
                            {blocked.ip_address}
                          </Badge>
                          {blocked.expires_at && (
                            <Badge variant="outline" className="text-xs">
                              <Clock className="h-3 w-3 mr-1" />
                              Expira{' '}
                              {formatDistanceToNow(new Date(blocked.expires_at), {
                                addSuffix: true,
                                locale: ptBR
                              })}
                            </Badge>
                          )}
                        </div>

                        <p className="text-sm text-muted-foreground">
                          <strong>Motivo:</strong> {blocked.reason}
                        </p>

                        <div className="flex items-center gap-4 text-xs text-muted-foreground">
                          <span className="flex items-center gap-1">
                            <User className="h-3 w-3" />
                            {blocked.blocked_by_name || 'Sistema'}
                          </span>
                          <span>
                            Bloqueado{' '}
                            {formatDistanceToNow(new Date(blocked.blocked_at), {
                              addSuffix: true,
                              locale: ptBR
                            })}
                          </span>
                        </div>
                      </div>

                      <Button
                        size="sm"
                        variant="outline"
                        onClick={() => handleUnblock(blocked.id)}
                        disabled={unblockMutation.isPending}
                      >
                        <Trash2 className="h-4 w-4 mr-2" />
                        Desbloquear
                      </Button>
                    </div>
                  </div>
                ))
              )}
            </div>
          </ScrollArea>
        </CardContent>
      </Card>
    </div>
  );
};
