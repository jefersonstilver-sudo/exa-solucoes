import React, { useState, useEffect } from 'react';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { Shield, AlertTriangle, Eye, RefreshCw } from 'lucide-react';
import { useSecureCoupon } from '@/hooks/useSecureCoupon';
import { toast } from 'sonner';

interface SecurityStatus {
  suspicious_users: number;
  high_value_attempts: number;
  status: 'LOW_RISK' | 'MEDIUM_RISK' | 'HIGH_RISK';
  timestamp: string;
}

const CouponSecurityMonitor = () => {
  const [securityStatus, setSecurityStatus] = useState<SecurityStatus | null>(null);
  const [isLoading, setIsLoading] = useState(false);
  const { monitorSecurity } = useSecureCoupon();

  const checkSecurity = async () => {
    setIsLoading(true);
    try {
      const status = await monitorSecurity();
      if (status) {
        setSecurityStatus(status as unknown as SecurityStatus);
      }
    } catch (error) {
      console.error('Erro ao verificar segurança:', error);
      toast.error('Erro ao verificar status de segurança');
    } finally {
      setIsLoading(false);
    }
  };

  useEffect(() => {
    checkSecurity();
  }, []);

  const getStatusColor = (status: string) => {
    switch (status) {
      case 'LOW_RISK':
        return 'bg-green-100 text-green-800 border-green-200';
      case 'MEDIUM_RISK':
        return 'bg-yellow-100 text-yellow-800 border-yellow-200';
      case 'HIGH_RISK':
        return 'bg-red-100 text-red-800 border-red-200';
      default:
        return 'bg-gray-100 text-gray-800 border-gray-200';
    }
  };

  const getStatusIcon = (status: string) => {
    switch (status) {
      case 'LOW_RISK':
        return <Shield className="h-4 w-4 text-green-600" />;
      case 'MEDIUM_RISK':
        return <Eye className="h-4 w-4 text-yellow-600" />;
      case 'HIGH_RISK':
        return <AlertTriangle className="h-4 w-4 text-red-600" />;
      default:
        return <Shield className="h-4 w-4 text-gray-600" />;
    }
  };

  return (
    <Card className="w-full">
      <CardHeader className="pb-4">
        <div className="flex items-center justify-between">
          <div>
            <CardTitle className="text-lg font-semibold flex items-center gap-2">
              <Shield className="h-5 w-5 text-blue-600" />
              Monitor de Segurança - Cupons
            </CardTitle>
            <CardDescription>
              Monitoramento em tempo real de atividades suspeitas relacionadas a cupons
            </CardDescription>
          </div>
          <Button 
            onClick={checkSecurity} 
            disabled={isLoading}
            variant="outline"
            size="sm"
          >
            <RefreshCw className={`h-4 w-4 mr-2 ${isLoading ? 'animate-spin' : ''}`} />
            Atualizar
          </Button>
        </div>
      </CardHeader>
      
      <CardContent className="space-y-6">
        {securityStatus ? (
          <>
            {/* Status Geral */}
            <div className="flex items-center justify-between p-4 rounded-lg border bg-gray-50">
              <div className="flex items-center gap-3">
                {getStatusIcon(securityStatus.status)}
                <div>
                  <h3 className="font-medium">Status de Segurança</h3>
                  <p className="text-sm text-gray-600">
                    Última verificação: {new Date(securityStatus.timestamp).toLocaleString()}
                  </p>
                </div>
              </div>
              <Badge className={getStatusColor(securityStatus.status)}>
                {securityStatus.status.replace('_', ' ')}
              </Badge>
            </div>

            {/* Métricas de Segurança */}
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <Card>
                <CardContent className="pt-6">
                  <div className="flex items-center justify-between">
                    <div>
                      <p className="text-sm font-medium text-gray-600">Usuários Suspeitos</p>
                      <p className="text-2xl font-bold text-orange-600">
                        {securityStatus.suspicious_users}
                      </p>
                    </div>
                    <div className="p-3 bg-orange-100 rounded-full">
                      <AlertTriangle className="h-6 w-6 text-orange-600" />
                    </div>
                  </div>
                  <p className="text-xs text-gray-500 mt-2">
                    Usuários com mais de 5 tentativas na última hora
                  </p>
                </CardContent>
              </Card>

              <Card>
                <CardContent className="pt-6">
                  <div className="flex items-center justify-between">
                    <div>
                      <p className="text-sm font-medium text-gray-600">Tentativas de Alto Valor</p>
                      <p className="text-2xl font-bold text-red-600">
                        {securityStatus.high_value_attempts}
                      </p>
                    </div>
                    <div className="p-3 bg-red-100 rounded-full">
                      <Eye className="h-6 w-6 text-red-600" />
                    </div>
                  </div>
                  <p className="text-xs text-gray-500 mt-2">
                    Tentativas com cupons de desconto ≥30%
                  </p>
                </CardContent>
              </Card>
            </div>

            {/* Alertas de Segurança */}
            {securityStatus.status !== 'LOW_RISK' && (
              <div className="p-4 rounded-lg border border-amber-200 bg-amber-50">
                <div className="flex items-start gap-3">
                  <AlertTriangle className="h-5 w-5 text-amber-600 mt-0.5" />
                  <div>
                    <h4 className="font-medium text-amber-800">Atenção Requerida</h4>
                    <p className="text-sm text-amber-700 mt-1">
                      {securityStatus.status === 'HIGH_RISK' 
                        ? 'Alto risco detectado! Atividade suspeita significativa nos últimos tempos.'
                        : 'Risco médio detectado. Monitore mais de perto as atividades de cupons.'
                      }
                    </p>
                  </div>
                </div>
              </div>
            )}

            {/* Medidas de Segurança Implementadas */}
            <div className="mt-6 p-4 rounded-lg border border-green-200 bg-green-50">
              <h4 className="font-medium text-green-800 mb-3">Medidas de Segurança Ativas</h4>
              <ul className="space-y-2 text-sm text-green-700">
                <li className="flex items-center gap-2">
                  <Shield className="h-4 w-4" />
                  Rate limiting: máximo 10 tentativas por usuário por hora
                </li>
                <li className="flex items-center gap-2">
                  <Shield className="h-4 w-4" />
                  Acesso restrito: apenas usuários autenticados podem validar cupons
                </li>
                <li className="flex items-center gap-2">
                  <Shield className="h-4 w-4" />
                  Auditoria completa: todas as tentativas são registradas
                </li>
                <li className="flex items-center gap-2">
                  <Shield className="h-4 w-4" />
                  Validação segura: cupons não são expostos publicamente
                </li>
              </ul>
            </div>
          </>
        ) : (
          <div className="text-center py-8">
            <Shield className="h-12 w-12 text-gray-400 mx-auto mb-4" />
            <p className="text-gray-500">Carregando dados de segurança...</p>
          </div>
        )}
      </CardContent>
    </Card>
  );
};

export default CouponSecurityMonitor;