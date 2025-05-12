
import { Panel } from "@/types/panel";
import { Card, CardContent, CardFooter, CardHeader, CardTitle } from "@/components/ui/card";
import { Separator } from "@/components/ui/separator";
import { Badge } from "@/components/ui/badge";
import { ShoppingCart, Calendar, Ticket, Gift } from "lucide-react";
import { motion } from "framer-motion";

interface CheckoutSummaryProps {
  cartItems: { panel: Panel; duration: number }[];
  selectedPlan: 1 | 3 | 6 | 12;
  plans: {
    [key: number]: {
      months: number;
      pricePerMonth: number;
      discount: number;
      extras: string[];
    };
  };
  couponDiscount: number;
  startDate: Date;
  endDate: Date;
}

const CheckoutSummary = ({
  cartItems,
  selectedPlan,
  plans,
  couponDiscount,
  startDate,
  endDate,
}: CheckoutSummaryProps) => {
  // Format dates
  const formatDate = (date: Date) => {
    return new Intl.DateTimeFormat("pt-BR", {
      year: "numeric",
      month: "long",
      day: "numeric",
    }).format(date);
  };

  // Format currency
  const formatCurrency = (value: number) => {
    return new Intl.NumberFormat("pt-BR", {
      style: "currency",
      currency: "BRL",
    }).format(value);
  };

  // Calculate base price (without plan discount)
  const calculateBasePrice = () => {
    return cartItems.length * plans[selectedPlan].pricePerMonth * plans[selectedPlan].months;
  };

  // Calculate plan discount amount
  const calculatePlanDiscount = () => {
    const basePrice = calculateBasePrice();
    return (basePrice * plans[selectedPlan].discount) / 100;
  };

  // Calculate coupon discount amount
  const calculateCouponDiscount = () => {
    const priceAfterPlanDiscount = calculateBasePrice() - calculatePlanDiscount();
    return (priceAfterPlanDiscount * couponDiscount) / 100;
  };

  // Calculate final price
  const calculateFinalPrice = () => {
    return calculateBasePrice() - calculatePlanDiscount() - calculateCouponDiscount();
  };

  return (
    <Card className="overflow-hidden border-indexa-purple/10 shadow-lg">
      <CardHeader className="bg-indexa-purple bg-opacity-5 pb-3">
        <CardTitle className="flex items-center text-lg">
          <ShoppingCart className="mr-2 h-5 w-5 text-indexa-purple" />
          Resumo do Pedido
        </CardTitle>
      </CardHeader>
      <CardContent className="p-5 space-y-5">
        {/* Items summary */}
        <div className="space-y-3">
          <div className="flex items-center justify-between text-sm font-medium">
            <span>Painéis:</span>
            <span>{cartItems.length} {cartItems.length === 1 ? "item" : "itens"}</span>
          </div>
          
          {cartItems.map((item, index) => (
            <motion.div 
              key={item.panel.id}
              initial={{ opacity: 0, y: 10 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ delay: index * 0.1, duration: 0.3 }}
              className="bg-gray-50 p-3 rounded-md text-sm"
            >
              <div className="font-medium mb-1">{item.panel.buildings?.nome}</div>
              <div className="text-gray-600 text-xs flex justify-between items-center">
                <span>{item.panel.buildings?.bairro}</span>
                <Badge variant="outline" className="bg-white">
                  {item.duration} dias
                </Badge>
              </div>
            </motion.div>
          ))}
        </div>
        
        {/* Plan details */}
        <div className="space-y-3">
          <div className="flex items-center justify-between text-sm font-medium">
            <span className="flex items-center">
              <Calendar className="mr-1.5 h-4 w-4 text-indexa-purple" /> Plano selecionado:
            </span>
            <Badge className="bg-indexa-purple">
              {selectedPlan === 1 ? "Mensal" : `${selectedPlan} meses`}
            </Badge>
          </div>
          
          <div className="bg-gray-50 p-3 rounded-md text-sm">
            <div className="flex justify-between items-center mb-2">
              <span>Valor mensal:</span>
              <span className="font-medium">{formatCurrency(plans[selectedPlan].pricePerMonth)}</span>
            </div>
            
            <div className="flex justify-between items-center mb-2 text-xs text-gray-600">
              <span>Período total:</span>
              <span>{plans[selectedPlan].months} {plans[selectedPlan].months === 1 ? "mês" : "meses"}</span>
            </div>
            
            {plans[selectedPlan].extras.length > 0 && (
              <div className="mt-2 pt-2 border-t border-gray-200">
                <div className="flex items-center text-xs text-green-600 mb-1.5">
                  <Gift className="h-3.5 w-3.5 mr-1" /> Benefícios inclusos:
                </div>
                <ul className="list-disc list-inside text-xs text-gray-600 space-y-1 pl-1">
                  {plans[selectedPlan].extras.map((extra, idx) => (
                    <li key={idx}>{extra}</li>
                  ))}
                </ul>
              </div>
            )}
          </div>
        </div>
        
        {/* Campaign dates */}
        <div className="space-y-3">
          <div className="flex items-center justify-between text-sm font-medium">
            <span className="flex items-center">
              <Calendar className="mr-1.5 h-4 w-4 text-indexa-purple" /> Período da campanha:
            </span>
          </div>
          
          <div className="bg-gray-50 p-3 rounded-md text-sm space-y-2">
            <div className="flex justify-between items-center">
              <span>Início:</span>
              <span className="font-medium">{formatDate(startDate)}</span>
            </div>
            
            <div className="flex justify-between items-center">
              <span>Término:</span>
              <span className="font-medium">{formatDate(endDate)}</span>
            </div>
          </div>
        </div>
        
        {/* Coupon */}
        {couponDiscount > 0 && (
          <div className="bg-green-50 p-3 rounded-md">
            <div className="flex items-center text-green-700 mb-1">
              <Ticket className="h-4 w-4 mr-1.5" /> Cupom aplicado
            </div>
            <div className="flex justify-between text-sm">
              <span className="text-green-700">Desconto:</span>
              <span className="font-medium text-green-700">
                {couponDiscount}% ({formatCurrency(calculateCouponDiscount())})
              </span>
            </div>
          </div>
        )}
      </CardContent>
      
      {/* Totals */}
      <CardFooter className="bg-gray-50 p-5 flex-col">
        <div className="w-full space-y-2">
          <div className="flex justify-between text-sm">
            <span>Subtotal:</span>
            <span>{formatCurrency(calculateBasePrice())}</span>
          </div>
          
          {plans[selectedPlan].discount > 0 && (
            <div className="flex justify-between text-sm text-green-600">
              <span>Desconto do plano:</span>
              <span>- {formatCurrency(calculatePlanDiscount())} ({plans[selectedPlan].discount}%)</span>
            </div>
          )}
          
          {couponDiscount > 0 && (
            <div className="flex justify-between text-sm text-green-600">
              <span>Desconto do cupom:</span>
              <span>- {formatCurrency(calculateCouponDiscount())} ({couponDiscount}%)</span>
            </div>
          )}
          
          <Separator className="my-2" />
          
          <div className="flex justify-between text-lg font-bold">
            <span>Total:</span>
            <span className="text-indexa-purple">{formatCurrency(calculateFinalPrice())}</span>
          </div>
          
          <div className="text-xs text-gray-500 text-center mt-2">
            Pagamento único ({selectedPlan === 1 ? "mensal" : `a cada ${selectedPlan} meses`})
          </div>
        </div>
      </CardFooter>
    </Card>
  );
};

export default CheckoutSummary;
