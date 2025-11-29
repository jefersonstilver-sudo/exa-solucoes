
import React from 'react';
import { 
  DollarSign, 
  Calendar,
  Monitor,
  Users,
  Eye
} from 'lucide-react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';

interface OrderSummaryCardProps {
  orderDetails: {
    plano_meses: number;
  };
  displayPanels: string[];
  isRecovered?: boolean;
  totalScreens?: number;
  totalAudience?: number;
  totalVisualizacoesMes?: number;
}

export const OrderSummaryCard: React.FC<OrderSummaryCardProps> = ({ 
  orderDetails, 
  displayPanels, 
  isRecovered,
  totalScreens = 0,
  totalAudience = 0,
  totalVisualizacoesMes = 0
}) => {
  // Usar dados reais ou fallback para cálculo estimado
  const exibiçõesPorMês = totalVisualizacoesMes > 0 
    ? totalVisualizacoesMes 
    : displayPanels.length * 5000;
  const exibiçõesTotais = exibiçõesPorMês * orderDetails.plano_meses;

  console.log('📊 [ORDER_SUMMARY] Dados recebidos:', {
    plano_meses: orderDetails.plano_meses,
    displayPanels: displayPanels.length,
    totalScreens,
    totalAudience,
    totalVisualizacoesMes,
    exibiçõesPorMês,
    exibiçõesTotais,
    isRecovered
  });

  return (
    <Card className="bg-white border border-gray-200 rounded-xl shadow-sm">
      <CardHeader className="p-4 pb-2">
        <CardTitle className="text-base font-semibold text-gray-900">
          Resumo do Pedido
        </CardTitle>
      </CardHeader>
      <CardContent className="p-4 pt-2">
        <div className="grid grid-cols-2 gap-3">
          <div className="flex items-center gap-3 p-3 bg-gray-50 rounded-lg border border-gray-100">
            <div className="w-9 h-9 rounded-lg bg-gray-200/60 flex items-center justify-center flex-shrink-0">
              <Calendar className="h-4 w-4 text-gray-600" />
            </div>
            <div className="min-w-0">
              <p className="text-xs text-gray-500 font-medium">Duração</p>
              <p className="text-base font-semibold text-gray-900 truncate">
                {orderDetails.plano_meses} {orderDetails.plano_meses === 1 ? 'mês' : 'meses'}
              </p>
            </div>
          </div>

          <div className="flex items-center gap-3 p-3 bg-gray-50 rounded-lg border border-gray-100">
            <div className="w-9 h-9 rounded-lg bg-gray-200/60 flex items-center justify-center flex-shrink-0">
              <Monitor className="h-4 w-4 text-gray-600" />
            </div>
            <div className="min-w-0">
              <p className="text-xs text-gray-500 font-medium">Locais</p>
              <p className="text-base font-semibold text-gray-900 truncate">
                {displayPanels.length} {displayPanels.length === 1 ? 'local' : 'locais'}
              </p>
            </div>
          </div>
          
          {totalScreens > 0 && (
            <div className="flex items-center gap-3 p-3 bg-gray-50 rounded-lg border border-gray-100">
              <div className="w-9 h-9 rounded-lg bg-gray-200/60 flex items-center justify-center flex-shrink-0">
                <Monitor className="h-4 w-4 text-gray-600" />
              </div>
              <div className="min-w-0">
                <p className="text-xs text-gray-500 font-medium">Telas</p>
                <p className="text-base font-semibold text-gray-900 truncate">
                  {totalScreens} {totalScreens === 1 ? 'tela' : 'telas'}
                </p>
              </div>
            </div>
          )}
          
          {totalAudience > 0 && (
            <div className="flex items-center gap-3 p-3 bg-gray-50 rounded-lg border border-gray-100">
              <div className="w-9 h-9 rounded-lg bg-gray-200/60 flex items-center justify-center flex-shrink-0">
                <Users className="h-4 w-4 text-gray-600" />
              </div>
              <div className="min-w-0">
                <p className="text-xs text-gray-500 font-medium">Pessoas</p>
                <p className="text-base font-semibold text-gray-900 truncate">
                  {totalAudience.toLocaleString()}<span className="text-xs font-normal text-gray-500">/mês</span>
                </p>
              </div>
            </div>
          )}

          <div className="flex items-center gap-3 p-3 bg-gray-50 rounded-lg border border-gray-100">
            <div className="w-9 h-9 rounded-lg bg-gray-200/60 flex items-center justify-center flex-shrink-0">
              <Eye className="h-4 w-4 text-gray-600" />
            </div>
            <div className="min-w-0">
              <p className="text-xs text-gray-500 font-medium">Exibições/mês</p>
              <p className="text-base font-semibold text-gray-900 truncate">
                {exibiçõesPorMês.toLocaleString('pt-BR')}
              </p>
            </div>
          </div>

          <div className="col-span-2 flex items-center gap-3 p-3 bg-gray-50 rounded-lg border border-gray-100">
            <div className="w-9 h-9 rounded-lg bg-gray-200/60 flex items-center justify-center flex-shrink-0">
              <Eye className="h-4 w-4 text-gray-600" />
            </div>
            <div className="min-w-0">
              <p className="text-xs text-gray-500 font-medium">Exibições Totais</p>
              <p className="text-xl font-bold text-gray-900 truncate">
                {exibiçõesTotais.toLocaleString('pt-BR')}
              </p>
            </div>
          </div>
        </div>
      </CardContent>
    </Card>
  );
};
