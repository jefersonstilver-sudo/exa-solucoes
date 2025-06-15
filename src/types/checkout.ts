
export interface Plan {
  id: number;
  name: string;
  description?: string;
  duration: string; // Add duration property
  months: number;
  discount: number;
  price: number;
  popular?: boolean; // Change to optional
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
