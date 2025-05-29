
import React from 'react';
import { DollarSign, Percent, Receipt } from 'lucide-react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Separator } from '@/components/ui/separator';

interface RealOrderFinancialCardProps {
  order: {
    valor_total: number;
    cupom_id?: string;
    log_pagamento?: any;
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

  return (
    <Card className="bg-white border-gray-200">
      <CardHeader className="border-b border-gray-200">
        <CardTitle className="text-gray-900 flex items-center">
          <DollarSign className="h-5 w-5 mr-2 text-indexa-purple" />
          Resumo Financeiro
        </CardTitle>
      </CardHeader>
      <CardContent className="p-6 space-y-4">
        <div className="flex justify-between">
          <p className="text-gray-600">Subtotal</p>
          <p className="text-gray-900 font-medium">{formatCurrency(subtotal)}</p>
        </div>
        
        {temDesconto && (
          <div className="flex justify-between">
            <div className="flex items-center space-x-1">
              <Percent className="h-3 w-3 text-green-600" />
              <p className="text-gray-600">Desconto (Cupom)</p>
            </div>
            <p className="text-green-600 font-medium">-{formatCurrency(valorDesconto)}</p>
          </div>
        )}
        
        <div className="flex justify-between">
          <p className="text-gray-600">Taxas</p>
          <p className="text-gray-900 font-medium">{formatCurrency(taxas)}</p>
        </div>
        
        <Separator className="bg-gray-200" />
        
        <div className="flex justify-between">
          <p className="text-gray-900 font-bold text-lg">Total Pago</p>
          <p className="text-indexa-purple font-bold text-xl">{formatCurrency(valorBruto)}</p>
        </div>
        
        {order.log_pagamento && (
          <div className="mt-4 p-3 bg-gray-50 rounded-lg">
            <div className="flex items-center space-x-2 mb-2">
              <Receipt className="h-4 w-4 text-gray-500" />
              <p className="text-sm font-medium text-gray-700">Informações do Pagamento</p>
            </div>
            <div className="space-y-1 text-xs text-gray-600">
              {order.log_pagamento.payment_status && (
                <p>Status: <span className="font-medium">{order.log_pagamento.payment_status}</span></p>
              )}
              {order.log_pagamento.processed_at && (
                <p>Processado em: <span className="font-medium">
                  {new Date(order.log_pagamento.processed_at).toLocaleString('pt-BR')}
                </span></p>
              )}
            </div>
          </div>
        )}
      </CardContent>
    </Card>
  );
};
