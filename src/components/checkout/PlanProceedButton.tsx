
import React from 'react';
import { motion } from 'framer-motion';
import { ArrowRight } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { useUserSession } from '@/hooks/useUserSession';
import { toast } from 'sonner';
import { supabase } from '@/integrations/supabase/client';

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
        userId: user.id,
        fullName: user.name || 'Não fornecido',
        userEmail: user.email,
        valorCompra: totalPrice || 0,
        paineisSelecionados: paineisList,
        timestamp: new Date().toISOString()
      };
      
      console.log("Sending webhook with payload:", webhookPayload);
      
      // Send webhook to the specified URL
      const response = await fetch('https://stilver.app.n8n.cloud/webhook-test/d8e707ae-093a-4e08-9069-8627eb9c1d19', {
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
      // Don't block the payment process if webhook fails
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
