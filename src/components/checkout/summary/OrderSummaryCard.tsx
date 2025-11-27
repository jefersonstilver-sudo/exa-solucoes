
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
  const [isListOpen, setIsListOpen] = useState(false);
  
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

      {/* Accordion Principal - Lista de Prédios */}
      <div className="space-y-2">
        <button
          onClick={() => setIsListOpen(!isListOpen)}
          className="w-full bg-gradient-to-r from-orange-50 to-orange-100/50 hover:from-orange-100 hover:to-orange-100 transition-colors rounded-lg p-3 sm:p-4 border border-orange-200"
        >
          <div className="flex items-center justify-between">
            <div className="flex items-center space-x-2 sm:space-x-3">
              <div className="flex-shrink-0 bg-orange-600 rounded-full p-1.5 sm:p-2">
                <MapPin className="h-3.5 w-3.5 sm:h-4 sm:w-4 text-white" />
              </div>
              <div className="text-left">
                <h3 className="text-xs sm:text-sm font-semibold text-gray-900">
                  Locais Selecionados ({Object.keys(paineisPorPredio).length})
                </h3>
                <p className="text-[10px] sm:text-xs text-gray-600">
                  {isListOpen ? 'Ocultar detalhes' : 'Ver detalhes dos prédios'}
                </p>
              </div>
            </div>
            <ChevronDown 
              className={`h-4 w-4 sm:h-5 sm:w-5 text-orange-600 transition-transform flex-shrink-0 ${
                isListOpen ? 'rotate-180' : ''
              }`}
            />
          </div>
        </button>
        
        {isListOpen && (
          <motion.div
            initial={{ opacity: 0, height: 0 }}
            animate={{ opacity: 1, height: 'auto' }}
            exit={{ opacity: 0, height: 0 }}
            transition={{ duration: 0.3 }}
            className="overflow-hidden space-y-2"
          >
            {Object.entries(paineisPorPredio).map(([buildingId, building]: [string, any]) => (
              <div
                key={buildingId}
                className="border border-gray-200 rounded-lg p-3 sm:p-4 bg-white hover:shadow-sm transition-shadow"
              >
                <div className="flex items-center space-x-2 sm:space-x-3">
                  <div className="flex-shrink-0">
                    <Building2 className="h-4 w-4 sm:h-5 sm:w-5 text-orange-600" />
                  </div>
                  <div className="flex-1 min-w-0">
                    <h4 className="text-xs sm:text-sm font-semibold text-gray-900 truncate">
                      {building.nome}
                    </h4>
                    <div className="flex flex-wrap items-center gap-x-3 gap-y-1 mt-1">
                      <div className="flex items-center space-x-1">
                        <Monitor className="h-3 w-3 text-gray-400" />
                        <span className="text-[10px] sm:text-xs text-gray-600">
                          {building.quantidadeTelas} {building.quantidadeTelas === 1 ? 'tela' : 'telas'}
                        </span>
                      </div>
                      <div className="flex items-center space-x-1">
                        <Users className="h-3 w-3 text-gray-400" />
                        <span className="text-[10px] sm:text-xs text-gray-600">
                          {building.publico_estimado.toLocaleString()} pessoas/mês
                        </span>
                      </div>
                    </div>
                  </div>
                </div>
              </div>
            ))}
          </motion.div>
        )}
      </div>
    </div>
  );
};

export default OrderSummaryCard;
