
import { Panel } from '@/types/panel';
import { PlanKey } from '@/types/checkout';
import { calculateCartSubtotal, calculateTotalPrice } from '@/utils/checkoutUtils';
import { formatCurrency } from '@/utils/priceUtils';

interface CartItem {
  panel: Panel;
  duration: number;
}

interface CheckoutSummaryProps {
  cartItems: CartItem[];
  selectedPlan: PlanKey;
  plans: Record<string, any>;
  couponDiscount: number;
  couponValid: boolean;
  startDate: Date;
  endDate: Date;
  paymentMethod?: string;
}

const CheckoutSummary = ({ 
  cartItems, 
  selectedPlan, 
  plans, 
  couponDiscount, 
  couponValid, 
  startDate, 
  endDate,
  paymentMethod = 'credit_card'
}: CheckoutSummaryProps) => {
  
  // USAR AS FUNÇÕES CENTRALIZADAS para garantir consistência
  const subtotal = calculateCartSubtotal(cartItems);
  const total = calculateTotalPrice(selectedPlan, cartItems, couponDiscount, couponValid);
  const discount = couponValid && couponDiscount ? subtotal - total : 0;

  // Log detalhado para auditoria
  console.log("📄 [CheckoutSummary] AUDITORIA DE PREÇOS:", {
    component: "CheckoutSummary",
    cartItemsCount: cartItems.length,
    selectedPlan,
    subtotal,
    total,
    discount,
    couponValid,
    couponDiscount,
    paymentMethod,
    cartDetails: cartItems.map(item => ({
      panelId: item.panel.id,
      buildingName: item.panel.buildings?.nome,
      preco_base: item.panel.buildings?.preco_base,
      duration: item.duration
    })),
    timestamp: new Date().toISOString()
  });

  // Formatar data
  const formatDate = (date: Date) => {
    return new Intl.DateTimeFormat('pt-BR', { 
      day: '2-digit', 
      month: '2-digit', 
      year: 'numeric' 
    }).format(date);
  };

  // Pegar ícone do método de pagamento
  const getPaymentMethodIcon = () => {
    if (paymentMethod === 'pix') {
      return (
        <svg 
          viewBox="0 0 512 512" 
          className="h-4 w-4" 
          fill="currentColor"
        >
          <path d="M242.4 292.5C247.8 287.1 257.1 287.1 262.5 292.5L339.5 369.5C353.7 383.7 372.6 391.5 392.6 391.5H407.7L310.6 294.4C300.7 284.5 300.7 268.5 310.6 258.6L407.7 161.5H392.6C372.6 161.5 353.7 169.3 339.5 183.5L262.5 260.5C257.1 265.9 247.8 265.9 242.4 260.5L165.4 183.5C151.2 169.3 132.3 161.5 112.3 161.5H97.2L194.3 258.6C204.2 268.5 204.2 284.5 194.3 294.4L97.2 391.5H112.3C132.3 391.5 151.2 383.7 165.4 369.5L242.4 292.5z"/>
        </svg>
      );
    }
    
    return <svg className="h-4 w-4" fill="none" stroke="currentColor" viewBox="0 0 24 24" xmlns="http://www.w3.org/2000/svg"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M3 10h18M7 15h1m4 0h1m-7 4h12a3 3 0 003-3V8a3 3 0 00-3-3H6a3 3 0 00-3 3v8a3 3 0 003 3z"></path></svg>;
  };

  return (
    <div className="border border-gray-200 rounded-lg shadow-sm bg-white">
      <div className="bg-indigo-900 text-white p-4 rounded-t-lg flex items-center gap-2">
        <svg className="h-5 w-5" fill="none" stroke="currentColor" viewBox="0 0 24 24" xmlns="http://www.w3.org/2000/svg"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M9 5H7a2 2 0 00-2 2v12a2 2 0 002 2h10a2 2 0 002-2V7a2 2 0 00-2-2h-2M9 5a2 2 0 002 2h2a2 2 0 002-2M9 5a2 2 0 012-2h2a2 2 0 012 2"></path></svg>
        <h2 className="font-semibold">Resumo do pedido</h2>
      </div>
      
      <div className="p-4 space-y-4">
        {/* Plano Selecionado */}
        <div className="bg-blue-50 p-3 rounded-md border border-blue-100">
          <div className="font-medium text-blue-900">Plano Selecionado</div>
          <div className="mt-1 flex items-start gap-2">
            <div className="bg-blue-100 rounded-md p-1">
              <svg className="h-4 w-4 text-blue-700" fill="none" stroke="currentColor" viewBox="0 0 24 24" xmlns="http://www.w3.org/2000/svg"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M8 7V3m8 4V3m-9 8h10M5 21h14a2 2 0 002-2V7a2 2 0 00-2-2H5a2 2 0 00-2 2v12a2 2 0 002 2z"></path></svg>
            </div>
            <div>
              <div className="text-sm font-medium">{plans[selectedPlan]?.name || `Plano de ${selectedPlan} ${selectedPlan === 1 ? 'mês' : 'meses'}`}</div>
              <div className="text-xs text-blue-700">{selectedPlan} {selectedPlan === 1 ? 'mês' : 'meses'}</div>
            </div>
          </div>
        </div>
        
        {/* Detalhes */}
        <div>
          <div className="font-medium mb-2">Detalhes</div>
          <div className="flex justify-between text-sm mb-1">
            <span>Qtde. painéis:</span>
            <span className="font-medium">{cartItems.length}</span>
          </div>
        </div>
        
        {/* Período */}
        <div>
          <div className="font-medium mb-2">Período</div>
          <div className="flex items-center text-sm mb-1">
            <svg className="h-4 w-4 mr-2 text-gray-500" fill="none" stroke="currentColor" viewBox="0 0 24 24" xmlns="http://www.w3.org/2000/svg"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M8 7V3m8 4V3m-9 8h10M5 21h14a2 2 0 002-2V7a2 2 0 00-2-2H5a2 2 0 00-2 2v12a2 2 0 002 2z"></path></svg>
            <div>
              <span>Início: </span>
              <span className="font-medium">{formatDate(startDate)}</span>
            </div>
          </div>
          <div className="flex items-center text-sm">
            <svg className="h-4 w-4 mr-2 text-gray-500" fill="none" stroke="currentColor" viewBox="0 0 24 24" xmlns="http://www.w3.org/2000/svg"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M8 7V3m8 4V3m-9 8h10M5 21h14a2 2 0 002-2V7a2 2 0 00-2-2H5a2 2 0 00-2 2v12a2 2 0 002 2z"></path></svg>
            <div>
              <span>Término: </span>
              <span className="font-medium">{formatDate(endDate)}</span>
            </div>
          </div>
        </div>
        
        {/* Método de pagamento */}
        <div>
          <div className="font-medium mb-2">Método de pagamento</div>
          <div className="flex items-center text-sm">
            <span className="mr-2">{getPaymentMethodIcon()}</span>
            <span>{paymentMethod === 'pix' ? 'PIX' : 'Cartão de crédito'}</span>
          </div>
        </div>

        {/* Valores - USANDO FUNÇÕES CENTRALIZADAS */}
        <div className="border-t pt-3 mt-3">
          <div className="flex justify-between mb-1">
            <span className="text-sm">Subtotal:</span>
            <span className="font-medium">{formatCurrency(subtotal)}</span>
          </div>
          
          {couponValid && discount > 0 && (
            <div className="flex justify-between mb-1 text-green-600">
              <span className="text-sm">Desconto ({couponDiscount}%):</span>
              <span className="font-medium">-{formatCurrency(discount)}</span>
            </div>
          )}
          
          <div className="flex justify-between font-semibold mt-2 text-lg">
            <span>Total:</span>
            <span className="text-indigo-900">{formatCurrency(total)}</span>
          </div>
          
          {couponValid && discount > 0 && (
            <div className="text-xs text-green-600 mt-1 text-right">
              Você economizou {formatCurrency(discount)}!
            </div>
          )}
        </div>
      </div>
    </div>
  );
};

export default CheckoutSummary;
