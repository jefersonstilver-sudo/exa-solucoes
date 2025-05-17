
import React from 'react';
import { CheckCircle2, AlertCircle } from 'lucide-react';

interface PaymentStatusBadgeProps {
  status: string;
}

const PaymentStatusBadge = ({ status }: PaymentStatusBadgeProps) => {
  // Get status messages and colors
  const getStatusInfo = () => {
    switch (status) {
      case 'pending':
        return {
          title: 'Aguardando pagamento',
          description: 'Escaneie o QR code com o app do seu banco ou copie o código PIX',
          color: 'text-yellow-500',
          bgColor: 'bg-yellow-100'
        };
      case 'approved':
        return {
          title: 'Pagamento aprovado!',
          description: 'Seu pagamento foi confirmado com sucesso',
          color: 'text-green-500',
          bgColor: 'bg-green-100'
        };
      case 'rejected':
        return {
          title: 'Pagamento recusado',
          description: 'Houve um problema com seu pagamento. Tente novamente ou use outro método',
          color: 'text-red-500',
          bgColor: 'bg-red-100'
        };
      default:
        return {
          title: 'Processando pagamento',
          description: 'Estamos verificando seu pagamento',
          color: 'text-blue-500',
          bgColor: 'bg-blue-100'
        };
    }
  };

  const statusInfo = getStatusInfo();

  return (
    <div className={`w-full p-4 rounded-md ${statusInfo.bgColor} flex items-center space-x-3`}>
      {status === 'approved' ? (
        <CheckCircle2 className={`h-6 w-6 ${statusInfo.color}`} />
      ) : status === 'rejected' ? (
        <AlertCircle className={`h-6 w-6 ${statusInfo.color}`} />
      ) : (
        <div className={`h-5 w-5 rounded-full ${statusInfo.color} animate-pulse`}></div>
      )}
      <div>
        <h3 className={`font-medium ${statusInfo.color}`}>{statusInfo.title}</h3>
        <p className="text-sm text-gray-600">{statusInfo.description}</p>
      </div>
    </div>
  );
};

export default PaymentStatusBadge;
