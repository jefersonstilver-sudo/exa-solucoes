import { useState } from 'react';
import { Switch } from '@/components/ui/switch';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Bot, Zap } from 'lucide-react';
import { supabase } from '@/integrations/supabase/client';
import { toast } from 'sonner';

interface AIAutoResponseToggleProps {
  agentId: string;
  agentKey: string;
  agentName: string;
  whatsappProvider?: string;
  aiAutoResponse: boolean;
  onUpdate?: () => void;
}

export const AIAutoResponseToggle = ({
  agentId,
  agentKey,
  agentName,
  whatsappProvider,
  aiAutoResponse,
  onUpdate
}: AIAutoResponseToggleProps) => {
  const [isEnabled, setIsEnabled] = useState(aiAutoResponse);
  const [isUpdating, setIsUpdating] = useState(false);

  // Só mostrar para agentes Z-API
  if (whatsappProvider !== 'zapi') {
    return null;
  }

  const handleToggleAI = async (checked: boolean) => {
    setIsUpdating(true);
    
    try {
      const { error } = await supabase
        .from('agents')
        .update({ ai_auto_response: checked })
        .eq('id', agentId);

      if (error) throw error;

      setIsEnabled(checked);
      toast.success(
        checked 
          ? `🤖 IA ativada para ${agentName}` 
          : `IA desativada para ${agentName}`
      );
      
      onUpdate?.();
    } catch (error) {
      console.error('Error toggling AI:', error);
      toast.error('Erro ao atualizar configuração de IA');
    } finally {
      setIsUpdating(false);
    }
  };

  return (
    <Card className="border-primary/20 bg-gradient-to-br from-primary/5 to-transparent">
      <CardHeader>
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-2">
            <Bot className="h-5 w-5 text-primary" />
            <CardTitle className="text-lg">Resposta Automática com IA</CardTitle>
            {isEnabled && (
              <Badge variant="default" className="gap-1">
                <Zap className="h-3 w-3" />
                ATIVA
              </Badge>
            )}
          </div>
          <Switch
            checked={isEnabled}
            onCheckedChange={handleToggleAI}
            disabled={isUpdating}
          />
        </div>
        <CardDescription>
          Quando ativada, a IA responderá automaticamente mensagens recebidas no WhatsApp usando o conhecimento configurado para este agente.
        </CardDescription>
      </CardHeader>
      <CardContent>
        <div className="rounded-lg border border-muted bg-muted/50 p-4 text-sm text-muted-foreground">
          <p className="font-medium text-foreground mb-2">Como funciona:</p>
          <ul className="list-disc list-inside space-y-1">
            <li>Mensagens recebidas são analisadas pela IA</li>
            <li>Respostas são geradas com base na base de conhecimento</li>
            <li>Mensagens são enviadas automaticamente via WhatsApp</li>
            <li>Todo histórico é mantido para contexto</li>
          </ul>
        </div>
      </CardContent>
    </Card>
  );
};
