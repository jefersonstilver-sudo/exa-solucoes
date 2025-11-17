
import React from 'react';
import { useNavigate } from 'react-router-dom';
import Layout from '@/components/layout/Layout';
import { Button } from '@/components/ui/button';

interface PaymentErrorProps {
  error: string;
}

const PaymentError = ({ error }: PaymentErrorProps) => {
  const navigate = useNavigate();
  
  return (
    <Layout>
      <div className="container mx-auto px-4 py-12">
        <div className="bg-red-50 border border-red-200 rounded-lg p-6 text-center">
          <h2 className="text-xl font-bold text-red-700 mb-2">Erro ao carregar pagamento</h2>
          <p className="text-red-600">{error}</p>
          <Button
            onClick={() => navigate('/selecionar-plano')}
            className="mt-4"
            variant="outline"
          >
            Voltar para seleção de plano
          </Button>
        </div>
      </div>
    </Layout>
  );
};

export default PaymentError;
