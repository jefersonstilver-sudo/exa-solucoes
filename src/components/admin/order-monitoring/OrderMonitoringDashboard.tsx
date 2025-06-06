
import React from 'react';
import OrderCreationMonitor from './OrderCreationMonitor';
import OrderTestScenarios from './OrderTestScenarios';

const OrderMonitoringDashboard: React.FC = () => {
  return (
    <div className="space-y-8">
      <div>
        <h1 className="text-3xl font-bold text-gray-900 mb-2">Dashboard de Monitoramento de Pedidos</h1>
        <p className="text-gray-600">
          Sistema completo de monitoramento e validação para garantir criação correta de pedidos
        </p>
      </div>

      {/* Monitor em Tempo Real */}
      <OrderCreationMonitor />

      {/* Cenários de Teste */}
      <OrderTestScenarios />
    </div>
  );
};

export default OrderMonitoringDashboard;
