
import React from 'react';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import Layout from '@/components/layout/Layout';
import TransactionRecoveryCard from '@/components/admin/financial-integrity/TransactionRecoveryCard';
import EmergencyRecoveryPanel from '@/components/admin/EmergencyRecoveryPanel';
import { DollarSign, AlertTriangle } from 'lucide-react';

const FinancialAdmin = () => {
  return (
    <Layout>
      <div className="container mx-auto px-4 py-6 space-y-6">
        <div className="flex items-center justify-between">
          <div>
            <h1 className="text-3xl font-bold">Administração Financeira</h1>
            <p className="text-gray-600 mt-2">
              Monitoramento e recuperação de transações
            </p>
          </div>
        </div>

        {/* Emergency Recovery Section */}
        <div className="space-y-4">
          <div className="bg-red-50 border border-red-200 rounded-lg p-4">
            <div className="flex items-center gap-2 mb-2">
              <AlertTriangle className="h-5 w-5 text-red-600" />
              <h2 className="text-lg font-semibold text-red-800">Recuperação Emergencial</h2>
            </div>
            <p className="text-red-700 text-sm">
              Sistema para corrigir problemas críticos de transações e duplicação de pedidos.
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
              Como usar o sistema de recuperação financeira
            </CardDescription>
          </CardHeader>
          <CardContent className="space-y-4">
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <div className="bg-red-50 p-4 rounded border border-red-200">
                <h4 className="font-medium text-red-800 mb-2">Recuperação Emergencial</h4>
                <ul className="text-sm text-red-700 space-y-1">
                  <li>• Use para problemas críticos imediatos</li>
                  <li>• Corrige transações específicas conhecidas</li>
                  <li>• Remove duplicações automáticas</li>
                  <li>• Aplica correções no sistema de cálculo</li>
                </ul>
              </div>
              
              <div className="bg-blue-50 p-4 rounded border border-blue-200">
                <h4 className="font-medium text-blue-800 mb-2">Recuperação Regular</h4>
                <ul className="text-sm text-blue-700 space-y-1">
                  <li>• Verificação diária de reconciliação</li>
                  <li>• Correção automática de transações perdidas</li>
                  <li>• Investigação de transações específicas</li>
                  <li>• Monitoramento contínuo</li>
                </ul>
              </div>
            </div>
          </CardContent>
        </Card>
      </div>
    </Layout>
  );
};

export default FinancialAdmin;
