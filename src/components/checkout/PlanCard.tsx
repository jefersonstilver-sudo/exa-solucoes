import React, { useState, useEffect } from 'react';
import { motion } from 'framer-motion';
import { CheckCircle, Video, Gift, Building, X, Star, Crown, Zap } from 'lucide-react';
import { Card, CardContent, CardFooter } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Plan, PlanKey } from '@/types/checkout';
import { formatCurrency } from '@/utils/priceUtils';
import { Panel } from '@/types/panel';
import { logPriceCalculation } from '@/utils/auditLogger';
import { getPlanWithDynamicPricing } from '@/utils/checkoutUtils';

interface CartItem {
  panel: Panel;
  duration: number;
  price?: number;
}

interface PlanCardProps {
  plan: Plan;
  planKey: PlanKey;
  isSelected: boolean;
  onSelect: () => void;
  basePrice: number; // Add basePrice prop
  finalPrice: number; // Add finalPrice prop
  cartItems?: CartItem[]; // Make cartItems optional
  disabled?: boolean; // Add disabled prop
}

const PlanCard: React.FC<PlanCardProps> = ({
  plan,
  planKey,
  isSelected,
  onSelect,
  basePrice,
  finalPrice,
  cartItems = [], // Default to empty array
  disabled = false
}) => {
  const [isHovered, setIsHovered] = useState(false);
  const [dynamicPricing, setDynamicPricing] = useState<any>(null);
  
  // Calculate dynamic pricing based on basePrice and finalPrice passed as props
  useEffect(() => {
    if (basePrice > 0) {
      const dynamicPricePerMonth = finalPrice / planKey;
      const dynamicSavings = (basePrice * planKey) - finalPrice;
      
      setDynamicPricing({
        dynamicPricePerMonth,
        dynamicTotalPrice: finalPrice,
        dynamicSavings: dynamicSavings > 0 ? dynamicSavings : 0
      });
    }
  }, [basePrice, finalPrice, planKey]);
  
  // Definir cores e estilos específicos para cada plano
  const getPlanStyle = () => {
    switch (planKey) {
      case 1: // Mensal - Tornar menos atrativo
        return {
          border: isSelected ? 'border-gray-400 bg-gray-50' : 'border-gray-300 hover:border-gray-400 bg-gray-50',
          text: 'text-gray-600',
          header: 'bg-gray-300 text-gray-700',
          accent: 'text-gray-500',
          icon: X,
          iconColor: 'text-gray-400',
          restrictionBadge: 'bg-red-100 text-red-700',
          opacity: 'opacity-80'
        };
      case 3: // Trimestral - Mais Popular
        return {
          border: isSelected ? 'border-green-500 bg-green-50 ring-2 ring-green-200' : 'border-green-400 hover:border-green-500 bg-white hover:bg-green-50',
          text: 'text-green-800',
          header: 'bg-gradient-to-r from-green-500 to-green-600 text-white',
          accent: 'text-green-600',
          icon: Star,
          iconColor: 'text-green-500',
          popularBadge: 'bg-orange-500 text-white animate-pulse',
          glow: 'shadow-lg shadow-green-200'
        };
      case 6: // Semestral - Recomendado
        return {
          border: isSelected ? 'border-purple-500 bg-purple-50 ring-2 ring-purple-300' : 'border-purple-400 hover:border-purple-500 bg-white hover:bg-purple-50',
          text: 'text-purple-800',
          header: 'bg-gradient-to-r from-purple-600 to-purple-700 text-white',
          accent: 'text-purple-600',
          icon: Crown,
          iconColor: 'text-purple-500',
          recommendedBadge: 'bg-purple-600 text-white',
          glow: 'shadow-lg shadow-purple-200'
        };
      case 12: // Anual - Máxima Economia
        return {
          border: isSelected ? 'border-blue-500 bg-blue-50 ring-2 ring-blue-300' : 'border-blue-400 hover:border-blue-500 bg-white hover:bg-blue-50',
          text: 'text-blue-800',
          header: 'bg-gradient-to-r from-blue-600 to-blue-700 text-white',
          accent: 'text-blue-600',
          icon: Zap,
          iconColor: 'text-blue-500',
          maxEconomyBadge: 'bg-blue-600 text-white',
          glow: 'shadow-lg shadow-blue-200'
        };
      default:
        return {
          border: 'border-gray-300',
          text: 'text-gray-700',
          header: 'bg-gray-200 text-gray-700',
          accent: 'text-gray-600',
          icon: CheckCircle,
          iconColor: 'text-gray-500'
        };
    }
  };
  
  const style = getPlanStyle();
  const IconComponent = style.icon;

  // Show loading state if no pricing data
  if (!dynamicPricing && basePrice > 0) {
    return (
      <Card className="border-2 border-gray-200 bg-white">
        <CardContent className="p-4 sm:p-5 text-center">
          <div className="h-8 w-8 border-2 border-[#3C1361] border-t-transparent rounded-full animate-spin mx-auto mb-2"></div>
          <p className="text-gray-500 text-sm">
            Calculando preços...
          </p>
        </CardContent>
      </Card>
    );
  }

  // Show empty state if no base price
  if (basePrice === 0) {
    return (
      <Card className="border-2 border-gray-200 bg-gray-50 opacity-50">
        <CardContent className="p-4 sm:p-5 text-center">
          <p className="text-gray-500 text-sm">
            Adicione prédios ao carrinho para ver os preços
          </p>
        </CardContent>
      </Card>
    );
  }

  const { dynamicPricePerMonth, dynamicTotalPrice, dynamicSavings } = dynamicPricing;

  return (
    <motion.div
      variants={{
        hidden: { opacity: 0, y: 20 },
        visible: { opacity: 1, y: 0 }
      }}
      transition={{ duration: 0.4 }}
      whileHover={{ 
        scale: planKey === 1 ? 1 : 1.02,
        boxShadow: planKey === 1 ? 'none' : '0 10px 30px rgba(0, 0, 0, 0.1)' 
      }}
      onHoverStart={() => setIsHovered(true)}
      onHoverEnd={() => setIsHovered(false)}
      className={planKey === 1 ? style.opacity : ''}
    >
      <Card 
        className={`
          overflow-hidden transition-all cursor-pointer h-full flex flex-col border-2
          ${style.border}
          ${style.glow || ''}
          ${disabled ? 'opacity-50 cursor-not-allowed' : ''}
        `}
        onClick={disabled ? undefined : onSelect}
      >
        {/* Header Tags */}
        {planKey === 3 && (
          <div className={`${style.header} text-center py-2 text-sm font-bold tracking-wide`}>
            🔥 MAIS POPULAR 🔥
          </div>
        )}
        
        {planKey === 6 && (
          <div className={`${style.header} text-center py-2 text-sm font-bold tracking-wide`}>
            ✨ RECOMENDADO ✨
          </div>
        )}
        
        {planKey === 12 && (
          <div className={`${style.header} text-center py-2 text-sm font-bold tracking-wide`}>
            💎 MÁXIMA ECONOMIA 💎
          </div>
        )}

        {planKey === 1 && (
          <div className={`${style.header} text-center py-1.5 text-xs font-medium`}>
            Básico
          </div>
        )}
        
        <CardContent className="p-4 sm:p-5 flex-grow flex flex-col">
          {/* Plan Title with icon */}
          <div className="text-center mb-4">
            <div className="flex items-center justify-center gap-2 mb-2">
              <IconComponent className={`h-5 w-5 ${style.iconColor}`} />
              <h3 className={`text-lg sm:text-xl font-bold ${style.text}`}>
                {plan.name}
              </h3>
            </div>
            <p className="text-sm text-gray-500">
              {plan.description}
            </p>
          </div>
          
          {/* Dynamic Pricing */}
          <div className="text-center mb-4 sm:mb-6">
            <div className="flex justify-center items-baseline mb-2">
              <span className={`text-2xl sm:text-3xl font-bold ${planKey === 1 ? 'text-gray-600' : style.text}`}>
                {formatCurrency(dynamicPricePerMonth)}
              </span>
              <span className="text-gray-500 text-sm ml-1">/mês</span>
            </div>
            
            {/* Total Price on Hover/Selection */}
            {(isHovered || isSelected) && (
              <motion.div 
                initial={{ opacity: 0, y: -10 }}
                animate={{ opacity: 1, y: 0 }}
                className="bg-gray-50 py-2 px-3 rounded-lg shadow-sm border border-gray-100 mb-2"
              >
                <div className="text-sm font-medium text-gray-700">
                  Total: {formatCurrency(dynamicTotalPrice)}
                </div>
                {plan.months > 1 && (
                  <div className="text-xs text-gray-500">
                    ({plan.months} meses)
                  </div>
                )}
              </motion.div>
            )}
            
            {/* Discount Badge */}
            {plan.discount > 0 && (
              <div className="flex justify-center gap-2">
                <Badge className="bg-green-100 text-green-800 hover:bg-green-100 text-xs">
                  Economize {plan.discount}%
                </Badge>
                {dynamicSavings > 0 && (
                  <Badge variant="outline" className="text-xs">
                    -{formatCurrency(dynamicSavings)}
                  </Badge>
                )}
              </div>
            )}
          </div>
          
          {/* Features específicas para cada plano */}
          <div className="space-y-2 sm:space-y-3 mt-auto">
            {planKey === 1 && (
              <>
                <div className="flex items-start gap-2">
                  <X className="h-4 w-4 text-red-400 flex-shrink-0 mt-0.5" />
                  <span className="text-xs sm:text-sm text-gray-500 leading-tight">Sem vídeos inclusos</span>
                </div>
                <div className="flex items-start gap-2">
                  <X className="h-4 w-4 text-red-400 flex-shrink-0 mt-0.5" />
                  <span className="text-xs sm:text-sm text-gray-500 leading-tight">Sem benefícios extras</span>
                </div>
                <div className="flex items-start gap-2">
                  <CheckCircle className="h-4 w-4 text-gray-400 flex-shrink-0 mt-0.5" />
                  <span className="text-xs sm:text-sm text-gray-500 leading-tight">Apenas exibição básica</span>
                </div>
              </>
            )}

            {planKey === 3 && (
              <>
                <div className="flex items-start gap-2">
                  <Video className="h-4 w-4 text-green-500 flex-shrink-0 mt-0.5" />
                  <span className="text-xs sm:text-sm text-green-700 leading-tight font-medium">🎥 1 vídeo horizontal lettering de 15s por mês</span>
                </div>
                <div className="flex items-start gap-2">
                  <CheckCircle className="h-4 w-4 text-green-500 flex-shrink-0 mt-0.5" />
                  <span className="text-xs sm:text-sm text-green-700 leading-tight">Economize R$ 40/mês</span>
                </div>
                <div className="flex items-start gap-2">
                  <CheckCircle className="h-4 w-4 text-green-500 flex-shrink-0 mt-0.5" />
                  <span className="text-xs sm:text-sm text-green-700 leading-tight">Melhor custo-benefício</span>
                </div>
              </>
            )}

            {planKey === 6 && (
              <>
                <div className="flex items-start gap-2">
                  <Video className="h-4 w-4 text-purple-500 flex-shrink-0 mt-0.5" />
                  <span className="text-xs sm:text-sm text-purple-700 leading-tight font-medium">🎥 1 vídeo por mês</span>
                </div>
                <div className="flex items-start gap-2 bg-purple-100 p-2 rounded-lg">
                  <Building className="h-4 w-4 text-purple-600 flex-shrink-0 mt-0.5" />
                  <span className="text-xs sm:text-sm text-purple-800 leading-tight font-bold">🎬 1 aluguel GRÁTIS do estúdio avançado Indexa Mídia</span>
                </div>
                <div className="flex items-start gap-2">
                  <CheckCircle className="h-4 w-4 text-purple-500 flex-shrink-0 mt-0.5" />
                  <span className="text-xs sm:text-sm text-purple-700 leading-tight">Economize R$ 60/mês</span>
                </div>
              </>
            )}

            {planKey === 12 && (
              <>
                <div className="flex items-start gap-2">
                  <Video className="h-4 w-4 text-blue-500 flex-shrink-0 mt-0.5" />
                  <span className="text-xs sm:text-sm text-blue-700 leading-tight font-medium">🎥 1 vídeo por mês</span>
                </div>
                <div className="flex items-start gap-2 bg-blue-100 p-2 rounded-lg">
                  <Gift className="h-4 w-4 text-blue-600 flex-shrink-0 mt-0.5" />
                  <span className="text-xs sm:text-sm text-blue-800 leading-tight font-bold">🎬 1 vídeo cinematográfico de até 1 minuto GRÁTIS</span>
                </div>
                <div className="flex items-start gap-2">
                  <CheckCircle className="h-4 w-4 text-blue-500 flex-shrink-0 mt-0.5" />
                  <span className="text-xs sm:text-sm text-blue-700 leading-tight">Para usar nas redes sociais</span>
                </div>
                <div className="flex items-start gap-2">
                  <CheckCircle className="h-4 w-4 text-blue-500 flex-shrink-0 mt-0.5" />
                  <span className="text-xs sm:text-sm text-blue-700 leading-tight">Economize R$ 75/mês</span>
                </div>
              </>
            )}
          </div>
        </CardContent>
        
        <CardFooter className={`
          px-4 sm:px-5 py-3 border-t flex justify-between items-center
          ${isSelected ? 'border-t-green-200 bg-white/50' : 'border-t-gray-100'}
        `}>
          {isSelected ? (
            <span className="text-sm font-medium text-green-600 flex items-center">
              <CheckCircle className="h-4 w-4 mr-1" />
              Selecionado
            </span>
          ) : (
            <span className={`text-sm ${planKey === 1 ? 'text-gray-400' : style.text}`}>
              {planKey === 1 ? 'Plano Básico' : 'Selecionar'}
            </span>
          )}
          
          <div className={`
            h-5 w-5 sm:h-6 sm:w-6 rounded-full border flex items-center justify-center
            ${isSelected 
              ? planKey === 1 ? 'border-gray-400 bg-gray-400' : `${style.border.split(' ')[0].replace('border-', 'border-')} bg-${style.border.split(' ')[0].replace('border-', '').replace('-400', '-500')}`
              : 'border-gray-300'}`
            }
          >
            {isSelected && (
              <CheckCircle className="h-3 w-3 sm:h-4 sm:w-4 text-white" />
            )}
          </div>
        </CardFooter>
      </Card>
    </motion.div>
  );
};

export default PlanCard;
