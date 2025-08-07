
import React, { useState } from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { 
  CreditCard, 
  Calendar, 
  Clock, 
  DollarSign, 
  ChevronDown, 
  ChevronUp,
  CheckCircle,
  Hash
} from 'lucide-react';
import { ClickableLocationsDisplay } from './ClickableLocationsDisplay';

interface PurchaseInfoCardProps {
  orderDetails: {
    created_at: string;
    valor_total: number;
    data_inicio?: string;
    data_fim?: string;
    plano_meses: number;
    log_pagamento?: any;
    status: string;
    lista_paineis?: string[];
    lista_predios?: string[];
  };
}

export const PurchaseInfoCard: React.FC<PurchaseInfoCardProps> = ({ orderDetails }) => {
  const [isExpanded, setIsExpanded] = useState(false);

  const formatCurrency = (value: number) => {
    return new Intl.NumberFormat('pt-BR', {
      style: 'currency',
      currency: 'BRL'
    }).format(value);
  };

  const formatDateTime = (dateString: string) => {
    const date = new Date(dateString);
    return {
      date: date.toLocaleDateString('pt-BR'),
      time: date.toLocaleTimeString('pt-BR', { hour: '2-digit', minute: '2-digit' })
    };
  };

  const getPaymentMethod = () => {
    if (orderDetails.log_pagamento?.payment_method) {
      return orderDetails.log_pagamento.payment_method === 'pix' ? 'PIX' : 'Cartão de Crédito';
    }
    return 'PIX'; // Default baseado no contexto
  };

  const getTransactionId = () => {
    const logPagamento = orderDetails.log_pagamento;
    if (!logPagamento) return 'N/A';
    
    return logPagamento.payment_id || 
           logPagamento.external_reference || 
           logPagamento.preferenceId ||
           'N/A';
  };

  const getPaymentStatus = () => {
    if (orderDetails.log_pagamento?.payment_status === 'approved') {
      return { label: 'Pagamento Aprovado', color: 'text-green-600' };
    }
    
    // Status que indicam pagamento confirmado
    const paidStatuses = ['pago', 'pago_pendente_video', 'video_aprovado', 'ativo'];
    
    if (paidStatuses.includes(orderDetails.status) || orderDetails.status.includes('pago')) {
      return { label: 'Pagamento Confirmado', color: 'text-green-600' };
    }
    
    return { label: 'Processando', color: 'text-yellow-600' };
  };

  const getContractPeriod = () => {
    if (orderDetails.data_inicio && orderDetails.data_fim) {
      const startDate = new Date(orderDetails.data_inicio).toLocaleDateString('pt-BR');
      const endDate = new Date(orderDetails.data_fim).toLocaleDateString('pt-BR');
      return `${startDate} - ${endDate}`;
    }
    return `${orderDetails.plano_meses} ${orderDetails.plano_meses === 1 ? 'mês' : 'meses'}`;
  };

  const purchaseDateTime = formatDateTime(orderDetails.created_at);
  const paymentStatus = getPaymentStatus();
  const transactionId = getTransactionId();

  console.log('💳 [PURCHASE_INFO] Dados do pedido:', {
    orderDetails,
    transactionId,
    paymentMethod: getPaymentMethod(),
    contractPeriod: getContractPeriod()
  });

  return (
    <Card>
      <CardHeader>
        <CardTitle className="flex items-center justify-between">
          <span className="flex items-center">
            <CreditCard className="h-5 w-5 mr-2" />
            Informações de Compra
          </span>
          <Button
            variant="ghost"
            size="sm"
            onClick={() => setIsExpanded(!isExpanded)}
            className="flex items-center"
          >
            {isExpanded ? <ChevronUp className="h-4 w-4" /> : <ChevronDown className="h-4 w-4" />}
          </Button>
        </CardTitle>
      </CardHeader>
      
      {/* Informações básicas sempre visíveis */}
      <CardContent>
        <div className="grid grid-cols-1 md:grid-cols-4 gap-4 mb-4">
          <div className="flex items-center space-x-3">
            <Calendar className="h-6 w-6 text-blue-500" />
            <div>
              <p className="text-sm text-gray-600">Data da Compra</p>
              <p className="font-medium">{purchaseDateTime.date}</p>
              <p className="text-xs text-gray-500">{purchaseDateTime.time}</p>
            </div>
          </div>
          
          <div className="flex items-center space-x-3">
            <DollarSign className="h-6 w-6 text-green-500" />
            <div>
              <p className="text-sm text-gray-600">Valor Total</p>
              <p className="font-bold text-lg">{formatCurrency(orderDetails.valor_total)}</p>
            </div>
          </div>
          
          {/* UPDATED: Usar nova coluna lista_predios com fallback para lista_paineis */}
          <div className="flex items-center space-x-3">
            <div>
              <p className="text-sm text-gray-600">Locais Contratados</p>
              <ClickableLocationsDisplay 
                listaPaineis={orderDetails.lista_paineis || []}
                listaPredios={orderDetails.lista_predios || []}
                orderDetails={orderDetails}
                className="mt-1"
              />
            </div>
          </div>

          <div className="flex items-center space-x-3">
            <CheckCircle className="h-6 w-6 text-green-500" />
            <div>
              <p className="text-sm text-gray-600">Status</p>
              <p className={`font-medium ${paymentStatus.color}`}>{paymentStatus.label}</p>
            </div>
          </div>
        </div>

        {/* Informações expandidas */}
        {isExpanded && (
          <div className="border-t pt-4 space-y-4">
            <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
              <div>
                <h4 className="font-semibold mb-3">Detalhes do Pagamento</h4>
                <div className="space-y-2">
                  <div className="flex justify-between">
                    <span className="text-gray-600">Método:</span>
                    <span className="font-medium">{getPaymentMethod()}</span>
                  </div>
                  <div className="flex justify-between items-start">
                    <span className="text-gray-600">ID Transação:</span>
                    <div className="text-right">
                      <div className="flex items-center space-x-1">
                        <Hash className="h-3 w-3 text-gray-400" />
                        <span className="font-mono text-xs">
                          {transactionId.length > 20 ? 
                            `${transactionId.substring(0, 20)}...` : 
                            transactionId
                          }
                        </span>
                      </div>
                    </div>
                  </div>
                  {orderDetails.log_pagamento?.processed_at && (
                    <div className="flex justify-between">
                      <span className="text-gray-600">Processado em:</span>
                      <span className="text-xs">
                        {new Date(orderDetails.log_pagamento.processed_at).toLocaleString('pt-BR')}
                      </span>
                    </div>
                  )}
                </div>
              </div>

              <div>
                <h4 className="font-semibold mb-3">Período do Contrato</h4>
                <div className="space-y-2">
                  <div className="flex justify-between">
                    <span className="text-gray-600">Duração:</span>
                    <span className="font-medium">{orderDetails.plano_meses} {orderDetails.plano_meses === 1 ? 'mês' : 'meses'}</span>
                  </div>
                  <div className="flex justify-between">
                    <span className="text-gray-600">Período:</span>
                    <span className="font-medium text-sm">{getContractPeriod()}</span>
                  </div>
                </div>
              </div>
            </div>
          </div>
        )}
      </CardContent>
    </Card>
  );
};
