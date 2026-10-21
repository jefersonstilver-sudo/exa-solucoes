
import React from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { AlertTriangle, DollarSign, Search } from 'lucide-react';

interface LostTransactionsAlertProps {
  missingCount: number;
  estimatedLoss: number;
  onInvestigate: () => void;
  onAutoFix: () => void;
  loading: boolean;
}

const LostTransactionsAlert: React.FC<LostTransactionsAlertProps> = ({
  missingCount,
  estimatedLoss,
  onInvestigate,
  onAutoFix,
  loading
}) => {
  if (missingCount === 0) {
    return (
      <Card className="border-green-200 bg-green-50">
        <CardHeader>
          <CardTitle className="flex items-center text-green-700">
            <DollarSign className="h-5 w-5 mr-2" />
            Conciliação não certificada
          </CardTitle>
        </CardHeader>
        <CardContent>
          <p className="text-green-700">
            A ausência de pendências neste espelho não certifica a conciliação bancária.
          </p>
        </CardContent>
      </Card>
    );
  }

  return (
    <Card className="border-red-200 bg-red-50">
      <CardHeader>
        <CardTitle className="flex items-center text-red-700">
          <AlertTriangle className="h-5 w-5 mr-2" />
          Cobranças Asaas sem evento correspondente
        </CardTitle>
      </CardHeader>
      <CardContent className="space-y-4">
        <div className="grid grid-cols-2 gap-4">
          <div>
            <div className="text-2xl font-bold text-red-600">{missingCount}</div>
            <p className="text-sm text-red-600">Pendências de correspondência</p>
          </div>
          <div>
            <div className="text-2xl font-bold text-red-600">
              R$ {estimatedLoss.toFixed(2)}
            </div>
            <p className="text-sm text-red-600">Perda financeira não certificada</p>
          </div>
        </div>
        
        <p className="text-red-700">
          Foram detectadas {missingCount} cobrança(s) Asaas 
          sem evento identificado pelo ID oficial.
        </p>
        
        <div className="flex space-x-3">
          <Button 
            onClick={onInvestigate}
            disabled={loading}
            variant="outline"
            size="sm"
          >
            <Search className="h-4 w-4 mr-2" />
            Investigar
          </Button>
          
          <Button 
            onClick={onAutoFix}
            disabled
            variant="destructive"
            size="sm"
          >
            <AlertTriangle className="h-4 w-4 mr-2" />
            Correção Automática
          </Button>
        </div>
      </CardContent>
    </Card>
  );
};

export default LostTransactionsAlert;
