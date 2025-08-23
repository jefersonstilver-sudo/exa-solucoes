
import React from 'react';
import { TableHead } from '@/components/ui/table';
import { Checkbox } from '@/components/ui/checkbox';
import { useAuth } from '@/hooks/useAuth';

interface OrdersTableHeaderProps {
  hasSelectableItems?: boolean;
  isAllSelected?: boolean;
  onSelectAllChange?: (checked: boolean) => void;
}

const OrdersTableHeader: React.FC<OrdersTableHeaderProps> = ({
  hasSelectableItems = false,
  isAllSelected = false,
  onSelectAllChange
}) => {
  const { isSuperAdmin } = useAuth();

  return (
    <>
      {isSuperAdmin && hasSelectableItems && (
        <TableHead className="w-12">
          <Checkbox
            checked={isAllSelected}
            onCheckedChange={(checked) => onSelectAllChange?.(checked as boolean)}
            aria-label="Selecionar todos os pedidos"
          />
        </TableHead>
      )}
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
      <TableHead className="text-gray-900 font-semibold min-w-[200px]">Vídeos Ativos</TableHead>
      <TableHead className="text-gray-900 font-semibold">Ações</TableHead>
    </>
  );
};

export default OrdersTableHeader;
