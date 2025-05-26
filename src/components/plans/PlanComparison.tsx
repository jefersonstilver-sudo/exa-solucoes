
import React from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { CheckCircle, X } from 'lucide-react';
import { Plan, PlanKey } from '@/types/checkout';
import { formatCurrency } from '@/utils/priceUtils';

interface PlanComparisonProps {
  plans: Record<number, Plan>;
  selectedPlan: PlanKey;
  onSelectPlan: (plan: PlanKey) => void;
  panelCount?: number;
}

const PlanComparison: React.FC<PlanComparisonProps> = ({
  plans,
  selectedPlan,
  onSelectPlan,
  panelCount = 1
}) => {
  const planKeys = Object.keys(plans).map(key => parseInt(key)) as Array<PlanKey>;
  
  const features = [
    { key: 'support', label: 'Suporte', values: { 1: 'Email', 3: 'Prioritário', 6: 'Dedicado', 12: 'Gerente de conta' } },
    { key: 'changes', label: 'Alterações', values: { 1: '0', 3: '1 gratuita', 6: '3 gratuitas', 12: 'Ilimitadas' } },
    { key: 'reports', label: 'Relatórios', values: { 1: 'Básico', 3: 'Detalhado', 6: 'Completo', 12: 'Mensais' } },
    { key: 'production', label: 'Produção inclusa', values: { 1: false, 3: false, 6: true, 12: true } },
    { key: 'studio', label: 'Uso de estúdio', values: { 1: false, 3: false, 6: true, 12: true } }
  ];

  return (
    <div className="overflow-x-auto">
      <table className="w-full border-collapse">
        <thead>
          <tr>
            <th className="text-left p-4 border-b"></th>
            {planKeys.map(planKey => {
              const plan = plans[planKey];
              const totalPrice = plan.pricePerMonth * plan.months * panelCount;
              const discountedPrice = plan.discount > 0 
                ? totalPrice - (totalPrice * plan.discount / 100)
                : totalPrice;
              
              return (
                <th key={planKey} className="text-center p-4 border-b">
                  <Card 
                    className={`cursor-pointer transition-all ${
                      selectedPlan === planKey 
                        ? 'border-2 border-[#3C1361] bg-purple-50' 
                        : 'border hover:border-[#3C1361]/50'
                    }`}
                    onClick={() => onSelectPlan(planKey)}
                  >
                    <CardHeader className="pb-2">
                      <div className="space-y-1">
                        <CardTitle className="text-lg">{plan.name}</CardTitle>
                        {plan.mostPopular && (
                          <Badge className="bg-green-500 text-white text-xs">
                            MAIS VENDIDO
                          </Badge>
                        )}
                        {plan.tag && !plan.mostPopular && (
                          <Badge className="bg-purple-500 text-white text-xs">
                            {plan.tag}
                          </Badge>
                        )}
                      </div>
                    </CardHeader>
                    <CardContent>
                      <div className="text-center">
                        <div className="text-xl font-bold text-[#3C1361]">
                          {formatCurrency(discountedPrice)}
                        </div>
                        <div className="text-sm text-gray-500">
                          {formatCurrency(plan.pricePerMonth)}/mês
                        </div>
                        {plan.discount > 0 && (
                          <Badge className="mt-1 bg-green-100 text-green-800 text-xs">
                            -{plan.discount}%
                          </Badge>
                        )}
                      </div>
                    </CardContent>
                  </Card>
                </th>
              );
            })}
          </tr>
        </thead>
        <tbody>
          {features.map(feature => (
            <tr key={feature.key} className="border-b">
              <td className="p-4 font-medium">{feature.label}</td>
              {planKeys.map(planKey => (
                <td key={planKey} className="p-4 text-center">
                  {typeof feature.values[planKey] === 'boolean' ? (
                    feature.values[planKey] ? (
                      <CheckCircle className="h-5 w-5 text-green-500 mx-auto" />
                    ) : (
                      <X className="h-5 w-5 text-gray-400 mx-auto" />
                    )
                  ) : (
                    <span className="text-sm">{feature.values[planKey]}</span>
                  )}
                </td>
              ))}
            </tr>
          ))}
        </tbody>
      </table>
    </div>
  );
};

export default PlanComparison;
