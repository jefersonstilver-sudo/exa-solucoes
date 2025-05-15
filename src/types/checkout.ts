
export interface Plan {
  id: number;
  name: string;
  description: string;
  months: number;
  discount: number;
  mostPopular: boolean;
  pricePerMonth: number;
  extras: string[];
  
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
  REVIEW: number;
  PLAN: number;
  COUPON: number;
  PAYMENT: number;
  UPLOAD: number;
}
