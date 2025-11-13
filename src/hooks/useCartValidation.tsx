import { supabase } from '@/integrations/supabase/client';
import { toast } from 'sonner';

export const useCartValidation = () => {
  const validateCartPanels = async (panelIds: string[]) => {
    console.log('🔍 [CART_VALIDATION] Valid ando buildings do carrinho (usando panel IDs)...', panelIds);
    
    if (!panelIds || panelIds.length === 0) {
      return { valid: true, invalidIds: [] };
    }
    
    // Validar contra a tabela buildings usando os IDs dos painéis (que são IDs de buildings)
    const { data: buildings, error } = await supabase
      .from('buildings')
      .select('id, status')
      .in('id', panelIds);
    
    if (error) {
      console.error('❌ [CART_VALIDATION] Erro ao validar prédios:', error);
      return { valid: false, invalidIds: panelIds };
    }
    
    const foundIds = buildings?.filter(b => b.status === 'ativo').map(b => b.id) || [];
    const invalidIds = panelIds.filter(id => !foundIds.includes(id));
    
    if (invalidIds.length > 0) {
      console.warn('⚠️ [CART_VALIDATION] Prédios inválidos encontrados:', invalidIds);
      toast.error(`${invalidIds.length} prédios no carrinho não estão mais disponíveis`, {
        description: 'Por favor, remova os prédios inválidos e tente novamente.',
        duration: 6000
      });
      return { valid: false, invalidIds };
    }
    
    console.log('✅ [CART_VALIDATION] Todos os prédios são válidos');
    return { valid: true, invalidIds: [] };
  };
  
  return { validateCartPanels };
};
