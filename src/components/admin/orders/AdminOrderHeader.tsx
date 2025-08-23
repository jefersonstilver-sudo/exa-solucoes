
import React from 'react';
import { useNavigate } from 'react-router-dom';
import { ArrowLeft, Download } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';

interface AdminOrderHeaderProps {
  orderNumber: string;
  status: string;
}

export const AdminOrderHeader: React.FC<AdminOrderHeaderProps> = ({
  orderNumber,
  status
}) => {
  const navigate = useNavigate();

  const getStatusBadge = (status: string) => {
    const variants: Record<string, { variant: any, label: string }> = {
      pending: { variant: 'secondary', label: 'Pendente' },
      processing: { variant: 'default', label: 'Processando' },
      completed: { variant: 'success', label: 'Concluído' },
      bloqueado: { variant: 'destructive', label: 'Bloqueado' },
      cancelled: { variant: 'destructive', label: 'Cancelado' }
    };
    
    return variants[status] || { variant: 'secondary', label: status };
  };

  const statusInfo = getStatusBadge(status);

  return (
    <div className="flex items-center justify-between">
      <div className="flex items-center space-x-4">
        <Button 
          variant="ghost" 
          size="sm" 
          onClick={() => navigate('/super_admin/pedidos')}
          className="text-slate-300 hover:text-white"
        >
          <ArrowLeft className="h-4 w-4 mr-2" />
          Voltar
        </Button>
        <div>
          <h1 className="text-3xl font-bold text-white">{orderNumber}</h1>
          <p className="text-slate-400">Detalhes do pedido</p>
        </div>
      </div>
      
      <div className="flex items-center space-x-3">
        <Badge variant={statusInfo.variant} className="text-sm">
          {statusInfo.label}
        </Badge>
        <Button variant="outline" size="sm" className="border-slate-600 text-slate-300">
          <Download className="h-4 w-4 mr-2" />
          Exportar
        </Button>
      </div>
    </div>
  );
};
