
import React, { useState, useEffect } from 'react';
import { Button } from '@/components/ui/button';
import { toast } from 'sonner';
import { Shield, CheckCircle, AlertCircle } from 'lucide-react';
import { Card, CardContent, CardDescription, CardFooter, CardHeader, CardTitle } from '@/components/ui/card';
import { supabase } from '@/integrations/supabase/client';

const AdminInitializer = () => {
  const [isLoading, setIsLoading] = useState(false);
  const [initialized, setInitialized] = useState(false);
  const [error, setError] = useState<string | null>(null);
  
  // Check if master admin exists using our security definer function
  useEffect(() => {
    const checkMasterAdmin = async () => {
      try {
        // Use our custom RPC function to avoid RLS recursion issues
        const { data, error } = await supabase.rpc(
          'admin_check_user_exists', 
          { user_email: 'jefersonstilver@gmail.com' }
        );
        
        if (error) throw error;
        
        setInitialized(!!data);
      } catch (err: any) {
        console.error('Erro ao verificar admin master:', err);
        setError(err.message);
      }
    };
    
    checkMasterAdmin();
  }, []);
  
  const initializeMasterAdmin = async () => {
    setIsLoading(true);
    setError(null);
    
    try {
      // Call the edge function to create master admin with proper authentication
      const response = await fetch('https://aakenoljsycyrcrchgxj.supabase.co/functions/v1/create-master-admin', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'apikey': 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6ImFha2Vub2xqc3ljeXJjcmNoZ3hqIiwicm9sZSI6ImFub24iLCJpYXQiOjE3NDY5MDM3NTUsImV4cCI6MjA2MjQ3OTc1NX0.wEKVfJKfQiybyne0yn0dOUwbujb_WXkZHAzlyfHb0lk'
        }
      });
      
      const data = await response.json();
      
      if (!response.ok) {
        throw new Error(data.error || 'Erro ao criar admin master');
      }
      
      toast.success('Usuário admin master criado com sucesso!');
      setInitialized(true);
    } catch (err: any) {
      console.error('Erro ao criar admin master:', err);
      setError(err.message);
      toast.error(`Erro ao criar admin master: ${err.message}`);
    } finally {
      setIsLoading(false);
    }
  };
  
  return (
    <Card className="max-w-md mx-auto">
      <CardHeader>
        <CardTitle className="flex items-center gap-2">
          <Shield className="text-indigo-500" />
          Inicialização de Administrador Master
        </CardTitle>
        <CardDescription>
          {initialized 
            ? 'O usuário administrador master já está configurado.'
            : 'Configure o usuário administrador master do sistema.'}
        </CardDescription>
      </CardHeader>
      
      <CardContent>
        {initialized ? (
          <div className="flex items-center gap-2 text-green-500">
            <CheckCircle className="h-5 w-5" />
            <p>Usuário admin master já está configurado:</p>
          </div>
        ) : error ? (
          <div className="flex items-center gap-2 text-red-500">
            <AlertCircle className="h-5 w-5" />
            <p>{error}</p>
          </div>
        ) : (
          <div>
            <p className="mb-4">
              Este processo irá criar o usuário administrador master com as seguintes credenciais:
            </p>
            <ul className="list-disc pl-5 space-y-1">
              <li>Email: <span className="font-mono">jefersonstilver@gmail.com</span></li>
              <li>Senha: <span className="font-mono">573039</span></li>
              <li>Função: <span className="font-semibold">Super Admin</span></li>
            </ul>
          </div>
        )}
      </CardContent>
      
      <CardFooter>
        {initialized ? (
          <Button variant="outline" disabled>Já inicializado</Button>
        ) : (
          <Button 
            onClick={initializeMasterAdmin} 
            disabled={isLoading}
            className="w-full"
          >
            {isLoading ? (
              <>
                <span className="animate-spin mr-2">⟳</span>
                Inicializando...
              </>
            ) : (
              'Inicializar Admin Master'
            )}
          </Button>
        )}
      </CardFooter>
    </Card>
  );
};

export default AdminInitializer;
