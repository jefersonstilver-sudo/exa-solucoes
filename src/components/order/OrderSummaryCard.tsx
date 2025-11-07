
import React from 'react';
import { 
  DollarSign, 
  Calendar,
  Monitor,
  Users
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

  console.log('📊 [ORDER_SUMMARY] Dados recebidos:', {
    plano_meses: orderDetails.plano_meses,
    displayPanels: displayPanels.length,
    totalScreens,
    totalAudience,
    isRecovered
  });

  return (
    <Card>
      <CardHeader>
        <CardTitle>Resumo do Pedido</CardTitle>
      </CardHeader>
      <CardContent>
        <div className="grid grid-cols-1 sm:grid-cols-2 gap-4 md:gap-6">
          <div className="flex items-center space-x-3 p-3 bg-purple-50 rounded-lg">
            <Calendar className="h-8 w-8 text-purple-600 flex-shrink-0" />
            <div>
              <p className="text-sm font-medium text-gray-600">Duração do Contrato</p>
              <p className="text-xl font-bold text-gray-900">
                {orderDetails.plano_meses} {orderDetails.plano_meses === 1 ? 'mês' : 'meses'}
              </p>
            </div>
          </div>

          <div className="flex items-center space-x-3 p-3 bg-orange-50 rounded-lg">
            <Calendar className="h-8 w-8 text-orange-600 flex-shrink-0" />
            <div>
              <p className="text-sm font-medium text-gray-600">Locais Contratados</p>
              <p className="text-xl font-bold text-gray-900">
                {displayPanels.length} {displayPanels.length === 1 ? 'local' : 'locais'}
              </p>
            </div>
          </div>
          
          {totalScreens > 0 && (
            <div className="flex items-center space-x-3 p-3 bg-blue-50 rounded-lg">
              <Monitor className="h-8 w-8 text-blue-600 flex-shrink-0" />
              <div>
                <p className="text-sm font-medium text-gray-600">Total de Telas</p>
                <p className="text-xl font-bold text-gray-900">
                  {totalScreens} {totalScreens === 1 ? 'tela' : 'telas'}
                </p>
              </div>
            </div>
          )}
          
          {totalAudience > 0 && (
            <div className="flex items-center space-x-3 p-3 bg-green-50 rounded-lg">
              <Users className="h-8 w-8 text-green-600 flex-shrink-0" />
              <div>
                <p className="text-sm font-medium text-gray-600">Pessoas Impactadas</p>
                <p className="text-xl font-bold text-gray-900">
                  {totalAudience.toLocaleString()}<span className="text-sm font-normal">/mês</span>
                </p>
              </div>
            </div>
          )}
        </div>
      </CardContent>
    </Card>
  );
};
