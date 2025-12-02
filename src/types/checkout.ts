
// Payment method types for the checkout
export type PaymentMethodType = 
  | 'pix_avista'        // PIX with 5% discount, single payment
  | 'pix_fidelidade'    // PIX monthly with contract
  | 'boleto_fidelidade' // Boleto monthly with contract
  | 'credit_card';      // Credit card, single payment

// Fidelity data interface
export interface FidelidadeData {
  diaVencimento: 5 | 10 | 15;
  termoAceito: boolean;
  termoAceitoEm?: Date;
  paymentMethod: 'pix_fidelidade' | 'boleto_fidelidade';
}

export interface Plan {
  id: number;
  name: string;
  description?: string;
  months: number;
  discount: number;
  price: number;
  mostPopular?: boolean;
  pricePerMonth?: number;
  extras?: string[];
  
  // New fields needed for PlanSelector and CheckoutSummary
  color?: string;
  tag?: string;
  videosPerMonth?: number;
  productionIncluded?: boolean;
  studioUse?: boolean;
  additionalProduction?: {
    available: boolean;
    price: number;
  };
  // For backward compatibility with existing code
  extendedDisplay?: boolean;
  corporateBonus?: boolean;
}

export type PlanKey = 1 | 3 | 6 | 12;

export interface CheckoutSteps {
  PLAN: number;
  REVIEW: number;
  COUPON: number;
  PAYMENT: number;
  UPLOAD: number;
}
