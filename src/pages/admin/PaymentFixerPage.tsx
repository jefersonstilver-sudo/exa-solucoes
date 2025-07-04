
import React from 'react';
import { ArrowLeft } from 'lucide-react';
import { Button } from '@/components/ui/button';
import PaymentFixerPanel from '@/components/admin/PaymentFixerPanel';
import { useNavigate } from 'react-router-dom';

const PaymentFixerPage = () => {
  const navigate = useNavigate();

  return (
    <div className="min-h-screen bg-gray-50 p-6">
      <div className="max-w-4xl mx-auto space-y-6">
        {/* Header */}
        <div className="flex items-center gap-4">
          <Button
            variant="outline"
            onClick={() => navigate('/admin')}
            className="flex items-center gap-2"
          >
            <ArrowLeft className="h-4 w-4" />
            Voltar para Admin
          </Button>
          <div>
            <h1 className="text-3xl font-bold text-gray-900">
              Sistema de Correção de Pagamentos
            </h1>
            <p className="text-gray-600">
              Ferramentas para corrigir e reconciliar pagamentos pendentes
            </p>
          </div>
        </div>

        {/* Payment Fixer Panel */}
        <PaymentFixerPanel />

        {/* Instructions */}
        <div className="bg-white rounded-lg p-6 shadow-sm">
          <h2 className="text-xl font-semibold mb-4">📋 Como Usar</h2>
          <div className="space-y-4">
            <div className="border-l-4 border-orange-400 pl-4">
              <h3 className="font-medium text-orange-800">1. Correção Imediata</h3>
              <p className="text-sm text-gray-600">
                Use quando um pagamento específico foi aprovado no MercadoPago mas não foi atualizado no sistema.
                Corrige automaticamente o pedido pendente mais recente.
              </p>
            </div>
            
            <div className="border-l-4 border-blue-400 pl-4">
              <h3 className="font-medium text-blue-800">2. Reconciliação Automática</h3>
              <p className="text-sm text-gray-600">
                Executa uma verificação completa de todos os pedidos pendentes há mais de 15 minutos,
                cruzando com os webhooks recebidos do MercadoPago.
              </p>
            </div>
            
            <div className="border-l-4 border-green-400 pl-4">
              <h3 className="font-medium text-green-800">3. Prevenção</h3>
              <p className="text-sm text-gray-600">
                O sistema agora monitora automaticamente os pagamentos e corrige discrepâncias.
                O webhook está configurado em: <code className="bg-gray-100 px-2 py-1 rounded text-xs">
                  https://aakenoljsycyrcrchgxj.supabase.co/functions/v1/mercadopago-webhook
                </code>
              </p>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};

export default PaymentFixerPage;
