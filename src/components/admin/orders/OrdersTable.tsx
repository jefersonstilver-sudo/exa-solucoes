
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
        return <Badge className="bg-[#00FFAB] text-[#3C1361] font-semibold">Aguardando Vídeo</Badge>;
      case 'video_enviado':
        return <Badge className="bg-[#3C1361] text-white font-semibold">Vídeo Enviado</Badge>;
      case 'video_aprovado':
        return <Badge className="bg-[#00FFAB] text-[#3C1361] font-semibold">Vídeo Aprovado</Badge>;
      case 'video_rejeitado':
        return <Badge className="bg-red-500 text-white font-semibold">Vídeo Rejeitado</Badge>;
      case 'pago':
        return <Badge className="bg-[#00FFAB] text-[#3C1361] font-semibold">Pago</Badge>;
      case 'pendente':
        return <Badge className="bg-slate-500 text-white font-semibold">Pendente</Badge>;
      case 'ativo':
        return <Badge className="bg-[#00FFAB] text-[#3C1361] font-semibold">Ativo</Badge>;
      case 'cancelado':
        return <Badge className="bg-red-500 text-white font-semibold">Cancelado</Badge>;
      default:
        return <Badge className="bg-slate-500 text-white font-semibold">{status}</Badge>;
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
        <div className="text-white text-lg">Nenhum pedido encontrado</div>
        <p className="text-slate-400 mt-2">Tente ajustar os filtros de busca</p>
      </div>
    );
  }

  return (
    <div className="overflow-x-auto">
      <Table>
        <TableHeader>
          <TableRow className="border-slate-600 hover:bg-slate-700/50">
            <TableHead className="text-slate-300 font-semibold">ID do Pedido</TableHead>
            <TableHead className="text-slate-300 font-semibold">Cliente</TableHead>
            <TableHead className="text-slate-300 font-semibold">Data</TableHead>
            <TableHead className="text-slate-300 font-semibold">Status</TableHead>
            <TableHead className="text-slate-300 font-semibold">Valor</TableHead>
            <TableHead className="text-slate-300 font-semibold">Plano</TableHead>
            <TableHead className="text-slate-300 font-semibold">Painéis</TableHead>
            <TableHead className="text-slate-300 font-semibold">Período</TableHead>
            <TableHead className="text-slate-300 font-semibold">Ações</TableHead>
          </TableRow>
        </TableHeader>
        <TableBody>
          {orders.map((order) => (
            <TableRow key={order.id} className="border-slate-600 hover:bg-slate-700/30">
              <TableCell className="font-mono text-sm text-slate-300">
                {order.id.substring(0, 8)}...
              </TableCell>
              <TableCell>
                <div className="flex flex-col">
                  <span className="font-medium text-white">{order.client_name}</span>
                  <span className="text-sm text-slate-400">{order.client_email}</span>
                </div>
              </TableCell>
              <TableCell className="text-slate-300">
                {formatDate(order.created_at)}
              </TableCell>
              <TableCell>
                {getStatusBadge(order.status)}
              </TableCell>
              <TableCell className="font-semibold text-[#00FFAB]">
                {formatCurrency(order.valor_total)}
              </TableCell>
              <TableCell className="text-slate-300">
                {order.plano_meses} {order.plano_meses === 1 ? 'mês' : 'meses'}
              </TableCell>
              <TableCell>
                <div className="flex items-center text-slate-300">
                  <MapPin className="h-3 w-3 mr-1" />
                  <span>{order.lista_paineis?.length || 0}</span>
                </div>
              </TableCell>
              <TableCell>
                <div className="flex items-center text-sm text-slate-300">
                  <Calendar className="h-3 w-3 mr-1" />
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
                  className="border-[#00FFAB] text-[#00FFAB] hover:bg-[#00FFAB] hover:text-[#3C1361]"
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
