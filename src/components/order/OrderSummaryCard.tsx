
import React from 'react';
import { 
  DollarSign, 
  MapPin, 
  Calendar 
} from 'lucide-react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { LocationsTooltip } from './LocationsTooltip';

interface OrderSummaryCardProps {
  orderDetails: {
    valor_total: number;
    plano_meses: number;
    created_at: string;
  };
  displayPanels: string[];
  isRecovered?: boolean;
}

export const OrderSummaryCard: React.FC<OrderSummaryCardProps> = ({ 
  orderDetails, 
  displayPanels, 
  isRecovered 
}) => {
  const formatCurrency = (value: number) => {
    return new Intl.NumberFormat('pt-BR', {
      style: 'currency',
      currency: 'BRL'
    }).format(value);
  };

  const formatDate = (dateString: string) => {
    return new Date(dateString).toLocaleDateString('pt-BR');
  };

  const panelsCount = displayPanels.length;

  return (
    <Card>
      <CardHeader>
        <CardTitle>Resumo do Pedido</CardTitle>
      </CardHeader>
      <CardContent>
        <div className="grid grid-cols-1 md:grid-cols-4 gap-6">
          <div className="flex items-center space-x-3">
            <DollarSign className="h-8 w-8 text-green-500" />
            <div>
              <p className="font-medium">Valor Total</p>
              <p className="text-lg">{formatCurrency(orderDetails.valor_total)}</p>
            </div>
          </div>
          
          <LocationsTooltip listaPaineis={displayPanels}>
            <div className="flex items-center space-x-3 cursor-pointer hover:bg-gray-50 rounded-lg p-2 transition-colors">
              <MapPin className="h-8 w-8 text-blue-500" />
              <div>
                <p className="font-medium">Locais</p>
                <p className="text-lg">
                  {panelsCount} selecionados
                  {isRecovered && (
                    <span className="text-xs text-blue-600 ml-1">(recuperados)</span>
                  )}
                </p>
              </div>
            </div>
          </LocationsTooltip>
          
          <div className="flex items-center space-x-3">
            <Calendar className="h-8 w-8 text-purple-500" />
            <div>
              <p className="font-medium">Duração</p>
              <p className="text-lg">{orderDetails.plano_meses} meses</p>
            </div>
          </div>

          <div className="flex items-center space-x-3">
            <Calendar className="h-8 w-8 text-orange-500" />
            <div>
              <p className="font-medium">Criado em</p>
              <p className="text-lg">{formatDate(orderDetails.created_at)}</p>
            </div>
          </div>
        </div>
      </CardContent>
    </Card>
  );
};
