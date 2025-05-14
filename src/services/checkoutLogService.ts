
import { logCheckoutEvent, LogLevel, CheckoutEvent } from '@/services/checkoutDebugService';

/**
 * Log checkout process initiation
 */
export const logCheckoutInitiation = (cartItemsLength: number, isProcessed: boolean) => {
  logCheckoutEvent(
    CheckoutEvent.AUDIT,
    LogLevel.INFO,
    "Início do processo de checkout",
    { cartItems: cartItemsLength, isProcessed }
  );
};

/**
 * Log empty cart attempt
 */
export const logEmptyCartAttempt = () => {
  logCheckoutEvent(
    CheckoutEvent.PROCEED_TO_CHECKOUT, 
    LogLevel.ERROR, 
    "Tentativa de checkout com carrinho vazio"
  );
};

/**
 * Log checkout start with cart items count
 */
export const logCheckoutStart = (cartItemsLength: number) => {
  logCheckoutEvent(
    CheckoutEvent.PROCEED_TO_CHECKOUT, 
    LogLevel.INFO, 
    `Iniciando checkout com ${cartItemsLength} itens`
  );
};

/**
 * Log navigation to plan selection
 */
export const logPlanSelectionNavigation = () => {
  logCheckoutEvent(
    CheckoutEvent.NAVIGATE_TO_PLAN, 
    LogLevel.INFO, 
    `Navegação para seleção de plano iniciada`
  );
};

/**
 * Log checkout error
 */
export const logCheckoutError = (error: unknown) => {
  logCheckoutEvent(
    CheckoutEvent.PROCEED_TO_CHECKOUT, 
    LogLevel.ERROR, 
    "Erro durante processo de checkout", 
    { error: String(error) }
  );
};

/**
 * Log multiple checkout attempts warning
 */
export const logMultipleCheckoutAttempt = () => {
  logCheckoutEvent(
    CheckoutEvent.DEBUG_EVENT,
    LogLevel.WARNING,
    "Tentativa de checkout múltiplo bloqueada"
  );
};
