
import React from 'react';
import { AlertTriangle, Clock, CheckCircle, XCircle, PlayCircle } from 'lucide-react';
import { Card, CardContent } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';

interface ContractStatusAlertProps {
  isActive: boolean;
  isExpired: boolean;
  isNearExpiration: boolean;
  daysRemaining: number;
  expiryDate: string | null;
  hasStarted?: boolean;
}

export const ContractStatusAlert: React.FC<ContractStatusAlertProps> = ({
  isActive,
  isExpired,
  isNearExpiration,
  daysRemaining,
  expiryDate,
  hasStarted = true
}) => {
  if (isExpired) {
    return (
      <Card className="border-red-200 bg-red-50">
        <CardContent className="p-4">
          <div className="flex items-center justify-between">
            <div className="flex items-center space-x-3">
              <XCircle className="h-6 w-6 text-red-600" />
              <div>
                <h3 className="font-medium text-red-800">Contrato Expirado</h3>
                <p className="text-sm text-red-700 mt-1">
                  Este contrato expirou em {expiryDate && new Date(expiryDate).toLocaleDateString('pt-BR')}. 
                  Os vídeos foram automaticamente bloqueados.
                </p>
              </div>
            </div>
            <div className="flex flex-col items-end space-y-2">
              <Badge variant="destructive">EXPIRADO</Badge>
              <Button size="sm" variant="outline" className="border-red-300 text-red-700">
                Renovar Contrato
              </Button>
            </div>
          </div>
        </CardContent>
      </Card>
    );
  }

  if (!hasStarted) {
    return (
      <Card className="border-blue-200 bg-blue-50">
        <CardContent className="p-4">
          <div className="flex items-center justify-between">
            <div className="flex items-center space-x-3">
              <Clock className="h-6 w-6 text-blue-600" />
              <div>
                <h3 className="font-medium text-blue-800">Contrato Aguardando Ativação</h3>
                <p className="text-sm text-blue-700 mt-1">
                  O contrato será iniciado automaticamente quando seu vídeo for aprovado pela nossa equipe.
                </p>
              </div>
            </div>
            <Badge variant="secondary" className="bg-blue-100 text-blue-800">
              AGUARDANDO
            </Badge>
          </div>
        </CardContent>
      </Card>
    );
  }

  if (isNearExpiration) {
    return (
      <Card className="border-yellow-200 bg-yellow-50">
        <CardContent className="p-4">
          <div className="flex items-center justify-between">
            <div className="flex items-center space-x-3">
              <AlertTriangle className="h-6 w-6 text-yellow-600" />
              <div>
                <h3 className="font-medium text-yellow-800">Contrato Próximo da Expiração</h3>
                <p className="text-sm text-yellow-700 mt-1">
                  Seu contrato expira em {daysRemaining} dia{daysRemaining !== 1 ? 's' : ''} 
                  ({expiryDate && new Date(expiryDate).toLocaleDateString('pt-BR')}).
                </p>
              </div>
            </div>
            <div className="flex flex-col items-end space-y-2">
              <Badge variant="secondary" className="bg-yellow-100 text-yellow-800">
                {daysRemaining} DIAS RESTANTES
              </Badge>
              <Button size="sm" variant="outline" className="border-yellow-300 text-yellow-700">
                Renovar Agora
              </Button>
            </div>
          </div>
        </CardContent>
      </Card>
    );
  }

  // Remove green banner for active contracts - RD requirement
  if (isActive) {
    return null;
  }

  return null;
};
