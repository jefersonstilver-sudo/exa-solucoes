import React, { useState } from 'react';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Users } from 'lucide-react';
import { useQuery } from '@tanstack/react-query';
import { supabase } from '@/integrations/supabase/client';
import ManageAlertContactsModal from './ManageAlertContactsModal';

const AgendaAlertContactsButton = () => {
  const [modalOpen, setModalOpen] = useState(false);

  // Get active contacts count
  const { data: contactsCount } = useQuery({
    queryKey: ['agenda-alert-contacts-count'],
    queryFn: async () => {
      const { count, error } = await supabase
        .from('exa_alerts_directors')
        .select('*', { count: 'exact', head: true })
        .eq('ativo', true);
      
      if (error) throw error;
      return count || 0;
    }
  });

  return (
    <>
      <Button
        onClick={() => setModalOpen(true)}
        size="sm"
        variant="outline"
        className="h-8 text-xs gap-1.5 border-blue-200 text-blue-700 hover:bg-blue-50"
      >
        <Users className="h-3.5 w-3.5" />
        Contatos
        {contactsCount !== undefined && contactsCount > 0 && (
          <Badge 
            variant="secondary" 
            className="ml-0.5 h-4 min-w-[16px] text-[10px] px-1 bg-blue-100 text-blue-700"
          >
            {contactsCount}
          </Badge>
        )}
      </Button>

      <ManageAlertContactsModal
        open={modalOpen}
        onOpenChange={setModalOpen}
      />
    </>
  );
};

export default AgendaAlertContactsButton;
