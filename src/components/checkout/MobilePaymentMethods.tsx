
import React from 'react';
import { motion } from 'framer-motion';
import { CreditCard, Smartphone, Zap, ChevronRight } from 'lucide-react';
import { Card, CardContent } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { cn } from '@/lib/utils';

interface PaymentMethod {
  id: string;
  title: string;
  description: string;
  icon: React.ComponentType<{ className?: string }>;
  originalAmount?: number;
  finalAmount: number;
  discount?: number;
  highlight?: boolean;
  installments?: string;
}

interface MobilePaymentMethodsProps {
  selectedMethod: string;
  onSelectMethod: (methodId: string) => void;
  totalAmount: number;
}

const MobilePaymentMethods = ({ selectedMethod, onSelectMethod, totalAmount }: MobilePaymentMethodsProps) => {
  const pixAmount = totalAmount * 0.95; // 5% discount

  const methods: PaymentMethod[] = [
    {
      id: 'pix',
      title: 'PIX',
      description: 'Pagamento instantâneo',
      icon: Smartphone,
      originalAmount: totalAmount,
      finalAmount: pixAmount,
      discount: 5,
      highlight: true
    },
    {
      id: 'credit_card',
      title: 'Cartão de Crédito',
      description: 'Visa, Mastercard, Elo',
      icon: CreditCard,
      finalAmount: totalAmount,
      installments: 'até 12x sem juros'
    }
  ];

  return (
    <div className="space-y-3">
      <h3 className="text-lg font-semibold text-gray-900 mb-4">
        Como você quer pagar?
      </h3>
      
      {methods.map((method) => {
        const Icon = method.icon;
        const isSelected = selectedMethod === method.id;
        
        return (
          <motion.div
            key={method.id}
            whileTap={{ scale: 0.98 }}
            transition={{ duration: 0.1 }}
          >
            <Card
              className={cn(
                "cursor-pointer transition-all duration-200 touch-manipulation",
                "min-h-[80px]", // Ensure touch-friendly height
                isSelected && "ring-2 ring-indexa-purple border-indexa-purple",
                method.highlight && "ring-1 ring-green-500 border-green-200"
              )}
              onClick={() => onSelectMethod(method.id)}
            >
              <CardContent className="p-4">
                <div className="flex items-center justify-between">
                  <div className="flex items-center space-x-3">
                    {/* Icon */}
                    <div className={cn(
                      "w-12 h-12 rounded-full flex items-center justify-center",
                      method.id === 'pix' && "bg-green-100",
                      method.id === 'credit_card' && "bg-blue-100"
                    )}>
                      <Icon className={cn(
                        "h-6 w-6",
                        method.id === 'pix' && "text-green-600",
                        method.id === 'credit_card' && "text-blue-600"
                      )} />
                    </div>
                    
                    {/* Method Info */}
                    <div className="flex-1">
                      <div className="flex items-center space-x-2">
                        <h4 className="font-semibold text-gray-900">{method.title}</h4>
                        {method.highlight && (
                          <Badge className="bg-green-100 text-green-800 text-xs">
                            <Zap className="h-3 w-3 mr-1" />
                            Recomendado
                          </Badge>
                        )}
                      </div>
                      
                      <p className="text-sm text-gray-600 mt-1">{method.description}</p>
                      
                      {method.installments && (
                        <p className="text-xs text-gray-500 mt-1">{method.installments}</p>
                      )}
                    </div>
                  </div>
                  
                  {/* Price and Selection */}
                  <div className="flex items-center space-x-3">
                    <div className="text-right">
                      {method.discount && method.originalAmount && (
                        <div className="text-xs text-gray-500 line-through">
                          R$ {method.originalAmount.toFixed(2)}
                        </div>
                      )}
                      <div className="font-bold text-gray-900">
                        R$ {method.finalAmount.toFixed(2)}
                      </div>
                      {method.discount && (
                        <div className="text-xs text-green-600 font-medium">
                          -{method.discount}% OFF
                        </div>
                      )}
                    </div>
                    
                    {/* Selection Indicator */}
                    <div className={cn(
                      "w-6 h-6 rounded-full border-2 flex items-center justify-center transition-colors",
                      isSelected 
                        ? "border-indexa-purple bg-indexa-purple" 
                        : "border-gray-300"
                    )}>
                      {isSelected && (
                        <motion.div
                          initial={{ scale: 0 }}
                          animate={{ scale: 1 }}
                          className="w-2 h-2 bg-white rounded-full"
                        />
                      )}
                    </div>
                  </div>
                </div>
              </CardContent>
            </Card>
          </motion.div>
        );
      })}
      
      {/* Security Note */}
      <div className="bg-gray-50 rounded-lg p-3 mt-4">
        <div className="flex items-center space-x-2 text-sm text-gray-600">
          <div className="w-4 h-4 bg-green-500 rounded-full flex items-center justify-center">
            <div className="w-2 h-2 bg-white rounded-full"></div>
          </div>
          <span>Pagamento 100% seguro via MercadoPago</span>
        </div>
      </div>
    </div>
  );
};

export default MobilePaymentMethods;
