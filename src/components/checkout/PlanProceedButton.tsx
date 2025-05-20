
import React, { useState } from 'react';
import { motion } from 'framer-motion';
import { ArrowRight } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { useUserSession } from '@/hooks/useUserSession';
import { toast } from 'sonner';

interface PlanProceedButtonProps {
  onProceed: () => void;
  disabled: boolean;
  selectedPlan?: number | null;
  planData?: any;
  totalPrice?: number;
}

const PlanProceedButton: React.FC<PlanProceedButtonProps> = ({ 
  onProceed, 
  disabled,
  selectedPlan,
  planData,
  totalPrice
}) => {
  const { user } = useUserSession();
  const [isSending, setIsSending] = useState(false);
  
  const sendWebhook = async () => {
    if (!user || !selectedPlan || !planData) {
      console.error("Webhook não enviado: dados do usuário ou plano ausentes", { 
        hasUser: !!user, 
        selectedPlan, 
        hasPlanData: !!planData 
      });
      return;
    }
    
    setIsSending(true);
    try {
      // Prepare webhook payload with user and plan data
      const webhookPayload = {
        userId: user.id,
        fullName: user.name || 'Not provided',
        userEmail: user.email,
        planoEscolhido: selectedPlan,
        periodoDias: selectedPlan * 30, // Converting months to days
        planoNome: planData.name || `Plano ${selectedPlan} meses`,
        valorTotal: totalPrice || 0,
        timestamp: new Date().toISOString()
      };
      
      console.log("Enviando webhook com payload:", webhookPayload);
      
      // Send webhook to the specified URL
      const response = await fetch('https://stilver.app.n8n.cloud/webhook-test/d8e707ae-093a-4e08-9069-8627eb9c1d19', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify(webhookPayload),
        // Adiciona timeout para evitar que a requisição fique pendente por muito tempo
        signal: AbortSignal.timeout(10000)
      });
      
      if (response.ok) {
        console.log("Webhook enviado com sucesso:", await response.text());
        toast.success("Plano registrado com sucesso!");
      } else {
        console.error("Erro ao enviar webhook. Status:", response.status, "Resposta:", await response.text());
        toast.error("Erro ao registrar plano. Por favor, tente novamente.");
      }
    } catch (error) {
      console.error("Exceção ao enviar webhook:", error);
      toast.error("Falha na comunicação. Por favor, tente novamente.");
    } finally {
      setIsSending(false);
    }
  };
  
  const handleClick = async () => {
    // Send webhook before proceeding
    await sendWebhook();
    // Continue with the original function
    onProceed();
  };

  return (
    <motion.div 
      initial={{ opacity: 0, y: 20 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ delay: 0.4 }}
      className="mt-10 flex justify-center"
    >
      <Button 
        size="lg" 
        className="px-8 py-6 bg-indexa-purple hover:bg-indexa-purple/90"
        onClick={handleClick}
        disabled={disabled || isSending}
      >
        {isSending ? (
          <>
            Registrando plano...
            <span className="ml-2 h-4 w-4 animate-spin rounded-full border-2 border-white border-t-transparent"></span>
          </>
        ) : (
          <>
            Continuar com o plano selecionado
            <ArrowRight className="ml-2 h-5 w-5" />
          </>
        )}
      </Button>
    </motion.div>
  );
};

export default PlanProceedButton;
