
import React from 'react';
import { User, Mail, Calendar, CreditCard } from 'lucide-react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';

interface RealOrderCustomerCardProps {
  order: {
    client_name: string;
    client_email: string;
    client_id: string;
    created_at: string;
  };
}

export const RealOrderCustomerCard: React.FC<RealOrderCustomerCardProps> = ({ order }) => {
  const formatDate = (dateString: string) => {
    return new Date(dateString).toLocaleDateString('pt-BR');
  };

  return (
    <Card className="bg-white border-gray-200">
      <CardHeader className="border-b border-gray-200">
        <CardTitle className="text-gray-900 flex items-center">
          <User className="h-5 w-5 mr-2 text-indexa-purple" />
          Informações do Cliente
        </CardTitle>
      </CardHeader>
      <CardContent className="p-6 space-y-4">
        <div>
          <p className="text-sm text-gray-600 font-medium">Nome</p>
          <p className="text-gray-900 font-semibold">{order.client_name}</p>
        </div>
        <div>
          <p className="text-sm text-gray-600 font-medium">Email</p>
          <div className="flex items-center space-x-2">
            <Mail className="h-4 w-4 text-gray-500" />
            <p className="text-gray-900">{order.client_email}</p>
          </div>
        </div>
        <div>
          <p className="text-sm text-gray-600 font-medium">ID do Cliente</p>
          <div className="flex items-center space-x-2">
            <CreditCard className="h-4 w-4 text-gray-500" />
            <p className="text-gray-900 font-mono text-sm">{order.client_id.substring(0, 8)}...</p>
          </div>
        </div>
        <div>
          <p className="text-sm text-gray-600 font-medium">Cliente desde</p>
          <div className="flex items-center space-x-2">
            <Calendar className="h-4 w-4 text-gray-500" />
            <p className="text-gray-900">{formatDate(order.created_at)}</p>
          </div>
        </div>
      </CardContent>
    </Card>
  );
};
