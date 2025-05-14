
export interface Plan {
  id: number;
  name: string;
  description: string;
  months: number;
  discount: number;
  mostPopular: boolean;
  pricePerMonth: number;
  extras: string[];
}

export type PlanKey = 1 | 3 | 6 | 12;

export interface CheckoutSteps {
  REVIEW: number;
  PLAN: number;
  COUPON: number;
  PAYMENT: number;
}
