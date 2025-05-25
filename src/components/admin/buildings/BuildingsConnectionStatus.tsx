
import React from 'react';
import { Card, CardContent } from '@/components/ui/card';
import { CheckCircle, AlertCircle, Shield } from 'lucide-react';

interface BuildingsConnectionStatusProps {
  buildingsCount: number;
  userEmail?: string;
}

const BuildingsConnectionStatus: React.FC<BuildingsConnectionStatusProps> = ({
  buildingsCount,
  userEmail
}) => {
  const hasBuildings = buildingsCount > 0;

  return (
    <Card className={`${hasBuildings ? 'bg-green-50 border-green-200' : 'bg-orange-50 border-orange-200'}`}>
      <CardContent className="p-4">
        <div className="flex items-center space-x-3">
          {hasBuildings ? (
            <>
              <CheckCircle className="h-6 w-6 text-green-600" />
              <div>
                <h3 className="font-semibold text-green-800 flex items-center">
                  <Shield className="h-4 w-4 mr-1" />
                  RLS Corrigido - Dados Carregados!
                </h3>
                <p className="text-green-700 text-sm">
                  {buildingsCount} prédios encontrados • Super Admin: {userEmail}
                </p>
              </div>
            </>
          ) : (
            <>
              <AlertCircle className="h-6 w-6 text-orange-600" />
              <div>
                <h3 className="font-semibold text-orange-800">Conectado - Nenhum Prédio Encontrado</h3>
                <p className="text-orange-700 text-sm">
                  Base de dados vazia ou sem permissões • Usuário: {userEmail}
                </p>
              </div>
            </>
          )}
        </div>
      </CardContent>
    </Card>
  );
};

export default BuildingsConnectionStatus;
