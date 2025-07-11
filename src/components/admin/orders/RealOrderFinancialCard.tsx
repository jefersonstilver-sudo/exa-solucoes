
import React from 'react';
import { DollarSign, Percent, Receipt, CreditCard, Shield } from 'lucide-react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Separator } from '@/components/ui/separator';
import { Badge } from '@/components/ui/badge';

interface RealOrderFinancialCardProps {
  order: {
    valor_total: number;
    cupom_id?: string;
    log_pagamento?: any;
    compliance_data?: any;
    status: string;
    transaction_id?: string;
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

  const getPaymentMethod = () => {
    if (order.compliance_data?.payment_method_id) {
      return order.compliance_data.payment_method_id === 'pix' ? 'PIX' : 'Cartão de Crédito';
    }
    if (order.log_pagamento?.payment_method) {
      return order.log_pagamento.payment_method === 'pix' ? 'PIX' : 'Cartão de Crédito';
    }
    return 'N/A';
  };

  const getTransactionDetails = () => {
    const details = [];
    
    // ID da Transação
    const transactionId = order.transaction_id || order.log_pagamento?.transaction_id;
    if (transactionId) {
      details.push({
        label: 'ID da Transação',
        value: transactionId
      });
    }
    
    // Dados da transação
    if (order.compliance_data?.date_approved) {
      details.push({
        label: 'Data de Aprovação',
        value: new Date(order.compliance_data.date_approved).toLocaleString('pt-BR')
      });
    }
    
    if (order.compliance_data?.transaction_amount) {
      details.push({
        label: 'Valor da Transação',
        value: formatCurrency(parseFloat(order.compliance_data.transaction_amount))
      });
    }
    
    if (order.compliance_data?.status_detail) {
      details.push({
        label: 'Detalhe do Status',
        value: order.compliance_data.status_detail
      });
    }
    
    return details;
  };

  const getPixDetails = () => {
    if (getPaymentMethod() !== 'PIX' || !order.compliance_data) return [];
    
    const pixDetails = [];
    
    if (order.compliance_data.pix_end_to_end_id) {
      pixDetails.push({
        label: 'End-to-End ID',
        value: order.compliance_data.pix_end_to_end_id
      });
    }
    
    return pixDetails;
  };

  const getCardDetails = () => {
    if (getPaymentMethod() === 'PIX' || !order.compliance_data) return [];
    
    const cardDetails = [];
    
    if (order.compliance_data.card_first_six_digits && order.compliance_data.card_last_four_digits) {
      cardDetails.push({
        label: 'Cartão',
        value: `**** **** ${order.compliance_data.card_first_six_digits.slice(-2)}** ****${order.compliance_data.card_last_four_digits}`
      });
    }
    
    if (order.compliance_data.card_holder_name) {
      cardDetails.push({
        label: 'Portador',
        value: order.compliance_data.card_holder_name
      });
    }
    
    return cardDetails;
  };

  const transactionDetails = getTransactionDetails();
  const pixDetails = getPixDetails();
  const cardDetails = getCardDetails();

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
        
        {(order.log_pagamento || order.compliance_data) && (
          <div className="mt-4 p-4 bg-blue-50 border border-blue-200 rounded-lg">
            <div className="flex items-center space-x-2 mb-3">
              <Receipt className="h-4 w-4 text-blue-600" />
              <p className="text-sm font-semibold text-blue-900">Informações do Pagamento</p>
            </div>
            <div className="space-y-2 text-sm text-blue-800">
              <div className="flex items-center justify-between">
                <span>Método:</span>
                <div className="flex items-center space-x-1">
                  <CreditCard className="h-3 w-3" />
                  <span className="font-medium">{getPaymentMethod()}</span>
                </div>
              </div>
              
              {transactionDetails.map((detail, index) => (
                <div key={index} className="flex items-center justify-between">
                  <span>{detail.label}:</span>
                  <span className="font-medium text-xs">{detail.value}</span>
                </div>
              ))}
            </div>
          </div>
        )}
        
        {pixDetails.length > 0 && (
          <div className="mt-4 p-4 bg-green-50 border border-green-200 rounded-lg">
            <div className="flex items-center space-x-2 mb-3">
              <Shield className="h-4 w-4 text-green-600" />
              <p className="text-sm font-semibold text-green-900">Detalhes PIX</p>
            </div>
            <div className="space-y-2 text-sm text-green-800">
              {pixDetails.map((detail, index) => (
                <div key={index} className="flex items-center justify-between">
                  <span>{detail.label}:</span>
                  <span className="font-medium text-xs break-all">{detail.value}</span>
                </div>
              ))}
            </div>
          </div>
        )}
        
        {cardDetails.length > 0 && (
          <div className="mt-4 p-4 bg-purple-50 border border-purple-200 rounded-lg">
            <div className="flex items-center space-x-2 mb-3">
              <CreditCard className="h-4 w-4 text-purple-600" />
              <p className="text-sm font-semibold text-purple-900">Detalhes do Cartão</p>
            </div>
            <div className="space-y-2 text-sm text-purple-800">
              {cardDetails.map((detail, index) => (
                <div key={index} className="flex items-center justify-between">
                  <span>{detail.label}:</span>
                  <span className="font-medium text-xs">{detail.value}</span>
                </div>
              ))}
            </div>
          </div>
        )}
      </CardContent>
    </Card>
  );
};
