import React from 'react';
import { Bot } from 'lucide-react';
import { useIsSofiaOrder } from '@/hooks/useSofiaOrders';
import { cn } from '@/lib/utils';

interface Props {
  pedidoId?: string | null;
  className?: string;
}

/** Selo "Vendido pela Sofia" — aparece apenas em pedidos fechados pela IA. */
const SofiaSoldBadge: React.FC<Props> = ({ pedidoId, className }) => {
  const isSofia = useIsSofiaOrder(pedidoId);
  if (!isSofia) return null;
  return (
    <span
      className={cn(
        'inline-flex items-center gap-1 rounded-full border border-primary/30 bg-primary/10 px-2 py-0.5 text-[11px] font-semibold text-primary whitespace-nowrap',
        className,
      )}
      title="Pedido fechado pela Sofia (IA) no WhatsApp"
    >
      <Bot className="h-3 w-3" />
      Vendido pela Sofia
    </span>
  );
};

export default SofiaSoldBadge;
