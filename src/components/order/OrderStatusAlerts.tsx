
import React from 'react';
import { Monitor, AlertCircle } from 'lucide-react';
import { Card, CardContent } from '@/components/ui/card';

interface OrderStatusAlertsProps {
  isRecovered?: boolean;
  enhancedError?: string | null;
  videosLoadError?: string | null;
}

export const OrderStatusAlerts: React.FC<OrderStatusAlertsProps> = ({
  isRecovered,
  enhancedError,
  videosLoadError
}) => {
  return (
    <>
      {/* Alerta de recuperação de dados */}
      {isRecovered && (
        <Card className="border-blue-200 bg-blue-50">
          <CardContent className="p-4">
            <div className="flex items-center space-x-3">
              <Monitor className="h-6 w-6 text-blue-600" />
              <div>
                <h3 className="font-medium text-blue-800">Dados Recuperados</h3>
                <p className="text-sm text-blue-700 mt-1">
                  Os locais selecionados foram recuperados automaticamente do sistema anterior.
                </p>
              </div>
            </div>
          </CardContent>
        </Card>
      )}

      {/* Error de dados aprimorados */}
      {enhancedError && (
        <Card className="border-yellow-200 bg-yellow-50">
          <CardContent className="p-4">
            <div className="flex items-center space-x-3">
              <AlertCircle className="h-6 w-6 text-yellow-600" />
              <div>
                <h3 className="font-medium text-yellow-800">Aviso de Recuperação</h3>
                <p className="text-sm text-yellow-700 mt-1">
                  Não foi possível recuperar alguns dados automaticamente: {enhancedError}
                </p>
              </div>
            </div>
          </CardContent>
        </Card>
      )}

      {/* Error de carregamento de vídeos */}
      {videosLoadError && (
        <Card className="border-red-200 bg-red-50">
          <CardContent className="p-4">
            <div className="flex items-center space-x-3">
              <AlertCircle className="h-6 w-6 text-red-600" />
              <div>
                <h3 className="font-medium text-red-800">Erro ao Carregar Vídeos</h3>
                <p className="text-sm text-red-700 mt-1">{videosLoadError}</p>
              </div>
            </div>
          </CardContent>
        </Card>
      )}
    </>
  );
};
