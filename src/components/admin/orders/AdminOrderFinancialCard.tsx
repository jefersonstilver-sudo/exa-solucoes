
import React from 'react';
import { DollarSign } from 'lucide-react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Separator } from '@/components/ui/separator';

interface AdminOrderFinancialCardProps {
  subtotal: number;
  discount: number;
  tax: number;
  total: number;
}

export const AdminOrderFinancialCard: React.FC<AdminOrderFinancialCardProps> = ({
  subtotal,
  discount,
  tax,
  total
}) => {
  return (
    <Card className="bg-slate-800/50 border-slate-700/50">
      <CardHeader>
        <CardTitle className="text-white flex items-center">
          <DollarSign className="h-5 w-5 mr-2 text-amber-400" />
          Resumo Financeiro
        </CardTitle>
      </CardHeader>
      <CardContent className="space-y-4">
        <div className="flex justify-between">
          <p className="text-slate-400">Subtotal</p>
          <p className="text-white">R$ {subtotal.toFixed(2)}</p>
        </div>
        <div className="flex justify-between">
          <p className="text-slate-400">Desconto</p>
          <p className="text-green-400">-R$ {discount.toFixed(2)}</p>
        </div>
        <div className="flex justify-between">
          <p className="text-slate-400">Taxas</p>
          <p className="text-white">R$ {tax.toFixed(2)}</p>
        </div>
        <Separator className="bg-slate-600" />
        <div className="flex justify-between">
          <p className="text-white font-bold">Total</p>
          <p className="text-white font-bold text-xl">R$ {total.toFixed(2)}</p>
        </div>
      </CardContent>
    </Card>
  );
};
