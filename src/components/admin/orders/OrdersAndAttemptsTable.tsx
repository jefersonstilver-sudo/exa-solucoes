
import React from 'react';
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from '@/components/ui/table';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { Eye, Calendar, MapPin, AlertTriangle, DollarSign } from 'lucide-react';
import { useNavigate } from 'react-router-dom';
import { OrderOrAttempt } from '@/hooks/useOrdersWithAttempts';

interface OrdersAndAttemptsTableProps {
  ordersAndAttempts: OrderOrAttempt[];
}

const OrdersAndAttemptsTable: React.FC<OrdersAndAttemptsTableProps> = ({ ordersAndAttempts }) => {
  const navigate = useNavigate();

  const getStatusBadge = (item: OrderOrAttempt) => {
    if (item.type === 'attempt') {
      return <Badge className="bg-orange-600 text-white text-xs px-2 py-1 font-semibold border-0">
        <AlertTriangle className="h-3 w-3 mr-1" />
        Tentativa Abandonada
      </Badge>;
    }

    const status = item.status;
    switch (status) {
      case 'pago_pendente_video':
        return <Badge className="bg-orange-600 text-white text-xs px-2 py-1 font-semibold border-0">Aguardando Vídeo</Badge>;
      case 'video_enviado':
        return <Badge className="bg-blue-600 text-white text-xs px-2 py-1 font-semibold border-0">Vídeo Enviado</Badge>;
      case 'video_aprovado':
        return <Badge className="bg-green-600 text-white text-xs px-2 py-1 font-semibold border-0">Vídeo Aprovado</Badge>;
      case 'video_rejeitado':
        return <Badge className="bg-red-600 text-white text-xs px-2 py-1 font-semibold border-0">Vídeo Rejeitado</Badge>;
      case 'pago':
        return <Badge className="bg-green-600 text-white text-xs px-2 py-1 font-semibold border-0">Pago</Badge>;
      case 'pendente':
        return <Badge className="bg-gray-700 text-white text-xs px-2 py-1 font-semibold border-0">Pendente</Badge>;
      case 'ativo':
        return <Badge className="bg-green-600 text-white text-xs px-2 py-1 font-semibold border-0">Ativo</Badge>;
      case 'cancelado':
        return <Badge className="bg-red-600 text-white text-xs px-2 py-1 font-semibold border-0">Cancelado</Badge>;
      default:
        return <Badge className="bg-gray-700 text-white text-xs px-2 py-1 font-semibold border-0">{status}</Badge>;
    }
  };

  const formatDate = (dateString: string) => {
    return new Date(dateString).toLocaleDateString('pt-BR');
  };

  const formatCurrency = (value: number) => {
    return new Intl.NumberFormat('pt-BR', {
      style: 'currency',
      currency: 'BRL'
    }).format(value);
  };

  const getClientName = (item: OrderOrAttempt) => {
    if (item.type === 'attempt') {
      return item.client_name || 'Nome não disponível';
    }
    return item.client_name;
  };

  const getClientEmail = (item: OrderOrAttempt) => {
    if (item.type === 'attempt') {
      return item.client_email || 'Email não encontrado';
    }
    return item.client_email;
  };

  const getPanelsCount = (item: OrderOrAttempt) => {
    if (item.type === 'attempt') {
      return item.predios_selecionados?.length || 0;
    }
    return item.lista_paineis?.length || 0;
  };

  const getPlanDuration = (item: OrderOrAttempt) => {
    if (item.type === 'attempt') {
      return '1 mês (estimado)';
    }
    return `${item.plano_meses} ${item.plano_meses === 1 ? 'mês' : 'meses'}`;
  };

  const getPeriod = (item: OrderOrAttempt) => {
    if (item.type === 'attempt') {
      return 'Não definido';
    }
    return `${formatDate(item.data_inicio)} - ${formatDate(item.data_fim)}`;
  };

  if (ordersAndAttempts.length === 0) {
    return (
      <div className="text-center py-12">
        <div className="text-gray-900 text-lg font-semibold">Nenhum pedido ou tentativa encontrada</div>
        <p className="text-gray-700 mt-2">Tente ajustar os filtros de busca</p>
      </div>
    );
  }

  return (
    <div className="overflow-x-auto">
      <Table>
        <TableHeader>
          <TableRow className="border-gray-200 hover:bg-gray-50">
            <TableHead className="text-gray-900 font-semibold">Tipo</TableHead>
            <TableHead className="text-gray-900 font-semibold">ID</TableHead>
            <TableHead className="text-gray-900 font-semibold">Cliente</TableHead>
            <TableHead className="text-gray-900 font-semibold">Data</TableHead>
            <TableHead className="text-gray-900 font-semibold">Status</TableHead>
            <TableHead className="text-gray-900 font-semibold">Valor</TableHead>
            <TableHead className="text-gray-900 font-semibold">Plano</TableHead>
            <TableHead className="text-gray-900 font-semibold">Painéis</TableHead>
            <TableHead className="text-gray-900 font-semibold">Período</TableHead>
            <TableHead className="text-gray-900 font-semibold">Ações</TableHead>
          </TableRow>
        </TableHeader>
        <TableBody>
          {ordersAndAttempts.map((item) => (
            <TableRow key={`${item.type}-${item.id}`} className="border-gray-200 hover:bg-gray-50">
              <TableCell>
                {item.type === 'attempt' ? (
                  <Badge variant="outline" className="border-orange-500 text-orange-700">
                    <AlertTriangle className="h-3 w-3 mr-1" />
                    Tentativa
                  </Badge>
                ) : (
                  <Badge variant="outline" className="border-green-500 text-green-700">
                    <DollarSign className="h-3 w-3 mr-1" />
                    Pedido
                  </Badge>
                )}
              </TableCell>
              <TableCell className="font-mono text-sm text-gray-900 font-medium">
                {item.id.substring(0, 8)}...
              </TableCell>
              <TableCell>
                <div className="flex flex-col">
                  <span className="font-semibold text-gray-900">{getClientName(item)}</span>
                  <span className="text-sm text-gray-700">{getClientEmail(item)}</span>
                </div>
              </TableCell>
              <TableCell className="text-gray-800 font-medium">
                {formatDate(item.created_at)}
              </TableCell>
              <TableCell>
                {getStatusBadge(item)}
              </TableCell>
              <TableCell className={`font-bold text-base ${item.type === 'attempt' ? 'text-orange-600' : 'text-green-700'}`}>
                {formatCurrency(item.valor_total || 0)}
              </TableCell>
              <TableCell className="text-gray-800 font-medium">
                {getPlanDuration(item)}
              </TableCell>
              <TableCell>
                <div className="flex items-center text-gray-800 font-medium">
                  <MapPin className="h-4 w-4 mr-1 text-indexa-purple" />
                  <span>{getPanelsCount(item)}</span>
                </div>
              </TableCell>
              <TableCell>
                <div className="flex items-center text-sm text-gray-800 font-medium">
                  <Calendar className="h-4 w-4 mr-1 text-indexa-purple" />
                  <span className="whitespace-nowrap">
                    {getPeriod(item)}
                  </span>
                </div>
              </TableCell>
              <TableCell>
                {item.type === 'order' ? (
                  <Button
                    variant="outline"
                    size="sm"
                    onClick={() => navigate(`/super_admin/pedidos/${item.id}`)}
                    className="border-indexa-purple text-indexa-purple hover:bg-indexa-purple hover:text-white font-medium"
                  >
                    <Eye className="h-3 w-3 mr-1" />
                    Ver
                  </Button>
                ) : (
                  <Button
                    variant="outline"
                    size="sm"
                    disabled
                    className="border-gray-300 text-gray-500 cursor-not-allowed"
                  >
                    <AlertTriangle className="h-3 w-3 mr-1" />
                    Tentativa
                  </Button>
                )}
              </TableCell>
            </TableRow>
          ))}
        </TableBody>
      </Table>
    </div>
  );
};

export default OrdersAndAttemptsTable;
