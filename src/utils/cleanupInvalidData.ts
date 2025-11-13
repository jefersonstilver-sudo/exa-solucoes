import { supabase } from '@/integrations/supabase/client';

/**
 * Clean all cart-related localStorage entries
 */
export const cleanupInvalidCart = () => {
  const keysToRemove = [
    'simple_cart',
    'checkout_cart', 
    'panelCart',
    'indexa_unified_cart',
    'selectedPlan',
    'checkout_plan',
    'checkout_coupon'
  ];
  
  keysToRemove.forEach(key => {
    localStorage.removeItem(key);
    console.log(`🧹 [CLEANUP] Removido: ${key}`);
  });
  
  console.log('✅ [CLEANUP] Carrinho limpo com sucesso');
};

/**
 * Get all valid panels from database
 */
export const getValidPanels = async () => {
  const { data: panels, error } = await supabase
    .from('painels')
    .select('id, building_id, buildings!inner(id, nome, preco_base, status)')
    .eq('buildings.status', 'ativo');
  
  if (error) {
    console.error('❌ [CLEANUP] Erro ao buscar painéis:', error);
    return [];
  }
  
  console.log(`✅ [CLEANUP] ${panels?.length || 0} painéis válidos encontrados`);
  return panels || [];
};

/**
 * Validate cart panels against database
 * Returns array of invalid panel IDs
 */
export const validateCartPanels = async (cartPanelIds: string[]) => {
  if (!cartPanelIds || cartPanelIds.length === 0) {
    return { valid: [], invalid: [] };
  }

  const { data: validPanels, error } = await supabase
    .from('painels')
    .select('id')
    .in('id', cartPanelIds);

  if (error) {
    console.error('❌ [CLEANUP] Erro ao validar painéis do carrinho:', error);
    return { valid: [], invalid: cartPanelIds };
  }

  const validIds = validPanels?.map(p => p.id) || [];
  const invalidIds = cartPanelIds.filter(id => !validIds.includes(id));

  console.log('🔍 [CLEANUP] Validação do carrinho:', {
    total: cartPanelIds.length,
    valid: validIds.length,
    invalid: invalidIds.length,
    invalidIds
  });

  return { valid: validIds, invalid: invalidIds };
};
