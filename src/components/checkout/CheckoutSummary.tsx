
import React from 'react';
import { motion } from 'framer-motion';
import { Calendar, Package, Tag, CheckCircle, Map, Users } from 'lucide-react';
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
  
  // Animation variants
  const itemVariants = {
    hidden: { opacity: 0, y: 5 },
    visible: (i: number) => ({ 
      opacity: 1, 
      y: 0, 
      transition: { delay: 0.1 * i, duration: 0.5 } 
    })
  };

  return (
    <Card className="sticky top-4 overflow-hidden">
      <CardHeader className="bg-gradient-to-r from-indexa-purple/10 to-indexa-mint/5 pb-4">
        <CardTitle className="text-lg flex items-center">
          <Package className="mr-2 h-5 w-5 text-indexa-purple" />
          Resumo do pedido
        </CardTitle>
      </CardHeader>
      <CardContent className="space-y-4 pt-5">
        <div className="space-y-3">
          <motion.div 
            className="flex justify-between text-sm"
            initial="hidden"
            animate="visible"
            custom={0}
            variants={itemVariants}
          >
            <div className="flex items-center">
              <Users className="h-4 w-4 mr-1.5 text-muted-foreground" />
              <span>Painéis:</span>
            </div>
            <span className="font-medium">{cartItems.length}</span>
          </motion.div>
          
          <motion.div 
            className="flex justify-between text-sm"
            initial="hidden"
            animate="visible"
            custom={1}
            variants={itemVariants}
          >
            <span>Plano:</span>
            <span className="font-medium">{plans[selectedPlan].months} {plans[selectedPlan].months === 1 ? 'mês' : 'meses'}</span>
          </motion.div>
          
          <motion.div 
            className="flex justify-between items-center text-sm"
            initial="hidden"
            animate="visible"
            custom={2}
            variants={itemVariants}
          >
            <div className="flex items-center">
              <Calendar className="mr-2 h-4 w-4 text-muted-foreground" />
              <span>Período:</span>
            </div>
            <span className="text-right font-medium">
              {formatDate(startDate)} a {formatDate(endDate)}
            </span>
          </motion.div>
          
          <motion.div 
            className="flex justify-between items-center text-sm"
            initial="hidden"
            animate="visible"
            custom={3}
            variants={itemVariants}
          >
            <div className="flex items-center">
              <Map className="mr-2 h-4 w-4 text-muted-foreground" />
              <span>Localização:</span>
            </div>
            <span className="text-right text-xs max-w-[150px] truncate">
              {cartItems.length > 0 && cartItems[0].panel.buildings?.bairro}
              {cartItems.length > 1 && <span> + {cartItems.length - 1}</span>}
            </span>
          </motion.div>
        </div>
        
        <Separator className="my-1" />
        
        {/* Extras included with plan */}
        {plans[selectedPlan].extras.length > 0 && (
          <motion.div 
            className="space-y-2"
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            transition={{ delay: 0.5, duration: 0.5 }}
          >
            <h4 className="text-sm font-medium">Incluso no plano:</h4>
            <ul className="space-y-1.5">
              {plans[selectedPlan].extras.map((extra, index) => (
                <motion.li 
                  key={index}
                  className="text-sm flex items-start"
                  initial={{ opacity: 0, x: -10 }}
                  animate={{ opacity: 1, x: 0 }}
                  transition={{ delay: 0.5 + (index * 0.1), duration: 0.3 }}
                >
                  <CheckCircle className="h-4 w-4 mr-2 text-green-500 flex-shrink-0 mt-0.5" />
                  <span>{extra}</span>
                </motion.li>
              ))}
            </ul>
            <Separator className="my-1" />
          </motion.div>
        )}
        
        {/* Price breakdown */}
        <div className="space-y-2 pt-1">
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
        
        <Separator className="my-1" />
        
        <motion.div 
          className="flex justify-between font-semibold"
          initial={{ scale: 0.95, opacity: 0 }}
          animate={{ scale: 1, opacity: 1 }}
          transition={{ delay: 0.7, duration: 0.5 }}
        >
          <span>Total:</span>
          <span className="text-xl text-indexa-purple">{formatCurrency(calculateTotal())}</span>
        </motion.div>
      </CardContent>
      <CardFooter className="flex flex-col space-y-2 bg-gradient-to-r from-indexa-purple/5 to-indexa-mint/5 pt-4">
        <Badge className="justify-center w-full py-1.5 bg-indexa-purple hover:bg-indexa-purple-dark">
          {plans[selectedPlan].discount > 0 ? 
            `Economize ${plans[selectedPlan].discount}% no plano de ${plans[selectedPlan].months} meses` : 
            'Plano mensal padrão'}
        </Badge>
        <div className="w-full text-center text-xs text-muted-foreground mt-1">
          🛡️ Garantia de exibição ou seu dinheiro de volta
        </div>
      </CardFooter>
    </Card>
  );
};

export default CheckoutSummary;
