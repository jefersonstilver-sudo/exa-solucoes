
import React, { useState } from 'react';
import { Button } from '@/components/ui/button';
import { RotateCw, Bug } from 'lucide-react';
import { PixPaymentData } from '@/hooks/payment/usePixPayment';
import { logCheckoutEvent, LogLevel, CheckoutEvent } from '@/services/checkoutDebugService';

interface PixPaymentDebuggerProps {
  paymentData: PixPaymentData | null;
  error: string | null;
  isLoading: boolean;
  pedidoId: string | null;
  onRefresh: () => Promise<void>;
}

const PixPaymentDebugger: React.FC<PixPaymentDebuggerProps> = ({
  paymentData,
  error,
  isLoading,
  pedidoId,
  onRefresh
}) => {
  const [isDebugExpanded, setIsDebugExpanded] = useState(false);
  const [isRefreshing, setIsRefreshing] = useState(false);
  
  // Only show in development or if a special parameter is present
  const isDev = process.env.NODE_ENV === 'development' || new URLSearchParams(window.location.search).has('debug');
  
  if (!isDev) return null;
  
  const handleDebugRefresh = async () => {
    setIsRefreshing(true);
    try {
      await onRefresh();
      
      logCheckoutEvent(
        CheckoutEvent.DEBUG_EVENT,
        LogLevel.INFO,
        "Manual refresh initiated from debug panel",
        { 
          pedidoId,
          paymentId: paymentData?.paymentId || 'N/A',
          timestamp: new Date().toISOString() 
        }
      );
    } catch (err) {
      console.error("Error refreshing payment status:", err);
    } finally {
      setIsRefreshing(false);
    }
  };
  
  return (
    <div className="mt-8 border border-gray-200 rounded-lg overflow-hidden bg-gray-50">
      <div className="bg-gray-100 border-b border-gray-200 px-4 py-2 flex justify-between items-center">
        <div className="flex items-center">
          <Bug className="h-4 w-4 text-gray-600 mr-2" />
          <h3 className="text-sm font-medium text-gray-700">Debug - PIX Payment</h3>
        </div>
        <Button
          size="sm"
          variant="ghost"
          className="h-8 w-8 p-0"
          onClick={() => setIsDebugExpanded(!isDebugExpanded)}
        >
          <span className="sr-only">Toggle debug panel</span>
          <svg 
            className={`h-4 w-4 transform transition-transform ${isDebugExpanded ? 'rotate-180' : ''}`} 
            fill="none" 
            stroke="currentColor" 
            viewBox="0 0 24 24"
          >
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 9l-7 7-7-7" />
          </svg>
        </Button>
      </div>
      
      {isDebugExpanded && (
        <div className="p-4 text-sm">
          {/* Payment Data Section */}
          {paymentData ? (
            <div className="grid grid-cols-2 gap-2 mb-4">
              <div className="bg-white p-2 rounded border border-gray-200">
                <div className="font-medium text-gray-700 mb-1">Status</div>
                <div className={`text-sm ${paymentData.status === 'approved' ? 'text-green-600' : 'text-orange-500'}`}>
                  {paymentData.status || 'Unknown'}
                </div>
              </div>
              <div className="bg-white p-2 rounded border border-gray-200">
                <div className="font-medium text-gray-700 mb-1">Total</div>
                <div className="text-sm">
                  {new Intl.NumberFormat('pt-BR', { style: 'currency', currency: 'BRL' }).format(paymentData.valorTotal || 0)}
                </div>
              </div>
              <div className="bg-white p-2 rounded border border-gray-200">
                <div className="font-medium text-gray-700 mb-1">Payment ID</div>
                <div className="text-sm font-mono text-xs truncate">{paymentData.paymentId || 'N/A'}</div>
              </div>
              <div className="bg-white p-2 rounded border border-gray-200">
                <div className="font-medium text-gray-700 mb-1">Order ID</div>
                <div className="text-sm font-mono text-xs truncate">{pedidoId || 'N/A'}</div>
              </div>
              <div className="bg-white p-2 rounded border border-gray-200 col-span-2">
                <div className="font-medium text-gray-700 mb-1">QR Code Status</div>
                <div className="text-sm">
                  {paymentData.qrCodeBase64 ? (
                    <span className="text-green-600">✓ QR Code disponível ({paymentData.qrCodeBase64.length} chars)</span>
                  ) : (
                    <span className="text-red-600">✗ QR Code não disponível</span>
                  )}
                </div>
              </div>
            </div>
          ) : (
            <div className="bg-yellow-50 border border-yellow-200 p-2 rounded mb-4">
              <div className="font-medium text-yellow-700 mb-1">Sem Dados de Pagamento</div>
              <div className="text-sm text-yellow-600">
                {isLoading ? 'Carregando dados...' : 'Nenhum dado de pagamento PIX encontrado'}
              </div>
            </div>
          )}
          
          {/* Error Section */}
          {error && (
            <div className="bg-red-50 border border-red-200 p-2 rounded mb-4">
              <div className="font-medium text-red-700 mb-1">Error</div>
              <div className="text-sm text-red-600">{error}</div>
            </div>
          )}
          
          {/* Debug Info */}
          <div className="bg-gray-50 border border-gray-200 p-2 rounded mb-4">
            <div className="font-medium text-gray-700 mb-1">Debug Info</div>
            <div className="text-xs space-y-1">
              <div>Pedido ID: {pedidoId || 'N/A'}</div>
              <div>Loading: {isLoading ? 'Yes' : 'No'}</div>
              <div>Has Error: {error ? 'Yes' : 'No'}</div>
              <div>Has Payment Data: {paymentData ? 'Yes' : 'No'}</div>
              <div>Timestamp: {new Date().toLocaleString('pt-BR')}</div>
            </div>
          </div>
          
          <Button 
            variant="outline"
            size="sm"
            className="w-full"
            onClick={handleDebugRefresh}
            disabled={isRefreshing || isLoading}
          >
            {isRefreshing ? (
              <>
                <RotateCw className="h-4 w-4 mr-2 animate-spin" />
                Refreshing...
              </>
            ) : (
              <>
                <RotateCw className="h-4 w-4 mr-2" />
                Refresh Status
              </>
            )}
          </Button>
        </div>
      )}
    </div>
  );
};

export default PixPaymentDebugger;
