
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
}

export const OrderSummaryCard: React.FC<OrderSummaryCardProps> = ({ 
  orderDetails, 
  displayPanels, 
  isRecovered,
  totalScreens = 0,
  totalAudience = 0
}) => {
  // Calcular exibições
  const exibiçõesPorMês = displayPanels.length * 5000;
  const exibiçõesTotais = exibiçõesPorMês * orderDetails.plano_meses;

  console.log('📊 [ORDER_SUMMARY] Dados recebidos:', {
    plano_meses: orderDetails.plano_meses,
    displayPanels: displayPanels.length,
    totalScreens,
    totalAudience,
    exibiçõesPorMês,
    exibiçõesTotais,
    isRecovered
  });

  return (
    <Card className="shadow-sm">
      <CardHeader className="p-3 sm:p-4 md:p-6 pb-2 sm:pb-3">
        <CardTitle className="text-sm sm:text-base md:text-lg">Resumo do Pedido</CardTitle>
      </CardHeader>
      <CardContent className="p-3 sm:p-4 md:p-6 pt-0">
        <div className="grid grid-cols-2 sm:grid-cols-2 gap-2 sm:gap-3 md:gap-4">
          <div className="flex items-center gap-2 p-2 sm:p-2.5 bg-purple-50 rounded-lg">
            <Calendar className="h-5 w-5 sm:h-6 sm:w-6 md:h-7 md:w-7 text-purple-600 flex-shrink-0" />
            <div className="min-w-0">
              <p className="text-[10px] sm:text-xs font-medium text-purple-600/80">Duração</p>
              <p className="text-sm sm:text-base md:text-lg font-bold text-purple-900 truncate">
                {orderDetails.plano_meses} {orderDetails.plano_meses === 1 ? 'mês' : 'meses'}
              </p>
            </div>
          </div>

          <div className="flex items-center gap-2 p-2 sm:p-2.5 bg-orange-50 rounded-lg">
            <Calendar className="h-5 w-5 sm:h-6 sm:w-6 md:h-7 md:w-7 text-orange-600 flex-shrink-0" />
            <div className="min-w-0">
              <p className="text-[10px] sm:text-xs font-medium text-orange-600/80">Locais</p>
              <p className="text-sm sm:text-base md:text-lg font-bold text-orange-900 truncate">
                {displayPanels.length} {displayPanels.length === 1 ? 'local' : 'locais'}
              </p>
            </div>
          </div>
          
          {totalScreens > 0 && (
            <div className="flex items-center gap-2 p-2 sm:p-2.5 bg-blue-50 rounded-lg">
              <Monitor className="h-5 w-5 sm:h-6 sm:w-6 md:h-7 md:w-7 text-blue-600 flex-shrink-0" />
              <div className="min-w-0">
                <p className="text-[10px] sm:text-xs font-medium text-blue-600/80">Telas</p>
                <p className="text-sm sm:text-base md:text-lg font-bold text-blue-900 truncate">
                  {totalScreens} {totalScreens === 1 ? 'tela' : 'telas'}
                </p>
              </div>
            </div>
          )}
          
          {totalAudience > 0 && (
            <div className="flex items-center gap-2 p-2 sm:p-2.5 bg-green-50 rounded-lg">
              <Users className="h-5 w-5 sm:h-6 sm:w-6 md:h-7 md:w-7 text-green-600 flex-shrink-0" />
              <div className="min-w-0">
                <p className="text-[10px] sm:text-xs font-medium text-green-600/80">Pessoas</p>
                <p className="text-sm sm:text-base md:text-lg font-bold text-green-900 truncate">
                  {totalAudience.toLocaleString()}<span className="text-[10px] sm:text-xs font-normal">/mês</span>
                </p>
              </div>
            </div>
          )}

          <div className="flex items-center gap-2 p-2 sm:p-2.5 bg-indigo-50 rounded-lg">
            <Eye className="h-5 w-5 sm:h-6 sm:w-6 md:h-7 md:w-7 text-indigo-600 flex-shrink-0" />
            <div className="min-w-0">
              <p className="text-[10px] sm:text-xs font-medium text-indigo-600/80">Exibições/mês</p>
              <p className="text-sm sm:text-base md:text-lg font-bold text-indigo-900 truncate">
                {exibiçõesPorMês.toLocaleString()}
              </p>
            </div>
          </div>

          <div className="flex items-center gap-2 p-2 sm:p-2.5 bg-pink-50 rounded-lg">
            <Eye className="h-5 w-5 sm:h-6 sm:w-6 md:h-7 md:w-7 text-pink-600 flex-shrink-0" />
            <div className="min-w-0">
              <p className="text-[10px] sm:text-xs font-medium text-pink-600/80">Exibições Totais</p>
              <p className="text-sm sm:text-base md:text-lg font-bold text-pink-900 truncate">
                {exibiçõesTotais.toLocaleString()}
              </p>
            </div>
          </div>
        </div>
      </CardContent>
    </Card>
  );
};
