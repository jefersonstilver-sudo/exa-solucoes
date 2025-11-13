
import React from 'react';
import { motion } from 'framer-motion';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Building2, Calendar, MapPin, Monitor, Clock } from 'lucide-react';
import { CartItem } from '@/types/cart';
import { PlanKey } from '@/types/checkout';

interface OrderSummaryCardProps {
  cartItems: CartItem[];
  selectedPlan: PlanKey | null;
}

const OrderSummaryCard: React.FC<OrderSummaryCardProps> = ({
  cartItems,
  selectedPlan
}) => {
  console.log('[OrderSummaryCard] Debug:', {
    cartItemsCount: cartItems?.length || 0,
    selectedPlan,
    cartItems: cartItems?.map(item => ({
      panelId: item.panel.id,
      buildingName: item.panel.buildings?.nome,
      endereco: item.panel.buildings?.endereco
    }))
  });

  if (!cartItems || cartItems.length === 0) {
    return (
      <Card className="bg-gradient-to-br from-red-50 to-red-100 border-red-200">
        <CardContent className="p-6 text-center">
          <p className="text-red-600 font-medium">Nenhum painel selecionado</p>
        </CardContent>
      </Card>
    );
  }

  // Calcular datas do período
  const dataInicio = new Date();
  const dataFim = new Date();
  if (selectedPlan) {
    dataFim.setMonth(dataFim.getMonth() + selectedPlan);
  }

  const formatDate = (date: Date) => {
    return new Intl.DateTimeFormat('pt-BR', {
      day: '2-digit',
      month: '2-digit', 
      year: 'numeric'
    }).format(date);
  };

  // Agrupar painéis por prédio - pega dados reais do banco
  const paineisPorPredio = cartItems.reduce((acc, item) => {
    const buildingId = item.panel.buildings?.id || 'unknown';
    const buildingName = item.panel.buildings?.nome || 'Prédio não identificado';
    
    if (!acc[buildingId]) {
      acc[buildingId] = {
        nome: buildingName,
        endereco: item.panel.buildings?.endereco || '',
        bairro: item.panel.buildings?.bairro || '',
        publico_estimado: item.panel.buildings?.publico_estimado || 0,
        // Pega o número real de telas do prédio do banco de dados
        quantidadeTelas: item.panel.buildings?.quantidade_telas || item.panel.buildings?.numero_elevadores || 0
      };
    }
    
    return acc;
  }, {} as Record<string, any>);

  // Calcular público total
  const publicoTotal = Object.values(paineisPorPredio).reduce((total, building: any) => {
    return total + (building.publico_estimado || 0);
  }, 0);

  return (
    <div className="space-y-3 sm:space-y-4">
      {/* Header Card */}
      <Card className="shadow-sm border">
        <CardHeader className="p-3 sm:p-4 pb-2 sm:pb-3">
          <CardTitle className="flex items-center text-sm sm:text-lg font-semibold">
            <Building2 className="h-4 w-4 sm:h-5 sm:w-5 mr-2" />
            Resumo da Campanha
          </CardTitle>
        </CardHeader>
        
        <CardContent className="p-3 sm:p-4 pt-0">
          <div className="grid grid-cols-2 gap-2 sm:gap-3 mb-3 sm:mb-4">
            {/* Total de Painéis */}
            <div className="flex items-center space-x-1.5 sm:space-x-2 p-2 sm:p-3 bg-blue-50 rounded-lg">
              <Monitor className="h-3.5 w-3.5 sm:h-4 sm:w-4 text-blue-600 flex-shrink-0" />
              <div>
                <p className="text-[10px] sm:text-xs text-blue-600">Painéis</p>
                <p className="text-base sm:text-lg font-bold text-blue-800">{cartItems.length}</p>
              </div>
            </div>

            {/* Duração */}
            <div className="flex items-center space-x-1.5 sm:space-x-2 p-2 sm:p-3 bg-green-50 rounded-lg">
              <Clock className="h-3.5 w-3.5 sm:h-4 sm:w-4 text-green-600 flex-shrink-0" />
              <div>
                <p className="text-[10px] sm:text-xs text-green-600">Duração</p>
                <p className="text-base sm:text-lg font-bold text-green-800">
                  {selectedPlan} {selectedPlan === 1 ? 'mês' : 'meses'}
                </p>
              </div>
            </div>

            {/* Período */}
            <div className="col-span-2 flex items-center space-x-1.5 sm:space-x-2 p-2 sm:p-3 bg-gray-100 rounded-lg">
              <Calendar className="h-3.5 w-3.5 sm:h-4 sm:w-4 text-gray-600 flex-shrink-0" />
              <div>
                <p className="text-[10px] sm:text-xs text-gray-600">Período da Campanha</p>
                <p className="text-xs sm:text-sm font-semibold text-gray-800">
                  {formatDate(dataInicio)} até {formatDate(dataFim)}
                </p>
              </div>
            </div>
          </div>

          {/* Público Total */}
          {publicoTotal > 0 && (
            <div className="p-2 sm:p-3 bg-orange-50 rounded-lg border border-orange-200">
              <p className="text-[10px] sm:text-xs text-orange-700 font-medium">Público Total Estimado</p>
              <p className="text-base sm:text-lg font-bold text-orange-900">
                {publicoTotal.toLocaleString('pt-BR')} pessoas/mês
              </p>
            </div>
          )}
        </CardContent>
      </Card>

      {/* Painéis por Prédio */}
      <div className="space-y-2 sm:space-y-3">
        <h3 className="text-xs sm:text-base font-semibold text-gray-900 px-1">
          Locais Selecionados
        </h3>
        
        {Object.entries(paineisPorPredio).map(([buildingId, building]: [string, any]) => (
          <div key={buildingId} className="bg-white border rounded-lg p-2.5 sm:p-3 hover:shadow-sm transition-shadow">
            <div className="flex items-start space-x-1.5 sm:space-x-2">
              <Building2 className="h-3.5 w-3.5 sm:h-4 sm:w-4 text-gray-500 mt-0.5 flex-shrink-0" />
              <div className="flex-1 min-w-0">
                <h4 className="font-semibold text-gray-900 text-xs sm:text-sm mb-1">
                  {building.nome}
                </h4>
                {building.endereco && (
                  <p className="text-[10px] sm:text-xs text-gray-600 mb-1.5 sm:mb-2">
                    {building.endereco}{building.bairro && `, ${building.bairro}`}
                  </p>
                )}
                
                <div className="flex items-center gap-2 sm:gap-3 text-[10px] sm:text-xs text-gray-600">
                  <span>
                    <strong className="text-gray-700">{building.quantidadeTelas}</strong> {building.quantidadeTelas === 1 ? 'tela' : 'telas'}
                  </span>
                  {building.publico_estimado > 0 && (
                    <>
                      <span>•</span>
                      <span>
                        <strong className="text-gray-700">{building.publico_estimado.toLocaleString('pt-BR')}</strong> pessoas
                      </span>
                    </>
                  )}
                </div>
              </div>
            </div>
          </div>
        ))}
      </div>
    </div>
  );
};

export default OrderSummaryCard;
