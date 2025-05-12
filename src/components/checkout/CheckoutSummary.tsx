
import React from 'react';
import { Calendar, Package, Tag, CheckCircle } from 'lucide-react';
import { Card, CardContent, CardFooter, CardHeader, CardTitle } from '@/components/ui/card';
import { Separator } from '@/components/ui/separator';
import { Badge } from '@/components/ui/badge';
import { Panel } from '@/types/panel';
import { formatDate, formatCurrency } from '@/utils/formatters';

interface CheckoutSummaryProps {
  cartItems: { panel: Panel, duration: number }[];
  selectedPlan: 1 | 3 | 6 | 12;
  plans: Record<number, {
    months: number;
    pricePerMonth: number;
    discount: number;
    extras: string[];
  }>;
  couponDiscount: number;
  startDate: Date;
  endDate: Date;
}

const CheckoutSummary: React.FC<CheckoutSummaryProps> = ({
  cartItems,
  selectedPlan,
  plans,
  couponDiscount,
  startDate,
  endDate
}) => {
  // Calculate subtotal before any discounts
  const calculateSubtotal = () => {
    const basePricePerMonth = plans[1].pricePerMonth; // Use the 1-month price as base
    return basePricePerMonth * plans[selectedPlan].months * cartItems.length;
  };
  
  // Calculate plan discount
  const calculatePlanDiscount = () => {
    const basePricePerMonth = plans[1].pricePerMonth; // Use the 1-month price as base
    const discountedPricePerMonth = plans[selectedPlan].pricePerMonth;
    return (basePricePerMonth - discountedPricePerMonth) * plans[selectedPlan].months * cartItems.length;
  };
  
  // Calculate coupon discount
  const calculateCouponDiscount = () => {
    if (couponDiscount <= 0) return 0;
    
    // Apply coupon discount after plan discount
    const afterPlanDiscount = calculateSubtotal() - calculatePlanDiscount();
    return afterPlanDiscount * (couponDiscount / 100);
  };
  
  // Calculate final price
  const calculateTotal = () => {
    return calculateSubtotal() - calculatePlanDiscount() - calculateCouponDiscount();
  };

  return (
    <Card className="sticky top-4">
      <CardHeader>
        <CardTitle className="text-lg flex items-center">
          <Package className="mr-2 h-5 w-5 text-indexa-purple" />
          Resumo do pedido
        </CardTitle>
      </CardHeader>
      <CardContent className="space-y-4">
        <div className="space-y-2">
          <div className="flex justify-between text-sm">
            <span>Painéis:</span>
            <span>{cartItems.length}</span>
          </div>
          
          <div className="flex justify-between text-sm">
            <span>Plano:</span>
            <span>{plans[selectedPlan].months} {plans[selectedPlan].months === 1 ? 'mês' : 'meses'}</span>
          </div>
          
          <div className="flex justify-between items-center text-sm">
            <div className="flex items-center">
              <Calendar className="mr-2 h-4 w-4 text-muted-foreground" />
              <span>Período:</span>
            </div>
            <span className="text-right">
              {formatDate(startDate)} a {formatDate(endDate)}
            </span>
          </div>
        </div>
        
        <Separator />
        
        {/* Extras included with plan */}
        {plans[selectedPlan].extras.length > 0 && (
          <div className="space-y-2">
            <h4 className="text-sm font-medium">Incluso no plano:</h4>
            <ul className="space-y-1">
              {plans[selectedPlan].extras.map((extra, index) => (
                <li key={index} className="text-sm flex items-start">
                  <CheckCircle className="h-4 w-4 mr-2 text-green-500 flex-shrink-0 mt-0.5" />
                  <span>{extra}</span>
                </li>
              ))}
            </ul>
            <Separator />
          </div>
        )}
        
        {/* Price breakdown */}
        <div className="space-y-2">
          <div className="flex justify-between text-sm">
            <span>Subtotal:</span>
            <span>{formatCurrency(calculateSubtotal())}</span>
          </div>
          
          {calculatePlanDiscount() > 0 && (
            <div className="flex justify-between text-sm text-green-600">
              <span className="flex items-center">
                <Tag className="mr-1 h-4 w-4" />
                Desconto do plano:
              </span>
              <span>-{formatCurrency(calculatePlanDiscount())}</span>
            </div>
          )}
          
          {couponDiscount > 0 && (
            <div className="flex justify-between text-sm text-green-600">
              <span className="flex items-center">
                <Tag className="mr-1 h-4 w-4" />
                Desconto do cupom:
              </span>
              <span>-{formatCurrency(calculateCouponDiscount())}</span>
            </div>
          )}
        </div>
        
        <Separator />
        
        <div className="flex justify-between font-semibold">
          <span>Total:</span>
          <span className="text-xl">{formatCurrency(calculateTotal())}</span>
        </div>
      </CardContent>
      <CardFooter className="flex flex-col space-y-2">
        <Badge className="justify-center w-full py-1.5 bg-indexa-purple hover:bg-indexa-purple-dark">
          {plans[selectedPlan].discount > 0 ? 
            `Economize ${plans[selectedPlan].discount}% no plano de ${plans[selectedPlan].months} meses` : 
            'Plano mensal padrão'}
        </Badge>
      </CardFooter>
    </Card>
  );
};

export default CheckoutSummary;
