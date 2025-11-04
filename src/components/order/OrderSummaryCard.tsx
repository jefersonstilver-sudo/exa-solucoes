
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

  return (
    <Card>
      <CardHeader>
        <CardTitle>Resumo do Pedido</CardTitle>
      </CardHeader>
      <CardContent>
        <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
          <div className="flex items-center space-x-3">
            <Calendar className="h-8 w-8 text-purple-500" />
            <div>
              <p className="font-medium">Duração do Contrato</p>
              <p className="text-lg">{orderDetails.plano_meses} {orderDetails.plano_meses === 1 ? 'mês' : 'meses'}</p>
            </div>
          </div>

          <div className="flex items-center space-x-3">
            <Calendar className="h-8 w-8 text-orange-500" />
            <div>
              <p className="font-medium">Locais Contratados</p>
              <p className="text-lg">{displayPanels.length} {displayPanels.length === 1 ? 'local' : 'locais'}</p>
            </div>
          </div>
          
          {totalScreens > 0 && (
            <div className="flex items-center space-x-3">
              <Monitor className="h-8 w-8 text-blue-500" />
              <div>
                <p className="font-medium">Total de Telas</p>
                <p className="text-lg">{totalScreens} {totalScreens === 1 ? 'tela' : 'telas'}</p>
              </div>
            </div>
          )}
          
          {totalAudience > 0 && (
            <div className="flex items-center space-x-3">
              <Users className="h-8 w-8 text-green-500" />
              <div>
                <p className="font-medium">Pessoas Impactadas</p>
                <p className="text-lg">{totalAudience.toLocaleString()}/mês</p>
              </div>
            </div>
          )}
        </div>
      </CardContent>
    </Card>
  );
};
