
import React from 'react';
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
  
  const sendWebhook = async () => {
    if (!user || !selectedPlan || !planData) return;
    
    try {
      // Prepare webhook payload with user and plan data
      const webhookPayload = {
        userId: user.id,
        fullName: user.name || 'Not provided', // Using name property instead of user_metadata
        userEmail: user.email,
        planoEscolhido: selectedPlan,
        periodoDias: selectedPlan * 30, // Converting months to days
        planoNome: planData.name || `Plano ${selectedPlan} meses`,
        valorTotal: totalPrice || 0,
        timestamp: new Date().toISOString()
      };
      
      console.log("Sending webhook with payload:", webhookPayload);
      
      // Send webhook to the specified URL
      const response = await fetch('https://stilver.app.n8n.cloud/webhook-test/4d787fb3-407b-434b-ab51-83836f064416', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify(webhookPayload)
      });
      
      if (response.ok) {
        console.log("Webhook sent successfully");
      } else {
        console.error("Error sending webhook:", response.status);
      }
    } catch (error) {
      console.error("Error sending webhook:", error);
    }
  };
  
  const handleClick = () => {
    // Send webhook before proceeding
    sendWebhook();
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
        disabled={disabled}
      >
        Continuar com o plano selecionado
        <ArrowRight className="ml-2 h-5 w-5" />
      </Button>
    </motion.div>
  );
};

export default PlanProceedButton;
