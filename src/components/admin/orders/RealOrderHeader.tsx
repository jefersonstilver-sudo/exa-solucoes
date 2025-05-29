
import React from 'react';
import { useNavigate } from 'react-router-dom';
import { ArrowLeft, Download, Calendar } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';

interface RealOrderHeaderProps {
  order: {
    id: string;
    created_at: string;
    status: string;
    client_name: string;
    valor_total: number;
  };
}

export const RealOrderHeader: React.FC<RealOrderHeaderProps> = ({ order }) => {
  const navigate = useNavigate();

  const getStatusBadge = (status: string) => {
    const variants: Record<string, { className: string, label: string }> = {
      'pago_pendente_video': { className: 'bg-orange-600 text-white', label: 'Aguardando Vídeo' },
      'video_enviado': { className: 'bg-blue-600 text-white', label: 'Vídeo Enviado' },
      'video_aprovado': { className: 'bg-green-600 text-white', label: 'Vídeo Aprovado' },
      'video_rejeitado': { className: 'bg-red-600 text-white', label: 'Vídeo Rejeitado' },
      'pago': { className: 'bg-green-600 text-white', label: 'Pago' },
      'pendente': { className: 'bg-gray-600 text-white', label: 'Pendente' },
      'ativo': { className: 'bg-green-600 text-white', label: 'Ativo' },
      'cancelado': { className: 'bg-red-600 text-white', label: 'Cancelado' }
    };
    
    return variants[status] || { className: 'bg-gray-600 text-white', label: status };
  };

  const statusInfo = getStatusBadge(order.status);

  const formatCurrency = (value: number) => {
    return new Intl.NumberFormat('pt-BR', {
      style: 'currency',
      currency: 'BRL'
    }).format(value);
  };

  const formatDate = (dateString: string) => {
    return new Date(dateString).toLocaleDateString('pt-BR', {
      day: '2-digit',
      month: '2-digit',
      year: 'numeric',
      hour: '2-digit',
      minute: '2-digit'
    });
  };

  return (
    <div className="bg-indexa-purple rounded-lg p-6 text-white">
      <div className="flex items-center justify-between">
        <div className="flex items-center space-x-4">
          <Button 
            variant="ghost" 
            size="sm" 
            onClick={() => navigate('/super_admin/pedidos')}
            className="text-white hover:bg-white/10"
          >
            <ArrowLeft className="h-4 w-4 mr-2" />
            Voltar aos Pedidos
          </Button>
          <div>
            <h1 className="text-2xl font-bold">Pedido #{order.id.substring(0, 8)}</h1>
            <p className="text-purple-100 flex items-center mt-1">
              <Calendar className="h-4 w-4 mr-1" />
              Criado em {formatDate(order.created_at)}
            </p>
          </div>
        </div>
        
        <div className="flex items-center space-x-4">
          <div className="text-right">
            <p className="text-purple-100 text-sm">Cliente</p>
            <p className="font-semibold">{order.client_name}</p>
          </div>
          <div className="text-right">
            <p className="text-purple-100 text-sm">Valor Total</p>
            <p className="font-bold text-xl">{formatCurrency(order.valor_total)}</p>
          </div>
          <Badge className={`${statusInfo.className} text-sm px-3 py-1`}>
            {statusInfo.label}
          </Badge>
          <Button variant="outline" size="sm" className="border-white text-white hover:bg-white hover:text-indexa-purple">
            <Download className="h-4 w-4 mr-2" />
            Exportar
          </Button>
        </div>
      </div>
    </div>
  );
};
