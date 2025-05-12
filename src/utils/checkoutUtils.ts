
import { calculatePriceWithDiscount } from '@/utils/priceUtils';
import { PLANS } from '@/constants/checkoutConstants';

// Calculate total price for the whole order
export const calculateTotalPrice = (
  selectedPlan: 1 | 3 | 6 | 12, 
  cartItemsCount: number, 
  couponDiscount: number, 
  couponValid: boolean
) => {
  // Set the proper monthly price based on the selected plan
  const pricePerMonth = PLANS[selectedPlan].pricePerMonth;
  const totalMonths = PLANS[selectedPlan].months;
  
  // Base price calculation
  let totalPrice = pricePerMonth * totalMonths * cartItemsCount;
  
  // Apply plan discount
  if (PLANS[selectedPlan].discount > 0) {
    totalPrice = calculatePriceWithDiscount(totalPrice, PLANS[selectedPlan].discount);
  }
  
  // Apply coupon discount if valid
  if (couponValid && couponDiscount > 0) {
    totalPrice = calculatePriceWithDiscount(totalPrice, couponDiscount);
  }
  
  return totalPrice;
};
