
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

  // Agrupar painéis por prédio - conta TODOS os items do carrinho por prédio
  const paineisPorPredio = cartItems.reduce((acc, item) => {
    const buildingId = item.panel.buildings?.id || 'unknown';
    const buildingName = item.panel.buildings?.nome || 'Prédio não identificado';
    
    if (!acc[buildingId]) {
      acc[buildingId] = {
        nome: buildingName,
        endereco: item.panel.buildings?.endereco || '',
        bairro: item.panel.buildings?.bairro || '',
        publico_estimado: item.panel.buildings?.publico_estimado || 0,
        telasSelecionadas: 0 // Contador de telas selecionadas do carrinho
      };
    }
    
    // Incrementa o contador de telas selecionadas para este prédio
    acc[buildingId].telasSelecionadas++;
    
    return acc;
  }, {} as Record<string, any>);

  // Calcular público total
  const publicoTotal = Object.values(paineisPorPredio).reduce((total, building: any) => {
    return total + (building.publico_estimado || 0);
  }, 0);

  return (
    <div className="space-y-4">
      {/* Header Card */}
      <Card className="shadow-sm border">
        <CardHeader className="p-4 pb-3">
          <CardTitle className="flex items-center text-lg font-semibold">
            <Building2 className="h-5 w-5 mr-2" />
            Resumo da Campanha
          </CardTitle>
        </CardHeader>
        
        <CardContent className="p-4 pt-0">
          <div className="grid grid-cols-2 gap-3 mb-4">
            {/* Total de Painéis */}
            <div className="flex items-center space-x-2 p-3 bg-blue-50 rounded-lg">
              <Monitor className="h-4 w-4 text-blue-600 flex-shrink-0" />
              <div>
                <p className="text-xs text-blue-600">Painéis</p>
                <p className="text-lg font-bold text-blue-800">{cartItems.length}</p>
              </div>
            </div>

            {/* Duração */}
            <div className="flex items-center space-x-2 p-3 bg-green-50 rounded-lg">
              <Clock className="h-4 w-4 text-green-600 flex-shrink-0" />
              <div>
                <p className="text-xs text-green-600">Duração</p>
                <p className="text-lg font-bold text-green-800">
                  {selectedPlan} {selectedPlan === 1 ? 'mês' : 'meses'}
                </p>
              </div>
            </div>

            {/* Período */}
            <div className="col-span-2 flex items-center space-x-2 p-3 bg-purple-50 rounded-lg">
              <Calendar className="h-4 w-4 text-purple-600 flex-shrink-0" />
              <div>
                <p className="text-xs text-purple-600">Período da Campanha</p>
                <p className="text-sm font-semibold text-purple-800">
                  {formatDate(dataInicio)} até {formatDate(dataFim)}
                </p>
              </div>
            </div>
          </div>

          {/* Público Total */}
          {publicoTotal > 0 && (
            <div className="p-3 bg-orange-50 rounded-lg border border-orange-200">
              <p className="text-xs text-orange-700 font-medium">Público Total Estimado</p>
              <p className="text-lg font-bold text-orange-900">
                {publicoTotal.toLocaleString('pt-BR')} pessoas/mês
              </p>
            </div>
          )}
        </CardContent>
      </Card>

      {/* Painéis por Prédio */}
      <div className="space-y-3">
        <h3 className="text-base font-semibold text-gray-900">
          Locais Selecionados
        </h3>
        
        {Object.entries(paineisPorPredio).map(([buildingId, building]: [string, any]) => (
          <div key={buildingId} className="bg-white border rounded-lg p-3 hover:shadow-sm transition-shadow">
            <div className="flex items-start space-x-2">
              <Building2 className="h-4 w-4 text-gray-500 mt-0.5 flex-shrink-0" />
              <div className="flex-1 min-w-0">
                <h4 className="font-semibold text-gray-900 text-sm mb-1">
                  {building.nome}
                </h4>
                {building.endereco && (
                  <p className="text-xs text-gray-600 mb-2">
                    {building.endereco}{building.bairro && `, ${building.bairro}`}
                  </p>
                )}
                
                <div className="flex items-center gap-3 text-xs text-gray-600 mb-2">
                  <span>
                    <strong className="text-purple-600">{building.telasSelecionadas}</strong> {building.telasSelecionadas === 1 ? 'tela selecionada' : 'telas selecionadas'}
                  </span>
                  {building.publico_estimado > 0 && (
                    <>
                      <span>•</span>
                      <span>
                        <strong className="text-orange-600">{building.publico_estimado.toLocaleString('pt-BR')}</strong> pessoas/mês
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
