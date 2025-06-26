
import React from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { MapPin, Calendar, Clock, Building, Eye } from 'lucide-react';
import { formatCurrency } from '@/utils/priceUtils';
import { PLANS } from '@/constants/checkoutConstants';
import { PlanKey } from '@/types/checkout';

interface CartItem {
  panel: any;
  duration: number;
}

interface OrderSummaryCardProps {
  cartItems: CartItem[];
  selectedPlan: PlanKey;
  startDate?: Date;
  endDate?: Date;
}

const OrderSummaryCard: React.FC<OrderSummaryCardProps> = ({
  cartItems,
  selectedPlan,
  startDate = new Date(),
  endDate = new Date(Date.now() + (selectedPlan * 30 * 24 * 60 * 60 * 1000))
}) => {
  const formatDate = (date: Date) => {
    return new Intl.DateTimeFormat('pt-BR', { 
      day: '2-digit', 
      month: 'long', 
      year: 'numeric' 
    }).format(date);
  };

  const formatPanelInfo = (panel: any) => {
    const parts = [];
    
    if (panel.buildings?.nome) {
      parts.push(panel.buildings.nome);
    }
    
    if (panel.buildings?.bairro) {
      parts.push(panel.buildings.bairro);
    }
    
    return parts.length > 0 ? parts.join(' - ') : 'Local não informado';
  };

  const getFullAddress = (panel: any) => {
    const parts = [];
    
    if (panel.buildings?.endereco) {
      parts.push(panel.buildings.endereco);
    }
    
    if (panel.buildings?.bairro) {
      parts.push(panel.buildings.bairro);
    }
    
    return parts.length > 0 ? parts.join(', ') : 'Endereço não informado';
  };

  return (
    <Card className="overflow-hidden shadow-lg border-0 bg-gradient-to-br from-white to-gray-50">
      <CardHeader className="bg-gradient-to-r from-[#3C1361] to-purple-700 text-white p-6">
        <CardTitle className="flex items-center text-xl font-bold">
          <Building className="h-6 w-6 mr-3" />
          Resumo da Campanha
        </CardTitle>
        <p className="text-purple-100 mt-2">
          Confira todos os detalhes da sua campanha publicitária
        </p>
      </CardHeader>
      
      <CardContent className="p-0">
        {/* Plano Selecionado */}
        <div className="p-6 bg-gradient-to-r from-purple-50 to-indigo-50 border-b">
          <div className="flex items-center justify-between">
            <div className="flex items-center space-x-3">
              <div className="p-3 bg-gradient-to-br from-[#3C1361] to-purple-600 rounded-xl">
                <Calendar className="h-6 w-6 text-white" />
              </div>
              <div>
                <h3 className="text-lg font-semibold text-gray-900">
                  {PLANS[selectedPlan]?.name || `Plano ${selectedPlan} ${selectedPlan === 1 ? 'mês' : 'meses'}`}
                </h3>
                <p className="text-sm text-gray-600">
                  Duração: {selectedPlan} {selectedPlan === 1 ? 'mês' : 'meses'}
                </p>
              </div>
            </div>
            <Badge className="bg-green-100 text-green-800 px-3 py-1">
              {selectedPlan > 1 ? `${((1 - (PLANS[selectedPlan]?.discount || 0)) * 100).toFixed(0)}% desconto` : 'Sem desconto'}
            </Badge>
          </div>
        </div>

        {/* Período da Campanha */}
        <div className="p-6 border-b bg-white">
          <h3 className="text-lg font-semibold text-gray-900 mb-4 flex items-center">
            <Clock className="h-5 w-5 mr-2 text-[#3C1361]" />
            Período da Exibição
          </h3>
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <div className="bg-gray-50 rounded-lg p-4">
              <div className="text-sm text-gray-600 font-medium">Data de Início</div>
              <div className="text-lg font-bold text-gray-900 mt-1">
                {formatDate(startDate)}
              </div>
            </div>
            <div className="bg-gray-50 rounded-lg p-4">
              <div className="text-sm text-gray-600 font-medium">Data de Término</div>
              <div className="text-lg font-bold text-gray-900 mt-1">
                {formatDate(endDate)}
              </div>
            </div>
          </div>
        </div>

        {/* Locais Selecionados */}
        <div className="p-6">
          <h3 className="text-lg font-semibold text-gray-900 mb-4 flex items-center">
            <MapPin className="h-5 w-5 mr-2 text-[#3C1361]" />
            Locais Selecionados ({cartItems.length})
          </h3>
          <div className="space-y-4">
            {cartItems.map((item, index) => (
              <div key={item.panel.id || index} className="bg-gradient-to-r from-gray-50 to-white border border-gray-200 rounded-xl p-4 hover:shadow-md transition-all duration-300">
                <div className="flex items-start space-x-4">
                  <div className="flex-shrink-0">
                    <div className="w-12 h-12 bg-gradient-to-br from-[#3C1361] to-purple-600 rounded-lg flex items-center justify-center">
                      <Building className="h-6 w-6 text-white" />
                    </div>
                  </div>
                  <div className="flex-1 min-w-0">
                    <div className="flex items-start justify-between">
                      <div className="flex-1">
                        <h4 className="text-lg font-semibold text-gray-900 mb-1">
                          {formatPanelInfo(item.panel)}
                        </h4>
                        <p className="text-sm text-gray-600 mb-2">
                          {getFullAddress(item.panel)}
                        </p>
                        <div className="flex items-center space-x-4 text-xs text-gray-500">
                          <span className="flex items-center">
                            <Eye className="h-3 w-3 mr-1" />
                            Código: {item.panel.code || 'N/A'}
                          </span>
                          {item.panel.resolucao && (
                            <span>Resolução: {item.panel.resolucao}</span>
                          )}
                        </div>
                      </div>
                      <div className="text-right ml-4">
                        <div className="text-lg font-bold text-[#3C1361]">
                          {formatCurrency(item.panel.buildings?.preco_base || 200)}/mês
                        </div>
                        <Badge variant="outline" className="text-xs mt-1">
                          Painel Digital
                        </Badge>
                      </div>
                    </div>
                  </div>
                </div>
              </div>
            ))}
          </div>
        </div>
      </CardContent>
    </Card>
  );
};

export default OrderSummaryCard;
