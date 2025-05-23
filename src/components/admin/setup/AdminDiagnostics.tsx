
import React from 'react';
import { Shield } from 'lucide-react';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { useUserSession } from '@/hooks/useUserSession';

interface AdminDiagnosticsProps {
  localAuthCheck: string | null;
}

const AdminDiagnostics = ({ localAuthCheck }: AdminDiagnosticsProps) => {
  const { user } = useUserSession();

  return (
    <Card className="max-w-md mx-auto">
      <CardHeader>
        <CardTitle className="flex items-center gap-2">
          <Shield className="text-blue-500" />
          Diagnóstico do Sistema
        </CardTitle>
        <CardDescription>
          Verificar e corrigir problemas de autenticação do usuário administrador master.
        </CardDescription>
      </CardHeader>
      
      <CardContent>
        {localAuthCheck && (
          <div className="text-xs bg-gray-100 p-2 rounded border border-gray-300 mb-2">
            <p>Status da autenticação: {localAuthCheck}</p>
            {user && (
              <p>Usuário atual: {user.email} (Role: {user.role || 'desconhecido'})</p>
            )}
          </div>
        )}
      </CardContent>
    </Card>
  );
};

export default AdminDiagnostics;
