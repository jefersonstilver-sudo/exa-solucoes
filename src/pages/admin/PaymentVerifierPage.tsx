
import React from 'react';
import { ArrowLeft, CreditCard } from 'lucide-react';
import { Button } from '@/components/ui/button';
import MercadoPagoVerifierPanel from '@/components/admin/MercadoPagoVerifierPanel';
import PaymentFixerPanel from '@/components/admin/PaymentFixerPanel';
import { useNavigate } from 'react-router-dom';

const PaymentVerifierPage = () => {
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
            <h1 className="text-3xl font-bold text-gray-900 flex items-center gap-2">
              <CreditCard className="h-8 w-8 text-blue-600" />
              Sistema de Verificação de Pagamentos
            </h1>
            <p className="text-gray-600">
              Verificação automática e correção de pagamentos MercadoPago
            </p>
          </div>
        </div>

        {/* Verificador MercadoPago */}
        <MercadoPagoVerifierPanel />

        {/* Sistema de Correção Existente */}
        <PaymentFixerPanel />

        {/* Instruções */}
        <div className="bg-white rounded-lg p-6 shadow-sm">
          <h2 className="text-xl font-semibold mb-4">🚀 Como Funciona o Sistema</h2>
          <div className="space-y-4">
            <div className="border-l-4 border-blue-400 pl-4">
              <h3 className="font-medium text-blue-800">1. Verificação Automática MercadoPago</h3>
              <p className="text-sm text-gray-600">
                O sistema consulta diretamente a API do MercadoPago a cada 5 minutos para verificar 
                o status real dos pagamentos pendentes. Quando encontra um pagamento aprovado, 
                atualiza automaticamente o pedido no sistema.
              </p>
            </div>
            
            <div className="border-l-4 border-orange-400 pl-4">
              <h3 className="font-medium text-orange-800">2. Correção Manual</h3>
              <p className="text-sm text-gray-600">
                Para casos específicos, você pode usar a correção manual que força a atualização
                do pedido pendente mais recente.
              </p>
            </div>
            
            <div className="border-l-4 border-green-400 pl-4">
              <h3 className="font-medium text-green-800">3. Sistema à Prova de Falhas</h3>
              <p className="text-sm text-gray-600">
                Combinando webhook + verificação automática via API, o sistema garante que nenhum 
                pagamento seja perdido, mesmo se houver problemas de conectividade ou falhas no webhook.
              </p>
            </div>
          </div>
        </div>

        {/* Status do Sistema */}
        <div className="bg-gradient-to-r from-green-50 to-blue-50 rounded-lg p-6 border border-green-200">
          <h2 className="text-lg font-semibold text-green-800 mb-2">✅ Sistema Ativo</h2>
          <p className="text-sm text-green-700">
            O verificador automático está rodando continuamente em segundo plano. 
            Todos os pagamentos pendentes são verificados automaticamente a cada 5 minutos.
          </p>
          <p className="text-xs text-green-600 mt-2">
            <strong>Webhook URL:</strong> https://aakenoljsycyrcrchgxj.supabase.co/functions/v1/mercadopago-webhook
          </p>
        </div>
      </div>
    </div>
  );
};

export default PaymentVerifierPage;
