
import React from 'react';
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from '@/components/ui/table';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { Eye, Calendar, MapPin } from 'lucide-react';
import { useNavigate } from 'react-router-dom';

interface OrderWithClient {
  id: string;
  created_at: string;
  status: string;
  valor_total: number;
  lista_paineis: string[];
  plano_meses: number;
  data_inicio: string;
  data_fim: string;
  client_id: string;
  client_email: string;
  client_name: string;
  video_status: string;
}

interface OrdersTableProps {
  orders: OrderWithClient[];
}

const OrdersTable: React.FC<OrdersTableProps> = ({ orders }) => {
  const navigate = useNavigate();

  const getStatusBadge = (status: string) => {
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
      case 'bloqueado':
        return <Badge className="bg-red-600 text-white text-xs px-2 py-1 font-semibold border-0">Bloqueado</Badge>;
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

  if (orders.length === 0) {
    return (
      <div className="text-center py-12">
        <div className="text-gray-900 text-lg font-semibold">Nenhum pedido encontrado</div>
        <p className="text-gray-700 mt-2">Tente ajustar os filtros de busca</p>
      </div>
    );
  }

  return (
    <div className="overflow-x-auto">
      <Table>
        <TableHeader>
          <TableRow className="border-gray-200 hover:bg-gray-50">
            <TableHead className="text-gray-900 font-semibold">ID do Pedido</TableHead>
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
          {orders.map((order) => (
            <TableRow key={order.id} className="border-gray-200 hover:bg-gray-50">
              <TableCell className="font-mono text-sm text-gray-900 font-medium">
                {order.id.substring(0, 8)}...
              </TableCell>
              <TableCell>
                <div className="flex flex-col">
                  <span className="font-semibold text-gray-900">{order.client_name}</span>
                  <span className="text-sm text-gray-700">{order.client_email}</span>
                </div>
              </TableCell>
              <TableCell className="text-gray-800 font-medium">
                {formatDate(order.created_at)}
              </TableCell>
              <TableCell>
                {getStatusBadge(order.status)}
              </TableCell>
              <TableCell className="font-bold text-green-700 text-base">
                {formatCurrency(order.valor_total)}
              </TableCell>
              <TableCell className="text-gray-800 font-medium">
                {order.plano_meses} {order.plano_meses === 1 ? 'mês' : 'meses'}
              </TableCell>
              <TableCell>
                <div className="flex items-center text-gray-800 font-medium">
                  <MapPin className="h-4 w-4 mr-1 text-indexa-purple" />
                  <span>{order.lista_paineis?.length || 0}</span>
                </div>
              </TableCell>
              <TableCell>
                <div className="flex items-center text-sm text-gray-800 font-medium">
                  <Calendar className="h-4 w-4 mr-1 text-indexa-purple" />
                  <span className="whitespace-nowrap">
                    {formatDate(order.data_inicio)} - {formatDate(order.data_fim)}
                  </span>
                </div>
              </TableCell>
              <TableCell>
                <Button
                  variant="outline"
                  size="sm"
                  onClick={() => navigate(`/super_admin/pedidos/${order.id}`)}
                  className="border-indexa-purple text-indexa-purple hover:bg-indexa-purple hover:text-white font-medium"
                >
                  <Eye className="h-3 w-3 mr-1" />
                  Ver
                </Button>
              </TableCell>
            </TableRow>
          ))}
        </TableBody>
      </Table>
    </div>
  );
};

export default OrdersTable;
