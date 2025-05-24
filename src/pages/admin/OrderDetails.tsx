
import React from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { Separator } from '@/components/ui/separator';
import { 
  ArrowLeft,
  Package,
  User,
  MapPin,
  Calendar,
  DollarSign,
  Eye,
  Download,
  Mail,
  Phone,
  MonitorPlay
} from 'lucide-react';

const OrderDetails = () => {
  const { id } = useParams();
  const navigate = useNavigate();

  // Mock data - em produção viria da API/Supabase
  const order = {
    id: id,
    orderNumber: 'PED-2024-001',
    customer: {
      name: 'João Silva',
      email: 'joao@exemplo.com',
      phone: '(11) 99999-9999',
      document: '123.456.789-00'
    },
    status: 'completed',
    total: 2500.00,
    subtotal: 2200.00,
    discount: 200.00,
    tax: 500.00,
    createdAt: '2024-01-15T10:30:00Z',
    updatedAt: '2024-01-16T14:20:00Z',
    paymentMethod: 'Cartão de Crédito',
    transactionId: 'TXN-789123456',
    items: [
      {
        id: '1',
        panelCode: 'P001',
        panelName: 'Painel Shopping Center Norte',
        location: 'São Paulo, SP',
        duration: '30 dias',
        price: 800.00,
        startDate: '2024-02-01',
        endDate: '2024-03-01'
      },
      {
        id: '2',
        panelCode: 'P002',
        panelName: 'Painel Av. Paulista',
        location: 'São Paulo, SP',
        duration: '30 dias',
        price: 1200.00,
        startDate: '2024-02-01',
        endDate: '2024-03-01'
      },
      {
        id: '3',
        panelCode: 'P003',
        panelName: 'Painel Centro Comercial',
        location: 'São Paulo, SP',
        duration: '15 dias',
        price: 400.00,
        startDate: '2024-02-15',
        endDate: '2024-03-01'
      }
    ]
  };

  const getStatusBadge = (status: string) => {
    const variants: Record<string, { variant: any, label: string, color: string }> = {
      pending: { variant: 'secondary', label: 'Pendente', color: 'text-orange-400' },
      processing: { variant: 'default', label: 'Processando', color: 'text-blue-400' },
      completed: { variant: 'success', label: 'Concluído', color: 'text-green-400' },
      cancelled: { variant: 'destructive', label: 'Cancelado', color: 'text-red-400' }
    };
    
    return variants[status] || { variant: 'secondary', label: status, color: 'text-slate-400' };
  };

  const statusInfo = getStatusBadge(order.status);

  return (
    <div className="space-y-6">
      {/* Header */}
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
            <h1 className="text-3xl font-bold text-white">{order.orderNumber}</h1>
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

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        {/* Informações do Cliente */}
        <Card className="bg-slate-800/50 border-slate-700/50">
          <CardHeader>
            <CardTitle className="text-white flex items-center">
              <User className="h-5 w-5 mr-2 text-amber-400" />
              Informações do Cliente
            </CardTitle>
          </CardHeader>
          <CardContent className="space-y-4">
            <div>
              <p className="text-sm text-slate-400">Nome</p>
              <p className="text-white font-medium">{order.customer.name}</p>
            </div>
            <div>
              <p className="text-sm text-slate-400">Email</p>
              <div className="flex items-center space-x-2">
                <Mail className="h-4 w-4 text-slate-400" />
                <p className="text-white">{order.customer.email}</p>
              </div>
            </div>
            <div>
              <p className="text-sm text-slate-400">Telefone</p>
              <div className="flex items-center space-x-2">
                <Phone className="h-4 w-4 text-slate-400" />
                <p className="text-white">{order.customer.phone}</p>
              </div>
            </div>
            <div>
              <p className="text-sm text-slate-400">Documento</p>
              <p className="text-white">{order.customer.document}</p>
            </div>
          </CardContent>
        </Card>

        {/* Informações do Pedido */}
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
                <div className={`w-2 h-2 rounded-full ${statusInfo.color.replace('text-', 'bg-')}`}></div>
                <p className={`font-medium ${statusInfo.color}`}>{statusInfo.label}</p>
              </div>
            </div>
            <div>
              <p className="text-sm text-slate-400">Data de Criação</p>
              <div className="flex items-center space-x-2">
                <Calendar className="h-4 w-4 text-slate-400" />
                <p className="text-white">{new Date(order.createdAt).toLocaleDateString('pt-BR')}</p>
              </div>
            </div>
            <div>
              <p className="text-sm text-slate-400">Última Atualização</p>
              <p className="text-white">{new Date(order.updatedAt).toLocaleDateString('pt-BR')}</p>
            </div>
            <div>
              <p className="text-sm text-slate-400">Método de Pagamento</p>
              <p className="text-white">{order.paymentMethod}</p>
            </div>
            <div>
              <p className="text-sm text-slate-400">ID da Transação</p>
              <p className="text-white font-mono text-xs">{order.transactionId}</p>
            </div>
          </CardContent>
        </Card>

        {/* Resumo Financeiro */}
        <Card className="bg-slate-800/50 border-slate-700/50">
          <CardHeader>
            <CardTitle className="text-white flex items-center">
              <DollarSign className="h-5 w-5 mr-2 text-amber-400" />
              Resumo Financeiro
            </CardTitle>
          </CardHeader>
          <CardContent className="space-y-4">
            <div className="flex justify-between">
              <p className="text-slate-400">Subtotal</p>
              <p className="text-white">R$ {order.subtotal.toFixed(2)}</p>
            </div>
            <div className="flex justify-between">
              <p className="text-slate-400">Desconto</p>
              <p className="text-green-400">-R$ {order.discount.toFixed(2)}</p>
            </div>
            <div className="flex justify-between">
              <p className="text-slate-400">Taxas</p>
              <p className="text-white">R$ {order.tax.toFixed(2)}</p>
            </div>
            <Separator className="bg-slate-600" />
            <div className="flex justify-between">
              <p className="text-white font-bold">Total</p>
              <p className="text-white font-bold text-xl">R$ {order.total.toFixed(2)}</p>
            </div>
          </CardContent>
        </Card>
      </div>

      {/* Itens do Pedido */}
      <Card className="bg-slate-800/50 border-slate-700/50">
        <CardHeader>
          <CardTitle className="text-white flex items-center">
            <MonitorPlay className="h-5 w-5 mr-2 text-amber-400" />
            Painéis Contratados
          </CardTitle>
          <CardDescription className="text-slate-400">
            {order.items.length} painéis neste pedido
          </CardDescription>
        </CardHeader>
        <CardContent>
          <div className="space-y-4">
            {order.items.map((item) => (
              <div key={item.id} className="flex items-center justify-between p-4 bg-slate-700/30 rounded-lg border border-slate-600/50">
                <div className="flex items-center space-x-4">
                  <div className="w-12 h-12 bg-amber-500/20 rounded-lg flex items-center justify-center">
                    <MonitorPlay className="h-6 w-6 text-amber-400" />
                  </div>
                  <div>
                    <h3 className="font-medium text-white">{item.panelCode}</h3>
                    <p className="text-sm text-slate-300">{item.panelName}</p>
                    <div className="flex items-center space-x-4 mt-1">
                      <div className="flex items-center space-x-1">
                        <MapPin className="h-3 w-3 text-slate-400" />
                        <p className="text-xs text-slate-400">{item.location}</p>
                      </div>
                      <div className="flex items-center space-x-1">
                        <Calendar className="h-3 w-3 text-slate-400" />
                        <p className="text-xs text-slate-400">{item.duration}</p>
                      </div>
                    </div>
                  </div>
                </div>
                
                <div className="text-right">
                  <p className="font-bold text-white">R$ {item.price.toFixed(2)}</p>
                  <p className="text-xs text-slate-400">
                    {item.startDate} - {item.endDate}
                  </p>
                </div>
              </div>
            ))}
          </div>
        </CardContent>
      </Card>
    </div>
  );
};

export default OrderDetails;
