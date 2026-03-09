import React from 'react';
import { AdminOrderFormData } from '@/hooks/useAdminCreateOrder';
import { CheckCircle, AlertCircle } from 'lucide-react';

interface OrderSummaryProps {
  formData: AdminOrderFormData;
}

const OrderSummary: React.FC<OrderSummaryProps> = ({ formData }) => {
  const isValid = formData.clientName && formData.clientEmail && formData.listaPredios.length > 0 && formData.valorTotal > 0;

  const items = [
    { label: 'Cliente', value: formData.clientName || '—', ok: !!formData.clientName },
    { label: 'Email', value: formData.clientEmail || '—', ok: !!formData.clientEmail },
    { label: 'Produto', value: formData.tipoProduto === 'vertical_premium' ? 'Vertical Premium' : 'Horizontal', ok: true },
    { label: 'Prédios', value: `${formData.listaPredios.length} selecionado(s)`, ok: formData.listaPredios.length > 0 },
    { label: 'Plano', value: `${formData.planoMeses} mês(es)`, ok: true },
    { label: 'Valor', value: `R$ ${formData.valorTotal.toLocaleString('pt-BR', { minimumFractionDigits: 2 })}`, ok: formData.valorTotal > 0 },
    { label: 'Pagamento', value: formData.metodoPagamento, ok: true },
    { label: 'Status', value: formData.statusInicial, ok: true },
    { label: 'Logo', value: formData.logoFile ? formData.logoFile.name : 'Não enviada', ok: true },
  ];

  return (
    <div className="space-y-3">
      <h4 className="text-sm font-semibold flex items-center gap-2">
        {isValid ? (
          <CheckCircle className="h-4 w-4 text-emerald-500" />
        ) : (
          <AlertCircle className="h-4 w-4 text-amber-500" />
        )}
        Resumo do Pedido
      </h4>
      <div className="bg-muted/50 rounded-lg p-3 space-y-1.5">
        {items.map((item, i) => (
          <div key={i} className="flex justify-between text-sm">
            <span className="text-muted-foreground">{item.label}</span>
            <span className={`font-medium ${item.ok ? 'text-foreground' : 'text-destructive'}`}>{item.value}</span>
          </div>
        ))}
      </div>
    </div>
  );
};

export default OrderSummary;
