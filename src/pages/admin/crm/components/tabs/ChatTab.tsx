import React from 'react';
import { useNavigate } from 'react-router-dom';
import { MessageCircle } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { useAdminBasePath } from '@/hooks/useAdminBasePath';

// O CRM Chat antigo foi eliminado: as conversas ficam no CRM Evolution (Sofia e colaboradores).
const ChatTab: React.FC = () => {
  const navigate = useNavigate();
  const { buildPath } = useAdminBasePath();
  return (
    <div className="bg-white rounded-xl border border-gray-200 -mx-4 md:mx-0">
      <div className="min-h-[320px] flex flex-col items-center justify-center text-center p-8 gap-3">
        <div className="w-14 h-14 rounded-full bg-red-50 flex items-center justify-center">
          <MessageCircle className="h-7 w-7 text-red-700" />
        </div>
        <h2 className="text-lg font-semibold text-foreground">As conversas agora ficam no CRM Evolution</h2>
        <p className="text-sm text-muted-foreground max-w-md">
          Conversas da Sofia e dos colaboradores, com histórico completo e envio de mensagens.
        </p>
        <Button onClick={() => navigate(buildPath('crm-evolution'))} className="bg-red-700 hover:bg-red-800 text-white">
          Abrir CRM Evolution
        </Button>
      </div>
    </div>
  );
};

export default ChatTab;
