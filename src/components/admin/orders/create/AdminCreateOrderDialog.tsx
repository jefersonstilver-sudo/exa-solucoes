import React from 'react';
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogDescription,
} from '@/components/ui/dialog';
import {
  Accordion,
  AccordionContent,
  AccordionItem,
  AccordionTrigger,
} from '@/components/ui/accordion';
import { Button } from '@/components/ui/button';
import { Loader2, ShoppingCart } from 'lucide-react';
import { useAdminCreateOrder } from '@/hooks/useAdminCreateOrder';
import ClientSearchSection from './ClientSearchSection';
import ProductSelectSection from './ProductSelectSection';
import OrderConfigSection from './OrderConfigSection';
import OrderSummary from './OrderSummary';
import { ScrollArea } from '@/components/ui/scroll-area';

interface AdminCreateOrderDialogProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  onSuccess?: () => void;
}

const AdminCreateOrderDialog: React.FC<AdminCreateOrderDialogProps> = ({
  open, onOpenChange, onSuccess
}) => {
  const {
    formData, updateField, resetForm,
    searchClients, searchProposals,
    activateAccount, createAccount,
    checkAccountStatus,
    submitOrder, isSubmitting,
  } = useAdminCreateOrder();

  const isValid = formData.clientName && formData.clientEmail && formData.listaPredios.length > 0 && formData.valorTotal > 0;

  const handleSubmit = async () => {
    try {
      await submitOrder();
      onOpenChange(false);
      onSuccess?.();
    } catch {
      // error already toasted
    }
  };

  const handleClose = (open: boolean) => {
    if (!open) resetForm();
    onOpenChange(open);
  };

  return (
    <Dialog open={open} onOpenChange={handleClose}>
      <DialogContent className="max-w-6xl w-[95vw] h-[90vh] p-0 overflow-hidden flex flex-col">
        <DialogHeader className="px-6 pt-6 pb-4 border-b shrink-0">
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 rounded-xl bg-[#9C1E1E]/10 flex items-center justify-center">
              <ShoppingCart className="h-5 w-5 text-[#9C1E1E]" />
            </div>
            <div>
              <DialogTitle className="text-lg">Novo Pedido</DialogTitle>
              <DialogDescription className="text-xs">Criar pedido manualmente pelo admin</DialogDescription>
            </div>
          </div>
        </DialogHeader>

        <div className="flex-1 overflow-hidden grid grid-cols-1 lg:grid-cols-[1fr_380px]">
          {/* Left column - Form */}
          <ScrollArea className="h-full">
            <div className="px-6 py-4">
              <Accordion type="multiple" defaultValue={['client', 'product', 'config']} className="space-y-2">
                <AccordionItem value="client" className="border rounded-lg px-4">
                  <AccordionTrigger className="text-sm font-semibold hover:no-underline">
                    <span className="flex items-center gap-2">
                      <span className="w-6 h-6 rounded-full bg-[#9C1E1E] text-white text-xs flex items-center justify-center">1</span>
                      Cliente
                    </span>
                  </AccordionTrigger>
                  <AccordionContent>
                    <ClientSearchSection
                      formData={formData}
                      updateField={updateField}
                      searchClients={searchClients}
                      searchProposals={searchProposals}
                      activateAccount={activateAccount}
                      createAccount={createAccount}
                      checkAccountStatus={checkAccountStatus}
                    />
                  </AccordionContent>
                </AccordionItem>

                <AccordionItem value="product" className="border rounded-lg px-4">
                  <AccordionTrigger className="text-sm font-semibold hover:no-underline">
                    <span className="flex items-center gap-2">
                      <span className="w-6 h-6 rounded-full bg-[#9C1E1E] text-white text-xs flex items-center justify-center">2</span>
                      Produto
                    </span>
                  </AccordionTrigger>
                  <AccordionContent>
                    <ProductSelectSection formData={formData} updateField={updateField} />
                  </AccordionContent>
                </AccordionItem>

                <AccordionItem value="config" className="border rounded-lg px-4">
                  <AccordionTrigger className="text-sm font-semibold hover:no-underline">
                    <span className="flex items-center gap-2">
                      <span className="w-6 h-6 rounded-full bg-[#9C1E1E] text-white text-xs flex items-center justify-center">3</span>
                      Configuração
                    </span>
                  </AccordionTrigger>
                  <AccordionContent>
                    <OrderConfigSection formData={formData} updateField={updateField} />
                  </AccordionContent>
                </AccordionItem>
              </Accordion>
            </div>
          </ScrollArea>

          {/* Right column - Summary */}
          <div className="border-l bg-muted/30 flex flex-col">
            <ScrollArea className="flex-1">
              <div className="px-5 py-4">
                <OrderSummary formData={formData} />
              </div>
            </ScrollArea>
          </div>
        </div>

        {/* Footer */}
        <div className="px-6 py-4 border-t bg-background shrink-0">
          <Button
            onClick={handleSubmit}
            disabled={!isValid || isSubmitting}
            className="w-full bg-[#9C1E1E] hover:bg-[#7D1818] text-white"
          >
            {isSubmitting ? (
              <><Loader2 className="h-4 w-4 mr-2 animate-spin" /> Criando...</>
            ) : (
              'Confirmar Pedido'
            )}
          </Button>
        </div>
      </DialogContent>
    </Dialog>
  );
};

export default AdminCreateOrderDialog;
