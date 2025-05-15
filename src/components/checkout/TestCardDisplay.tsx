
import { TEST_CREDIT_CARDS } from '@/constants/mercadoPagoConstants';
import { CreditCard, Copy, AlertTriangle } from 'lucide-react';
import { useState } from 'react';
import { toast } from 'sonner';

export const TestCardDisplay = () => {
  const [expanded, setExpanded] = useState(false);
  
  const copyToClipboard = (text: string) => {
    navigator.clipboard.writeText(text);
    toast.success('Número do cartão copiado para área de transferência');
  };
  
  if (!expanded) {
    return (
      <button
        onClick={() => setExpanded(true)}
        className="flex items-center text-sm text-orange-700 hover:text-orange-800 transition-colors"
      >
        <CreditCard className="h-4 w-4 mr-1" />
        Mostrar cartões de teste
      </button>
    );
  }
  
  return (
    <div className="mt-4 bg-orange-50 border border-orange-200 rounded-md p-4">
      <div className="flex items-center justify-between">
        <h4 className="text-sm font-medium text-orange-800 flex items-center">
          <AlertTriangle className="h-4 w-4 mr-1" />
          Cartões de teste para o ambiente de desenvolvimento
        </h4>
        <button 
          onClick={() => setExpanded(false)}
          className="text-xs text-orange-700 hover:text-orange-900"
        >
          Fechar
        </button>
      </div>
      
      <div className="mt-3 space-y-3">
        {TEST_CREDIT_CARDS.map((card, index) => (
          <div key={index} className="border border-orange-200 rounded bg-white p-2">
            <div className="flex justify-between items-center">
              <span className="text-sm font-medium">{card.name}</span>
              <span className={`text-xs px-2 py-1 rounded-full ${
                card.status === 'approved' ? 'bg-green-100 text-green-800' :
                card.status === 'pending' ? 'bg-yellow-100 text-yellow-800' :
                'bg-red-100 text-red-800'
              }`}>
                {card.status}
              </span>
            </div>
            <div className="flex items-center mt-2 justify-between">
              <code className="text-sm bg-gray-100 px-2 py-1 rounded font-mono">
                {card.number}
              </code>
              <button 
                onClick={() => copyToClipboard(card.number)}
                className="text-gray-500 hover:text-gray-700 ml-2"
                title="Copiar número"
              >
                <Copy className="h-4 w-4" />
              </button>
            </div>
            <div className="mt-2 text-xs text-gray-600">
              CVV: {card.cvv} | Validade: {card.expiration}
            </div>
          </div>
        ))}
      </div>
      
      <div className="mt-3 text-xs text-orange-700">
        Esses cartões funcionam apenas no ambiente de teste do Mercado Pago.
      </div>
    </div>
  );
};

export default TestCardDisplay;
