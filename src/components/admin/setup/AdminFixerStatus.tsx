
import React from 'react';
import { CheckCircle, AlertCircle } from 'lucide-react';

interface AdminFixerStatusProps {
  result: any;
  error: string | null;
}

const AdminFixerStatus = ({ result, error }: AdminFixerStatusProps) => {
  if (result) {
    return (
      <div className="flex items-center gap-2 text-green-500">
        <CheckCircle className="h-5 w-5" />
        <div>
          <p className="font-medium">{result.message}</p>
          <p className="text-sm text-gray-600">
            Email: {result.user?.email}
          </p>
          {result.confirmed !== undefined && (
            <p className="text-sm text-gray-600">
              Email confirmado: {result.confirmed ? 'Sim' : 'Não'}
            </p>
          )}
        </div>
      </div>
    );
  }
  
  if (error) {
    return (
      <div className="flex items-start gap-2 text-red-500">
        <AlertCircle className="h-5 w-5 mt-0.5" />
        <div>
          <p className="font-medium">Erro:</p>
          <p className="text-sm">{error}</p>
        </div>
      </div>
    );
  }
  
  return (
    <div className="text-center space-y-2">
      <p className="text-sm text-gray-600">
        Clique para verificar e corrigir o usuário master.
      </p>
      <p className="text-xs text-gray-500">
        Email: jefersonstilver@gmail.com<br />
        Senha: 573039
      </p>
    </div>
  );
};

export default AdminFixerStatus;
