import { supabase } from '@/integrations/supabase/client';
import { toast } from 'sonner';

export const useCartValidation = () => {
  const validateCartPanels = async (panelIds: string[]) => {
    console.log('🔍 [CART_VALIDATION] Validando painéis do carrinho...', panelIds);
    
    if (!panelIds || panelIds.length === 0) {
      return { valid: true, invalidIds: [] };
    }
    
    const { data: panels, error } = await supabase
      .from('painels')
      .select('id')
      .in('id', panelIds);
    
    if (error) {
      console.error('❌ [CART_VALIDATION] Erro ao validar painéis:', error);
      return { valid: false, invalidIds: panelIds };
    }
    
    const foundIds = panels?.map(p => p.id) || [];
    const invalidIds = panelIds.filter(id => !foundIds.includes(id));
    
    if (invalidIds.length > 0) {
      console.warn('⚠️ [CART_VALIDATION] Painéis inválidos encontrados:', invalidIds);
      toast.error(`${invalidIds.length} painéis no carrinho não estão mais disponíveis`, {
        description: 'Por favor, remova os painéis inválidos e tente novamente.',
        duration: 6000
      });
      return { valid: false, invalidIds };
    }
    
    console.log('✅ [CART_VALIDATION] Todos os painéis são válidos');
    return { valid: true, invalidIds: [] };
  };
  
  return { validateCartPanels };
};
