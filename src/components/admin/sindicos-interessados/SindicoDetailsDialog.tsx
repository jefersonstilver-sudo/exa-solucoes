
import React from 'react';
import { Dialog, DialogContent, DialogHeader, DialogTitle } from '@/components/ui/dialog';
import { format } from 'date-fns';
import { ptBR } from 'date-fns/locale';
import { SindicoInteressado } from './types';
import StatusBadge from './StatusBadge';

interface SindicoDetailsDialogProps {
  sindico: SindicoInteressado | null;
  isOpen: boolean;
  onOpenChange: (open: boolean) => void;
}

const SindicoDetailsDialog: React.FC<SindicoDetailsDialogProps> = ({
  sindico,
  isOpen,
  onOpenChange
}) => {
  if (!sindico) return null;

  return (
    <Dialog open={isOpen} onOpenChange={onOpenChange}>
      <DialogContent className="max-w-2xl">
        <DialogHeader>
          <DialogTitle>Detalhes do Síndico Interessado</DialogTitle>
        </DialogHeader>
        
        <div className="space-y-6">
          <div className="grid grid-cols-2 gap-4">
            <div>
              <label className="text-sm font-medium text-gray-600">Nome Completo</label>
              <p className="text-sm">{sindico.nome_completo}</p>
            </div>
            <div>
              <label className="text-sm font-medium text-gray-600">Nome do Prédio</label>
              <p className="text-sm">{sindico.nome_predio}</p>
            </div>
          </div>
          
          <div>
            <label className="text-sm font-medium text-gray-600">Endereço</label>
            <p className="text-sm">{sindico.endereco}</p>
          </div>
          
          <div className="grid grid-cols-2 gap-4">
            <div>
              <label className="text-sm font-medium text-gray-600">Número de Andares</label>
              <p className="text-sm">{sindico.numero_andares}</p>
            </div>
            <div>
              <label className="text-sm font-medium text-gray-600">Número de Unidades</label>
              <p className="text-sm">{sindico.numero_unidades}</p>
            </div>
          </div>
          
          <div className="grid grid-cols-2 gap-4">
            <div>
              <label className="text-sm font-medium text-gray-600">Email</label>
              <p className="text-sm">{sindico.email}</p>
            </div>
            <div>
              <label className="text-sm font-medium text-gray-600">Celular</label>
              <p className="text-sm">{sindico.celular}</p>
            </div>
          </div>
          
          <div className="grid grid-cols-2 gap-4">
            <div>
              <label className="text-sm font-medium text-gray-600">Status</label>
              <div className="mt-1">
                <StatusBadge status={sindico.status} />
              </div>
            </div>
            <div>
              <label className="text-sm font-medium text-gray-600">Data de Cadastro</label>
              <p className="text-sm">
                {format(new Date(sindico.created_at), 'dd/MM/yyyy HH:mm', { locale: ptBR })}
              </p>
            </div>
          </div>
          
          {sindico.data_contato && (
            <div>
              <label className="text-sm font-medium text-gray-600">Data do Contato</label>
              <p className="text-sm">
                {format(new Date(sindico.data_contato), 'dd/MM/yyyy', { locale: ptBR })}
              </p>
            </div>
          )}
        </div>
      </DialogContent>
    </Dialog>
  );
};

export default SindicoDetailsDialog;
