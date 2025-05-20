
import { useState, useEffect } from "react";
import { Separator } from "@/components/ui/separator";
import { motion } from "framer-motion";
import { 
  CreditCardIcon,
  ExternalLink,
  Lock,
  TestTube
} from "lucide-react";
import { Button } from "@/components/ui/button";
import { logCheckoutEvent, LogLevel, CheckoutEvent } from "@/services/checkoutDebugService";
import { toast } from "sonner";
import { useNavigate } from "react-router-dom";
import { useUserSession } from "@/hooks/useUserSession";
import { supabase } from "@/integrations/supabase/client";

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
  orderId?: string;
}

const PaymentStep = ({ 
  acceptTerms, 
  setAcceptTerms, 
  totalPrice, 
  paymentMethod: externalPaymentMethod, 
  setPaymentMethod: externalSetPaymentMethod,
  orderId
}: PaymentStepProps) => {
  const [internalPaymentMethod, setInternalPaymentMethod] = useState<string>("credit_card");
  const navigate = useNavigate();
  const { user } = useUserSession();
  
  // Use either external or internal state for payment method
  const selectedMethod = externalPaymentMethod || internalPaymentMethod;
  
  // CRITICAL FIX: Ensure payment method is properly set
  const setSelectedMethod = (method: string) => {
    console.log("[PaymentStep] Setting payment method to:", method);
    
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
  
  // Ensure a payment method is always selected
  useEffect(() => {
    if (!selectedMethod) {
      console.log("[PaymentStep] No payment method selected, defaulting to credit_card");
      setSelectedMethod("credit_card");
    }
  }, [selectedMethod]);

  // Test payment handler
  const handleTestPayment = async () => {
    toast.success("Modo de pagamento de teste ativado");
    
    try {
      // Get cart items from localStorage
      const cartStorageKey = 'indexa_cart';
      const cartItemsJSON = localStorage.getItem(cartStorageKey);
      const cartItems = cartItemsJSON ? JSON.parse(cartItemsJSON) : [];
      
      // Get building names for the selected panels
      let paineisList = [];
      if (cartItems && cartItems.length > 0) {
        // Fetch building information for each panel
        const panelIds = cartItems.map(item => item.panel.id);
        const { data: buildingsData } = await supabase
          .from('buildings')
          .select('id, nome')
          .in('id', panelIds);
          
        if (buildingsData) {
          paineisList = buildingsData.map(building => building.nome);
        } else {
          paineisList = cartItems.map((item, index) => `Painel ${index + 1}`);
        }
      }
      
      // Prepare webhook payload with user and plan data
      const webhookPayload = {
        userId: user?.id,
        fullName: user?.name || 'Não fornecido',
        userEmail: user?.email,
        valorCompra: totalPrice || 0,
        paineisSelecionados: paineisList,
        timestamp: new Date().toISOString(),
        testMode: true
      };
      
      console.log("Sending webhook with test payload:", webhookPayload);
      
      // Send webhook to the specified URL
      const response = await fetch('https://stilver.app.n8n.cloud/webhook-test/d8e707ae-093a-4e08-9069-8627eb9c1d19', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify(webhookPayload)
      });
      
      if (response.ok) {
        console.log("Test webhook sent successfully");
        // Simulate payment success and redirect
        toast.success("Pagamento de teste processado! Redirecionando...");
        setTimeout(() => {
          navigate(`/pedido-confirmado?id=${orderId}`);
        }, 1500);
      } else {
        console.error("Error sending webhook:", response.status);
        toast.error("Erro ao enviar dados de teste");
      }
    } catch (error) {
      console.error("Error in test payment:", error);
      toast.error("Erro ao processar pagamento de teste");
    }
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
          Como você deseja pagar sua campanha?
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

      {/* Redirect Information - Clean and minimal */}
      <PaymentInfoBox 
        variant="info" 
        icon={<ExternalLink className="h-4 w-4" />} 
        title="Você será redirecionado ao ambiente seguro do Mercado Pago para finalizar sua compra."
      >
        <p className="text-sm text-blue-600 font-medium">
          Após concluir o pagamento, você retornará automaticamente para continuar o processo.
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

      {/* Test Payment Button */}
      {orderId && (
        <div className="mt-4 flex justify-center">
          <Button 
            onClick={handleTestPayment}
            size="lg"
            variant="outline"
            className="border-2 border-indexa-purple text-indexa-purple hover:bg-indexa-purple/10"
          >
            PAGAR TESTE
            <TestTube className="ml-2 h-5 w-5" />
          </Button>
        </div>
      )}
    </motion.div>
  );
};

export default PaymentStep;
