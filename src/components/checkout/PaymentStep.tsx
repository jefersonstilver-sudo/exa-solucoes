
import { useState } from "react";
import { Checkbox } from "@/components/ui/checkbox";
import { Label } from "@/components/ui/label";
import { Separator } from "@/components/ui/separator";
import { motion } from "framer-motion";
import { 
  CreditCard,
  Lock,
  Check,
  CreditCardIcon,
  AlertTriangle,
  ExternalLink
} from "lucide-react";
import { logCheckoutEvent, LogLevel, CheckoutEvent } from "@/services/checkoutDebugService";

interface PaymentStepProps {
  acceptTerms: boolean;
  setAcceptTerms: (value: boolean) => void;
  totalPrice: number;
  paymentMethod?: string;
  setPaymentMethod?: (method: string) => void;
}

const PaymentStep = ({ 
  acceptTerms, 
  setAcceptTerms, 
  totalPrice, 
  paymentMethod: externalPaymentMethod, 
  setPaymentMethod: externalSetPaymentMethod 
}: PaymentStepProps) => {
  const [internalPaymentMethod, setInternalPaymentMethod] = useState<string>("credit_card");
  
  // Use either external or internal state for payment method
  const selectedMethod = externalPaymentMethod || internalPaymentMethod;
  const setSelectedMethod = (method: string) => {
    if (externalSetPaymentMethod) {
      externalSetPaymentMethod(method);
    } else {
      setInternalPaymentMethod(method);
    }
    
    // Log payment method selection for debugging
    logCheckoutEvent(
      CheckoutEvent.DEBUG_EVENT,
      LogLevel.INFO,
      `Método de pagamento selecionado: ${method}`,
      { method, totalPrice }
    );
  };

  // Payment method options - only PIX and credit card
  const paymentMethods = [
    { 
      id: "pix", 
      name: "PIX", 
      description: "Pagamento instantâneo — necessário app bancário", 
      icon: <svg 
        viewBox="0 0 512 512" 
        className="h-5 w-5" 
        fill="currentColor"
      >
        <path d="M242.4 292.5C247.8 287.1 257.1 287.1 262.5 292.5L339.5 369.5C353.7 383.7 372.6 391.5 392.6 391.5H407.7L310.6 294.4C300.7 284.5 300.7 268.5 310.6 258.6L407.7 161.5H392.6C372.6 161.5 353.7 169.3 339.5 183.5L262.5 260.5C257.1 265.9 247.8 265.9 242.4 260.5L165.4 183.5C151.2 169.3 132.3 161.5 112.3 161.5H97.2L194.3 258.6C204.2 268.5 204.2 284.5 194.3 294.4L97.2 391.5H112.3C132.3 391.5 151.2 383.7 165.4 369.5L242.4 292.5z"/>
      </svg>,
      installments: false  
    },
    { 
      id: "credit_card", 
      name: "Cartão de crédito", 
      description: "Visa, Mastercard, AMEX, ELO", 
      icon: <CreditCard className="h-5 w-5" />,
      installments: true
    }
  ];

  const [installments, setInstallments] = useState<number>(1);
  const installmentOptions = Array.from({ length: 12 }, (_, i) => i + 1);

  // Calculate installment amount
  const getInstallmentValue = (installment: number) => {
    // Apply interest rates based on number of installments
    const interestRates: Record<number, number> = {
      1: 0,    // No interest for 1 installment
      2: 0,    // No interest for 2 installments
      3: 0,    // No interest for 3 installments
      4: 0.01, // 1% for 4 installments
      5: 0.01, // 1% for 5 installments
      6: 0.015,// 1.5% for 6 installments
      7: 0.02, // 2% for 7+ installments
      8: 0.02,
      9: 0.025,
      10: 0.025,
      11: 0.03,
      12: 0.03
    };

    const rate = interestRates[installment] || 0.03;
    
    if (installment === 1) {
      return totalPrice;
    }
    
    // Apply compound interest formula: P(1 + r)^n
    const finalAmount = totalPrice * Math.pow(1 + rate, installment);
    return finalAmount / installment;
  };

  return (
    <motion.div 
      initial={{ opacity: 0 }}
      animate={{ opacity: 1 }}
      className="space-y-6"
    >
      <div className="space-y-2">
        <h2 className="text-xl font-semibold flex items-center">
          <CreditCardIcon className="mr-2 h-5 w-5 text-indexa-purple" />
          Forma de pagamento
        </h2>
        <p className="text-sm text-muted-foreground">
          Escolha como deseja pagar sua campanha
        </p>
      </div>

      <div className="space-y-4">
        {paymentMethods.map((method) => (
          <div key={method.id}>
            <label 
              htmlFor={method.id} 
              className={`flex items-center p-4 border rounded-lg cursor-pointer transition-all duration-200
                ${selectedMethod === method.id 
                  ? "border-indexa-purple bg-indexa-purple/5" 
                  : "border-gray-200 hover:bg-gray-50"}`}
            >
              <input
                type="radio"
                id={method.id}
                name="payment_method"
                value={method.id}
                checked={selectedMethod === method.id}
                onChange={() => setSelectedMethod(method.id)}
                className="sr-only"
                data-testid={`payment-method-${method.id}`}
              />
              <div className={`w-6 h-6 rounded-full border flex items-center justify-center mr-3
                ${selectedMethod === method.id 
                  ? "border-indexa-purple" 
                  : "border-gray-300"}`}
              >
                {selectedMethod === method.id && (
                  <motion.div 
                    initial={{ scale: 0 }}
                    animate={{ scale: 1 }}
                    className="bg-indexa-purple w-3 h-3 rounded-full"
                  />
                )}
              </div>
              
              <div className="mr-3 p-2 text-indexa-purple rounded-md bg-indexa-purple/10">
                {method.icon}
              </div>
              
              <div className="flex-grow">
                <p className="font-medium">{method.name}</p>
                <p className="text-sm text-muted-foreground">{method.description}</p>
              </div>
              
              {selectedMethod === method.id && (
                <motion.div 
                  initial={{ scale: 0 }}
                  animate={{ scale: 1 }}
                >
                  <Check className="text-indexa-purple h-5 w-5" />
                </motion.div>
              )}
            </label>
            
            {/* Installment options for credit card */}
            {selectedMethod === method.id && method.installments && (
              <motion.div 
                initial={{ opacity: 0, height: 0 }}
                animate={{ opacity: 1, height: "auto" }}
                className="ml-10 mt-3 mb-2 pl-4 border-l-2 border-indexa-purple/30"
              >
                <div className="space-y-2">
                  <Label htmlFor="installments" className="text-sm">
                    Número de parcelas
                  </Label>
                  <select
                    id="installments"
                    value={installments}
                    onChange={(e) => setInstallments(parseInt(e.target.value))}
                    className="w-full py-2 px-3 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-indexa-purple focus:border-transparent"
                  >
                    {installmentOptions.map((num) => (
                      <option key={num} value={num}>
                        {num}x {num === 1 ? "à vista" : `de R$ ${getInstallmentValue(num).toFixed(2)}`}
                        {num > 3 && " (com juros)"}
                      </option>
                    ))}
                  </select>
                  
                  {installments > 1 && (
                    <motion.div 
                      initial={{ opacity: 0 }}
                      animate={{ opacity: 1 }}
                      className="text-xs text-gray-500 mt-1"
                    >
                      Total com juros: R$ {(getInstallmentValue(installments) * installments).toFixed(2)}
                    </motion.div>
                  )}
                </div>
              </motion.div>
            )}
          </div>
        ))}
      </div>

      {/* Redirect Information */}
      <div className="bg-blue-50 border border-blue-100 rounded-lg p-4">
        <div className="flex">
          <div className="flex-shrink-0">
            <ExternalLink className="h-5 w-5 text-blue-500" />
          </div>
          <div className="ml-3">
            <h3 className="text-sm font-medium text-blue-800">
              Redirecionamento para o Mercado Pago
            </h3>
            <div className="mt-2 text-sm text-blue-700">
              <p>
                Ao clicar em "Confirmar e pagar", você será redirecionado para a plataforma segura 
                do Mercado Pago para finalizar seu pagamento. Após concluir, você retornará 
                automaticamente para a página de confirmação do seu pedido, onde poderá fazer 
                upload do seu vídeo.
              </p>
            </div>
          </div>
        </div>
      </div>

      {/* Security badges and trust elements */}
      <div className="bg-white p-4 rounded-lg border border-gray-200 shadow-sm">
        <div className="flex items-center mb-3">
          <Lock className="h-4 w-4 text-gray-500 mr-2" />
          <span className="text-sm font-medium">Ambiente 100% Seguro com Mercado Pago</span>
        </div>
        <div className="flex flex-wrap gap-3 items-center justify-center">
          <img 
            src="https://logospng.org/download/mercado-pago/logo-mercado-pago-icon-1024.png" 
            alt="Mercado Pago" 
            className="h-8"
          />
          <div className="h-6 w-px bg-gray-300 mx-1"></div>
          <img 
            src="https://logosmarcas.net/wp-content/uploads/2020/09/Mastercard-Logo.png" 
            alt="Mastercard" 
            className="h-6"
          />
          <img 
            src="https://logodownload.org/wp-content/uploads/2016/10/visa-logo-1.png" 
            alt="Visa" 
            className="h-6"
          />
          <img 
            src="https://logosmarcas.net/wp-content/uploads/2020/09/American-Express-Logo.png" 
            alt="American Express" 
            className="h-6"
          />
        </div>
      </div>

      <div className="bg-orange-50 border border-orange-100 rounded-lg p-4">
        <div className="flex">
          <div className="flex-shrink-0">
            <AlertTriangle className="h-5 w-5 text-orange-500" />
          </div>
          <div className="ml-3">
            <h3 className="text-sm font-medium text-orange-800">
              Ambiente de testes
            </h3>
            <div className="mt-2 text-sm text-orange-700">
              <p>
                Este é um ambiente de demonstração. Nenhum pagamento real será processado.
                Você pode testar a experiência de checkout completa.
              </p>
            </div>
          </div>
        </div>
      </div>

      <Separator />

      <div className="space-y-4">
        <div className="flex items-start gap-3">
          <Checkbox 
            id="terms" 
            checked={acceptTerms} 
            onCheckedChange={(checked) => setAcceptTerms(!!checked)} 
            className="mt-1"
          />
          <div>
            <Label 
              htmlFor="terms" 
              className="font-medium cursor-pointer"
            >
              Aceito os termos e condições
            </Label>
            <p className="text-sm text-muted-foreground mt-1">
              Ao confirmar este pedido, concordo com os <a href="#" className="text-indexa-purple hover:underline">Termos de Uso</a> e <a href="#" className="text-indexa-purple hover:underline">Política de Privacidade</a> da Indexa. 
              Estou ciente de que meu pagamento será processado pelo Mercado Pago e que não será possível cancelar campanhas ativas.
            </p>
          </div>
        </div>
      </div>
    </motion.div>
  );
};

export default PaymentStep;
