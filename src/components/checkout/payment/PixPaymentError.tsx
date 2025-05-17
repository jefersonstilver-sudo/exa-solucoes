
import React from 'react';
import Layout from '@/components/layout/Layout';
import { Button } from '@/components/ui/button';
import { AlertCircle } from 'lucide-react';

interface PixPaymentErrorProps {
  error: string;
  onBack: () => void;
}

const PixPaymentError = ({ error, onBack }: PixPaymentErrorProps) => {
  return (
    <Layout>
      <div className="container mx-auto px-4 py-12 max-w-4xl">
        <div className="bg-red-50 border border-red-200 rounded-lg p-6 flex flex-col items-center">
          <AlertCircle className="h-12 w-12 text-red-500 mb-4" />
          <h1 className="text-2xl font-bold text-red-700 mb-2">Erro ao carregar pagamento</h1>
          <p className="text-red-600 mb-6">{error}</p>
          <Button onClick={onBack}>Voltar para checkout</Button>
        </div>
      </div>
    </Layout>
  );
};

export default PixPaymentError;
