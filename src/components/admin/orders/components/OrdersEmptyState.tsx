
import React from 'react';

const OrdersEmptyState: React.FC = () => {
  return (
    <div className="text-center py-12">
      <div className="text-gray-900 text-lg font-semibold">Nenhum pedido ou tentativa encontrada</div>
      <p className="text-gray-700 mt-2">Tente ajustar os filtros de busca</p>
    </div>
  );
};

export default OrdersEmptyState;
