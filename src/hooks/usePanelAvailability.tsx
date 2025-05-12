
import { useState } from 'react';
import { useToast } from '@/hooks/use-toast';
import { supabase } from '@/integrations/supabase/client';
import { Panel } from '@/types/panel';

interface CartItem {
  panel: Panel;
  duration: number;
}

export const usePanelAvailability = () => {
  const [isCheckingAvailability, setIsCheckingAvailability] = useState(false);
  const [unavailablePanels, setUnavailablePanels] = useState<string[]>([]);
  const { toast } = useToast();

  // Function to check panel availability
  const checkPanelAvailability = async (cartItems: CartItem[], startDate: Date, endDate: Date) => {
    if (cartItems.length === 0) return;
    
    setIsCheckingAvailability(true);
    setUnavailablePanels([]);
    
    try {
      const startDateStr = startDate.toISOString().split('T')[0];
      const endDateStr = endDate.toISOString().split('T')[0];
      
      const unavailable: string[] = [];
      
      // Check availability for each panel
      for (const item of cartItems) {
        const { data, error } = await supabase.rpc('check_panel_availability', {
          p_panel_id: item.panel.id,
          p_start_date: startDateStr,
          p_end_date: endDateStr
        });
        
        if (error) throw error;
        
        if (data === false) {
          unavailable.push(item.panel.id);
        }
      }
      
      setUnavailablePanels(unavailable);
      
      if (unavailable.length > 0) {
        toast({
          variant: "destructive",
          title: "Painéis indisponíveis",
          description: `${unavailable.length} painéis não estão disponíveis para o período selecionado.`,
        });
      }
    } catch (error: any) {
      console.error('Error checking panel availability:', error);
      toast({
        variant: "destructive",
        title: "Erro ao verificar disponibilidade",
        description: error.message,
      });
    } finally {
      setIsCheckingAvailability(false);
    }
  };

  return {
    isCheckingAvailability,
    unavailablePanels,
    checkPanelAvailability
  };
};
