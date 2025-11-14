import React, { useState } from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { CreditCard, Calendar, Clock, DollarSign, ChevronDown, ChevronUp, CheckCircle, Hash } from 'lucide-react';
import { ClickableLocationsDisplay } from './ClickableLocationsDisplay';
import { CouponInfoDisplay } from './CouponInfoDisplay';
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
    cupom_id?: string;
    metodo_pagamento?: string;
  };
}
export const PurchaseInfoCard: React.FC<PurchaseInfoCardProps> = ({
  orderDetails
}) => {
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
      time: date.toLocaleTimeString('pt-BR', {
        hour: '2-digit',
        minute: '2-digit'
      })
    };
  };
  const getPaymentMethod = () => {
    const logPagamento = orderDetails.log_pagamento;
    
    console.log('[PurchaseInfoCard] Detectando método de pagamento:', {
      payment_type_id: logPagamento?.payment_type_id,
      payment_method_id: logPagamento?.payment_method_id,
      payment_method: logPagamento?.payment_method,
      metodo_pagamento: orderDetails.metodo_pagamento,
      tipo: logPagamento?.tipo
    });
    
    // Verificar se é pedido cortesia
    if (logPagamento?.tipo === 'CORTESIA' || orderDetails.metodo_pagamento === 'cortesia') {
      return 'Cortesia';
    }
    
    // PRIORIDADE 1: Verificar payment_type_id do Mercado Pago (campo mais confiável)
    if (logPagamento?.payment_type_id) {
      switch(logPagamento.payment_type_id.toLowerCase()) {
        case 'pix':
          return 'PIX';
        case 'credit_card':
          return 'Cartão de Crédito';
        case 'debit_card':
          return 'Cartão de Débito';
        case 'bank_transfer':
          return 'Transferência Bancária';
        default:
          return logPagamento.payment_type_id.replace(/_/g, ' ').toUpperCase();
      }
    }
    
    // PRIORIDADE 2: Verificar payment_method_id (método específico do MP)
    if (logPagamento?.payment_method_id) {
      if (logPagamento.payment_method_id === 'pix') {
        return 'PIX';
      }
      // Se não for PIX, verificar o tipo
      return logPagamento.payment_method_id.replace(/_/g, ' ').toUpperCase();
    }
    
    // PRIORIDADE 3: Verificar metodo_pagamento do pedido
    if (orderDetails.metodo_pagamento) {
      if (orderDetails.metodo_pagamento.toLowerCase() === 'pix') {
        return 'PIX';
      }
      if (orderDetails.metodo_pagamento.toLowerCase().includes('credit')) {
        return 'Cartão de Crédito';
      }
      return orderDetails.metodo_pagamento;
    }
    
    // Fallback: PIX (default mais comum)
    console.warn('[PurchaseInfoCard] Nenhum campo de método de pagamento encontrado, usando PIX como fallback');
    return 'PIX';
  };
  const getTransactionId = () => {
    const logPagamento = orderDetails.log_pagamento;
    if (!logPagamento) return 'N/A';
    return logPagamento.payment_id || logPagamento.external_reference || logPagamento.preferenceId || 'N/A';
  };
  const getPaymentStatus = () => {
    if (orderDetails.log_pagamento?.payment_status === 'approved') {
      return {
        label: 'Pagamento Aprovado',
        color: 'text-green-600'
      };
    }

    // Status que indicam pagamento confirmado
    const paidStatuses = ['pago', 'pago_pendente_video', 'video_aprovado', 'ativo'];
    if (paidStatuses.includes(orderDetails.status) || orderDetails.status.includes('pago')) {
      return {
        label: 'Pagamento Confirmado',
        color: 'text-green-600'
      };
    }
    return {
      label: 'Processando',
      color: 'text-yellow-600'
    };
  };
  const getContractPeriod = () => {
    // Verificar se tem vídeo aprovado antes de mostrar datas
    const hasApprovedVideo = orderDetails.status === 'video_aprovado' || orderDetails.status === 'ativo';
    
    if (hasApprovedVideo && orderDetails.data_inicio && orderDetails.data_fim) {
      const startDate = new Date(orderDetails.data_inicio).toLocaleDateString('pt-BR');
      const endDate = new Date(orderDetails.data_fim).toLocaleDateString('pt-BR');
      return `${startDate} - ${endDate}`;
    }
    return `${orderDetails.plano_meses} ${orderDetails.plano_meses === 1 ? 'mês' : 'meses'} (aguardando aprovação de vídeo)`;
  };
  const purchaseDateTime = formatDateTime(orderDetails.created_at);
  const paymentStatus = getPaymentStatus();
  const transactionId = getTransactionId();
  console.log('💳 [PURCHASE_INFO] Dados do pedido:', {
    orderDetails,
    cupomId: orderDetails.cupom_id,
    hasCupom: !!orderDetails.cupom_id,
    transactionId,
    paymentMethod: getPaymentMethod(),
    contractPeriod: getContractPeriod()
  });
  return <Card>
      <CardHeader>
        <CardTitle className="flex items-center justify-between">
          <span className="flex items-center">
            <CreditCard className="h-5 w-5 mr-2" />
            Informações de Compra
          </span>
          <Button variant="ghost" size="sm" onClick={() => setIsExpanded(!isExpanded)} className="flex items-center">
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
          
          {orderDetails.cupom_id && (
            <div className="flex items-center space-x-3">
              <CreditCard className="h-6 w-6 text-purple-500" />
              <div>
                <p className="text-sm text-gray-600">Cupom Usado</p>
                <CouponInfoDisplay cupomId={orderDetails.cupom_id} valorOriginal={orderDetails.valor_total} showDetails={false} />
              </div>
            </div>
          )}

          <div className="flex items-center space-x-3">
            <CheckCircle className="h-6 w-6 text-green-500" />
            <div>
              <p className="text-sm text-gray-600">Status</p>
              <p className={`font-medium ${paymentStatus.color}`}>{paymentStatus.label}</p>
            </div>
          </div>
        </div>

        {/* Badge Cortesia - Design Corporativo */}
        {(orderDetails.log_pagamento?.tipo === 'CORTESIA' || orderDetails.metodo_pagamento === 'cortesia') && (
          <div className="mt-4">
            <div className="bg-slate-50 border border-slate-300 rounded-lg p-4">
              <div className="flex items-center space-x-3">
                <div className="p-2 bg-slate-700 rounded">
                  <svg className="h-5 w-5 text-white" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 12l2 2 4-4m6 2a9 9 0 11-18 0 9 9 0 0118 0z" />
                  </svg>
                </div>
                <div>
                  <p className="font-semibold text-slate-800 text-base">Pedido Cortesia</p>
                  <p className="text-sm text-slate-600">Isento de cobrança</p>
                </div>
              </div>
            </div>
          </div>
        )}

        {/* Informações expandidas */}
        {isExpanded && <div className="border-t pt-4 space-y-4">
            {/* Seção de Cupom (se aplicável) */}
            {orderDetails.cupom_id && <div className="mb-6">
                <h4 className="font-semibold mb-3 text-green-800">Cupom Aplicado</h4>
                <CouponInfoDisplay cupomId={orderDetails.cupom_id} valorOriginal={orderDetails.valor_total} showDetails={true} />
              </div>}

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
                          {transactionId.length > 20 ? `${transactionId.substring(0, 20)}...` : transactionId}
                        </span>
                      </div>
                    </div>
                  </div>
                  
                  {/* Status do Mercado Pago */}
                  {orderDetails.log_pagamento?.status && (
                    <div className="flex justify-between">
                      <span className="text-gray-600">Status MP:</span>
                      <span className="font-medium text-xs capitalize">
                        {orderDetails.log_pagamento.status}
                      </span>
                    </div>
                  )}
                  
                  {/* Bandeira do Cartão */}
                  {orderDetails.log_pagamento?.payment_method_id && (
                    <div className="flex justify-between">
                      <span className="text-gray-600">Bandeira:</span>
                      <span className="font-medium text-xs uppercase">
                        {orderDetails.log_pagamento.payment_method_id}
                      </span>
                    </div>
                  )}
                  
                  {/* Últimos 4 dígitos do cartão */}
                  {orderDetails.log_pagamento?.card?.last_four_digits && (
                    <div className="flex justify-between">
                      <span className="text-gray-600">Final do Cartão:</span>
                      <span className="font-mono text-xs">
                        •••• {orderDetails.log_pagamento.card.last_four_digits}
                      </span>
                    </div>
                  )}
                  
                  {/* Parcelas */}
                  {orderDetails.log_pagamento?.installments && orderDetails.log_pagamento.installments > 1 && (
                    <div className="flex justify-between">
                      <span className="text-gray-600">Parcelas:</span>
                      <span className="font-medium text-xs">
                        {orderDetails.log_pagamento.installments}x
                      </span>
                    </div>
                  )}
                  
                  {/* Data de processamento */}
                  {orderDetails.log_pagamento?.date_approved && (
                    <div className="flex justify-between">
                      <span className="text-gray-600">Aprovado em:</span>
                      <span className="text-xs">
                        {new Date(orderDetails.log_pagamento.date_approved).toLocaleString('pt-BR')}
                      </span>
                    </div>
                  )}
                  
                  {/* Taxa do Mercado Pago */}
                  {orderDetails.log_pagamento?.fee_details && orderDetails.log_pagamento.fee_details.length > 0 && (
                    <div className="flex justify-between">
                      <span className="text-gray-600">Taxa MP:</span>
                      <span className="text-xs text-red-600">
                        - {formatCurrency(
                          orderDetails.log_pagamento.fee_details.reduce((sum: number, fee: any) => sum + (fee.amount || 0), 0)
                        )}
                      </span>
                    </div>
                  )}
                  
                  {/* Valor líquido */}
                  {orderDetails.log_pagamento?.transaction_amount_refunded !== undefined && (
                    <div className="flex justify-between">
                      <span className="text-gray-600">Valor Líquido:</span>
                      <span className="font-medium text-green-600">
                        {formatCurrency(
                          (orderDetails.log_pagamento.transaction_amount || 0) - 
                          (orderDetails.log_pagamento.transaction_amount_refunded || 0)
                        )}
                      </span>
                    </div>
                  )}
                  
                  {/* ID do pagador */}
                  {orderDetails.log_pagamento?.payer?.id && (
                    <div className="flex justify-between">
                      <span className="text-gray-600">ID Pagador:</span>
                      <span className="font-mono text-xs">
                        {orderDetails.log_pagamento.payer.id}
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
          </div>}
      </CardContent>
    </Card>;
};