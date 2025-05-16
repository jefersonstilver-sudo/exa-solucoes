
export type PlanKey = 1 | 3 | 6 | 12;

export interface Plan {
  id: number;
  name: string;
  discount: number;
  subtitle: string;
  price: string;
  totalMonths: number;
  description: string;
  months: number;
  mostPopular: boolean;
  pricePerMonth: number;
  extras: string[];
  color?: string;
}
