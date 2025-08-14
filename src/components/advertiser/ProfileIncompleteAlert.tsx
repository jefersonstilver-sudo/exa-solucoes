import React from 'react';
import { Alert, AlertDescription } from '@/components/ui/alert';
import { Button } from '@/components/ui/button';
import { AlertTriangle } from 'lucide-react';
import { useNavigate } from 'react-router-dom';
import { supabase } from '@/integrations/supabase/client';
import { useProfileValidation } from '@/hooks/useProfileValidation';
import { useEffect, useState } from 'react';

interface UserSettings {
  name?: string;
  cpf?: string;
  documento_estrangeiro?: string;
  documento_frente_url?: string;
  documento_verso_url?: string;
  tipo_documento?: 'cpf' | 'documento_estrangeiro';
}

export const ProfileIncompleteAlert = () => {
  const navigate = useNavigate();
  const [settings, setSettings] = useState<UserSettings>({});
  const [loading, setLoading] = useState(true);
  
  const { isProfileComplete, missingFields } = useProfileValidation(settings);

  useEffect(() => {
    const loadUserSettings = async () => {
      try {
        // Replicar a mesma lógica do AdvertiserSettings
        const { data: authUser } = await supabase.auth.getUser();
        const { data: userData } = await supabase
          .from('users')
          .select('*')
          .eq('id', authUser.user?.id)
          .single();
          
        if (authUser.user) {
          setSettings({
            name: authUser.user.user_metadata?.name || authUser.user.user_metadata?.full_name || '',
            cpf: userData?.cpf || '',
            documento_estrangeiro: userData?.documento_estrangeiro || '',
            documento_frente_url: userData?.documento_frente_url || '',
            documento_verso_url: userData?.documento_verso_url || '',
            tipo_documento: (userData?.tipo_documento as 'cpf' | 'documento_estrangeiro') || 'cpf'
          });
        }
      } catch (error) {
        console.error('Erro ao carregar perfil:', error);
      } finally {
        setLoading(false);
      }
    };

    loadUserSettings();
  }, []);

  if (loading || isProfileComplete) {
    return null;
  }

  return (
    <Alert variant="destructive" className="mb-6 bg-destructive text-destructive-foreground border-destructive">
      <AlertTriangle className="h-4 w-4" />
      <AlertDescription className="flex items-center justify-between">
        <div>
          <strong>Perfil Incompleto!</strong> Para continuar usando a plataforma, complete as seguintes informações: {missingFields.join(', ')}.
        </div>
        <Button 
          variant="outline" 
          size="sm" 
          onClick={() => navigate('/anunciante/perfil')}
          className="ml-4 bg-background text-foreground hover:bg-background/90"
        >
          Completar Perfil
        </Button>
      </AlertDescription>
    </Alert>
  );
};