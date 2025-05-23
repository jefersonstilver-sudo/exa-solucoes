
import React, { useState, useEffect } from 'react';
import { Button } from '@/components/ui/button';
import { toast } from 'sonner';
import { Shield, CheckCircle, AlertCircle } from 'lucide-react';
import { Card, CardContent, CardDescription, CardFooter, CardHeader, CardTitle } from '@/components/ui/card';
import { supabase } from '@/integrations/supabase/client';
import MasterAdminFixer from './MasterAdminFixer';

const AdminInitializer = () => {
  const [initialized, setInitialized] = useState(false);
  const [error, setError] = useState<string | null>(null);
  
  useEffect(() => {
    checkMasterAdmin();
  }, []);
  
  const checkMasterAdmin = async () => {
    try {
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
  
  return (
    <div className="space-y-6">
      <Card className="max-w-md mx-auto">
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <Shield className="text-indigo-500" />
            Sistema de Login Simplificado
          </CardTitle>
          <CardDescription>
            {initialized 
              ? 'Sistema configurado e funcionando com trigger automático.'
              : 'Sistema precisa ser configurado.'}
          </CardDescription>
        </CardHeader>
        
        <CardContent>
          {initialized ? (
            <div className="flex items-center gap-2 text-green-500">
              <CheckCircle className="h-5 w-5" />
              <p>Sistema funcionando corretamente</p>
            </div>
          ) : error ? (
            <div className="flex items-center gap-2 text-red-500">
              <AlertCircle className="h-5 w-5" />
              <p>{error}</p>
            </div>
          ) : (
            <div className="text-center space-y-2">
              <p className="text-sm text-gray-600">
                Sistema sendo inicializado...
              </p>
            </div>
          )}
        </CardContent>
        
        <CardFooter>
          <Button 
            onClick={checkMasterAdmin}
            className="w-full"
            variant="outline"
          >
            Verificar Status
          </Button>
        </CardFooter>
      </Card>

      <MasterAdminFixer />
    </div>
  );
};

export default AdminInitializer;
