
import React from 'react';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { 
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from '@/components/ui/table';
import { 
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";
import { MoreHorizontal, Eye, Video, Clock } from 'lucide-react';
import { useNavigate } from 'react-router-dom';

interface Order {
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
  orders: Order[];
}

const OrdersTable = ({ orders }: OrdersTableProps) => {
  const navigate = useNavigate();

  const getStatusBadge = (status: string) => {
    const variants: Record<string, { variant: any, label: string, color: string }> = {
      pendente: { variant: 'secondary', label: 'Pendente', color: 'bg-yellow-100 text-yellow-800' },
      pago: { variant: 'success', label: 'Pago', color: 'bg-green-100 text-green-800' },
      pago_pendente_video: { variant: 'secondary', label: 'Aguardando Vídeo', color: 'bg-orange-100 text-orange-800' },
      video_enviado: { variant: 'secondary', label: 'Vídeo Enviado', color: 'bg-blue-100 text-blue-800' },
      video_aprovado: { variant: 'success', label: 'Vídeo Aprovado', color: 'bg-green-100 text-green-800' },
      video_rejeitado: { variant: 'destructive', label: 'Vídeo Rejeitado', color: 'bg-red-100 text-red-800' },
      ativo: { variant: 'default', label: 'Ativo', color: 'bg-green-100 text-green-800' },
      cancelado: { variant: 'destructive', label: 'Cancelado', color: 'bg-red-100 text-red-800' }
    };
    
    return variants[status] || { variant: 'secondary', label: status, color: 'bg-gray-100 text-gray-800' };
  };

  const getVideoStatusIcon = (status: string) => {
    switch (status) {
      case 'pago_pendente_video':
        return <Clock className="h-4 w-4 text-orange-500" />;
      case 'video_enviado':
        return <Video className="h-4 w-4 text-blue-500" />;
      case 'video_aprovado':
        return <Video className="h-4 w-4 text-green-500" />;
      case 'video_rejeitado':
        return <Video className="h-4 w-4 text-red-500" />;
      default:
        return null;
    }
  };

  const handleViewOrder = (orderId: string) => {
    navigate(`/super_admin/pedidos/${orderId}`);
  };

  if (orders.length === 0) {
    return (
      <div className="text-center py-8 text-gray-500">
        <p>Nenhum pedido encontrado</p>
      </div>
    );
  }

  return (
    <div className="border rounded-lg overflow-hidden">
      <Table>
        <TableHeader>
          <TableRow className="bg-gray-50">
            <TableHead className="font-semibold text-gray-900">Cliente</TableHead>
            <TableHead className="font-semibold text-gray-900">Pedido</TableHead>
            <TableHead className="font-semibold text-gray-900">Status</TableHead>
            <TableHead className="font-semibold text-gray-900">Valor</TableHead>
            <TableHead className="font-semibold text-gray-900">Período</TableHead>
            <TableHead className="font-semibold text-gray-900">Data Criação</TableHead>
            <TableHead className="font-semibold text-gray-900 text-right">Ações</TableHead>
          </TableRow>
        </TableHeader>
        <TableBody>
          {orders.map((order) => {
            const statusInfo = getStatusBadge(order.status);
            const videoIcon = getVideoStatusIcon(order.status);
            
            return (
              <TableRow key={order.id} className="hover:bg-gray-50">
                <TableCell>
                  <div>
                    <div className="font-medium text-gray-900">{order.client_name}</div>
                    <div className="text-sm text-gray-500">{order.client_email}</div>
                  </div>
                </TableCell>
                <TableCell>
                  <div>
                    <div className="font-mono text-sm text-gray-900">
                      {order.id.substring(0, 8)}...
                    </div>
                    <div className="text-sm text-gray-500">
                      {order.plano_meses} meses • {Array.isArray(order.lista_paineis) ? order.lista_paineis.length : 0} painéis
                    </div>
                  </div>
                </TableCell>
                <TableCell>
                  <div className="flex items-center space-x-2">
                    <Badge className={statusInfo.color}>
                      {statusInfo.label}
                    </Badge>
                    {videoIcon}
                  </div>
                  <div className="text-xs text-gray-500 mt-1">
                    {order.video_status}
                  </div>
                </TableCell>
                <TableCell>
                  <div className="font-bold text-gray-900">
                    R$ {Number(order.valor_total || 0).toLocaleString('pt-BR', { minimumFractionDigits: 2 })}
                  </div>
                </TableCell>
                <TableCell>
                  <div className="text-sm text-gray-900">
                    {order.data_inicio && order.data_fim ? (
                      <div>
                        <div>{new Date(order.data_inicio).toLocaleDateString('pt-BR')}</div>
                        <div className="text-gray-500">até {new Date(order.data_fim).toLocaleDateString('pt-BR')}</div>
                      </div>
                    ) : (
                      <span className="text-gray-500">Período não definido</span>
                    )}
                  </div>
                </TableCell>
                <TableCell>
                  <div className="text-sm text-gray-900">
                    {new Date(order.created_at).toLocaleDateString('pt-BR')}
                  </div>
                  <div className="text-xs text-gray-500">
                    {new Date(order.created_at).toLocaleTimeString('pt-BR', { 
                      hour: '2-digit', 
                      minute: '2-digit' 
                    })}
                  </div>
                </TableCell>
                <TableCell className="text-right">
                  <DropdownMenu>
                    <DropdownMenuTrigger asChild>
                      <Button variant="ghost" size="sm">
                        <MoreHorizontal className="h-4 w-4" />
                      </Button>
                    </DropdownMenuTrigger>
                    <DropdownMenuContent align="end">
                      <DropdownMenuItem onClick={() => handleViewOrder(order.id)}>
                        <Eye className="h-4 w-4 mr-2" />
                        Ver Detalhes
                      </DropdownMenuItem>
                    </DropdownMenuContent>
                  </DropdownMenu>
                </TableCell>
              </TableRow>
            );
          })}
        </TableBody>
      </Table>
    </div>
  );
};

export default OrdersTable;
