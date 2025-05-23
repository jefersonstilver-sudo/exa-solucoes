
import React from 'react';
import { motion } from 'framer-motion';
import { Card } from '@/components/ui/card';

type OrderSummaryProps = {
  orderDetails: {
    plano_meses?: number;
    lista_paineis?: any[];
    data_inicio?: string;
    data_fim?: string;
    valor_total?: number;
  } | null;
};

const OrderSummary: React.FC<OrderSummaryProps> = ({ orderDetails }) => {
  if (!orderDetails) return null;
  
  const cardVariants = {
    initial: { y: 20, opacity: 0 },
    animate: { y: 0, opacity: 1 }
  };
  
  return (
    <motion.div
      variants={cardVariants}
      className="mb-8"
    >
      <Card className="p-6 shadow-md">
        <h2 className="text-xl font-semibold flex items-center">
          <span className="mr-2">📋</span>
          Resumo do pedido
        </h2>
        
        <div className="mt-6 space-y-6">
          <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
            <div>
              <h3 className="text-sm font-medium text-gray-500">Plano Selecionado</h3>
              <p className="text-lg font-medium">
                {orderDetails?.plano_meses === 1 && 'Plano Básico (1 mês)'}
                {orderDetails?.plano_meses === 3 && 'Plano Popular (3 meses)'}
                {orderDetails?.plano_meses === 6 && 'Plano Profissional (6 meses)'}
                {orderDetails?.plano_meses === 12 && 'Plano Empresarial (12 meses)'}
              </p>
            </div>
            
            <div>
              <h3 className="text-sm font-medium text-gray-500">Qtde. painéis</h3>
              <p className="text-lg font-medium">
                {orderDetails?.lista_paineis?.length || 0}
              </p>
            </div>
            
            <div>
              <h3 className="text-sm font-medium text-gray-500">Período</h3>
              <div>
                <p className="text-md">
                  <span className="text-gray-700">Início:</span> {orderDetails?.data_inicio ? new Date(orderDetails.data_inicio).toLocaleDateString() : '-'}
                </p>
                <p className="text-md">
                  <span className="text-gray-700">Término:</span> {orderDetails?.data_fim ? new Date(orderDetails.data_fim).toLocaleDateString() : '-'}
                </p>
              </div>
            </div>
            
            <div>
              <h3 className="text-sm font-medium text-gray-500">Valor</h3>
              <p className="text-lg font-medium">
                R$ {orderDetails?.valor_total?.toFixed(2)?.replace('.', ',') || '0,00'}
              </p>
            </div>
          </div>
        </div>
      </Card>
    </motion.div>
  );
};

export default OrderSummary;
