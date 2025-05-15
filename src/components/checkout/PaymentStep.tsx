
import { useState } from "react";
import { Separator } from "@/components/ui/separator";
import { motion } from "framer-motion";
import { 
  CreditCardIcon,
  ExternalLink,
  AlertTriangle,
  Lock
} from "lucide-react";
import { logCheckoutEvent, LogLevel, CheckoutEvent } from "@/services/checkoutDebugService";

// Componentes refatorados
import PaymentMethods from "./payment/PaymentMethods";
import PaymentInfoBox from "./payment/PaymentInfoBox";
import SecurityBadges from "./payment/SecurityBadges";
import TermsAcceptance from "./payment/TermsAcceptance";

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

      <PaymentMethods 
        selectedMethod={selectedMethod} 
        setSelectedMethod={setSelectedMethod} 
        totalPrice={totalPrice} 
      />

      {/* Redirect Information */}
      <PaymentInfoBox 
        variant="info" 
        icon={<ExternalLink />} 
        title="Redirecionamento para o Mercado Pago"
      >
        <p>
          Ao clicar em "Confirmar e pagar", você será redirecionado para a plataforma segura 
          do Mercado Pago para finalizar seu pagamento. Após concluir, você retornará 
          automaticamente para a página de confirmação do seu pedido, onde poderá fazer 
          upload do seu vídeo.
        </p>
      </PaymentInfoBox>

      {/* Security badges */}
      <SecurityBadges />

      {/* Testing environment warning */}
      <PaymentInfoBox 
        variant="warning" 
        icon={<AlertTriangle />} 
        title="Ambiente de testes"
      >
        <p>
          Este é um ambiente de demonstração. Nenhum pagamento real será processado.
          Você pode testar a experiência de checkout completa.
        </p>
      </PaymentInfoBox>

      <Separator />

      {/* Terms acceptance */}
      <TermsAcceptance 
        acceptTerms={acceptTerms} 
        setAcceptTerms={setAcceptTerms} 
      />
    </motion.div>
  );
};

export default PaymentStep;
