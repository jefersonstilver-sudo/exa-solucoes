
import { motion } from "framer-motion";
import { Checkbox } from "@/components/ui/checkbox";
import { Label } from "@/components/ui/label";
import { useEffect } from "react";
import { logCheckoutEvent, LogLevel, CheckoutEvent } from "@/services/checkoutDebugService";

interface TermsAcceptanceProps {
  acceptTerms: boolean;
  setAcceptTerms: (value: boolean) => void;
}

const TermsAcceptance = ({ acceptTerms, setAcceptTerms }: TermsAcceptanceProps) => {
  // Log when terms are accepted
  useEffect(() => {
    if (acceptTerms) {
      logCheckoutEvent(
        CheckoutEvent.DEBUG_EVENT,
        LogLevel.INFO,
        "Termos de uso aceitos pelo usuário",
        { accepted: true, timestamp: new Date().toISOString() }
      );
    }
  }, [acceptTerms]);
  
  const handleTermsChange = (checked: boolean) => {
    setAcceptTerms(!!checked);
    
    // Log the change for analytics
    console.log(`[Checkout] Termos de uso ${checked ? 'aceitos' : 'rejeitados'}`);
  };
  
  return (
    <motion.div 
      initial={{ opacity: 0 }}
      animate={{ opacity: 1 }}
      transition={{ delay: 0.3 }}
      className="flex items-start space-x-3"
    >
      <Checkbox 
        id="terms" 
        checked={acceptTerms} 
        onCheckedChange={handleTermsChange}
        className="h-5 w-5 mt-0.5 border-gray-300 text-[#00FFAB] focus:ring-[#00FFAB]"
      />
      <Label 
        htmlFor="terms" 
        className="text-sm text-gray-600 cursor-pointer"
      >
        Li e concordo com os <a href="/termos" className="text-[#1E1B4B] hover:underline">Termos de Uso</a> e a <a href="/privacidade" className="text-[#1E1B4B] hover:underline">Política de Privacidade</a>.
      </Label>
    </motion.div>
  );
};

export default TermsAcceptance;
