
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
  CheckCircle
} from 'lucide-react';

interface PurchaseInfoCardProps {
  orderDetails: {
    created_at: string;
    valor_total: number;
    data_inicio?: string;
    data_fim?: string;
    plano_meses: number;
    log_pagamento?: any;
    status: string;
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

  const getPaymentStatus = () => {
    if (orderDetails.log_pagamento?.payment_status === 'approved') {
      return { label: 'Pagamento Aprovado', color: 'text-green-600' };
    }
    if (orderDetails.status === 'pago' || orderDetails.status.includes('pago')) {
      return { label: 'Pagamento Confirmado', color: 'text-green-600' };
    }
    return { label: 'Processando', color: 'text-yellow-600' };
  };

  const purchaseDateTime = formatDateTime(orderDetails.created_at);
  const paymentStatus = getPaymentStatus();

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
        <div className="grid grid-cols-1 md:grid-cols-3 gap-4 mb-4">
          <div className="flex items-center space-x-3">
            <Calendar className="h-6 w-6 text-blue-500" />
            <div>
              <p className="text-sm text-gray-600">Data da Compra</p>
              <p className="font-medium">{purchaseDateTime.date}</p>
            </div>
          </div>
          
          <div className="flex items-center space-x-3">
            <Clock className="h-6 w-6 text-purple-500" />
            <div>
              <p className="text-sm text-gray-600">Horário</p>
              <p className="font-medium">{purchaseDateTime.time}</p>
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
                  <div className="flex justify-between">
                    <span className="text-gray-600">Valor Total:</span>
                    <span className="font-bold text-lg">{formatCurrency(orderDetails.valor_total)}</span>
                  </div>
                  {orderDetails.log_pagamento?.payment_id && (
                    <div className="flex justify-between">
                      <span className="text-gray-600">ID Transação:</span>
                      <span className="font-mono text-xs">
                        {orderDetails.log_pagamento.payment_id.substring(0, 16)}...
                      </span>
                    </div>
                  )}
                </div>
              </div>

              <div>
                <h4 className="font-semibold mb-3">Período de Exibição</h4>
                <div className="space-y-2">
                  <div className="flex justify-between">
                    <span className="text-gray-600">Duração:</span>
                    <span className="font-medium">{orderDetails.plano_meses} meses</span>
                  </div>
                  {orderDetails.data_inicio && (
                    <div className="flex justify-between">
                      <span className="text-gray-600">Início:</span>
                      <span className="font-medium">
                        {new Date(orderDetails.data_inicio).toLocaleDateString('pt-BR')}
                      </span>
                    </div>
                  )}
                  {orderDetails.data_fim && (
                    <div className="flex justify-between">
                      <span className="text-gray-600">Término:</span>
                      <span className="font-medium">
                        {new Date(orderDetails.data_fim).toLocaleDateString('pt-BR')}
                      </span>
                    </div>
                  )}
                </div>
              </div>
            </div>

            {/* Log técnico se disponível */}
            {orderDetails.log_pagamento && (
              <div className="mt-4 p-3 bg-gray-50 rounded-lg">
                <h5 className="text-sm font-medium text-gray-700 mb-2">Informações Técnicas</h5>
                <div className="text-xs text-gray-600 space-y-1">
                  {orderDetails.log_pagamento.processed_at && (
                    <div>Processado em: {new Date(orderDetails.log_pagamento.processed_at).toLocaleString('pt-BR')}</div>
                  )}
                  {orderDetails.log_pagamento.migrated_from_tentativa && (
                    <div>Migrado automaticamente do sistema anterior</div>
                  )}
                </div>
              </div>
            )}
          </div>
        )}
      </CardContent>
    </Card>
  );
};
