
export async function checkDuplicateProcessing(supabase: any, paymentKey: string, pedidoId: string): Promise<boolean> {
  console.log(`[ANTI-DUPLICATE] Checking for duplicate processing: ${paymentKey}`);
  
  const { data: existingPayment, error } = await supabase
    .from('pedidos')
    .select('id, log_pagamento')
    .eq('id', pedidoId)
    .single();
    
  if (error) {
    throw new Error(`Erro ao verificar pedido: ${error.message}`);
  }
  
  if (existingPayment?.log_pagamento?.payment_preference_id) {
    console.log(`[ANTI-DUPLICATE] Payment already processed for pedido: ${pedidoId}`);
    throw new Error('Pagamento já foi processado para este pedido');
  }
  
  return true;
}
