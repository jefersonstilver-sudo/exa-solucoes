import React from 'react';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { Bell, BellOff, Clock } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Tooltip, TooltipContent, TooltipProvider, TooltipTrigger } from '@/components/ui/tooltip';
import { supabase } from '@/integrations/supabase/client';
import { toast } from 'sonner';

interface ProposalReminderIndicatorProps {
  proposalId: string;
  proposalStatus: string;
  compact?: boolean;
}

export const ProposalReminderIndicator: React.FC<ProposalReminderIndicatorProps> = ({
  proposalId,
  proposalStatus,
  compact = false
}) => {
  const queryClient = useQueryClient();

  // Só mostrar para propostas expiradas
  const isExpired = proposalStatus === 'expirada';

  const { data: notifSettings, isLoading } = useQuery({
    queryKey: ['proposal-notification-settings', proposalId],
    queryFn: async () => {
      const { data, error } = await supabase
        .from('proposal_notification_settings')
        .select('*')
        .eq('proposal_id', proposalId)
        .maybeSingle();
      
      if (error) throw error;
      return data;
    },
    enabled: isExpired
  });

  const muteMutation = useMutation({
    mutationFn: async (reason: string) => {
      const { error } = await supabase
        .from('proposal_notification_settings')
        .upsert({
          proposal_id: proposalId,
          expire_reminders_muted: true,
          expire_reminders_muted_at: new Date().toISOString(),
          mute_reason: reason,
        }, {
          onConflict: 'proposal_id'
        });

      if (error) throw error;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['proposal-notification-settings', proposalId] });
      toast.success('Lembretes silenciados');
    },
    onError: () => {
      toast.error('Erro ao silenciar lembretes');
    }
  });

  const unmuteMutation = useMutation({
    mutationFn: async () => {
      const { error } = await supabase
        .from('proposal_notification_settings')
        .update({
          expire_reminders_muted: false,
          expire_reminders_muted_at: null,
          mute_reason: null,
        })
        .eq('proposal_id', proposalId);

      if (error) throw error;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['proposal-notification-settings', proposalId] });
      toast.success('Lembretes reativados');
    },
    onError: () => {
      toast.error('Erro ao reativar lembretes');
    }
  });

  if (!isExpired) return null;
  if (isLoading) return null;

  const isMuted = notifSettings?.expire_reminders_muted;
  const reminderCount = notifSettings?.reminders_sent_count || 0;
  const muteReason = notifSettings?.mute_reason;

  const getMuteReasonLabel = (reason: string | null) => {
    switch (reason) {
      case 'ja_enviei': return 'Já enviou nova proposta';
      case 'descartado': return 'Cliente descartado';
      case 'cliente_contactado': return 'Cliente contactado';
      default: return 'Silenciado';
    }
  };

  if (compact) {
    return (
      <TooltipProvider>
        <Tooltip>
          <TooltipTrigger asChild>
            {isMuted ? (
              <Badge variant="outline" className="bg-gray-100 text-gray-500 text-[10px] px-1">
                <BellOff className="h-3 w-3" />
              </Badge>
            ) : (
              <Badge variant="outline" className="bg-amber-100 text-amber-700 text-[10px] px-1 animate-pulse">
                <Bell className="h-3 w-3 mr-0.5" />
                {reminderCount > 0 && reminderCount}
              </Badge>
            )}
          </TooltipTrigger>
          <TooltipContent>
            {isMuted ? (
              <p>Lembretes silenciados: {getMuteReasonLabel(muteReason)}</p>
            ) : (
              <p>Lembretes ativos ({reminderCount} enviados)</p>
            )}
          </TooltipContent>
        </Tooltip>
      </TooltipProvider>
    );
  }

  return (
    <div className="flex items-center gap-2">
      {isMuted ? (
        <>
          <Badge variant="outline" className="bg-gray-100 text-gray-500 text-xs">
            <BellOff className="h-3 w-3 mr-1" />
            {getMuteReasonLabel(muteReason)}
          </Badge>
          <Button
            variant="ghost"
            size="sm"
            className="h-6 text-xs"
            onClick={() => unmuteMutation.mutate()}
            disabled={unmuteMutation.isPending}
          >
            Reativar
          </Button>
        </>
      ) : (
        <>
          <Badge variant="outline" className="bg-amber-100 text-amber-700 text-xs animate-pulse">
            <Bell className="h-3 w-3 mr-1" />
            {reminderCount} lembrete{reminderCount !== 1 ? 's' : ''} enviado{reminderCount !== 1 ? 's' : ''}
          </Badge>
          <Button
            variant="ghost"
            size="sm"
            className="h-6 text-xs text-muted-foreground"
            onClick={() => muteMutation.mutate('manual')}
            disabled={muteMutation.isPending}
          >
            <BellOff className="h-3 w-3 mr-1" />
            Silenciar
          </Button>
        </>
      )}
    </div>
  );
};
