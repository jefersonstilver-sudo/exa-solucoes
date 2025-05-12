
import React from 'react';
import { Checkbox } from '@/components/ui/checkbox';
import { Info } from 'lucide-react';

interface PaymentStepProps {
  acceptTerms: boolean;
  setAcceptTerms: (accepted: boolean) => void;
}

const PaymentStep: React.FC<PaymentStepProps> = ({ acceptTerms, setAcceptTerms }) => {
  return (
    <div className="space-y-6">
      <h2 className="text-xl font-semibold">Finalizar pagamento</h2>
      <div className="space-y-4">
        <div className="flex items-center space-x-2">
          <Checkbox 
            id="terms" 
            checked={acceptTerms}
            onCheckedChange={(checked) => setAcceptTerms(checked === true)}
          />
          <label
            htmlFor="terms"
            className="text-sm font-medium leading-none peer-disabled:cursor-not-allowed peer-disabled:opacity-70"
          >
            Aceito os termos e condições
          </label>
        </div>
        
        <div className="p-4 bg-indexa-purple/10 rounded-md">
          <div className="flex items-start gap-3">
            <Info className="h-5 w-5 text-indexa-purple mt-0.5" />
            <div className="text-sm">
              <p className="font-medium">Ao finalizar a compra:</p>
              <ul className="list-disc pl-5 space-y-1 mt-2">
                <li>Seus painéis serão reservados para o período selecionado</li>
                <li>Você será redirecionado para o Mercado Pago para concluir o pagamento</li>
                <li>Após o pagamento confirmado, suas campanhas serão criadas automaticamente</li>
              </ul>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};

export default PaymentStep;
