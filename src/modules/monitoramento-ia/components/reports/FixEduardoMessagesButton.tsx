import React, { useState } from 'react';
import { Button } from '@/components/ui/button';
import { RefreshCw, Loader2 } from 'lucide-react';
import { supabase } from '@/integrations/supabase/client';
import { toast } from 'sonner';

export const FixEduardoMessagesButton = () => {
  const [isFixing, setIsFixing] = useState(false);

  const handleFix = async () => {
    setIsFixing(true);
    
    try {
      const { data, error } = await supabase.functions.invoke('fix-eduardo-messages', {});

      if (error) throw error;

      toast.success(`✅ Correção concluída! ${data.fixed} mensagens corrigidas de ${data.total} analisadas`);
    } catch (error) {
      console.error('Erro ao corrigir mensagens:', error);
      toast.error('Erro ao corrigir mensagens');
    } finally {
      setIsFixing(false);
    }
  };

  return (
    <Button
      onClick={handleFix}
      disabled={isFixing}
      variant="outline"
      className="gap-2"
    >
      {isFixing ? (
        <>
          <Loader2 className="w-4 h-4 animate-spin" />
          Corrigindo...
        </>
      ) : (
        <>
          <RefreshCw className="w-4 h-4" />
          Corrigir Mensagens Eduardo
        </>
      )}
    </Button>
  );
};
