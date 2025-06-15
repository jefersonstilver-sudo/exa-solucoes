
export async function fetchUserData(supabase: any, userId: string): Promise<{ email: string }> {
  const { data: userData, error: userError } = await supabase
    .from('users')
    .select('email')
    .eq('id', userId)
    .single();
    
  if (userError) {
    throw new Error(`Erro ao buscar dados do usuário: ${userError.message}`);
  }
  
  return userData;
}

export async function updatePedidoWithPayment(
  supabase: any,
  pedidoId: string,
  totalAmount: number,
  correctedTotalAmount: number,
  preferenceId: string,
  initPoint: string,
  paymentMethod: string,
  cartItems: any[],
  paymentKey: string,
  idempotencyKey: string
): Promise<void> {
  const { error: updateError } = await supabase
    .from('pedidos')
    .update({
      log_pagamento: {
        original_total_amount: totalAmount,
        corrected_total_amount: correctedTotalAmount,
        payment_preference_id: preferenceId,
        payment_init_point: initPoint,
        payment_status: 'pending',
        payment_method: paymentMethod,
        items_count: cartItems.length,
        payment_key: paymentKey,
        idempotency_key: idempotencyKey,
        anti_duplicate_processed: true,
        test: true,
        timestamp: new Date().toISOString()
      }
    })
    .eq('id', pedidoId);
    
  if (updateError) {
    throw new Error(`Erro ao atualizar pedido: ${updateError.message}`);
  }
}
