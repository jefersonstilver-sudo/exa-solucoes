
import React from 'react';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { MapPin, Calendar, Clock, CreditCard, Tag, TrendingDown } from 'lucide-react';
import { useCheckout } from '@/hooks/useCheckout';
import { formatCurrency } from '@/utils/priceUtils';
import { PLANS } from '@/constants/checkoutConstants';
import { calculateCartSubtotal, calculateTotalPrice } from '@/utils/checkoutUtils';

const ReviewStep = () => {
  const { 
    cartItems, 
    selectedPlan, 
    couponValid,
    couponDiscount
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

  if (!selectedPlan || !PLANS[selectedPlan]) {
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

  const selectedMonths = PLANS[selectedPlan].months;
  
  // CORREÇÃO CRÍTICA: Usar funções centralizadas para garantir consistência
  const subtotal = calculateCartSubtotal(cartItems);
  const finalPrice = calculateTotalPrice(selectedPlan, cartItems, couponDiscount, couponValid);
  const subtotalWithPlan = subtotal * selectedMonths;
  const discount = couponValid && couponDiscount ? (subtotalWithPlan * couponDiscount) / 100 : 0;

  // CORREÇÃO: Log mais detalhado para mostrar valores de desconto
  console.log("📋 [ReviewStep] PREÇOS CORRIGIDOS COM DESCONTO:", {
    component: "ReviewStep",
    cartItemsCount: cartItems.length,
    selectedPlan,
    selectedMonths,
    subtotal,
    subtotalWithPlan,
    finalPrice,
    discount,
    couponValid,
    couponDiscount,
    hasDiscount: couponValid && discount > 0,
    calculation: `Subtotal: R$ ${subtotal} × ${selectedMonths} meses = R$ ${subtotalWithPlan}`,
    discountCalculation: `Desconto: R$ ${subtotalWithPlan} × ${couponDiscount}% = R$ ${discount}`,
    finalCalculation: `Com desconto: R$ ${finalPrice}`,
    shouldShowDiscount: couponValid && discount > 0
  });

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

        {/* CORREÇÃO: Resumo de Preços com Desconto SEMPRE Visível quando aplicado */}
        <Card>
          <CardHeader>
            <CardTitle className="flex items-center text-lg">
              <CreditCard className="h-5 w-5 mr-2 text-[#1E1B4B]" />
              Resumo de Preços
            </CardTitle>
          </CardHeader>
          <CardContent>
            <div className="space-y-3">
              {/* Preço Original - sempre mostrar como riscado quando há desconto */}
              <div className="flex justify-between text-sm">
                <span className="text-gray-600">Subtotal ({cartItems.length} painéis × {selectedMonths} meses)</span>
                <span className={`font-medium ${couponValid && discount > 0 ? 'line-through text-red-500 text-xs' : ''}`}>
                  {formatCurrency(subtotalWithPlan)}
                </span>
              </div>
              
              {/* CORREÇÃO: Desconto SEMPRE visível quando aplicado */}
              {couponValid && discount > 0 && (
                <>
                  <div className="flex justify-between text-green-600 text-sm bg-green-50 p-3 rounded-lg border border-green-200">
                    <span className="flex items-center font-medium">
                      <TrendingDown className="h-4 w-4 mr-2" />
                      Desconto aplicado ({couponDiscount}%)
                    </span>
                    <span className="font-bold text-green-700">-{formatCurrency(discount)}</span>
                  </div>
                  
                  {/* Economia Total Destacada com Visual Melhorado */}
                  <div className="bg-gradient-to-r from-green-100 to-green-200 p-4 rounded-lg border-2 border-green-300 shadow-sm">
                    <div className="flex items-center justify-center text-green-800">
                      <Tag className="h-5 w-5 mr-2" />
                      <span className="text-base font-bold">
                        🎉 Você está economizando {formatCurrency(discount)}!
                      </span>
                    </div>
                  </div>
                </>
              )}
              
              {/* Total Final Destacado */}
              <div className="border-t pt-3">
                <div className="flex justify-between text-lg font-bold">
                  <span>Total Final</span>
                  <span className="text-[#1E1B4B] text-xl">{formatCurrency(finalPrice)}</span>
                </div>
                {couponValid && discount > 0 && (
                  <div className="text-xs text-green-600 mt-2 text-right font-medium bg-green-50 p-2 rounded">
                    ✅ Desconto de {couponDiscount}% aplicado com sucesso! Economia de {formatCurrency(discount)}
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
