
import React from 'react';
import { motion } from 'framer-motion';
import { CheckCircle, Video } from 'lucide-react';
import { Card, CardContent, CardFooter } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Plan, PlanKey } from '@/types/checkout';
import { formatCurrency } from '@/utils/priceUtils';

interface PlanCardProps {
  plan: Plan;
  planKey: PlanKey;
  isSelected: boolean;
  onSelect: () => void;
  borderColorClass: string;
  selectedBgClass: string;
}

const PlanCard: React.FC<PlanCardProps> = ({
  plan,
  planKey,
  isSelected,
  onSelect,
  borderColorClass,
  selectedBgClass
}) => {
  return (
    <motion.div
      variants={{
        hidden: { opacity: 0, y: 20 },
        visible: { opacity: 1, y: 0 }
      }}
      transition={{ duration: 0.4 }}
      whileHover={{ 
        scale: 1.02, 
        boxShadow: '0 10px 30px rgba(0, 0, 0, 0.07)' 
      }}
    >
      <Card 
        className={`
          overflow-hidden transition-all cursor-pointer h-full flex flex-col border-2
          ${isSelected 
            ? `${borderColorClass} ${selectedBgClass} shadow-lg` 
            : `border-gray-200 hover:${borderColorClass} bg-white`
          }
        `}
        onClick={onSelect}
      >
        {plan.mostPopular && (
          <div className="bg-green-500 text-white text-center py-1 text-xs font-medium">
            🔥 MAIS VENDIDO
          </div>
        )}
        
        {plan.tag && !plan.mostPopular && (
          <div className={`
            text-center py-1 text-xs font-medium
            ${plan.color === 'purple' ? 'bg-purple-500 text-white' : 
              plan.color === 'blue' ? 'bg-blue-500 text-white' : 'bg-gray-200 text-gray-700'}
          `}>
            {plan.tag}
          </div>
        )}
        
        <CardContent className="p-5 flex-grow flex flex-col">
          <div className="text-center mb-4">
            <h3 className="text-xl font-bold text-gray-800">
              {plan.name}
            </h3>
            <p className="text-sm text-gray-500">
              {plan.description}
            </p>
          </div>
          
          <div className="text-center mb-6">
            <div className="flex justify-center items-baseline">
              <span className="text-3xl font-bold text-indexa-purple">
                {formatCurrency(plan.pricePerMonth)}
              </span>
              <span className="text-gray-500 text-sm ml-1">/mês</span>
            </div>
            
            {plan.discount > 0 && (
              <Badge className="mt-2 bg-green-100 text-green-800 hover:bg-green-100">
                Economize {plan.discount}%
              </Badge>
            )}
          </div>
          
          <div className="space-y-3 mt-auto">
            {plan.extras.map((extra, idx) => (
              <div key={idx} className="flex items-start gap-2">
                <CheckCircle className="h-5 w-5 text-green-500 flex-shrink-0" />
                <span className="text-sm text-gray-600">{extra}</span>
              </div>
            ))}
            
            {plan.id === 1 && plan.additionalProduction && plan.additionalProduction.available && (
              <div className="mt-4 pt-3 border-t border-gray-200">
                <Button 
                  variant="outline" 
                  size="sm"
                  className="w-full text-xs"
                  onClick={(e) => {
                    e.stopPropagation();
                    // Add logic to add production service
                  }}
                >
                  <Video className="h-3 w-3 mr-1" />
                  Adicionar produção (+R$ {plan.additionalProduction.price.toFixed(2)})
                </Button>
              </div>
            )}
          </div>
        </CardContent>
        
        <CardFooter className={`
          px-5 py-3 border-t flex justify-between items-center
          ${isSelected ? 'border-t-green-200 bg-white/50' : 'border-t-gray-100'}
        `}>
          {isSelected ? (
            <span className="text-sm font-medium text-green-600 flex items-center">
              <CheckCircle className="h-4 w-4 mr-1" />
              Selecionado
            </span>
          ) : (
            <span className="text-sm text-gray-500">
              Selecionar
            </span>
          )}
          
          <div className={`
            h-6 w-6 rounded-full border flex items-center justify-center
            ${isSelected 
              ? 'border-green-500 bg-green-500' 
              : 'border-gray-300'}`
            }
          >
            {isSelected && (
              <CheckCircle className="h-4 w-4 text-white" />
            )}
          </div>
        </CardFooter>
      </Card>
    </motion.div>
  );
};

export default PlanCard;
