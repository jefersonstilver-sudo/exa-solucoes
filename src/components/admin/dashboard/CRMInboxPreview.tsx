import React from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { MessageCircle, ArrowRight } from 'lucide-react';
import { useNavigate } from 'react-router-dom';
import { useUnreadCount } from '@/modules/monitoramento-ia/hooks/useUnreadCount';

const CRMInboxPreview = () => {
  const navigate = useNavigate();
  const { unreadCount, loading } = useUnreadCount();

  if (loading) {
    return (
      <Card className="bg-gradient-to-br from-background via-background to-accent/5 rounded-2xl border border-border/40 shadow-lg hover:shadow-xl hover:border-primary/20 transition-all">
        <CardHeader className="pb-3">
          <CardTitle className="text-sm flex items-center gap-2">
            <MessageCircle className="h-4 w-4 text-red-500" />
            CRM - Aguardando Resposta
          </CardTitle>
        </CardHeader>
        <CardContent>
          <div className="h-24 bg-gray-100 rounded-lg animate-pulse" />
        </CardContent>
      </Card>
    );
  }

  return (
    <Card className="bg-gradient-to-br from-background via-background to-accent/5 rounded-2xl border border-border/40 shadow-lg hover:shadow-xl hover:border-primary/20 transition-all">
      <CardHeader className="pb-3">
        <div className="flex items-center justify-between">
          <CardTitle className="text-sm md:text-base flex items-center gap-2">
            <MessageCircle className="h-4 w-4 text-red-500 animate-pulse" />
            CRM - Aguardando Resposta
          </CardTitle>
          {unreadCount > 0 && (
            <span className="bg-red-500 text-white text-xs font-bold px-2 py-0.5 rounded-full">
              {unreadCount}
            </span>
          )}
        </div>
      </CardHeader>
      <CardContent className="space-y-3">
        <div className="text-center py-8">
          <div className="text-4xl font-bold text-red-500 mb-2">
            {unreadCount}
          </div>
          <p className="text-sm text-gray-600">
            {unreadCount === 0 
              ? 'Nenhuma conversa aguardando' 
              : unreadCount === 1
              ? 'Conversa aguardando resposta'
              : 'Conversas aguardando resposta'
            }
          </p>
        </div>

        <Button
          variant="ghost"
          size="sm"
          className="w-full"
          onClick={() => navigate('/admin/monitoramento-ia/conversas')}
        >
          Ver conversas
          <ArrowRight className="h-3 w-3 ml-1" />
        </Button>
      </CardContent>
    </Card>
  );
};

export default CRMInboxPreview;
