
import React, { useState, useEffect } from 'react';
import { X, Bug, RefreshCw } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Separator } from '@/components/ui/separator';
import { toast } from 'sonner';

interface PixPaymentDebuggerProps {
  paymentData: any | null;
  error: string | null;
  isLoading: boolean;
  pedidoId: string | null;
  onRefresh: () => Promise<void>;
}

const PixPaymentDebugger = ({
  paymentData,
  error,
  isLoading,
  pedidoId,
  onRefresh
}: PixPaymentDebuggerProps) => {
  const [isOpen, setIsOpen] = useState(false);
  const [localLogs, setLocalLogs] = useState<any[]>([]);

  // Adiciona um log com timestamp
  const addLog = (message: string, type: 'info' | 'error' | 'success' = 'info', data?: any) => {
    const newLog = {
      timestamp: new Date().toISOString(),
      message,
      type,
      data
    };
    
    setLocalLogs(prev => [newLog, ...prev.slice(0, 19)]);
    return newLog;
  };

  // Captura eventos de refresh
  const handleRefresh = async () => {
    addLog('Iniciando atualização manual de status', 'info');
    try {
      await onRefresh();
      addLog('Atualização de status concluída', 'success');
    } catch (err) {
      addLog(`Erro na atualização: ${err}`, 'error', err);
    }
  };

  // Log de montagem do componente
  useEffect(() => {
    addLog('Debugger inicializado', 'info');
    addLog(`PedidoID: ${pedidoId || 'não disponível'}`, 'info');
    
    // Capture console.logs relacionados a pagamento
    const originalConsoleLog = console.log;
    const originalConsoleError = console.error;
    
    console.log = (...args) => {
      originalConsoleLog(...args);
      if (args.some(arg => 
        typeof arg === 'string' && 
        (arg.includes('payment') || arg.includes('pagamento') || arg.includes('PIX'))
      )) {
        addLog(`LOG: ${args.join(' ')}`, 'info');
      }
    };
    
    console.error = (...args) => {
      originalConsoleError(...args);
      if (args.some(arg => 
        typeof arg === 'string' && 
        (arg.includes('payment') || arg.includes('pagamento') || arg.includes('PIX'))
      )) {
        addLog(`ERROR: ${args.join(' ')}`, 'error');
      }
    };
    
    return () => {
      console.log = originalConsoleLog;
      console.error = originalConsoleError;
      addLog('Debugger finalizado', 'info');
    };
  }, []);
  
  // Log de mudanças no estado do pagamento
  useEffect(() => {
    if (isLoading) {
      addLog('Carregando dados do pagamento...', 'info');
    } else if (error) {
      addLog(`Erro detectado: ${error}`, 'error', { error });
    } else if (paymentData) {
      addLog(`Status do pagamento: ${paymentData.status}`, 
        paymentData.status === 'approved' ? 'success' : 'info', 
        { paymentStatus: paymentData.status }
      );
    }
  }, [isLoading, error, paymentData]);
  
  // Função para exportar logs
  const exportLogs = () => {
    const logData = JSON.stringify({
      paymentData,
      error,
      logs: localLogs,
      timestamp: new Date().toISOString(),
      pedidoId,
      userAgent: navigator.userAgent
    }, null, 2);
    
    const blob = new Blob([logData], { type: 'application/json' });
    const url = URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = `pix-payment-debug-${pedidoId || 'unknown'}-${Date.now()}.json`;
    document.body.appendChild(a);
    a.click();
    document.body.removeChild(a);
    URL.revokeObjectURL(url);
    
    toast.success("Logs exportados com sucesso!");
  };
  
  if (!isOpen) {
    return (
      <Button 
        variant="outline" 
        size="sm"
        onClick={() => setIsOpen(true)}
        className="fixed bottom-4 right-4 z-50 bg-yellow-100 hover:bg-yellow-200 border-yellow-300 flex items-center"
      >
        <Bug className="h-4 w-4 mr-2" />
        Debug
      </Button>
    );
  }
  
  return (
    <div className="fixed bottom-4 right-4 z-50 w-80 max-h-[80vh] bg-white border rounded-md shadow-lg overflow-hidden">
      <div className="p-2 bg-yellow-100 border-b border-yellow-300 flex justify-between items-center">
        <div className="flex items-center">
          <Bug className="h-4 w-4 mr-2 text-yellow-800" />
          <h3 className="font-medium text-yellow-900">PIX Payment Debugger</h3>
        </div>
        <Button variant="ghost" size="sm" onClick={() => setIsOpen(false)} className="h-6 w-6 p-0">
          <X className="h-4 w-4" />
        </Button>
      </div>
      
      <div className="p-2 bg-gray-50 border-b">
        <div className="flex justify-between items-center mb-1">
          <span className="text-xs font-medium text-gray-500">Status</span>
          {isLoading ? (
            <Badge variant="outline" className="bg-blue-50 text-blue-600 border-blue-300">
              Carregando...
            </Badge>
          ) : error ? (
            <Badge variant="outline" className="bg-red-50 text-red-600 border-red-300">
              Erro
            </Badge>
          ) : paymentData ? (
            <Badge 
              variant="outline" 
              className={
                paymentData.status === 'approved' 
                  ? "bg-green-50 text-green-600 border-green-300" 
                  : paymentData.status === 'rejected'
                    ? "bg-red-50 text-red-600 border-red-300"
                    : "bg-yellow-50 text-yellow-600 border-yellow-300"
              }
            >
              {paymentData.status}
            </Badge>
          ) : (
            <Badge variant="outline" className="bg-gray-50 text-gray-600 border-gray-300">
              Não inicializado
            </Badge>
          )}
        </div>
        
        <div className="flex justify-between items-center mb-1">
          <span className="text-xs font-medium text-gray-500">Pedido ID</span>
          <span className="text-xs text-gray-900">{pedidoId || "N/A"}</span>
        </div>
        
        {paymentData && (
          <div className="flex justify-between items-center">
            <span className="text-xs font-medium text-gray-500">Payment ID</span>
            <span className="text-xs text-gray-900">{paymentData.paymentId || "N/A"}</span>
          </div>
        )}
      </div>
      
      <div className="flex justify-between p-2 bg-gray-50 border-b">
        <Button 
          variant="outline" 
          size="sm" 
          className="text-xs"
          onClick={handleRefresh}
        >
          <RefreshCw className="h-3 w-3 mr-1" />
          Refresh Status
        </Button>
        
        <Button 
          variant="outline" 
          size="sm" 
          className="text-xs"
          onClick={exportLogs}
        >
          Export Logs
        </Button>
      </div>
      
      <div className="overflow-y-auto max-h-60 bg-gray-900 p-2">
        {localLogs.map((log, index) => (
          <div key={index} className="mb-2">
            <div className="flex justify-between items-start text-xs">
              <span 
                className={
                  log.type === 'error' 
                    ? "text-red-400" 
                    : log.type === 'success'
                      ? "text-green-400"
                      : "text-blue-400"
                }
              >
                {new Date(log.timestamp).toLocaleTimeString()}
              </span>
              <span 
                className={
                  log.type === 'error' 
                    ? "text-red-200" 
                    : log.type === 'success'
                      ? "text-green-200"
                      : "text-gray-200"
                }
              >
                {log.message}
              </span>
            </div>
            {log.data && (
              <pre className="text-xs mt-1 text-gray-400 overflow-x-auto">
                {JSON.stringify(log.data, null, 2)}
              </pre>
            )}
            <Separator className="mt-2 bg-gray-700" />
          </div>
        ))}
      </div>
    </div>
  );
};

export default PixPaymentDebugger;
