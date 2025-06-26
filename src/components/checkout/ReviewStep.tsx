
import React from 'react';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { MapPin, Calendar, Clock, CreditCard, Tag } from 'lucide-react';
import { useCheckout } from '@/hooks/useCheckout';
import { formatCurrency } from '@/utils/priceUtils';
import { PLANS } from '@/constants/checkoutConstants';
import { calculateCartSubtotal, calculateTotalPrice, getPlanDiscount } from '@/utils/checkoutUtils';
import { PlanKey } from '@/types/checkout';

const ReviewStep = () => {
  const { 
    cartItems, 
    selectedPlan, 
    couponValid,
    couponDiscount // CORREÇÃO: Agora disponível no useCheckout
  } = useCheckout();

  const formatPanelInfo = (panel: any) => {
    const info = [];
    
    if (panel.buildings?.nome) {
      info.push(panel.buildings.nome);
    }
    
    if (panel.buildings?.bairro) {
      info.push(panel.buildings.bairro);
    }
    
    return info.join(' - ');
  };

  // CORRIGIDO: Cast para PlanKey
  const planKey = selectedPlan as PlanKey;

  if (!selectedPlan || !PLANS[planKey]) {
    return (
      <div className="space-y-6">
        <div className="border-b pb-4">
          <h2 className="text-2xl font-bold text-gray-900 flex items-center">
            <span className="mr-3 text-2xl">📋</span>
            Revisão do Pedido
          </h2>
          <p className="text-gray-600 mt-2">Selecione um plano para visualizar o resumo</p>
        </div>
        <Card>
          <CardContent className="p-6 text-center">
            <p className="text-gray-500">Nenhum plano selecionado</p>
          </CardContent>
        </Card>
      </div>
    );
  }

  const selectedMonths = PLANS[planKey].months;
  
  // CORREÇÃO: Cálculo detalhado para exibir desconto aplicado
  const subtotalMensal = calculateCartSubtotal(cartItems, 1);
  const subtotalComPlano = calculateCartSubtotal(cartItems, planKey);
  const subtotalTotal = subtotalMensal * selectedMonths;
  const subtotalComPlanoTotal = subtotalComPlano * selectedMonths;
  const descontoPorPlano = subtotalTotal - subtotalComPlanoTotal;
  
  const finalPrice = calculateTotalPrice(planKey, cartItems, couponDiscount, couponValid);
  const descontoCupom = couponValid && couponDiscount ? (subtotalComPlanoTotal * couponDiscount) / 100 : 0;

  return (
    <div className="space-y-6">
      <div className="border-b pb-4">
        <h2 className="text-2xl font-bold text-gray-900 flex items-center">
          <span className="mr-3 text-2xl">📋</span>
          Revisão do Pedido
        </h2>
        <p className="text-gray-600 mt-2">Confirme os detalhes do seu pedido antes de prosseguir</p>
      </div>

      {/* Painéis Selecionados */}
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center text-lg">
            <MapPin className="h-5 w-5 mr-2 text-[#1E1B4B]" />
            Painéis Selecionados ({cartItems.length})
          </CardTitle>
          <CardDescription>
            Painéis que serão utilizados em sua campanha
          </CardDescription>
        </CardHeader>
        <CardContent>
          <div className="space-y-3">
            {cartItems.map((item) => (
              <div key={item.panel.id} className="flex items-center justify-between p-4 border border-gray-200 rounded-lg hover:bg-gray-50 transition-colors">
                <div className="flex-1">
                  <div className="flex items-center space-x-3">
                    <div className="w-12 h-12 bg-[#1E1B4B]/10 rounded-lg flex items-center justify-center">
                      <MapPin className="h-6 w-6 text-[#1E1B4B]" />
                    </div>
                    <div>
                      <h4 className="font-medium text-gray-900">{formatPanelInfo(item.panel)}</h4>
                      <p className="text-sm text-gray-500">{item.panel.code}</p>
                      {item.panel.localizacao && (
                        <p className="text-xs text-gray-400">{item.panel.localizacao}</p>
                      )}
                    </div>
                  </div>
                </div>
                <div className="text-right">
                  <p className="font-medium text-gray-900">
                    {formatCurrency(item.panel.buildings?.preco_base || 0)}/mês
                  </p>
                  <Badge variant="outline" className="text-xs mt-1">
                    {item.panel.resolucao || 'Resolução não informada'}
                  </Badge>
                </div>
              </div>
            ))}
          </div>
        </CardContent>
      </Card>

      {/* Grid de informações */}
      <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
        {/* Duração */}
        <Card>
          <CardHeader>
            <CardTitle className="flex items-center text-lg">
              <Calendar className="h-5 w-5 mr-2 text-[#1E1B4B]" />
              Duração da Campanha
            </CardTitle>
          </CardHeader>
          <CardContent>
            <div className="flex items-center space-x-3">
              <Clock className="h-5 w-5 text-gray-400" />
              <span className="text-lg font-medium">
                {selectedMonths} {selectedMonths === 1 ? 'mês' : 'meses'}
              </span>
            </div>
          </CardContent>
        </Card>

        {/* Resumo de Preços com Desconto Detalhado */}
        <Card>
          <CardHeader>
            <CardTitle className="flex items-center text-lg">
              <CreditCard className="h-5 w-5 mr-2 text-[#1E1B4B]" />
              Resumo de Preços
            </CardTitle>
          </CardHeader>
          <CardContent>
            <div className="space-y-3">
              <div className="flex justify-between text-sm">
                <span className="text-gray-600">Subtotal ({cartItems.length} painéis × {selectedMonths} meses)</span>
                <span className="font-medium">{formatCurrency(subtotalTotal)}</span>
              </div>
              
              {/* Desconto do Plano - NOVO */}
              {descontoPorPlano > 0 && (
                <div className="flex justify-between text-red-600 text-sm">
                  <span className="flex items-center">
                    <Tag className="h-4 w-4 mr-1" />
                    Desconto {PLANS[planKey].name} ({getPlanDiscount(planKey) * 100}%)
                  </span>
                  <span className="font-medium line-through">-{formatCurrency(descontoPorPlano)}</span>
                </div>
              )}
              
              {/* Desconto do Cupom */}
              {couponValid && descontoCupom > 0 && (
                <div className="flex justify-between text-red-600 text-sm">
                  <span className="flex items-center">
                    <Tag className="h-4 w-4 mr-1" />
                    Desconto cupom ({couponDiscount}%)
                  </span>
                  <span className="font-medium line-through">-{formatCurrency(descontoCupom)}</span>
                </div>
              )}
              
              <div className="border-t pt-3">
                <div className="flex justify-between text-lg font-bold">
                  <span>Total Final</span>
                  <span className="text-[#1E1B4B]">{formatCurrency(finalPrice)}</span>
                </div>
                {(descontoPorPlano > 0 || (couponValid && descontoCupom > 0)) && (
                  <div className="text-xs text-green-600 mt-1 text-right">
                    ✅ Você economizou {formatCurrency(descontoPorPlano + descontoCupom)}!
                  </div>
                )}
              </div>
            </div>
          </CardContent>
        </Card>
      </div>
    </div>
  );
};

export default ReviewStep;
