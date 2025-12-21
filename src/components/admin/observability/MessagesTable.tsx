import React, { useState } from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Badge } from '@/components/ui/badge';
import { 
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select';
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from '@/components/ui/table';
import { ScrollArea } from '@/components/ui/scroll-area';
import { 
  MessageSquare, 
  Search, 
  Filter,
  Send,
  Inbox,
  Clock,
  CheckCircle,
  XCircle,
  AlertTriangle,
  RefreshCw,
  Loader2
} from 'lucide-react';
import { MessageWithTrace } from '@/hooks/useObservabilityData';
import { format } from 'date-fns';
import { ptBR } from 'date-fns/locale';
import { UseQueryResult } from '@tanstack/react-query';

interface MessagesTableProps {
  useMessages: (filters?: any) => UseQueryResult<MessageWithTrace[], Error>;
}

export const MessagesTable: React.FC<MessagesTableProps> = ({ useMessages }) => {
  const [filters, setFilters] = useState({
    agentKey: '',
    deliveryStatus: '',
    direction: '',
  });
  const [appliedFilters, setAppliedFilters] = useState(filters);

  const { data: messages, isLoading, refetch } = useMessages({
    ...appliedFilters,
    limit: 100,
  });

  const handleApplyFilters = () => {
    setAppliedFilters(filters);
  };

  const handleClearFilters = () => {
    const cleared = { agentKey: '', deliveryStatus: '', direction: '' };
    setFilters(cleared);
    setAppliedFilters(cleared);
  };

  const getDirectionIcon = (direction: string) => {
    return direction === 'inbound' ? (
      <Inbox className="h-4 w-4 text-purple-500" />
    ) : (
      <Send className="h-4 w-4 text-green-500" />
    );
  };

  const getDeliveryStatusBadge = (status: string | null) => {
    switch (status) {
      case 'delivered':
        return (
          <Badge className="bg-green-500/10 text-green-600 border-green-500/20 gap-1">
            <CheckCircle className="h-3 w-3" />
            Entregue
          </Badge>
        );
      case 'pending':
        return (
          <Badge className="bg-amber-500/10 text-amber-600 border-amber-500/20 gap-1">
            <Clock className="h-3 w-3" />
            Pendente
          </Badge>
        );
      case 'failed':
        return (
          <Badge variant="destructive" className="gap-1">
            <XCircle className="h-3 w-3" />
            Falhou
          </Badge>
        );
      case 'suspected_delivery_failure':
        return (
          <Badge className="bg-orange-500/10 text-orange-600 border-orange-500/20 gap-1">
            <AlertTriangle className="h-3 w-3" />
            Suspeita
          </Badge>
        );
      default:
        return <Badge variant="outline">-</Badge>;
    }
  };

  return (
    <Card>
      <CardHeader>
        <div className="flex flex-col gap-4 sm:flex-row sm:items-center sm:justify-between">
          <CardTitle className="text-lg flex items-center gap-2">
            <MessageSquare className="h-5 w-5 text-blue-500" />
            Rastreamento de Mensagens
          </CardTitle>
          <Button
            onClick={() => refetch()}
            variant="outline"
            size="sm"
            disabled={isLoading}
          >
            {isLoading ? (
              <Loader2 className="h-4 w-4 animate-spin" />
            ) : (
              <RefreshCw className="h-4 w-4" />
            )}
            <span className="ml-2">Atualizar</span>
          </Button>
        </div>
      </CardHeader>
      <CardContent className="space-y-4">
        {/* Filtros */}
        <div className="grid gap-3 sm:grid-cols-2 lg:grid-cols-4">
          <Input
            placeholder="Agente..."
            value={filters.agentKey}
            onChange={(e) => setFilters({ ...filters, agentKey: e.target.value })}
          />
          <Select
            value={filters.direction}
            onValueChange={(value) => setFilters({ ...filters, direction: value })}
          >
            <SelectTrigger>
              <SelectValue placeholder="Direção" />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="">Todas</SelectItem>
              <SelectItem value="inbound">Inbound</SelectItem>
              <SelectItem value="outbound">Outbound</SelectItem>
            </SelectContent>
          </Select>
          <Select
            value={filters.deliveryStatus}
            onValueChange={(value) => setFilters({ ...filters, deliveryStatus: value })}
          >
            <SelectTrigger>
              <SelectValue placeholder="Status Entrega" />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="">Todos</SelectItem>
              <SelectItem value="pending">Pendente</SelectItem>
              <SelectItem value="delivered">Entregue</SelectItem>
              <SelectItem value="failed">Falhou</SelectItem>
              <SelectItem value="suspected_delivery_failure">Suspeita</SelectItem>
            </SelectContent>
          </Select>
          <div className="flex gap-2">
            <Button onClick={handleApplyFilters} size="sm" className="flex-1">
              <Filter className="h-4 w-4 mr-1" />
              Filtrar
            </Button>
            <Button onClick={handleClearFilters} variant="outline" size="sm">
              Limpar
            </Button>
          </div>
        </div>

        {/* Tabela */}
        {isLoading ? (
          <div className="flex items-center justify-center h-64">
            <Loader2 className="h-8 w-8 animate-spin text-muted-foreground" />
          </div>
        ) : (
          <ScrollArea className="h-[500px]">
            <Table>
              <TableHeader>
                <TableRow>
                  <TableHead className="w-[80px]">Direção</TableHead>
                  <TableHead>Mensagem</TableHead>
                  <TableHead className="w-[100px]">Agente</TableHead>
                  <TableHead className="w-[130px]">Status Entrega</TableHead>
                  <TableHead className="w-[80px]">Retries</TableHead>
                  <TableHead className="w-[150px]">Data</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {messages && messages.length > 0 ? (
                  messages.map((msg) => (
                    <TableRow key={msg.id}>
                      <TableCell>
                        <div className="flex items-center gap-2">
                          {getDirectionIcon(msg.direction)}
                          <span className="text-xs text-muted-foreground">
                            {msg.direction === 'inbound' ? 'IN' : 'OUT'}
                          </span>
                        </div>
                      </TableCell>
                      <TableCell>
                        <p className="text-sm line-clamp-2 max-w-[300px]">
                          {msg.body || '(sem conteúdo)'}
                        </p>
                      </TableCell>
                      <TableCell className="text-sm">
                        {msg.agent_key || '-'}
                      </TableCell>
                      <TableCell>
                        {msg.direction === 'outbound' 
                          ? getDeliveryStatusBadge(msg.delivery_status)
                          : <Badge variant="outline">N/A</Badge>
                        }
                      </TableCell>
                      <TableCell className="text-center">
                        {msg.delivery_retry_count || 0}
                      </TableCell>
                      <TableCell className="text-sm text-muted-foreground">
                        {format(new Date(msg.created_at), 'dd/MM/yyyy HH:mm:ss', { locale: ptBR })}
                      </TableCell>
                    </TableRow>
                  ))
                ) : (
                  <TableRow>
                    <TableCell colSpan={6} className="h-32 text-center text-muted-foreground">
                      Nenhuma mensagem encontrada
                    </TableCell>
                  </TableRow>
                )}
              </TableBody>
            </Table>
          </ScrollArea>
        )}
      </CardContent>
    </Card>
  );
};
