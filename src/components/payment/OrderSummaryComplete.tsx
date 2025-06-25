
import React from 'react';
import { motion } from 'framer-motion';
import { Calendar, MapPin, CreditCard, Clock } from 'lucide-react';
import { formatCurrency } from '@/utils/formatters';

interface OrderSummaryCompleteProps {
  pedidoData: {
    id: string;
    valor_total: number;
    plano_meses: number;
    lista_paineis: string[];
    lista_predios: string[];
    data_inicio: string;
    data_fim: string;
    created_at: string;
  };
  buildingNames?: Record<string, string>;
}

const OrderSummaryComplete = ({ pedidoData, buildingNames = {} }: OrderSummaryCompleteProps) => {
  const getPlanName = (months: number) => {
    switch (months) {
      case 1: return 'Plano Básico';
      case 3: return 'Plano Popular';
      case 6: return 'Plano Profissional';
      case 12: return 'Plano Empresarial';
      default: return `Plano ${months} mês${months > 1 ? 'es' : ''}`;
    }
  };

  const formatDate = (dateString: string) => {
    return new Date(dateString).toLocaleDateString('pt-BR');
  };

  const valorComDesconto = pedidoData.valor_total * 0.95;

  return (
    <motion.div
      initial={{ opacity: 0, scale: 0.95 }}
      animate={{ opacity: 1, scale: 1 }}
      className="bg-white rounded-2xl shadow-xl p-6 border border-gray-100"
    >
      <h3 className="text-xl font-bold text-gray-800 mb-6 flex items-center">
        📋 Resumo Completo do Pedido
      </h3>

      <div className="space-y-6">
        {/* Plano Selecionado */}
        <div className="bg-gradient-to-r from-blue-50 to-blue-100 rounded-xl p-4 border border-blue-200">
          <div className="flex items-center space-x-3 mb-2">
            <Calendar className="h-5 w-5 text-blue-600" />
            <span className="font-medium text-blue-800">Plano Selecionado</span>
          </div>
          <p className="text-lg font-bold text-blue-900">
            {getPlanName(pedidoData.plano_meses)} ({pedidoData.plano_meses} mês{pedidoData.plano_meses > 1 ? 'es' : ''})
          </p>
        </div>

        {/* Período de Exibição */}
        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
          <div className="bg-green-50 rounded-xl p-4 border border-green-200">
            <div className="flex items-center space-x-2 mb-2">
              <Clock className="h-4 w-4 text-green-600" />
              <span className="text-sm font-medium text-green-700">Data de Início</span>
            </div>
            <p className="font-semibold text-green-800">
              {formatDate(pedidoData.data_inicio)}
            </p>
          </div>
          
          <div className="bg-orange-50 rounded-xl p-4 border border-orange-200">
            <div className="flex items-center space-x-2 mb-2">
              <Clock className="h-4 w-4 text-orange-600" />
              <span className="text-sm font-medium text-orange-700">Data de Término</span>
            </div>
            <p className="font-semibold text-orange-800">
              {formatDate(pedidoData.data_fim)}
            </p>
          </div>
        </div>

        {/* Prédios Selecionados */}
        <div className="bg-purple-50 rounded-xl p-4 border border-purple-200">
          <div className="flex items-center space-x-3 mb-3">
            <MapPin className="h-5 w-5 text-purple-600" />
            <span className="font-medium text-purple-800">Prédios Selecionados</span>
          </div>
          <div className="space-y-2">
            {pedidoData.lista_predios && pedidoData.lista_predios.length > 0 ? (
              pedidoData.lista_predios.map((predioId, index) => (
                <div key={predioId} className="flex items-center space-x-2">
                  <div className="w-2 h-2 bg-purple-500 rounded-full"></div>
                  <span className="text-purple-700 font-medium">
                    {buildingNames[predioId] || `Prédio ${index + 1}`}
                  </span>
                </div>
              ))
            ) : (
              <p className="text-purple-600 italic">
                {pedidoData.lista_paineis.length} painel{pedidoData.lista_paineis.length > 1 ? 'éis' : ''} selecionado{pedidoData.lista_paineis.length > 1 ? 's' : ''}
              </p>
            )}
          </div>
        </div>

        {/* Resumo Financeiro */}
        <div className="bg-gradient-to-r from-gray-50 to-gray-100 rounded-xl p-4 border border-gray-200">
          <div className="flex items-center space-x-3 mb-4">
            <CreditCard className="h-5 w-5 text-gray-600" />
            <span className="font-medium text-gray-800">Resumo Financeiro</span>
          </div>
          
          <div className="space-y-3">
            <div className="flex justify-between items-center">
              <span className="text-gray-600">Valor Original:</span>
              <span className="font-semibold text-gray-800">
                {formatCurrency(pedidoData.valor_total)}
              </span>
            </div>
            
            <div className="flex justify-between items-center text-green-600">
              <span>Desconto PIX (5%):</span>
              <span className="font-semibold">
                -{formatCurrency(pedidoData.valor_total * 0.05)}
              </span>
            </div>
            
            <div className="border-t border-gray-300 pt-3">
              <div className="flex justify-between items-center">
                <span className="text-lg font-bold text-gray-800">Total a Pagar:</span>
                <span className="text-2xl font-bold text-green-600">
                  {formatCurrency(valorComDesconto)}
                </span>
              </div>
            </div>
          </div>
        </div>

        {/* Informações do Pedido */}
        <div className="text-center text-sm text-gray-500 space-y-1">
          <p>Pedido #{pedidoData.id.slice(0, 8)}</p>
          <p>Criado em {formatDate(pedidoData.created_at)}</p>
        </div>
      </div>
    </motion.div>
  );
};

export default OrderSummaryComplete;
