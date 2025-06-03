
import React from 'react';
import { Calendar, Clock, TrendingUp, AlertTriangle, PlayCircle } from 'lucide-react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Progress } from '@/components/ui/progress';
import { Button } from '@/components/ui/button';
import { useContractStatus } from '@/hooks/useContractStatus';
import { cn } from '@/lib/utils';

interface EnhancedContractStatusCardProps {
  orderId: string;
  orderDetails: {
    data_inicio?: string;
    data_fim?: string;
    status: string;
    plano_meses: number;
  };
}

const EnhancedContractStatusCard: React.FC<EnhancedContractStatusCardProps> = ({
  orderId,
  orderDetails
}) => {
  const { 
    isActive, 
    daysRemaining, 
    hoursRemaining, 
    totalDays, 
    progressPercentage,
    isExpiringSoon,
    isExpired,
    hasStarted
  } = useContractStatus(orderDetails);

  const getStatusConfig = () => {
    if (isExpired) {
      return {
        badge: 'Contrato Encerrado',
        badgeColor: 'bg-red-100 text-red-800 border-red-200',
        cardBorder: 'border-red-200',
        progressColor: 'bg-red-500',
        icon: AlertTriangle,
        iconColor: 'text-red-500'
      };
    }
    
    if (!hasStarted) {
      return {
        badge: 'Aguardando Ativação',
        badgeColor: 'bg-blue-100 text-blue-800 border-blue-200',
        cardBorder: 'border-blue-200',
        progressColor: 'bg-blue-500',
        icon: Clock,
        iconColor: 'text-blue-500'
      };
    }
    
    if (isExpiringSoon) {
      return {
        badge: 'Expirando em Breve',
        badgeColor: 'bg-orange-100 text-orange-800 border-orange-200',
        cardBorder: 'border-orange-200',
        progressColor: 'bg-orange-500',
        icon: AlertTriangle,
        iconColor: 'text-orange-500'
      };
    }
    
    if (isActive) {
      return {
        badge: 'Contrato Ativo',
        badgeColor: 'bg-green-100 text-green-800 border-green-200',
        cardBorder: 'border-green-200',
        progressColor: 'bg-green-500',
        icon: TrendingUp,
        iconColor: 'text-green-500'
      };
    }
    
    return {
      badge: 'Contrato Iniciado',
      badgeColor: 'bg-emerald-100 text-emerald-800 border-emerald-200',
      cardBorder: 'border-emerald-200',
      progressColor: 'bg-emerald-500',
      icon: PlayCircle,
      iconColor: 'text-emerald-500'
    };
  };

  const config = getStatusConfig();
  const StatusIcon = config.icon;

  const formatDate = (dateString?: string) => {
    if (!dateString) return 'Não definido';
    return new Date(dateString).toLocaleDateString('pt-BR');
  };

  const getTimeDisplayText = () => {
    if (isExpired) return 'Contrato encerrado';
    if (!hasStarted) return 'Contrato não iniciado';
    
    if (daysRemaining === 0 && hoursRemaining !== null) {
      return `${hoursRemaining}h restantes`;
    }
    
    return `${daysRemaining} dias restantes`;
  };

  const getMainDisplayValue = () => {
    if (isExpired) return 'ENCERRADO';
    if (!hasStarted) return 'AGUARDANDO';
    
    if (daysRemaining === 0 && hoursRemaining !== null) {
      return `${hoursRemaining}h`;
    }
    
    return daysRemaining.toString();
  };

  return (
    <Card className={cn('border-2 shadow-lg', config.cardBorder)}>
      <CardHeader className="pb-3">
        <div className="flex items-center justify-between">
          <CardTitle className="text-lg flex items-center space-x-2">
            <StatusIcon className={cn('h-5 w-5', config.iconColor)} />
            <span>Status do Contrato</span>
          </CardTitle>
          <Badge className={cn('border', config.badgeColor)}>
            {config.badge}
          </Badge>
        </div>
      </CardHeader>
      
      <CardContent className="space-y-6">
        {/* Contador Principal */}
        <div className="text-center">
          <div className="text-4xl font-bold mb-1">
            <span className={cn(
              isExpired ? 'text-red-600' : 
              !hasStarted ? 'text-blue-600' :
              isExpiringSoon ? 'text-orange-600' : 'text-green-600'
            )}>
              {getMainDisplayValue()}
            </span>
          </div>
          <p className="text-sm text-gray-600">
            {getTimeDisplayText()}
          </p>
        </div>

        {/* Barra de Progresso */}
        {hasStarted && isActive && !isExpired && (
          <div className="space-y-2">
            <div className="flex justify-between text-sm">
              <span>Progresso do contrato</span>
              <span>{Math.round(progressPercentage)}%</span>
            </div>
            <Progress 
              value={progressPercentage} 
              className="h-3"
            />
          </div>
        )}

        {/* Informações do Período */}
        <div className="grid grid-cols-2 gap-4 text-sm">
          <div className="flex items-center space-x-2">
            <Calendar className="h-4 w-4 text-gray-500" />
            <div>
              <p className="text-gray-500">Início</p>
              <p className="font-medium">{formatDate(orderDetails.data_inicio)}</p>
            </div>
          </div>
          <div className="flex items-center space-x-2">
            <Calendar className="h-4 w-4 text-gray-500" />
            <div>
              <p className="text-gray-500">Término</p>
              <p className="font-medium">{formatDate(orderDetails.data_fim)}</p>
            </div>
          </div>
        </div>

        {/* Detalhes Adicionais */}
        <div className="bg-gray-50 rounded-lg p-3 text-sm">
          <div className="flex items-center justify-between mb-2">
            <span className="text-gray-600">Duração do Plano:</span>
            <span className="font-medium">{orderDetails.plano_meses} meses</span>
          </div>
          {hasStarted && totalDays && (
            <div className="flex items-center justify-between">
              <span className="text-gray-600">Total de Dias:</span>
              <span className="font-medium">{totalDays} dias</span>
            </div>
          )}
        </div>

        {/* Status específicos */}
        {!hasStarted && (
          <div className="bg-blue-50 border border-blue-200 rounded-lg p-4">
            <div className="flex items-center space-x-2 mb-2">
              <Clock className="h-4 w-4 text-blue-600" />
              <span className="font-medium text-blue-800">Aguardando Ativação</span>
            </div>
            <p className="text-sm text-blue-700 mb-3">
              O contrato será iniciado automaticamente quando seu vídeo for aprovado.
            </p>
          </div>
        )}

        {/* Ações para expiração próxima */}
        {isExpiringSoon && !isExpired && (
          <div className="bg-orange-50 border border-orange-200 rounded-lg p-4">
            <div className="flex items-center space-x-2 mb-2">
              <AlertTriangle className="h-4 w-4 text-orange-600" />
              <span className="font-medium text-orange-800">Ação Requerida</span>
            </div>
            <p className="text-sm text-orange-700 mb-3">
              Seu contrato expira em breve. Renove agora para manter sua campanha ativa.
            </p>
            <Button size="sm" className="w-full">
              Renovar Contrato
            </Button>
          </div>
        )}

        {/* Ações para contrato expirado */}
        {isExpired && (
          <div className="bg-red-50 border border-red-200 rounded-lg p-4">
            <div className="flex items-center space-x-2 mb-2">
              <AlertTriangle className="h-4 w-4 text-red-600" />
              <span className="font-medium text-red-800">Contrato Encerrado</span>
            </div>
            <p className="text-sm text-red-700 mb-3">
              Seu contrato expirou. Crie um novo pedido para reativar sua campanha.
            </p>
            <Button size="sm" className="w-full" variant="destructive">
              Criar Nova Campanha
            </Button>
          </div>
        )}
      </CardContent>
    </Card>
  );
};

export default EnhancedContractStatusCard;
