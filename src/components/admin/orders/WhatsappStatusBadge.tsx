import React from 'react';
import { MessageCircle } from 'lucide-react';
import { Tooltip, TooltipContent, TooltipProvider, TooltipTrigger } from '@/components/ui/tooltip';
import { formatarFone } from '@/services/pedidoWhatsappService';

interface Props {
  whatsapp?: string | null;
  autorizados?: number;
}

/** Selo na lista de pedidos: tem ou nao WhatsApp do gestor, e quantos autorizados extras. */
const WhatsappStatusBadge: React.FC<Props> = ({ whatsapp, autorizados = 0 }) => {
  const tem = !!whatsapp;
  const total = (tem ? 1 : 0) + autorizados;
  const dica = tem
    ? `Gestor: ${formatarFone(whatsapp)}${autorizados ? ` + ${autorizados} autorizado(s)` : ''}`
    : 'Pedido sem WhatsApp do gestor. Clique no cliente para cadastrar.';
  return (
    <TooltipProvider delayDuration={200}>
      <Tooltip>
        <TooltipTrigger asChild>
          <span
            className={`inline-flex shrink-0 items-center gap-1 rounded-full border px-1.5 py-0 text-[10px] font-medium ${
              tem ? 'border-green-600/40 bg-green-50 text-green-700' : 'border-amber-500/50 bg-amber-50 text-amber-700'
            }`}
          >
            <MessageCircle className="h-3 w-3" />
            {tem ? `WhatsApp${total > 1 ? ` ${total}/3` : ''}` : 'Sem WhatsApp'}
          </span>
        </TooltipTrigger>
        <TooltipContent>{dica}</TooltipContent>
      </Tooltip>
    </TooltipProvider>
  );
};

export default WhatsappStatusBadge;
