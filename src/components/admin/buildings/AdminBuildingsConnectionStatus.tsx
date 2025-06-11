
import React from 'react';
import { Card, CardContent } from '@/components/ui/card';
import { CheckCircle, AlertTriangle, User } from 'lucide-react';

interface AdminBuildingsConnectionStatusProps {
  buildingsCount: number;
  activeCount: number;
  inactiveCount: number;
  userEmail?: string;
}

const AdminBuildingsConnectionStatus: React.FC<AdminBuildingsConnectionStatusProps> = ({
  buildingsCount,
  activeCount,
  inactiveCount,
  userEmail
}) => {
  return (
    <Card className="bg-gradient-to-r from-green-50 to-blue-50 border-green-200">
      <CardContent className="p-4">
        <div className="flex items-center justify-between">
          <div className="flex items-center space-x-4">
            <div className="flex items-center space-x-2">
              <CheckCircle className="h-5 w-5 text-green-600" />
              <span className="text-sm font-medium text-green-800">
                Sistema Administrativo Conectado
              </span>
            </div>
            
            <div className="text-sm text-gray-600">
              Total: {buildingsCount} | 
              <span className="text-green-600 ml-1">Ativos: {activeCount}</span> | 
              <span className="text-orange-600 ml-1">Inativos: {inactiveCount}</span>
            </div>
          </div>
          
          <div className="flex items-center space-x-2 text-xs text-gray-500">
            {userEmail && (
              <>
                <User className="h-4 w-4" />
                <span>{userEmail}</span>
              </>
            )}
          </div>
        </div>
        
        {inactiveCount > 0 && (
          <div className="mt-2 flex items-center space-x-2">
            <AlertTriangle className="h-4 w-4 text-orange-600" />
            <span className="text-sm text-orange-700">
              {inactiveCount} prédio{inactiveCount > 1 ? 's' : ''} inativo{inactiveCount > 1 ? 's' : ''} 
              {inactiveCount > 1 ? ' aparecem' : ' aparece'} como "Em Manutenção" na loja pública
            </span>
          </div>
        )}
      </CardContent>
    </Card>
  );
};

export default AdminBuildingsConnectionStatus;
