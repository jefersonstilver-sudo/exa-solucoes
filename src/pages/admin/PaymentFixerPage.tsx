
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
              Verificação de Pagamentos Asaas
            </h1>
            <p className="text-gray-600">
              Cobranças e eventos oficiais Asaas
            </p>
          </div>
        </div>

        {/* Payment Fixer Panel */}
        <PaymentFixerPanel />


      </div>
    </div>
  );
};

export default PaymentFixerPage;
