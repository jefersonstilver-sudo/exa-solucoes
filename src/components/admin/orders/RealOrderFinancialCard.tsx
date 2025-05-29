
import React from 'react';
import { DollarSign, Percent, Receipt, CreditCard } from 'lucide-react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Separator } from '@/components/ui/separator';
import { Badge } from '@/components/ui/badge';

interface RealOrderFinancialCardProps {
  order: {
    valor_total: number;
    cupom_id?: string;
    log_pagamento?: any;
    status: string;
  };
}

export const RealOrderFinancialCard: React.FC<RealOrderFinancialCardProps> = ({ order }) => {
  const formatCurrency = (value: number) => {
    return new Intl.NumberFormat('pt-BR', {
      style: 'currency',
      currency: 'BRL'
    }).format(value);
  };

  // Calcular valores baseados no valor total e possível desconto
  const valorBruto = order.valor_total;
  const temDesconto = !!order.cupom_id;
  const valorDesconto = temDesconto ? valorBruto * 0.1 : 0; // Assumindo 10% se há cupom
  const subtotal = temDesconto ? valorBruto + valorDesconto : valorBruto;
  const taxas = 0; // Assumindo sem taxas extras

  const getPaymentStatus = () => {
    const isPaid = order.status === 'pago' || order.status === 'pago_pendente_video' || order.status === 'video_enviado' || order.status === 'video_aprovado';
    return isPaid ? 'Pago' : 'Pendente';
  };

  const getPaymentStatusColor = () => {
    const isPaid = order.status === 'pago' || order.status === 'pago_pendente_video' || order.status === 'video_enviado' || order.status === 'video_aprovado';
    return isPaid ? 'bg-green-100 text-green-800' : 'bg-orange-100 text-orange-800';
  };

  return (
    <Card className="bg-white border-gray-200 shadow-sm hover:shadow-md transition-shadow">
      <CardHeader className="border-b border-gray-200 bg-gray-50/50">
        <CardTitle className="text-gray-900 flex items-center justify-between">
          <div className="flex items-center">
            <DollarSign className="h-5 w-5 mr-2 text-indexa-purple" />
            Resumo Financeiro
          </div>
          <Badge className={getPaymentStatusColor()}>
            {getPaymentStatus()}
          </Badge>
        </CardTitle>
      </CardHeader>
      <CardContent className="p-6 space-y-4">
        <div className="flex justify-between items-center">
          <p className="text-gray-600 font-medium">Subtotal</p>
          <p className="text-gray-900 font-semibold">{formatCurrency(subtotal)}</p>
        </div>
        
        {temDesconto && (
          <div className="flex justify-between items-center">
            <div className="flex items-center space-x-1">
              <Percent className="h-4 w-4 text-green-600" />
              <p className="text-gray-600 font-medium">Desconto (Cupom)</p>
            </div>
            <p className="text-green-600 font-semibold">-{formatCurrency(valorDesconto)}</p>
          </div>
        )}
        
        <div className="flex justify-between items-center">
          <p className="text-gray-600 font-medium">Taxas</p>
          <p className="text-gray-900 font-semibold">{formatCurrency(taxas)}</p>
        </div>
        
        <Separator className="bg-gray-200" />
        
        <div className="flex justify-between items-center bg-indexa-purple/5 p-4 rounded-lg">
          <p className="text-gray-900 font-bold text-lg">Total Pago</p>
          <p className="text-indexa-purple font-bold text-2xl">{formatCurrency(valorBruto)}</p>
        </div>
        
        {order.log_pagamento && (
          <div className="mt-4 p-4 bg-blue-50 border border-blue-200 rounded-lg">
            <div className="flex items-center space-x-2 mb-3">
              <Receipt className="h-4 w-4 text-blue-600" />
              <p className="text-sm font-semibold text-blue-900">Informações do Pagamento</p>
            </div>
            <div className="space-y-2 text-sm text-blue-800">
              {order.log_pagamento.payment_status && (
                <div className="flex items-center justify-between">
                  <span>Status:</span>
                  <Badge variant="outline" className="border-blue-300 text-blue-700">
                    {order.log_pagamento.payment_status}
                  </Badge>
                </div>
              )}
              {order.log_pagamento.payment_method && (
                <div className="flex items-center justify-between">
                  <span>Método:</span>
                  <div className="flex items-center space-x-1">
                    <CreditCard className="h-3 w-3" />
                    <span className="font-medium">
                      {order.log_pagamento.payment_method === 'pix' ? 'PIX' : 'Cartão de Crédito'}
                    </span>
                  </div>
                </div>
              )}
              {order.log_pagamento.processed_at && (
                <div className="flex items-center justify-between">
                  <span>Processado em:</span>
                  <span className="font-medium">
                    {new Date(order.log_pagamento.processed_at).toLocaleString('pt-BR')}
                  </span>
                </div>
              )}
            </div>
          </div>
        )}
      </CardContent>
    </Card>
  );
};
