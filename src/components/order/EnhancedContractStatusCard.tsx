
import React from 'react';
import { Calendar, Clock, TrendingUp, AlertTriangle, PlayCircle, ShoppingCart, Flag } from 'lucide-react';
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
    created_at?: string;
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
  } = useContractStatus({ ...orderDetails, id: orderId });

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
    try {
      // Parse da data e formatação para timezone brasileiro
      const date = new Date(dateString);
      // Garantir que estamos trabalhando com a data local correta
      const localDate = new Date(date.getTime() + date.getTimezoneOffset() * 60000);
      const formattedDate = localDate.toLocaleDateString('pt-BR', {
        day: '2-digit',
        month: '2-digit', 
        year: 'numeric'
      });
      
      return formattedDate;
    } catch (error) {
      return 'Data inválida';
    }
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
    <Card className={cn('shadow-sm border-l-4', config.cardBorder)}>
      <CardHeader className="p-2 sm:p-3 pb-1.5">
        <div className="flex items-center justify-between gap-2">
          <div className="flex items-center gap-1.5">
            <StatusIcon className={cn('h-3.5 w-3.5 sm:h-4 sm:w-4', config.iconColor)} />
            <CardTitle className="text-sm sm:text-base font-semibold">Status</CardTitle>
          </div>
          <Badge className={cn('border text-[10px] sm:text-xs px-1.5 py-0.5', config.badgeColor)}>
            {config.badge}
          </Badge>
        </div>
      </CardHeader>
      
      <CardContent className="p-2 sm:p-3 pt-0 space-y-2">
        {/* Contador Principal - Compacto */}
        <div className="text-center py-1">
          <div className="text-2xl sm:text-3xl font-bold">
            <span className={cn(
              isExpired ? 'text-red-600' : 
              !hasStarted ? 'text-blue-600' :
              isExpiringSoon ? 'text-orange-600' : 'text-green-600'
            )}>
              {getMainDisplayValue()}
            </span>
          </div>
          <p className="text-[10px] sm:text-xs text-muted-foreground">
            {getTimeDisplayText()}
          </p>
        </div>

        {/* Barra de Progresso - Mais Fina */}
        {hasStarted && isActive && !isExpired && (
          <div className="space-y-1">
            <Progress 
              value={progressPercentage} 
              className="h-1 sm:h-1.5"
            />
            <p className="text-[9px] sm:text-[10px] text-muted-foreground text-center">
              {Math.round(progressPercentage)}% concluído
            </p>
          </div>
        )}

        {/* Informações das Datas */}
        <div className="grid grid-cols-3 gap-3 text-sm">
          <div className="flex items-center space-x-2">
            <ShoppingCart className="h-4 w-4 text-gray-500" />
            <div>
              <p className="text-gray-500">Data de Compra</p>
              <p className="font-medium">{formatDate(orderDetails.created_at)}</p>
            </div>
          </div>
          {hasStarted && (
            <>
              <div className="flex items-center space-x-2">
                <PlayCircle className="h-4 w-4 text-gray-500" />
                <div>
                  <p className="text-gray-500">Data de Início</p>
                  <p className="font-medium">{formatDate(orderDetails.data_inicio)}</p>
                </div>
              </div>
              <div className="flex items-center space-x-2">
                <Flag className="h-4 w-4 text-gray-500" />
                <div>
                  <p className="text-gray-500">Data de Término</p>
                  <p className="font-medium">{formatDate(orderDetails.data_fim)}</p>
                </div>
              </div>
            </>
          )}
        </div>

        {/* Detalhes do Plano */}
        <div className="bg-gray-50 rounded-lg p-3 text-sm">
          <div className="flex items-center justify-between">
            <span className="text-gray-600">Duração do Plano:</span>
            <span className="font-medium">{orderDetails.plano_meses} meses</span>
          </div>
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
