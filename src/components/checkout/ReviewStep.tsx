
import React from 'react';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { MapPin, Calendar, Clock, CreditCard, Tag, ChevronRight } from 'lucide-react';
import { useCheckout } from '@/hooks/useCheckout';
import { formatPrice } from '@/utils/formatters';

const ReviewStep = () => {
  const { 
    selectedPanels, 
    selectedMonths, 
    finalPrice, 
    appliedCoupon, 
    nextStep 
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

  const totalOriginalPrice = selectedPanels.reduce((sum, panel) => {
    return sum + (panel.buildings?.basePrice || 0);
  }, 0) * selectedMonths;

  const discount = appliedCoupon ? totalOriginalPrice - finalPrice : 0;

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
            Painéis Selecionados ({selectedPanels.length})
          </CardTitle>
          <CardDescription>
            Painéis que serão utilizados em sua campanha
          </CardDescription>
        </CardHeader>
        <CardContent>
          <div className="space-y-4">
            {selectedPanels.map((panel) => (
              <div key={panel.id} className="flex items-center justify-between p-4 border border-gray-200 rounded-lg">
                <div className="flex-1">
                  <div className="flex items-center space-x-3">
                    <div className="w-12 h-12 bg-indexa-purple/10 rounded-lg flex items-center justify-center">
                      <MapPin className="h-6 w-6 text-indexa-purple" />
                    </div>
                    <div>
                      <h4 className="font-medium text-gray-900">{formatPanelInfo(panel)}</h4>
                      <p className="text-sm text-gray-500">{panel.code}</p>
                      {panel.localizacao && (
                        <p className="text-xs text-gray-400">{panel.localizacao}</p>
                      )}
                    </div>
                  </div>
                </div>
                <div className="text-right">
                  <p className="font-medium text-gray-900">
                    {formatPrice(panel.buildings?.basePrice || 0)}/mês
                  </p>
                  <Badge variant="outline" className="text-xs">
                    {panel.resolucao || 'Resolução não informada'}
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
              <span className="text-gray-600">Subtotal ({selectedPanels.length} painéis × {selectedMonths} meses)</span>
              <span className="font-medium">{formatPrice(totalOriginalPrice)}</span>
            </div>
            
            {appliedCoupon && (
              <div className="flex justify-between text-green-600">
                <span className="flex items-center">
                  <Tag className="h-4 w-4 mr-1" />
                  Desconto ({appliedCoupon.codigo})
                </span>
                <span className="font-medium">-{formatPrice(discount)}</span>
              </div>
            )}
            
            <div className="border-t pt-3">
              <div className="flex justify-between text-lg font-bold">
                <span>Total</span>
                <span className="text-indexa-purple">{formatPrice(finalPrice)}</span>
              </div>
            </div>
          </div>
        </CardContent>
      </Card>

      {/* Continue Button */}
      <Button 
        onClick={nextStep}
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
