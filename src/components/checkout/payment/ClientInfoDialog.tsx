
import React from 'react';
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle,
} from '@/components/ui/dialog';
import { Panel } from '@/types/panel';

interface ClientInfoDialogProps {
  isOpen: boolean;
  onClose: () => void;
  clientId?: string;
  clientEmail?: string;
  totalPrice: number;
  panels: { panel: Panel; duration: number }[];
}

const ClientInfoDialog = ({
  isOpen,
  onClose,
  clientId,
  clientEmail,
  totalPrice,
  panels,
}: ClientInfoDialogProps) => {
  return (
    <Dialog open={isOpen} onOpenChange={onClose}>
      <DialogContent className="sm:max-w-md">
        <DialogHeader>
          <DialogTitle>Informações do Cliente</DialogTitle>
          <DialogDescription>
            Detalhes do pedido para fins de teste
          </DialogDescription>
        </DialogHeader>
        <div className="space-y-4 py-4">
          <div className="grid grid-cols-3 gap-2">
            <span className="text-sm font-medium">ID do Cliente:</span>
            <span className="col-span-2 text-sm break-all">{clientId || 'Não disponível'}</span>
          </div>
          
          <div className="grid grid-cols-3 gap-2">
            <span className="text-sm font-medium">Email:</span>
            <span className="col-span-2 text-sm">{clientEmail || 'Não disponível'}</span>
          </div>
          
          <div className="grid grid-cols-3 gap-2">
            <span className="text-sm font-medium">Valor Total:</span>
            <span className="col-span-2 text-sm font-semibold">
              R$ {totalPrice.toFixed(2).replace('.', ',')}
            </span>
          </div>
          
          <div>
            <h4 className="text-sm font-medium mb-2">Painéis:</h4>
            {panels.length > 0 ? (
              <ul className="space-y-2 text-sm">
                {panels.map((item, index) => (
                  <li key={index} className="border p-2 rounded">
                    <div><span className="font-medium">ID:</span> {item.panel.id}</div>
                    <div><span className="font-medium">Código:</span> {item.panel.code}</div>
                    <div><span className="font-medium">Duração:</span> {item.duration} dias</div>
                  </li>
                ))}
              </ul>
            ) : (
              <p className="text-sm text-gray-500">Nenhum painel selecionado</p>
            )}
          </div>
        </div>
      </DialogContent>
    </Dialog>
  );
};

export default ClientInfoDialog;
