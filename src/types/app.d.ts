
// Declarações de tipos para o Mercado Pago
declare global {
  interface Window {
    MercadoPago: any;
  }
}

export interface Panel {
  id: string;
  code?: string;
  building_id?: string;
  status?: string;
  ultima_sync?: string;
  resolucao?: string;
  modo?: string;
  buildings?: {
    id: string;
    nome: string;
    endereco: string;
    bairro: string;
    latitude: number;
    longitude: number;
    status: string;
    imageUrl?: string;
  };
}

// Tipos para o checkout
export type PlanKey = 1 | 3 | 6 | 12;

export interface Plan {
  id: PlanKey;
  title: string;
  monthlyPrice: number;
  description: string;
  features: string[];
  mostPopular?: boolean;
  discountPercent?: number;
  originalPrice?: number;
  duration: number;
}

export enum CheckoutSteps {
  PLAN = 0,
  REVIEW = 1,
  COUPON = 2,
  PAYMENT = 3
}
