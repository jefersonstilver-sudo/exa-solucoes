
import React from 'react';
import AdminLayout from '@/components/admin/layout/AdminLayout';
import { useUserSession } from '@/hooks/useUserSession';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Shield, RefreshCw } from 'lucide-react';
import { toast } from 'sonner';
import AdminInitializer from '@/components/admin/setup/AdminInitializer';
import UserSyncComponent from '@/components/admin/setup/UserSyncComponent';

const ConfiguracoesPage = () => {
  const { user } = useUserSession();
  
  return (
    <AdminLayout title="Configurações" requireSuperAdmin={true}>
      <div className="space-y-6">
        <div className="flex justify-between items-center">
          <div>
            <h1 className="text-2xl font-bold">Configurações do Sistema</h1>
            <p className="text-muted-foreground">
              Gerencie as configurações do sistema e inicialize componentes essenciais
            </p>
          </div>
        </div>
        
        <div className="grid md:grid-cols-2 gap-6">
          <Card>
            <CardHeader>
              <CardTitle>Inicializar Admin Master</CardTitle>
            </CardHeader>
            <CardContent>
              <p className="mb-4 text-sm text-muted-foreground">
                Crie ou configure o usuário administrador master com acesso total ao sistema.
              </p>
              <AdminInitializer />
            </CardContent>
          </Card>
          
          <Card>
            <CardHeader>
              <CardTitle>Sincronizar Usuários</CardTitle>
            </CardHeader>
            <CardContent>
              <p className="mb-4 text-sm text-muted-foreground">
                Sincronize usuários entre o sistema de autenticação e o banco de dados.
              </p>
              <UserSyncComponent />
            </CardContent>
          </Card>
        </div>
        
        <div className="border-t pt-6 mt-6">
          <h2 className="text-xl font-semibold mb-4">Informações do Sistema</h2>
          <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
            <Card>
              <CardContent className="pt-6">
                <div className="text-center">
                  <p className="text-sm font-medium">Versão do Sistema</p>
                  <p className="text-2xl font-bold mt-1">1.0.0</p>
                </div>
              </CardContent>
            </Card>
            
            <Card>
              <CardContent className="pt-6">
                <div className="text-center">
                  <p className="text-sm font-medium">Ambiente</p>
                  <p className="text-2xl font-bold mt-1">Produção</p>
                </div>
              </CardContent>
            </Card>
            
            <Card>
              <CardContent className="pt-6">
                <div className="text-center">
                  <p className="text-sm font-medium">Usuário Atual</p>
                  <div className="flex items-center justify-center gap-2 mt-1">
                    <Shield className="h-5 w-5 text-amber-500" />
                    <p className="text-xl font-bold">{user?.role || 'N/A'}</p>
                  </div>
                </div>
              </CardContent>
            </Card>
          </div>
        </div>
      </div>
    </AdminLayout>
  );
};

export default ConfiguracoesPage;
