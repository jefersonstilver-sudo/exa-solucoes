
import { motion } from 'framer-motion';
import { useState } from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Building2, Calendar, MapPin, Monitor, Clock, Users, ChevronDown } from 'lucide-react';
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
  // Todos os prédios começam recolhidos (collapsed)
  const [expandedBuildings, setExpandedBuildings] = useState<Record<string, boolean>>({});
  
  console.log('[OrderSummaryCard] Debug:', {
    cartItemsCount: cartItems?.length || 0,
    selectedPlan,
    cartItems: cartItems?.map(item => ({
      panelId: item.panel.id,
      buildingName: item.panel.buildings?.nome,
      endereco: item.panel.buildings?.endereco,
      quantidadeTelas: item.panel.buildings?.quantidade_telas,
      numeroElevadores: item.panel.buildings?.numero_elevadores
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

  // Agrupar painéis por prédio - GARANTIR que número de telas vem do banco
  const paineisPorPredio = cartItems.reduce((acc, item) => {
    const buildingId = item.panel.buildings?.id || 'unknown';
    const buildingName = item.panel.buildings?.nome || 'Prédio não identificado';
    
    if (!acc[buildingId]) {
      // CRÍTICO: Usar quantidade_telas do banco, se 0 usar numero_elevadores como fallback
      const quantidadeTelasDB = item.panel.buildings?.quantidade_telas || 0;
      const numeroElevadores = item.panel.buildings?.numero_elevadores || 0;
      const quantidadeTelasReal = quantidadeTelasDB > 0 ? quantidadeTelasDB : numeroElevadores;
      
      console.log(`[OrderSummaryCard] Prédio ${buildingName}:`, {
        quantidade_telas_banco: quantidadeTelasDB,
        numero_elevadores: numeroElevadores,
        quantidadeTelasUsada: quantidadeTelasReal
      });
      
      acc[buildingId] = {
        nome: buildingName,
        endereco: item.panel.buildings?.endereco || '',
        bairro: item.panel.buildings?.bairro || '',
        cidade: item.panel.buildings?.cidade || '',
        estado: item.panel.buildings?.estado || '',
        publico_estimado: item.panel.buildings?.publico_estimado || 0,
        // USAR quantidade_telas se preenchido, senão usar numero_elevadores
        quantidadeTelas: quantidadeTelasReal
      };
    }
    
    return acc;
  }, {} as Record<string, any>);

  // Calcular público total e exibições
  const publicoTotal = Object.values(paineisPorPredio).reduce((total, building: any) => {
    return total + (building.publico_estimado || 0);
  }, 0);

  // Calcular exibições totais (usando visualizacoes_mes dos prédios)
  const exibicoesPorMes = cartItems.reduce((total, item) => {
    const visualizacoes = item.panel.buildings?.visualizacoes_mes || 0;
    return total + visualizacoes;
  }, 0);

  return (
    <div className="space-y-3 sm:space-y-4">
      {/* Header Card */}
      <Card className="shadow-2xl border rounded-2xl">
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

          {/* Exibições por Mês */}
          {exibicoesPorMes > 0 && (
            <div className="p-2 sm:p-3 bg-purple-50 rounded-lg border border-purple-200">
              <p className="text-[10px] sm:text-xs text-purple-700 font-medium">Exibições por Mês</p>
              <p className="text-base sm:text-lg font-bold text-purple-900">
                {exibicoesPorMes.toLocaleString('pt-BR')} exibições/mês
              </p>
            </div>
          )}
        </CardContent>
      </Card>

      {/* Painéis por Prédio - Accordion (Inicia Recolhido) */}
      <div className="space-y-2 sm:space-y-3">
        <div className="flex items-center justify-between px-1">
          <h3 className="text-xs sm:text-base font-semibold text-gray-900">
            Locais Selecionados ({Object.keys(paineisPorPredio).length})
          </h3>
          <p className="text-[10px] sm:text-xs text-gray-500">
            Clique para ver detalhes
          </p>
        </div>
        
        {Object.entries(paineisPorPredio).map(([buildingId, building]: [string, any]) => {
          const isExpanded = expandedBuildings[buildingId] || false;
          
          return (
            <motion.div 
              key={buildingId} 
              className="bg-white border border-gray-200 rounded-xl shadow-sm hover:shadow-md transition-all overflow-hidden"
            >
              {/* Header - Sempre Visível (Clicável) */}
              <button
                onClick={() => setExpandedBuildings(prev => ({ ...prev, [buildingId]: !prev[buildingId] }))}
                className="w-full p-3 sm:p-4 text-left hover:bg-gray-50 transition-colors"
              >
                <div className="flex items-center justify-between mb-2">
                  <div className="flex items-center space-x-2 flex-1 min-w-0">
                    <Building2 className="h-4 w-4 sm:h-5 sm:w-5 text-[#9C1E1E] flex-shrink-0" />
                    <h4 className="font-semibold text-gray-900 text-sm sm:text-base truncate">
                      {building.nome}
                    </h4>
                  </div>
                  <motion.div
                    animate={{ rotate: isExpanded ? 180 : 0 }}
                    transition={{ duration: 0.2 }}
                    className="flex-shrink-0"
                  >
                    <ChevronDown className="h-4 w-4 sm:h-5 sm:w-5 text-gray-400" />
                  </motion.div>
                </div>
                
                {/* Info Compacta - Sempre Visível */}
                <div className="flex items-center gap-3 sm:gap-4 text-xs sm:text-sm">
                  <div className="flex items-center gap-1.5 text-blue-600">
                    <Monitor className="h-3.5 w-3.5" />
                    <span className="font-semibold">{building.quantidadeTelas}</span>
                    <span className="text-gray-600">{building.quantidadeTelas === 1 ? 'tela' : 'telas'}</span>
                  </div>
                  
                  {building.publico_estimado > 0 && (
                    <div className="flex items-center gap-1.5 text-orange-600">
                      <Users className="h-3.5 w-3.5" />
                      <span className="font-semibold">{building.publico_estimado.toLocaleString('pt-BR')}</span>
                      <span className="text-gray-600">pessoas/mês</span>
                    </div>
                  )}
                </div>
              </button>
              
              {/* Detalhes Expandidos - Condicional */}
              {isExpanded && (
                <motion.div
                  initial={{ opacity: 0, height: 0 }}
                  animate={{ opacity: 1, height: 'auto' }}
                  exit={{ opacity: 0, height: 0 }}
                  transition={{ duration: 0.2 }}
                  className="overflow-hidden"
                >
                  <div className="px-3 sm:px-4 pb-3 sm:pb-4 pt-0 border-t border-gray-100">
                    <div className="flex items-start space-x-1.5 mt-3">
                      <MapPin className="h-3.5 w-3.5 text-gray-400 mt-0.5 flex-shrink-0" />
                      <p className="text-xs sm:text-sm text-gray-600 leading-relaxed">
                        {building.endereco}
                        {building.bairro && `, ${building.bairro}`}
                        {building.cidade && ` - ${building.cidade}`}
                        {building.estado && `/${building.estado}`}
                      </p>
                    </div>
                  </div>
                </motion.div>
              )}
            </motion.div>
          );
        })}
      </div>
    </div>
  );
};

export default OrderSummaryCard;
