
import { PaymentRequestData } from './types.ts';

export function validatePedidoId(pedidoId: string): void {
  const validUuidPattern = /^[0-9a-f]{8}-[0-9a-f]{4}-[1-5][0-9a-f]{3}-[89ab][0-9a-f]{3}-[0-9a-f]{12}$/i;
  if (!pedidoId || typeof pedidoId !== 'string' || !pedidoId.match(validUuidPattern)) {
    throw new Error(`ID de pedido inválido: ${pedidoId}`);
  }
}

export function validatePaymentData(data: PaymentRequestData): void {
  const { pedido_id: pedidoId, total_amount: totalAmount, cart_items: cartItems, user_id: userId } = data;
  
  validatePedidoId(pedidoId);
  
  if (!totalAmount || totalAmount <= 0) {
    throw new Error(`Valor total inválido: ${totalAmount}`);
  }
  
  if (!cartItems || !Array.isArray(cartItems) || cartItems.length === 0) {
    throw new Error("Nenhum painel válido encontrado no carrinho");
  }
  
  if (!userId) {
    throw new Error("ID do usuário é obrigatório");
  }
}
