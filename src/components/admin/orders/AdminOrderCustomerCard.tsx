
import React from 'react';
import { User, Mail, Phone } from 'lucide-react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';

interface Customer {
  name: string;
  email: string;
  phone: string;
  document: string;
}

interface AdminOrderCustomerCardProps {
  customer: Customer;
}

export const AdminOrderCustomerCard: React.FC<AdminOrderCustomerCardProps> = ({
  customer
}) => {
  return (
    <Card className="bg-slate-800/50 border-slate-700/50">
      <CardHeader>
        <CardTitle className="text-white flex items-center">
          <User className="h-5 w-5 mr-2 text-amber-400" />
          Informações do Cliente
        </CardTitle>
      </CardHeader>
      <CardContent className="space-y-4">
        <div>
          <p className="text-sm text-slate-400">Nome</p>
          <p className="text-white font-medium">{customer.name}</p>
        </div>
        <div>
          <p className="text-sm text-slate-400">Email</p>
          <div className="flex items-center space-x-2">
            <Mail className="h-4 w-4 text-slate-400" />
            <p className="text-white">{customer.email}</p>
          </div>
        </div>
        <div>
          <p className="text-sm text-slate-400">Telefone</p>
          <div className="flex items-center space-x-2">
            <Phone className="h-4 w-4 text-slate-400" />
            <p className="text-white">{customer.phone}</p>
          </div>
        </div>
        <div>
          <p className="text-sm text-slate-400">Documento</p>
          <p className="text-white">{customer.document}</p>
        </div>
      </CardContent>
    </Card>
  );
};
