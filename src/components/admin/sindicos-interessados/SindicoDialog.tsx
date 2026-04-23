import React from 'react';
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
} from '@/components/ui/dialog';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { SindicoRow } from '@/hooks/useSindicosList';
import { TabResumo } from './tabs/TabResumo';
import { TabPredio } from './tabs/TabPredio';
import { TabSindico } from './tabs/TabSindico';
import { TabAceiteJuridico } from './tabs/TabAceiteJuridico';
import { TabGestaoInterna } from './tabs/TabGestaoInterna';

interface Props {
  sindico: SindicoRow | null;
  open: boolean;
  onOpenChange: (open: boolean) => void;
  onUpdated?: () => void;
}

export const SindicoDialog: React.FC<Props> = ({ sindico, open, onOpenChange, onUpdated }) => {
  if (!sindico) return null;

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="max-w-[900px] w-[calc(100vw-2rem)] max-h-[calc(100dvh-2rem)] overflow-hidden flex flex-col p-0">
        <DialogHeader className="px-6 pt-6 pb-2 border-b">
          <DialogTitle className="text-base">
            Cadastro de síndico — {sindico.nome_predio}
          </DialogTitle>
        </DialogHeader>

        <Tabs defaultValue="resumo" className="flex-1 flex flex-col overflow-hidden">
          <div className="px-6 pt-3 border-b">
            <TabsList className="flex-wrap gap-1 h-auto">
              <TabsTrigger value="resumo">Resumo</TabsTrigger>
              <TabsTrigger value="predio">Prédio</TabsTrigger>
              <TabsTrigger value="sindico">Síndico</TabsTrigger>
              <TabsTrigger value="aceite">Aceite jurídico</TabsTrigger>
              <TabsTrigger value="gestao">Gestão interna</TabsTrigger>
            </TabsList>
          </div>

          <div className="flex-1 overflow-y-auto px-6 py-5">
            <TabsContent value="resumo" className="mt-0">
              <TabResumo sindico={sindico} />
            </TabsContent>
            <TabsContent value="predio" className="mt-0">
              <TabPredio sindico={sindico} />
            </TabsContent>
            <TabsContent value="sindico" className="mt-0">
              <TabSindico sindico={sindico} />
            </TabsContent>
            <TabsContent value="aceite" className="mt-0">
              <TabAceiteJuridico sindico={sindico} />
            </TabsContent>
            <TabsContent value="gestao" className="mt-0">
              <TabGestaoInterna sindico={sindico} onSaved={onUpdated} />
            </TabsContent>
          </div>
        </Tabs>
      </DialogContent>
    </Dialog>
  );
};
