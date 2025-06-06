
import React from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { AlertTriangle, CheckCircle, DollarSign, Search, Wrench } from 'lucide-react';
import { useTransactionRecovery } from '@/hooks/admin/useTransactionRecovery';

const TransactionRecoveryCard: React.FC = () => {
  const {
    loading,
    investigationResult,
    reconciliationResult,
    autoFixResult,
    runReconciliationCheck,
    autoFixLostTransactions,
    fixSpecificTransaction
  } = useTransactionRecovery();

  const getStatusIcon = (status: string) => {
    switch (status) {
      case 'RECONCILED':
        return <CheckCircle className="h-4 w-4 text-green-600" />;
      case 'MINOR_DISCREPANCY':
        return <AlertTriangle className="h-4 w-4 text-yellow-600" />;
      case 'MAJOR_DISCREPANCY':
        return <AlertTriangle className="h-4 w-4 text-red-600" />;
      default:
        return <Search className="h-4 w-4 text-gray-600" />;
    }
  };

  const getStatusColor = (status: string) => {
    switch (status) {
      case 'RECONCILED':
        return 'bg-green-100 text-green-800';
      case 'MINOR_DISCREPANCY':
        return 'bg-yellow-100 text-yellow-800';
      case 'MAJOR_DISCREPANCY':
        return 'bg-red-100 text-red-800';
      default:
        return 'bg-gray-100 text-gray-800';
    }
  };

  return (
    <Card>
      <CardHeader>
        <CardTitle className="flex items-center">
          <Wrench className="h-5 w-5 mr-2 text-blue-600" />
          Recuperação de Transações
        </CardTitle>
      </CardHeader>
      <CardContent className="space-y-6">
        {/* Quick Actions */}
        <div className="grid grid-cols-1 md:grid-cols-3 gap-3">
          <Button
            onClick={runReconciliationCheck}
            disabled={loading}
            variant="outline"
            size="sm"
          >
            <Search className="h-4 w-4 mr-2" />
            Verificar Reconciliação
          </Button>
          
          <Button
            onClick={autoFixLostTransactions}
            disabled={loading}
            variant="default"
            size="sm"
          >
            <Wrench className="h-4 w-4 mr-2" />
            Correção Automática
          </Button>
          
          <Button
            onClick={fixSpecificTransaction}
            disabled={loading}
            variant="destructive"
            size="sm"
          >
            <DollarSign className="h-4 w-4 mr-2" />
            Corrigir R$ 0,19
          </Button>
        </div>

        {/* Reconciliation Results */}
        {reconciliationResult && (
          <div className="space-y-3">
            <h4 className="font-medium flex items-center">
              {getStatusIcon(reconciliationResult.reconciliation_status)}
              <span className="ml-2">Status da Reconciliação</span>
            </h4>
            
            <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
              <div className="text-center">
                <div className="text-2xl font-bold text-green-600">
                  R$ {reconciliationResult.supabase_total.toFixed(2)}
                </div>
                <p className="text-sm text-gray-600">Total Supabase</p>
              </div>
              
              <div className="text-center">
                <div className="text-2xl font-bold text-blue-600">
                  {reconciliationResult.webhook_transactions}
                </div>
                <p className="text-sm text-gray-600">Webhooks Recebidos</p>
              </div>
              
              <div className="text-center">
                <div className="text-2xl font-bold text-red-600">
                  {reconciliationResult.missing_transactions}
                </div>
                <p className="text-sm text-gray-600">Transações Perdidas</p>
              </div>
              
              <div className="text-center">
                <Badge className={getStatusColor(reconciliationResult.reconciliation_status)}>
                  {reconciliationResult.reconciliation_status}
                </Badge>
              </div>
            </div>
          </div>
        )}

        {/* Auto-Fix Results */}
        {autoFixResult && (
          <div className="bg-green-50 p-4 rounded-lg">
            <h4 className="font-medium text-green-800 mb-2">Resultado da Correção Automática</h4>
            <div className="grid grid-cols-2 gap-4">
              <div>
                <span className="text-sm text-green-600">Transações Corrigidas:</span>
                <span className="ml-2 font-bold">{autoFixResult.transactions_fixed}</span>
              </div>
              <div>
                <span className="text-sm text-green-600">Valor Recuperado:</span>
                <span className="ml-2 font-bold">R$ {autoFixResult.total_recovered.toFixed(2)}</span>
              </div>
            </div>
          </div>
        )}

        {/* Investigation Results */}
        {investigationResult && (
          <div className="bg-blue-50 p-4 rounded-lg">
            <h4 className="font-medium text-blue-800 mb-2">Resultado da Investigação</h4>
            <div className="space-y-2 text-sm">
              <div>
                <span className="text-blue-600">Email:</span>
                <span className="ml-2">{investigationResult.email}</span>
              </div>
              <div>
                <span className="text-blue-600">Valor:</span>
                <span className="ml-2">R$ {investigationResult.amount.toFixed(2)}</span>
              </div>
              <div>
                <span className="text-blue-600">Logs Encontrados:</span>
                <span className="ml-2">{investigationResult.webhook_logs_found}</span>
              </div>
              {investigationResult.new_pedido_created && (
                <div>
                  <span className="text-green-600">Novo Pedido:</span>
                  <span className="ml-2 font-mono">{investigationResult.new_pedido_created}</span>
                </div>
              )}
              {investigationResult.existing_pedido && (
                <div>
                  <span className="text-yellow-600">Pedido Existente:</span>
                  <span className="ml-2 font-mono">{investigationResult.existing_pedido}</span>
                </div>
              )}
            </div>
          </div>
        )}

        {loading && (
          <div className="text-center py-4">
            <div className="inline-flex items-center">
              <div className="animate-spin rounded-full h-4 w-4 border-b-2 border-blue-600 mr-2"></div>
              <span>Processando...</span>
            </div>
          </div>
        )}
      </CardContent>
    </Card>
  );
};

export default TransactionRecoveryCard;
