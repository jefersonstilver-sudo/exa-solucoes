
import { useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { useToast } from '@/hooks/use-toast';
import { supabase } from '@/integrations/supabase/client';

export const useCheckoutAuth = (setSessionUser: (user: any) => void) => {
  const { toast } = useToast();
  const navigate = useNavigate();
  
  // Check if user is authenticated
  useEffect(() => {
    console.log("useCheckoutAuth: Verificando autenticação do usuário");
    const checkAuth = async () => {
      const { data } = await supabase.auth.getSession();
      console.log("useCheckoutAuth: Sessão verificada", data.session ? "Usuário logado" : "Usuário não logado");
      
      if (!data.session?.user) {
        toast({
          title: "Acesso restrito",
          description: "Você precisa estar logado para finalizar a compra.",
          variant: "destructive"
        });
        navigate('/login?redirect=/checkout');
      } else {
        setSessionUser(data.session.user);
      }
    };
    
    checkAuth();
    
    // Set up auth state change listener
    const { data: { subscription } } = supabase.auth.onAuthStateChange((event, session) => {
      console.log("useCheckoutAuth: Auth state mudou:", event);
      if (event === 'SIGNED_IN') {
        setSessionUser(session?.user || null);
      } else if (event === 'SIGNED_OUT') {
        setSessionUser(null);
        navigate('/login?redirect=/checkout');
      }
    });
    
    return () => {
      subscription.unsubscribe();
    };
  }, [navigate, toast, setSessionUser]);
};
