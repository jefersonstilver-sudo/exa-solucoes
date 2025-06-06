
import React from 'react';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import Layout from '@/components/layout/Layout';
import TransactionRecoveryCard from '@/components/admin/financial-integrity/TransactionRecoveryCard';
import EmergencyRecoveryPanel from '@/components/admin/EmergencyRecoveryPanel';
import UnifiedRecoveryPanel from '@/components/admin/financial-integrity/UnifiedRecoveryPanel';
import { DollarSign, AlertTriangle, Shield } from 'lucide-react';

const FinancialAdmin = () => {
  return (
    <Layout>
      <div className="container mx-auto px-4 py-6 space-y-6">
        <div className="flex items-center justify-between">
          <div>
            <h1 className="text-3xl font-bold">Administração Financeira</h1>
            <p className="text-gray-600 mt-2">
              Sistema completo de monitoramento e recuperação de transações
            </p>
          </div>
        </div>

        {/* Sistema Unificado de Recuperação */}
        <div className="space-y-4">
          <div className="bg-blue-50 border border-blue-200 rounded-lg p-4">
            <div className="flex items-center gap-2 mb-2">
              <Shield className="h-5 w-5 text-blue-600" />
              <h2 className="text-lg font-semibold text-blue-800">Sistema Unificado de Recuperação</h2>
            </div>
            <p className="text-blue-700 text-sm">
              Sistema automatizado com transações únicas para prevenir problemas e recuperar dados perdidos.
            </p>
          </div>
          
          <UnifiedRecoveryPanel />
        </div>

        {/* Emergency Recovery Section */}
        <div className="space-y-4">
          <div className="bg-red-50 border border-red-200 rounded-lg p-4">
            <div className="flex items-center gap-2 mb-2">
              <AlertTriangle className="h-5 w-5 text-red-600" />
              <h2 className="text-lg font-semibold text-red-800">Recuperação Emergencial</h2>
            </div>
            <p className="text-red-700 text-sm">
              Sistema para corrigir problemas críticos específicos e duplicação de pedidos.
            </p>
          </div>
          
          <EmergencyRecoveryPanel />
        </div>

        {/* Regular Recovery System */}
        <div className="space-y-4">
          <div className="flex items-center gap-2">
            <DollarSign className="h-5 w-5 text-blue-600" />
            <h2 className="text-lg font-semibold">Sistema de Recuperação Regular</h2>
          </div>
          
          <TransactionRecoveryCard />
        </div>

        {/* Instructions */}
        <Card>
          <CardHeader>
            <CardTitle>Instruções de Uso</CardTitle>
            <CardDescription>
              Como usar os sistemas de recuperação financeira
            </CardDescription>
          </CardHeader>
          <CardContent className="space-y-4">
            <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
              <div className="bg-blue-50 p-4 rounded border border-blue-200">
                <h4 className="font-medium text-blue-800 mb-2">Sistema Unificado (RECOMENDADO)</h4>
                <ul className="text-sm text-blue-700 space-y-1">
                  <li>• Recuperação automática de todas as transações órfãs</li>
                  <li>• Sistema com transaction_id único</li>
                  <li>• Prevenção total de duplicações</li>
                  <li>• Limpeza de dados antigos</li>
                </ul>
              </div>

              <div className="bg-red-50 p-4 rounded border border-red-200">
                <h4 className="font-medium text-red-800 mb-2">Recuperação Emergencial</h4>
                <ul className="text-sm text-red-700 space-y-1">
                  <li>• Use para problemas críticos específicos</li>
                  <li>• Corrige transações conhecidas</li>
                  <li>• Remove duplicações manuais</li>
                  <li>• Correções no sistema de cálculo</li>
                </ul>
              </div>
              
              <div className="bg-gray-50 p-4 rounded border border-gray-200">
                <h4 className="font-medium text-gray-800 mb-2">Recuperação Regular</h4>
                <ul className="text-sm text-gray-700 space-y-1">
                  <li>• Verificação diária de reconciliação</li>
                  <li>• Investigação de transações específicas</li>
                  <li>• Monitoramento contínuo</li>
                  <li>• Relatórios detalhados</li>
                </ul>
              </div>
            </div>

            <div className="bg-green-50 p-4 rounded border border-green-200 mt-4">
              <h4 className="font-medium text-green-800 mb-2">✅ Correções Implementadas</h4>
              <div className="grid grid-cols-1 md:grid-cols-2 gap-2 text-sm text-green-700">
                <div>• Transaction ID único para cada fluxo</div>
                <div>• Preço calculado uma única vez</div>
                <div>• Sincronização garantida tentativa → pedido</div>
                <div>• Prevenção total de duplicação</div>
                <div>• Sistema independente de webhooks</div>
                <div>• Recuperação automática de transações perdidas</div>
              </div>
            </div>
          </CardContent>
        </Card>
      </div>
    </Layout>
  );
};

export default FinancialAdmin;
