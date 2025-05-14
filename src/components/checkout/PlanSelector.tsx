
import React from 'react';
import { motion } from 'framer-motion';
import { CheckCircle, Clock, ArrowRight, Video, Award, Star } from 'lucide-react';
import { Card, CardContent, CardFooter } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Plan, PlanKey } from '@/types/checkout';
import { formatCurrency } from '@/utils/priceUtils';

interface PlanSelectorProps {
  selectedPlan: PlanKey;
  onSelectPlan: (plan: PlanKey) => void;
  plans: Record<number, Plan>;
  panelCount: number;
  onProceed?: () => void;
}

const PlanSelector: React.FC<PlanSelectorProps> = ({ 
  selectedPlan, 
  onSelectPlan, 
  plans,
  panelCount,
  onProceed
}) => {
  const planKeys = Object.keys(plans).map(key => parseInt(key)) as Array<PlanKey>;
  
  // Animation variants
  const containerVariants = {
    hidden: { opacity: 0 },
    visible: {
      opacity: 1,
      transition: {
        staggerChildren: 0.1
      }
    }
  };
  
  const itemVariants = {
    hidden: { opacity: 0, y: 20 },
    visible: { opacity: 1, y: 0 }
  };

  // Get color class based on plan
  const getPlanColorClass = (planKey: PlanKey) => {
    const colorMap = {
      'gray': 'border-gray-300 hover:border-gray-400',
      'green': 'border-green-500 hover:border-green-600',
      'purple': 'border-purple-500 hover:border-purple-600',
      'blue': 'border-blue-500 hover:border-blue-600'
    };
    
    const color = plans[planKey].color || 'gray';
    return colorMap[color] || colorMap.gray;
  };
  
  // Get background color class for selected plan
  const getSelectedBgClass = (planKey: PlanKey) => {
    const colorMap = {
      'gray': 'bg-gray-50',
      'green': 'bg-green-50',
      'purple': 'bg-purple-50',
      'blue': 'bg-blue-50'
    };
    
    const color = plans[planKey].color || 'gray';
    return colorMap[color] || colorMap.gray;
  };
  
  return (
    <div className="space-y-6">
      <div className="flex items-center gap-2 mb-6 text-xl font-medium text-gray-700">
        <Clock className="h-6 w-6 text-indexa-purple" />
        <span>Escolha seu plano ideal de veiculação</span>
      </div>
      
      <p className="text-lg text-gray-600 mb-8">
        Ganhe vídeos, economize por mês e destaque sua campanha nos melhores locais!
      </p>
      
      <motion.div 
        variants={containerVariants}
        initial="hidden"
        animate="visible"
        className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4"
      >
        {planKeys.map((planKey) => {
          const plan = plans[planKey];
          const isSelected = selectedPlan === planKey;
          const borderColorClass = getPlanColorClass(planKey);
          const selectedBgClass = getSelectedBgClass(planKey);
          
          return (
            <motion.div 
              key={planKey}
              variants={itemVariants}
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
                onClick={() => onSelectPlan(planKey)}
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
        })}
      </motion.div>
      
      {onProceed && (
        <motion.div 
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.4 }}
          className="mt-10 flex justify-center"
        >
          <Button 
            size="lg" 
            className="px-8 py-6 bg-indexa-purple hover:bg-indexa-purple/90"
            onClick={onProceed}
            disabled={!selectedPlan}
          >
            Continuar com o plano selecionado
            <ArrowRight className="ml-2 h-5 w-5" />
          </Button>
        </motion.div>
      )}
    </div>
  );
};

export default PlanSelector;
