
import React, { useState, useEffect } from 'react';
import { getCheckoutAuditSummary } from '@/services/checkoutDebugService';
import { checkNavigationHealth, getAllNavigationLogs, clearNavigationLogs } from '@/services/navigationAuditService';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Separator } from '@/components/ui/separator';
import { Badge } from '@/components/ui/badge';
import { AlertTriangle, CheckCircle, RefreshCw, Info, X } from 'lucide-react';

interface CheckoutDebuggerProps {
  onClose?: () => void;
}

const CheckoutDebugger: React.FC<CheckoutDebuggerProps> = ({ onClose }) => {
  const [auditData, setAuditData] = useState<any>(null);
  const [navigationHealth, setNavigationHealth] = useState<any>(null);
  const [expanded, setExpanded] = useState(false);
  
  // Carregar dados de auditoria
  const loadAuditData = () => {
    setAuditData(getCheckoutAuditSummary());
    setNavigationHealth(checkNavigationHealth());
  };
  
  // Carregar dados iniciais
  useEffect(() => {
    loadAuditData();
    
    // Atualizar a cada 5 segundos
    const interval = setInterval(() => {
      loadAuditData();
    }, 5000);
    
    return () => clearInterval(interval);
  }, []);
  
  if (!auditData || !navigationHealth) {
    return (
      <div className="p-3 text-center">
        <RefreshCw className="animate-spin h-5 w-5 mx-auto mb-2" />
        <p className="text-sm">Carregando informações de diagnóstico...</p>
      </div>
    );
  }
  
  // Determinar status geral
  const getOverallStatus = () => {
    if (auditData.errorCount > 0 || navigationHealth.status === 'issues') {
      return 'issues';
    }
    return 'healthy';
  };
  
  const overallStatus = getOverallStatus();
  
  const handleClearLogs = () => {
    clearNavigationLogs();
    loadAuditData();
  };
  
  return (
    <Card className="shadow-lg border-gray-200 overflow-hidden max-w-xl mx-auto">
      <CardHeader className={`py-3 flex flex-row justify-between items-center ${
        overallStatus === 'issues' ? 'bg-red-50' : 'bg-green-50'
      }`}>
        <CardTitle className="flex items-center text-sm font-medium">
          {overallStatus === 'issues' ? (
            <AlertTriangle className="h-4 w-4 text-red-500 mr-2" />
          ) : (
            <CheckCircle className="h-4 w-4 text-green-500 mr-2" />
          )}
          Diagnóstico de Checkout
        </CardTitle>
        <div className="flex items-center gap-2">
          <Button 
            variant="ghost" 
            size="icon" 
            onClick={loadAuditData} 
            title="Atualizar"
            className="h-7 w-7"
          >
            <RefreshCw className="h-4 w-4" />
          </Button>
          {onClose && (
            <Button 
              variant="ghost" 
              size="icon" 
              onClick={onClose}
              title="Fechar" 
              className="h-7 w-7"
            >
              <X className="h-4 w-4" />
            </Button>
          )}
        </div>
      </CardHeader>
      
      <CardContent className="p-3 text-sm">
        <div className="space-y-3">
          {/* Resumo geral */}
          <div className="flex flex-col gap-2">
            <div className="flex justify-between items-center">
              <span className="font-medium">Status da navegação:</span>
              <Badge variant={navigationHealth.status === 'healthy' ? 'outline' : 'destructive'}>
                {navigationHealth.status === 'healthy' ? 'Saudável' : 'Problemas detectados'}
              </Badge>
            </div>
            
            <div className="flex justify-between">
              <span>Total de logs:</span>
              <span>{auditData.totalLogs}</span>
            </div>
            
            <div className="flex justify-between">
              <span>Erros registrados:</span>
              <span className={auditData.errorCount > 0 ? 'text-red-500 font-medium' : ''}>
                {auditData.errorCount}
              </span>
            </div>
            
            <div className="flex justify-between">
              <span>Falhas recentes na navegação:</span>
              <span className={navigationHealth.recentFailures > 0 ? 'text-red-500 font-medium' : ''}>
                {navigationHealth.recentFailures}
              </span>
            </div>
          </div>
          
          <Separator />
          
          {/* Botões de ação */}
          <div className="flex justify-between">
            <Button 
              variant="outline" 
              size="sm" 
              onClick={handleClearLogs}
              className="text-xs"
            >
              Limpar logs
            </Button>
            
            <Button 
              variant="outline" 
              size="sm" 
              onClick={() => setExpanded(prev => !prev)}
              className="text-xs"
            >
              {expanded ? 'Mostrar menos' : 'Mostrar detalhes'}
            </Button>
          </div>
          
          {/* Detalhes expandidos */}
          {expanded && (
            <div className="mt-3 space-y-3">
              {/* Eventos recentes */}
              <div>
                <h4 className="text-xs font-medium mb-1 flex items-center">
                  <Info className="h-3 w-3 mr-1" /> Eventos recentes
                </h4>
                <div className="bg-gray-50 p-2 rounded-md text-xs max-h-40 overflow-auto">
                  {auditData.recentLogs.length > 0 ? (
                    auditData.recentLogs.map((log: any, index: number) => (
                      <div key={index} className="mb-1 pb-1 border-b border-gray-100">
                        <div className="flex">
                          <span className={`font-mono ${
                            log.level === 'ERROR' ? 'text-red-500' : 
                            log.level === 'WARNING' ? 'text-amber-500' : 
                            log.level === 'SUCCESS' ? 'text-green-500' : 'text-gray-500'
                          }`}>
                            [{new Date(log.timestamp).toISOString().substr(11, 8)}]
                          </span>
                          <span className="ml-1">{log.message}</span>
                        </div>
                      </div>
                    ))
                  ) : (
                    <p>Nenhum evento recente</p>
                  )}
                </div>
              </div>
              
              {/* Erros recentes */}
              {auditData.errorCount > 0 && (
                <div>
                  <h4 className="text-xs font-medium mb-1 flex items-center text-red-500">
                    <AlertTriangle className="h-3 w-3 mr-1" /> Erros recentes
                  </h4>
                  <div className="bg-red-50 p-2 rounded-md text-xs max-h-40 overflow-auto">
                    {auditData.recentErrors.map((error: any, index: number) => (
                      <div key={index} className="mb-1 pb-1 border-b border-red-100">
                        <div className="font-mono text-red-600">
                          [{error.event}] {error.message}
                        </div>
                        {error.data && (
                          <div className="text-red-500 mt-1 pl-2">
                            {JSON.stringify(error.data)}
                          </div>
                        )}
                      </div>
                    ))}
                  </div>
                </div>
              )}
            </div>
          )}
          
          {/* Dica de diagnóstico */}
          <div className="text-xs text-gray-500 italic border-t border-gray-100 pt-2 mt-2">
            Se estiver enfrentando problemas de navegação, tente limpar os logs e tentar novamente.
          </div>
        </div>
      </CardContent>
    </Card>
  );
};

export default CheckoutDebugger;
