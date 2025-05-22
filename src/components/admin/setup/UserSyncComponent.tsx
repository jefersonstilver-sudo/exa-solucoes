
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

const UserSyncComponent: React.FC = () => {
  const [isSyncing, setIsSyncing] = useState(false);
  const [syncStatus, setSyncStatus] = useState<SyncStatus | null>(null);

  // Handle user sync between auth.users and public.users
  const syncUsers = async () => {
    setIsSyncing(true);
    setSyncStatus(null);
    
    try {
      // Fetch users from auth.users
      const { data: authUsers, error: authError } = await supabase.auth.admin.listUsers();
      
      if (authError) {
        throw new Error(`Error fetching auth users: ${authError.message}`);
      }
      
      if (!authUsers?.users?.length) {
        throw new Error('No auth users found');
      }
      
      // Get existing users from public.users
      const { data: existingUsers, error: existingError } = await supabase
        .from('users')
        .select('id');
        
      if (existingError) {
        throw new Error(`Error fetching existing users: ${existingError.message}`);
      }
      
      // Create a set of existing user IDs for quick lookup
      const existingUserIds = new Set<string>();
      if (existingUsers && Array.isArray(existingUsers)) {
        existingUsers.forEach(user => {
          if (user && typeof user === 'object' && 'id' in user) {
            existingUserIds.add(user.id as string);
          }
        });
      }
      
      // Find users that are in auth.users but not in public.users
      const usersToCreate = authUsers.users
        .filter(authUser => !existingUserIds.has(authUser.id))
        .map(authUser => ({
          id: authUser.id,
          email: authUser.email,
          role: authUser.user_metadata?.role || 'client' // Default to 'client' if no role
        }));
      
      if (usersToCreate.length === 0) {
        setSyncStatus({
          success: true,
          message: 'All users are already synchronized!',
          userCount: 0
        });
        return;
      }
      
      // Insert missing users into public.users
      const { data, error } = await supabase
        .from('users')
        .insert(usersToCreate)
        .select();
        
      if (error) {
        throw new Error(`Error syncing users: ${error.message}`);
      }
      
      setSyncStatus({
        success: true,
        message: `Successfully synchronized ${usersToCreate.length} users between auth and public tables!`,
        userCount: usersToCreate.length
      });
      
      toast.success(`Sincronizados ${usersToCreate.length} usuários`);
      
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
    <section>
      <h2 className="text-xl font-semibold mb-4">2. Sincronizar Usuários</h2>
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
    </section>
  );
};

export default UserSyncComponent;
