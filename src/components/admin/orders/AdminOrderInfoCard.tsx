
import React from 'react';
import { Package, Calendar } from 'lucide-react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';

interface AdminOrderInfoCardProps {
  status: string;
  createdAt: string;
  updatedAt: string;
  paymentMethod: string;
  transactionId: string;
}

export const AdminOrderInfoCard: React.FC<AdminOrderInfoCardProps> = ({
  status,
  createdAt,
  updatedAt,
  paymentMethod,
  transactionId
}) => {
  const getStatusColor = (status: string) => {
    const colors: Record<string, string> = {
      pending: 'text-orange-400',
      processing: 'text-blue-400',
      completed: 'text-green-400',
      cancelled: 'text-red-400'
    };
    
    return colors[status] || 'text-slate-400';
  };

  const getStatusLabel = (status: string) => {
    const labels: Record<string, string> = {
      pending: 'Pendente',
      processing: 'Processando',
      completed: 'Concluído',
      cancelled: 'Cancelado'
    };
    
    return labels[status] || status;
  };

  const statusColor = getStatusColor(status);
  const statusLabel = getStatusLabel(status);

  return (
    <Card className="bg-slate-800/50 border-slate-700/50">
      <CardHeader>
        <CardTitle className="text-white flex items-center">
          <Package className="h-5 w-5 mr-2 text-amber-400" />
          Informações do Pedido
        </CardTitle>
      </CardHeader>
      <CardContent className="space-y-4">
        <div>
          <p className="text-sm text-slate-400">Status</p>
          <div className="flex items-center space-x-2">
            <div className={`w-2 h-2 rounded-full ${statusColor.replace('text-', 'bg-')}`}></div>
            <p className={`font-medium ${statusColor}`}>{statusLabel}</p>
          </div>
        </div>
        <div>
          <p className="text-sm text-slate-400">Data de Criação</p>
          <div className="flex items-center space-x-2">
            <Calendar className="h-4 w-4 text-slate-400" />
            <p className="text-white">{new Date(createdAt).toLocaleDateString('pt-BR')}</p>
          </div>
        </div>
        <div>
          <p className="text-sm text-slate-400">Última Atualização</p>
          <p className="text-white">{new Date(updatedAt).toLocaleDateString('pt-BR')}</p>
        </div>
        <div>
          <p className="text-sm text-slate-400">Método de Pagamento</p>
          <p className="text-white">{paymentMethod}</p>
        </div>
        <div>
          <p className="text-sm text-slate-400">ID da Transação</p>
          <p className="text-white font-mono text-xs">{transactionId}</p>
        </div>
      </CardContent>
    </Card>
  );
};
