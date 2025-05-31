
import { useState, useEffect } from "react";
import { Separator } from "@/components/ui/separator";
import { motion } from "framer-motion";
import { 
  CreditCardIcon,
  ExternalLink,
  Lock
} from "lucide-react";
import { logCheckoutEvent, LogLevel, CheckoutEvent } from "@/services/checkoutDebugService";
import { toast } from "sonner";

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
  // CRITICAL CHANGE: Default to PIX since credit card is temporarily disabled
  const [internalPaymentMethod, setInternalPaymentMethod] = useState<string>("pix");
  
  // Use either external or internal state for payment method
  const selectedMethod = externalPaymentMethod || internalPaymentMethod;
  
  // CRITICAL FIX: Ensure payment method is properly set to PIX only
  const setSelectedMethod = (method: string) => {
    console.log("[PaymentStep] Setting payment method to:", method);
    
    // Only allow PIX for now
    if (method !== 'pix') {
      console.log("[PaymentStep] Credit card temporarily disabled, forcing PIX");
      method = 'pix';
    }
    
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
  
  // Ensure PIX is always selected when component mounts
  useEffect(() => {
    if (selectedMethod !== 'pix') {
      console.log("[PaymentStep] Forcing PIX as default payment method");
      setSelectedMethod("pix");
    }
  }, []);

  return (
    <motion.div 
      initial={{ opacity: 0 }}
      animate={{ opacity: 1 }}
      className="space-y-6"
    >
      <div className="space-y-2">
        <h2 className="text-xl font-semibold flex items-center">
          <CreditCardIcon className="mr-2 h-5 w-5 text-indexa-purple" />
          Como você deseja pagar sua campanha?
        </h2>
        <p className="text-sm text-muted-foreground">
          Atualmente disponível apenas pagamento via PIX
        </p>
      </div>

      <PaymentMethods 
        selectedMethod={selectedMethod} 
        setSelectedMethod={setSelectedMethod} 
        totalPrice={totalPrice} 
      />

      {/* PIX Information - Updated messaging */}
      <PaymentInfoBox 
        variant="info" 
        icon={<ExternalLink className="h-4 w-4" />} 
        title="Pagamento instantâneo via PIX com 5% de desconto."
      >
        <p className="text-sm text-blue-600 font-medium">
          Após gerar o QR Code, você pode pagar diretamente pelo seu banco ou carteira digital.
        </p>
      </PaymentInfoBox>

      {/* Security badges */}
      <SecurityBadges />

      <Separator />

      {/* Terms acceptance */}
      <TermsAcceptance 
        acceptTerms={acceptTerms} 
        setAcceptTerms={(checked) => {
          console.log("[PaymentStep] Setting terms acceptance to:", checked);
          setAcceptTerms(checked);
        }} 
      />
    </motion.div>
  );
};

export default PaymentStep;
