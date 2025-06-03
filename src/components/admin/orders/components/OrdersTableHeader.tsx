
import React from 'react';
import { TableHead } from '@/components/ui/table';

const OrdersTableHeader: React.FC = () => {
  return (
    <>
      <TableHead className="text-gray-900 font-semibold">Tipo</TableHead>
      <TableHead className="text-gray-900 font-semibold">ID</TableHead>
      <TableHead className="text-gray-900 font-semibold">Data</TableHead>
      <TableHead className="text-gray-900 font-semibold">Status</TableHead>
      <TableHead className="text-gray-900 font-semibold">Valor</TableHead>
      <TableHead className="text-gray-900 font-semibold">Plano</TableHead>
      <TableHead className="text-gray-900 font-semibold">Período</TableHead>
      <TableHead className="text-gray-900 font-semibold">Painéis</TableHead>
      <TableHead className="text-gray-900 font-semibold">Cliente</TableHead>
      <TableHead className="text-gray-900 font-semibold">Email</TableHead>
      <TableHead className="text-gray-900 font-semibold">Ações</TableHead>
    </>
  );
};

export default OrdersTableHeader;
