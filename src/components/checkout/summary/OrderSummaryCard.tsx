
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

  // Agrupar painéis por prédio
  const paineisPorPredio = cartItems.reduce((acc, item) => {
    const buildingId = item.panel.buildings?.id || 'unknown';
    const buildingName = item.panel.buildings?.nome || 'Prédio não identificado';
    
    if (!acc[buildingId]) {
      acc[buildingId] = {
        nome: buildingName,
        endereco: item.panel.buildings?.endereco || '',
        bairro: item.panel.buildings?.bairro || '',
        numero_elevadores: item.panel.buildings?.numero_elevadores || 0,
        publico_estimado: item.panel.buildings?.publico_estimado || 0,
        paineis: []
      };
    }
    
    acc[buildingId].paineis.push(item.panel);
    return acc;
  }, {} as Record<string, any>);

  // Calcular público total
  const publicoTotal = Object.values(paineisPorPredio).reduce((total, building: any) => {
    return total + (building.publico_estimado || 0);
  }, 0);

  return (
    <motion.div
      initial={{ opacity: 0, y: 20 }}
      animate={{ opacity: 1, y: 0 }}
      className="space-y-6"
    >
      {/* Header Card */}
      <Card className="overflow-hidden shadow-lg border-0 bg-gradient-to-br from-white to-gray-50">
        <CardHeader className="bg-gradient-to-r from-[#3C1361] to-purple-700 text-white p-6">
          <CardTitle className="flex items-center text-xl font-bold">
            <Building2 className="h-6 w-6 mr-3" />
            Resumo da Sua Campanha
          </CardTitle>
          <p className="text-purple-100 mt-2">
            Confira todos os detalhes da sua campanha publicitária
          </p>
        </CardHeader>
        
        <CardContent className="p-6">
          <div className="grid grid-cols-1 md:grid-cols-3 gap-6 mb-6">
            {/* Total de Painéis */}
            <div className="flex items-center space-x-3 p-4 bg-blue-50 rounded-lg border border-blue-200">
              <div className="p-2 bg-blue-100 rounded-full">
                <Monitor className="h-5 w-5 text-blue-600" />
              </div>
              <div>
                <p className="text-sm text-blue-600 font-medium">Total de Painéis</p>
                <p className="text-xl font-bold text-blue-800">{cartItems.length}</p>
              </div>
            </div>

            {/* Duração */}
            <div className="flex items-center space-x-3 p-4 bg-green-50 rounded-lg border border-green-200">
              <div className="p-2 bg-green-100 rounded-full">
                <Clock className="h-5 w-5 text-green-600" />
              </div>
              <div>
                <p className="text-sm text-green-600 font-medium">Duração</p>
                <p className="text-xl font-bold text-green-800">
                  {selectedPlan} {selectedPlan === 1 ? 'mês' : 'meses'}
                </p>
              </div>
            </div>

            {/* Período */}
            <div className="flex items-center space-x-3 p-4 bg-purple-50 rounded-lg border border-purple-200">
              <div className="p-2 bg-purple-100 rounded-full">
                <Calendar className="h-5 w-5 text-purple-600" />
              </div>
              <div>
                <p className="text-sm text-purple-600 font-medium">Período</p>
                <p className="text-sm font-bold text-purple-800">
                  {formatDate(dataInicio)} até {formatDate(dataFim)}
                </p>
              </div>
            </div>
          </div>

          {/* Público Total */}
          {publicoTotal > 0 && (
            <div className="mt-4 p-4 bg-gradient-to-r from-orange-50 to-amber-50 rounded-lg border border-orange-200">
              <p className="text-sm text-orange-700 font-medium mb-1">Público Alvo Total Estimado</p>
              <p className="text-2xl font-bold text-orange-900">
                {publicoTotal.toLocaleString('pt-BR')} pessoas/mês
              </p>
            </div>
          )}
        </CardContent>
      </Card>

      {/* Painéis por Prédio */}
      <div className="space-y-4">
        <h3 className="text-lg font-semibold text-gray-900 mb-4">
          Locais Selecionados
        </h3>
        
        {Object.entries(paineisPorPredio).map(([buildingId, building]: [string, any]) => (
          <motion.div
            key={buildingId}
            initial={{ opacity: 0, x: -20 }}
            animate={{ opacity: 1, x: 0 }}
            transition={{ delay: 0.1 }}
          >
            <Card className="border border-gray-200 hover:shadow-md transition-shadow">
              <CardContent className="p-4">
                <div className="flex items-start space-x-3">
                  <div className="p-2 bg-gray-100 rounded-full flex-shrink-0">
                    <Building2 className="h-5 w-5 text-gray-600" />
                  </div>
                  <div className="flex-1">
                    <h4 className="font-semibold text-gray-900 mb-1">
                      {building.nome}
                    </h4>
                    {building.endereco && (
                      <div className="flex items-center text-sm text-gray-600 mb-2">
                        <MapPin className="h-4 w-4 mr-1" />
                        <span>{building.endereco}</span>
                        {building.bairro && <span>, {building.bairro}</span>}
                      </div>
                    )}
                    
                    {/* Quantidade de telas e público */}
                    <div className="grid grid-cols-2 gap-3 mb-3">
                      <div className="flex items-center space-x-2 text-sm">
                        <Monitor className="h-4 w-4 text-blue-600" />
                        <span className="text-gray-700">
                          <span className="font-semibold text-blue-600">{building.numero_elevadores || 0}</span> telas
                        </span>
                      </div>
                      {building.publico_estimado > 0 && (
                        <div className="flex items-center space-x-2 text-sm">
                          <span className="text-gray-700">
                            <span className="font-semibold text-orange-600">
                              {building.publico_estimado.toLocaleString('pt-BR')}
                            </span> pessoas/mês
                          </span>
                        </div>
                      )}
                    </div>

                    <div className="flex items-center justify-between">
                      <span className="text-sm font-medium text-blue-600">
                        {building.paineis.length} {building.paineis.length === 1 ? 'painel selecionado' : 'painéis selecionados'}
                      </span>
                      <div className="flex space-x-1">
                        {building.paineis.map((painel: any, index: number) => (
                          <div
                            key={painel.id}
                            className="w-6 h-6 bg-gradient-to-br from-[#3C1361] to-purple-600 rounded text-white text-xs flex items-center justify-center font-bold"
                            title={`Painel ${painel.code || `#${index + 1}`}`}
                          >
                            {index + 1}
                          </div>
                        ))}
                      </div>
                    </div>
                  </div>
                </div>
              </CardContent>
            </Card>
          </motion.div>
        ))}
      </div>
    </motion.div>
  );
};

export default OrderSummaryCard;
