import React from 'react';
import { motion } from 'framer-motion';
import { Card } from '@/components/ui/card';
import { Zap, CalendarCheck, FileText, CreditCard, Check, Shield } from 'lucide-react';
import { formatCurrency } from '@/utils/priceUtils';
import { cn } from '@/lib/utils';

export type PaymentMethodType = 'pix_avista' | 'pix_fidelidade' | 'boleto_fidelidade' | 'credit_card';

interface PaymentMethodSelectorProps {
  selectedMethod: PaymentMethodType;
  onMethodChange: (method: PaymentMethodType) => void;
  totalAmount: number;
  selectedPlan: number;
  couponCode?: string;
}

const PaymentMethodSelector: React.FC<PaymentMethodSelectorProps> = ({
  selectedMethod,
  onMethodChange,
  totalAmount,
  selectedPlan,
  couponCode
}) => {
  // Cupom teste especial
  const isCupom573040 = couponCode === '573040';
  
  // Calcular valores
  const pixDiscount = 0.10; // 10% desconto PIX à vista
  const pixAvistaAmount = isCupom573040 ? 0.05 : totalAmount * (1 - pixDiscount);
  const monthlyAmount = totalAmount / selectedPlan;
  
  // Plano de 1 mês = apenas PIX à vista e Cartão
  const is1MonthPlan = selectedPlan === 1;
  
  const paymentOptions = [
    {
      id: 'pix_avista' as PaymentMethodType,
      title: 'PIX à Vista',
      subtitle: 'Pagamento instantâneo',
      icon: Zap,
      iconBg: 'bg-emerald-100',
      iconColor: 'text-emerald-600',
      mainValue: pixAvistaAmount,
      originalValue: isCupom573040 ? null : totalAmount,
      badge: '-5% OFF',
      badgeColor: 'bg-emerald-500',
      description: 'Desconto aplicado automaticamente',
      available: true
    },
    {
      id: 'pix_fidelidade' as PaymentMethodType,
      title: 'PIX Fidelidade',
      subtitle: `${selectedPlan}x parcelas mensais`,
      icon: CalendarCheck,
      iconBg: 'bg-blue-100',
      iconColor: 'text-blue-600',
      mainValue: monthlyAmount,
      isMonthly: true,
      totalValue: totalAmount,
      badge: 'Contrato',
      badgeColor: 'bg-blue-500',
      description: 'Parcelas via PIX todo mês',
      available: !is1MonthPlan
    },
    {
      id: 'boleto_fidelidade' as PaymentMethodType,
      title: 'Boleto Fidelidade',
      subtitle: `${selectedPlan}x parcelas mensais`,
      icon: FileText,
      iconBg: 'bg-violet-100',
      iconColor: 'text-violet-600',
      mainValue: monthlyAmount,
      isMonthly: true,
      totalValue: totalAmount,
      badge: 'Contrato',
      badgeColor: 'bg-violet-500',
      description: 'Boletos enviados por email',
      available: !is1MonthPlan
    },
    {
      id: 'credit_card' as PaymentMethodType,
      title: 'Cartão de Crédito',
      subtitle: 'Pagamento único',
      icon: CreditCard,
      iconBg: 'bg-slate-100',
      iconColor: 'text-slate-600',
      mainValue: totalAmount,
      description: 'Visa, Mastercard, Elo, Amex',
      available: true
    }
  ];

  const availableOptions = paymentOptions.filter(opt => opt.available);

  return (
    <Card className="overflow-hidden border-0 shadow-xl rounded-2xl bg-white">
      {/* Header minimalista */}
      <div className="px-5 pt-5 pb-3">
        <h3 className="text-lg font-semibold text-gray-900">Forma de Pagamento</h3>
        <p className="text-sm text-gray-500 mt-0.5">Escolha como deseja pagar</p>
      </div>
      
      {/* Options */}
      <div className="px-4 pb-4 space-y-3">
        {availableOptions.map((option, index) => {
          const isSelected = selectedMethod === option.id;
          const Icon = option.icon;
          
          return (
            <motion.button
              key={option.id}
              initial={{ opacity: 0, y: 10 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ delay: index * 0.05 }}
              onClick={() => onMethodChange(option.id)}
              className={cn(
                "w-full p-4 rounded-xl border-2 transition-all duration-200 text-left",
                "hover:shadow-md hover:scale-[1.01]",
                isSelected 
                  ? "border-emerald-500 bg-emerald-50/50 shadow-lg shadow-emerald-500/10" 
                  : "border-gray-200 bg-white hover:border-gray-300"
              )}
            >
              <div className="flex items-start gap-4">
                {/* Icon */}
                <div className={cn(
                  "p-2.5 rounded-xl transition-colors",
                  isSelected ? "bg-emerald-500" : option.iconBg
                )}>
                  <Icon className={cn(
                    "h-5 w-5",
                    isSelected ? "text-white" : option.iconColor
                  )} />
                </div>
                
                {/* Content */}
                <div className="flex-1 min-w-0">
                  <div className="flex items-center gap-2 flex-wrap">
                    <span className={cn(
                      "font-semibold text-base",
                      isSelected ? "text-gray-900" : "text-gray-800"
                    )}>
                      {option.title}
                    </span>
                    {option.badge && (
                      <span className={cn(
                        "px-2 py-0.5 rounded-full text-xs font-medium text-white",
                        option.badgeColor
                      )}>
                        {option.badge}
                      </span>
                    )}
                  </div>
                  <p className="text-sm text-gray-500 mt-0.5">{option.subtitle}</p>
                </div>
                
                {/* Price */}
                <div className="text-right shrink-0">
                  {option.originalValue && (
                    <p className="text-sm text-gray-400 line-through">
                      {formatCurrency(option.originalValue)}
                    </p>
                  )}
                  <p className={cn(
                    "font-bold text-lg",
                    isSelected ? "text-emerald-600" : "text-gray-900"
                  )}>
                    {formatCurrency(option.mainValue)}
                    {option.isMonthly && <span className="text-sm font-normal text-gray-500">/mês</span>}
                  </p>
                  {option.totalValue && (
                    <p className="text-xs text-gray-500">
                      Total: {formatCurrency(option.totalValue)}
                    </p>
                  )}
                </div>
                
                {/* Check indicator */}
                <div className={cn(
                  "w-6 h-6 rounded-full border-2 flex items-center justify-center transition-all shrink-0 mt-0.5",
                  isSelected 
                    ? "border-emerald-500 bg-emerald-500" 
                    : "border-gray-300 bg-white"
                )}>
                  {isSelected && <Check className="h-4 w-4 text-white" />}
                </div>
              </div>
              
              {/* Description */}
              <p className={cn(
                "text-xs mt-2 ml-14",
                isSelected ? "text-emerald-700" : "text-gray-400"
              )}>
                {option.description}
              </p>
            </motion.button>
          );
        })}
      </div>
      
      {/* Security footer */}
      <div className="px-5 py-3 bg-gray-50 border-t border-gray-100">
        <div className="flex items-center justify-center gap-2 text-gray-500">
          <Shield className="h-4 w-4" />
          <span className="text-xs font-medium">Pagamento 100% seguro</span>
        </div>
      </div>
    </Card>
  );
};

export default PaymentMethodSelector;
