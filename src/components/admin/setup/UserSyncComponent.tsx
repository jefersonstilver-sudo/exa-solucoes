
import React, { useState } from 'react';
import { Alert, AlertDescription, AlertTitle } from "@/components/ui/alert";
import { supabase } from '@/integrations/supabase/client';
import { Button } from '@/components/ui/button';
import { toast } from 'sonner';
import { CheckCircle, AlertCircle, Loader2, User } from 'lucide-react';
import { Card, CardContent, CardDescription, CardFooter, CardHeader, CardTitle } from '@/components/ui/card';

interface SyncStatus {
  success: boolean;
  message: string;
  userCount: number;
}

// Define the interface for user objects from auth.users
interface AuthUser {
  id: string;
  email: string | null;
  user_metadata?: {
    role?: string;
  };
  [key: string]: any;
}

// Define the interface for user objects from public.users
interface DbUser {
  id: string;
  email: string;
  role?: string;
  [key: string]: any;
}

const UserSyncComponent: React.FC = () => {
  const [isSyncing, setIsSyncing] = useState(false);
  const [syncStatus, setSyncStatus] = useState<SyncStatus | null>(null);

  // Handle user sync between auth.users and public.users
  const syncUsers = async () => {
    setIsSyncing(true);
    setSyncStatus(null);
    
    try {
      // Call our edge function to sync users and bypass RLS issues
      const response = await fetch('https://aakenoljsycyrcrchgxj.supabase.co/functions/v1/sync-users', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        }
      });
      
      if (!response.ok) {
        throw new Error(`Error syncing users: ${response.statusText}`);
      }
      
      const syncResult = await response.json();
      
      if (!syncResult || !syncResult.success) {
        throw new Error(syncResult?.message || 'Unknown error during synchronization');
      }
      
      setSyncStatus({
        success: true,
        message: syncResult.message || 'Synchronization completed successfully!',
        userCount: syncResult.syncedCount || 0
      });
      
      toast.success(`Sincronizados ${syncResult.syncedCount || 0} usuários`);
      
    } catch (error: any) {
      console.error('Error syncing users:', error);
      setSyncStatus({
        success: false,
        message: error.message || 'An error occurred during synchronization',
        userCount: 0
      });
      toast.error(`Erro na sincronização: ${error.message}`);
    } finally {
      setIsSyncing(false);
    }
  };

  return (
    <Card>
      <CardHeader>
        <CardTitle className="flex items-center gap-2">
          <User className="text-blue-500" />
          Sincronização de Usuários
        </CardTitle>
        <CardDescription>
          Sincronize usuários entre auth.users e public.users para garantir permissões corretas
        </CardDescription>
      </CardHeader>
      
      <CardContent>
        {syncStatus ? (
          <Alert variant={syncStatus.success ? "default" : "destructive"}>
            {syncStatus.success ? (
              <CheckCircle className="h-5 w-5" />
            ) : (
              <AlertCircle className="h-5 w-5" />
            )}
            <AlertTitle>
              {syncStatus.success ? "Sincronização Concluída" : "Erro na Sincronização"}
            </AlertTitle>
            <AlertDescription>
              {syncStatus.message}
              {syncStatus.success && syncStatus.userCount > 0 && (
                <p className="mt-2">
                  {syncStatus.userCount} usuários foram sincronizados com sucesso.
                </p>
              )}
            </AlertDescription>
          </Alert>
        ) : (
          <div>
            <p className="mb-4">
              Este processo irá sincronizar usuários entre as tabelas auth.users e public.users,
              garantindo que todos os usuários tenham seus papéis corretamente definidos.
            </p>
            <ul className="list-disc pl-5 space-y-1 mb-4">
              <li>Usuários existentes apenas em auth.users serão adicionados à tabela public.users</li>
              <li>Papel padrão 'client' será atribuído aos novos usuários</li>
              <li>A operação é segura e não afetará usuários já sincronizados</li>
            </ul>
          </div>
        )}
      </CardContent>
      
      <CardFooter>
        <Button 
          onClick={syncUsers} 
          disabled={isSyncing}
          className="w-full"
        >
          {isSyncing ? (
            <>
              <Loader2 className="mr-2 h-4 w-4 animate-spin" />
              Sincronizando...
            </>
          ) : (
            'Iniciar Sincronização'
          )}
        </Button>
      </CardFooter>
    </Card>
  );
};

export default UserSyncComponent;
