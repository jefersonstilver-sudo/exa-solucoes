import React, { useState } from 'react';
import { toast } from 'sonner';
import { isValidCpfCnpj } from '@/utils/cpfCnpjValidator';
import { generateOrderPix, AdminPixData } from '@/services/adminOrderPix';
import AsaasPixPanel from '../pix/AsaasPixPanel';
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
import { Loader2, ShoppingCart, QrCode, Save } from 'lucide-react';
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

  const [pixOrder, setPixOrder] = useState<{ id: string; pix: AdminPixData } | null>(null);
  const [generatingPix, setGeneratingPix] = useState(false);

  const docValid = isValidCpfCnpj(formData.clientDocument);
  const isValid = formData.clientName && formData.clientEmail && docValid && formData.listaPredios.length > 0 && formData.valorTotal > 0;

  const handleSavePending = async () => {
    try {
      await submitOrder();
      onOpenChange(false);
      onSuccess?.();
    } catch {
      // error already toasted
    }
  };

  const handleGeneratePix = async () => {
    let pedidoId: string | null = null;
    try {
      const pedido = await submitOrder({ keepForm: true });
      pedidoId = pedido.id;
      onSuccess?.();
    } catch {
      return;
    }
    setGeneratingPix(true);
    try {
      const pix = await generateOrderPix({
        pedidoId: pedidoId!,
        name: formData.clientName,
        cpfCnpj: formData.clientDocument,
        email: formData.clientEmail,
        phone: formData.clientPhone,
        value: formData.valorTotal,
        description: `Pedido EXA ${pedidoId!.slice(0, 8)} - ${formData.tipoProduto === 'vertical_premium' ? 'Vertical Premium' : 'Horizontal'} ${formData.planoMeses} mes(es)`,
      });
      setPixOrder({ id: pedidoId!, pix });
      toast.success('PIX gerado no Asaas');
    } catch (e: any) {
      toast.error(`Pedido salvo como pendente, mas o PIX falhou: ${e?.message || 'erro'}. Use "Gerar PIX" na lista.`);
    } finally {
      setGeneratingPix(false);
    }
  };

  const handleClose = (open: boolean) => {
    if (!open) { resetForm(); setPixOrder(null); }
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
                {pixOrder ? (
                  <AsaasPixPanel pedidoId={pixOrder.id} pix={pixOrder.pix} onPaid={onSuccess} />
                ) : (
                  <OrderSummary formData={formData} />
                )}
              </div>
            </ScrollArea>
          </div>
        </div>

        {/* Footer */}
        <div className="px-6 py-4 border-t bg-background shrink-0">
          {pixOrder ? (
            <Button variant="outline" className="w-full" onClick={() => handleClose(false)}>Fechar</Button>
          ) : (
            <div className="flex flex-col sm:flex-row gap-2">
              <Button variant="outline" onClick={handleSavePending} disabled={!isValid || isSubmitting || generatingPix} className="flex-1 border-[#9C1E1E]/40 text-[#9C1E1E] hover:bg-[#9C1E1E]/10">
                {isSubmitting && !generatingPix ? <Loader2 className="h-4 w-4 mr-2 animate-spin" /> : <Save className="h-4 w-4 mr-2" />}
                Salvar pedido pendente
              </Button>
              <Button onClick={handleGeneratePix} disabled={!isValid || isSubmitting || generatingPix} className="flex-1 bg-[#9C1E1E] hover:bg-[#7D1818] text-white">
                {generatingPix ? <Loader2 className="h-4 w-4 mr-2 animate-spin" /> : <QrCode className="h-4 w-4 mr-2" />}
                Gerar PIX via Asaas
              </Button>
            </div>
          )}
        </div>
      </DialogContent>
    </Dialog>
  );
};

export default AdminCreateOrderDialog;
