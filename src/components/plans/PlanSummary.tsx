
import React from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { CheckCircle, Calendar, Users, TrendingUp } from 'lucide-react';
import { Plan, PlanKey } from '@/types/checkout';
import { formatCurrency } from '@/utils/priceUtils';

interface PlanSummaryProps {
  plan: Plan;
  planKey: PlanKey;
  panelCount: number;
  totalPrice: number;
}

const PlanSummary: React.FC<PlanSummaryProps> = ({
  plan,
  planKey,
  panelCount,
  totalPrice
}) => {
  const monthlyTotal = totalPrice / plan.months;
  const savings = plan.discount > 0 ? (totalPrice * plan.discount) / (100 - plan.discount) : 0;

  return (
    <Card className="border-2 border-[#3C1361] bg-gradient-to-br from-purple-50 to-white">
      <CardHeader className="pb-4">
        <div className="flex items-center justify-between">
          <CardTitle className="text-lg font-bold text-[#3C1361]">
            {plan.name}
          </CardTitle>
          {plan.mostPopular && (
            <Badge className="bg-green-500 text-white">
              MAIS VENDIDO
            </Badge>
          )}
          {plan.tag && !plan.mostPopular && (
            <Badge className="bg-purple-500 text-white">
              {plan.tag}
            </Badge>
          )}
        </div>
        <p className="text-sm text-gray-600">{plan.description}</p>
      </CardHeader>
      
      <CardContent className="space-y-4">
        {/* Pricing */}
        <div className="bg-white rounded-lg p-4 border">
          <div className="text-center mb-3">
            <div className="text-2xl font-bold text-[#3C1361]">
              {formatCurrency(totalPrice)}
            </div>
            <div className="text-sm text-gray-500">
              {formatCurrency(monthlyTotal)}/mês
            </div>
          </div>
          
          {savings > 0 && (
            <div className="text-center">
              <Badge className="bg-green-100 text-green-800">
                Economize {formatCurrency(savings)}
              </Badge>
            </div>
          )}
        </div>
        
        {/* Details */}
        <div className="grid grid-cols-2 gap-4 text-sm">
          <div className="flex items-center gap-2">
            <Calendar className="h-4 w-4 text-[#3C1361]" />
            <span>{plan.months} {plan.months === 1 ? 'mês' : 'meses'}</span>
          </div>
          <div className="flex items-center gap-2">
            <Users className="h-4 w-4 text-[#3C1361]" />
            <span>{panelCount} {panelCount === 1 ? 'painel' : 'painéis'}</span>
          </div>
          {plan.discount > 0 && (
            <div className="flex items-center gap-2">
              <TrendingUp className="h-4 w-4 text-green-600" />
              <span>{plan.discount}% desconto</span>
            </div>
          )}
        </div>
        
        {/* Features */}
        <div className="space-y-2">
          <h4 className="font-medium text-sm">Incluído no plano:</h4>
          <div className="space-y-1">
            {plan.extras.slice(0, 3).map((extra, idx) => (
              <div key={idx} className="flex items-start gap-2 text-sm">
                <CheckCircle className="h-4 w-4 text-green-500 flex-shrink-0 mt-0.5" />
                <span className="text-gray-600">{extra}</span>
              </div>
            ))}
            {plan.extras.length > 3 && (
              <div className="text-xs text-gray-500">
                +{plan.extras.length - 3} benefícios adicionais
              </div>
            )}
          </div>
        </div>
      </CardContent>
    </Card>
  );
};

export default PlanSummary;
