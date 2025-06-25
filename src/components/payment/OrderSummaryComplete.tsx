
import React, { useEffect, useState } from 'react';
import { motion } from 'framer-motion';
import { Calendar, MapPin, CreditCard, Clock } from 'lucide-react';
import { formatCurrency } from '@/utils/formatters';
import { supabase } from '@/integrations/supabase/client';

interface OrderSummaryCompleteProps {
  pedidoData: {
    id: string;
    valor_total: number;
    plano_meses: number;
    lista_paineis: string[];
    lista_predios: string[];
    data_inicio: string;
    data_fim: string;
    created_at: string;
  };
}

const OrderSummaryComplete = ({ pedidoData }: OrderSummaryCompleteProps) => {
  const [buildingNames, setBuildingNames] = useState<Record<string, string>>({});
  const [isLoading, setIsLoading] = useState(true);

  // Buscar nomes dos prédios
  useEffect(() => {
    const fetchBuildingNames = async () => {
      if (!pedidoData.lista_predios || pedidoData.lista_predios.length === 0) {
        setIsLoading(false);
        return;
      }

      try {
        const { data: buildings, error } = await supabase
          .from('buildings')
          .select('id, name')
          .in('id', pedidoData.lista_predios);

        if (!error && buildings) {
          const namesMap: Record<string, string> = {};
          buildings.forEach(building => {
            namesMap[building.id] = building.name;
          });
          setBuildingNames(namesMap);
        }
      } catch (error) {
        console.error('Erro ao buscar nomes dos prédios:', error);
      } finally {
        setIsLoading(false);
      }
    };

    fetchBuildingNames();
  }, [pedidoData.lista_predios]);

  const getPlanName = (months: number) => {
    switch (months) {
      case 1: return 'Plano Básico';
      case 3: return 'Plano Popular';
      case 6: return 'Plano Profissional';
      case 12: return 'Plano Empresarial';
      default: return `Plano ${months} mês${months > 1 ? 'es' : ''}`;
    }
  };

  const formatDate = (dateString: string) => {
    return new Date(dateString).toLocaleDateString('pt-BR');
  };

  const valorComDesconto = pedidoData.valor_total * 0.95;

  if (isLoading) {
    return (
      <div className="bg-white rounded-xl shadow-lg p-6 border">
        <div className="animate-pulse space-y-4">
          <div className="h-4 bg-gray-200 rounded w-3/4"></div>
          <div className="h-4 bg-gray-200 rounded w-1/2"></div>
          <div className="h-4 bg-gray-200 rounded w-2/3"></div>
        </div>
      </div>
    );
  }

  return (
    <motion.div
      initial={{ opacity: 0, scale: 0.95 }}
      animate={{ opacity: 1, scale: 1 }}
      className="bg-white rounded-xl shadow-lg p-6 border"
    >
      <h3 className="text-lg font-bold text-gray-800 mb-4">
        📋 Resumo do Pedido
      </h3>

      <div className="space-y-4">
        {/* Plano Selecionado */}
        <div className="bg-blue-50 rounded-lg p-4 border border-blue-200">
          <div className="flex items-center space-x-2 mb-2">
            <Calendar className="h-4 w-4 text-blue-600" />
            <span className="font-medium text-blue-800">Plano Selecionado</span>
          </div>
          <p className="font-bold text-blue-900">
            {getPlanName(pedidoData.plano_meses)}
          </p>
          <p className="text-sm text-blue-700">
            Duração: {pedidoData.plano_meses} mês{pedidoData.plano_meses > 1 ? 'es' : ''}
          </p>
        </div>

        {/* Período */}
        <div className="grid grid-cols-2 gap-3">
          <div className="bg-green-50 rounded-lg p-3 border border-green-200">
            <div className="flex items-center space-x-1 mb-1">
              <Clock className="h-3 w-3 text-green-600" />
              <span className="text-xs text-green-700">Início</span>
            </div>
            <p className="font-semibold text-green-800 text-sm">
              {formatDate(pedidoData.data_inicio)}
            </p>
          </div>
          
          <div className="bg-orange-50 rounded-lg p-3 border border-orange-200">
            <div className="flex items-center space-x-1 mb-1">
              <Clock className="h-3 w-3 text-orange-600" />
              <span className="text-xs text-orange-700">Fim</span>
            </div>
            <p className="font-semibold text-orange-800 text-sm">
              {formatDate(pedidoData.data_fim)}
            </p>
          </div>
        </div>

        {/* Prédios/Painéis */}
        <div className="bg-purple-50 rounded-lg p-4 border border-purple-200">
          <div className="flex items-center space-x-2 mb-2">
            <MapPin className="h-4 w-4 text-purple-600" />
            <span className="font-medium text-purple-800">Locais Selecionados</span>
          </div>
          <div className="space-y-1">
            {pedidoData.lista_predios && pedidoData.lista_predios.length > 0 ? (
              pedidoData.lista_predios.map((predioId, index) => (
                <div key={predioId} className="flex items-center space-x-2">
                  <div className="w-1.5 h-1.5 bg-purple-500 rounded-full"></div>
                  <span className="text-purple-700 text-sm">
                    {buildingNames[predioId] || `Prédio ${index + 1}`}
                  </span>
                </div>
              ))
            ) : (
              <p className="text-purple-600 text-sm">
                {pedidoData.lista_paineis.length} painel{pedidoData.lista_paineis.length > 1 ? 'éis' : ''} selecionado{pedidoData.lista_paineis.length > 1 ? 's' : ''}
              </p>
            )}
          </div>
        </div>

        {/* Valores */}
        <div className="bg-gray-50 rounded-lg p-4 border border-gray-200">
          <div className="flex items-center space-x-2 mb-3">
            <CreditCard className="h-4 w-4 text-gray-600" />
            <span className="font-medium text-gray-800">Valores</span>
          </div>
          
          <div className="space-y-2 text-sm">
            <div className="flex justify-between">
              <span className="text-gray-600">Valor Original:</span>
              <span className="font-semibold text-gray-800">
                {formatCurrency(pedidoData.valor_total)}
              </span>
            </div>
            
            <div className="flex justify-between text-green-600">
              <span>Desconto PIX (5%):</span>
              <span className="font-semibold">
                -{formatCurrency(pedidoData.valor_total * 0.05)}
              </span>
            </div>
            
            <div className="border-t pt-2">
              <div className="flex justify-between">
                <span className="font-bold text-gray-800">Total PIX:</span>
                <span className="text-lg font-bold text-green-600">
                  {formatCurrency(valorComDesconto)}
                </span>
              </div>
            </div>
          </div>
        </div>

        {/* Info do pedido */}
        <div className="text-center text-xs text-gray-500 space-y-1">
          <p>Pedido #{pedidoData.id.slice(0, 8)}</p>
          <p>Criado em {formatDate(pedidoData.created_at)}</p>
        </div>
      </div>
    </motion.div>
  );
};

export default OrderSummaryComplete;
