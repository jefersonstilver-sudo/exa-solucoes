
import React from 'react';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { MapPin, Calendar, Clock, CreditCard, Tag, ChevronRight } from 'lucide-react';
import { useCheckout } from '@/hooks/useCheckout';
import { formatCurrency } from '@/utils/formatters';
import { PLANS } from '@/constants/checkoutConstants';

const ReviewStep = () => {
  const { 
    cartItems, 
    selectedPlan, 
    couponValid,
    couponDiscount,
    handleNextStep,
    calculateTotalPrice,
    calculateCartSubtotal
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

  const selectedMonths = PLANS[selectedPlan].months;
  const totalOriginalPrice = calculateCartSubtotal();
  const finalPrice = calculateTotalPrice();
  const discount = couponValid && couponDiscount ? totalOriginalPrice - finalPrice : 0;

  return (
    <div className="space-y-6">
      <div>
        <h2 className="text-2xl font-bold text-gray-900 mb-2">Revisão do Pedido</h2>
        <p className="text-gray-600">Confirme os detalhes do seu pedido antes de prosseguir</p>
      </div>

      {/* Selected Panels */}
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center">
            <MapPin className="h-5 w-5 mr-2" />
            Painéis Selecionados ({cartItems.length})
          </CardTitle>
          <CardDescription>
            Painéis que serão utilizados em sua campanha
          </CardDescription>
        </CardHeader>
        <CardContent>
          <div className="space-y-4">
            {cartItems.map((item) => (
              <div key={item.panel.id} className="flex items-center justify-between p-4 border border-gray-200 rounded-lg">
                <div className="flex-1">
                  <div className="flex items-center space-x-3">
                    <div className="w-12 h-12 bg-indexa-purple/10 rounded-lg flex items-center justify-center">
                      <MapPin className="h-6 w-6 text-indexa-purple" />
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
                    {formatCurrency(item.panel.buildings?.basePrice || 250)}/mês
                  </p>
                  <Badge variant="outline" className="text-xs">
                    {item.panel.resolucao || 'Resolução não informada'}
                  </Badge>
                </div>
              </div>
            ))}
          </div>
        </CardContent>
      </Card>

      {/* Duration */}
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center">
            <Calendar className="h-5 w-5 mr-2" />
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

      {/* Pricing Summary */}
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center">
            <CreditCard className="h-5 w-5 mr-2" />
            Resumo de Preços
          </CardTitle>
        </CardHeader>
        <CardContent>
          <div className="space-y-3">
            <div className="flex justify-between">
              <span className="text-gray-600">Subtotal ({cartItems.length} painéis × {selectedMonths} meses)</span>
              <span className="font-medium">{formatCurrency(totalOriginalPrice)}</span>
            </div>
            
            {couponValid && discount > 0 && (
              <div className="flex justify-between text-green-600">
                <span className="flex items-center">
                  <Tag className="h-4 w-4 mr-1" />
                  Desconto aplicado
                </span>
                <span className="font-medium">-{formatCurrency(discount)}</span>
              </div>
            )}
            
            <div className="border-t pt-3">
              <div className="flex justify-between text-lg font-bold">
                <span>Total</span>
                <span className="text-indexa-purple">{formatCurrency(finalPrice)}</span>
              </div>
            </div>
          </div>
        </CardContent>
      </Card>

      {/* Continue Button */}
      <Button 
        onClick={() => handleNextStep()}
        className="w-full bg-indexa-purple hover:bg-indexa-purple-dark text-white py-3"
        size="lg"
      >
        Continuar para Pagamento
        <ChevronRight className="h-4 w-4 ml-2" />
      </Button>
    </div>
  );
};

export default ReviewStep;
