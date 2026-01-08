import { useState, useEffect, useCallback, useMemo } from 'react';
import { supabase } from '@/integrations/supabase/client';
import { toast } from 'sonner';
import { Email, EmailThread, EmailFilters, EmailStats, ComposeEmail } from '@/types/email';
import { useAuth } from '@/hooks/useAuth';
import { useEmailPermissions } from './useEmailPermissions';

export const useEmails = (filters?: EmailFilters) => {
  const [emails, setEmails] = useState<Email[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const { userProfile } = useAuth();
  const permissions = useEmailPermissions();

  const fetchEmails = useCallback(async () => {
    if (permissions.accessLevel === 'none') {
      setEmails([]);
      setLoading(false);
      return;
    }

    try {
      setLoading(true);
      setError(null);

      let query = supabase
        .from('emails')
        .select(`
          *,
          client:contacts(id, nome, email)
        `)
        .order('received_at', { ascending: false });

      // Aplicar filtros
      if (filters?.direction) {
        query = query.eq('direction', filters.direction);
      }
      if (filters?.categoria) {
        query = query.eq('categoria', filters.categoria);
      }
      if (filters?.clientId) {
        query = query.eq('client_id', filters.clientId);
      }
      if (filters?.vendaId) {
        query = query.eq('venda_id', filters.vendaId);
      }
      if (filters?.isRead !== undefined) {
        query = query.eq('is_read', filters.isRead);
      }
      if (filters?.isStarred) {
        query = query.eq('is_starred', true);
      }
      if (filters?.isArchived !== undefined) {
        query = query.eq('is_archived', filters.isArchived);
      } else {
        // Por padrão, não mostrar arquivados
        query = query.eq('is_archived', false);
      }
      if (filters?.search) {
        query = query.or(`subject.ilike.%${filters.search}%,from_email.ilike.%${filters.search}%,body_preview.ilike.%${filters.search}%`);
      }
      if (filters?.dateFrom) {
        query = query.gte('received_at', filters.dateFrom);
      }
      if (filters?.dateTo) {
        query = query.lte('received_at', filters.dateTo);
      }

      // Filtrar por permissões de categoria
      if (permissions.allowedCategorias.length > 0 && permissions.allowedCategorias.length < 5) {
        query = query.in('categoria', permissions.allowedCategorias);
      }

      // Filtrar por propriedade se acesso é 'own'
      if (permissions.accessLevel === 'own' && userProfile?.id) {
        query = query.eq('usuario_origem_id', userProfile.id);
      }

      const { data, error: fetchError } = await query.limit(100);

      if (fetchError) throw fetchError;

      const mappedEmails = (data || []).map((item: any) => ({
        ...item,
        attachments: Array.isArray(item.attachments) ? item.attachments : []
      })) as Email[];

      setEmails(mappedEmails);
    } catch (err) {
      console.error('Erro ao buscar e-mails:', err);
      setError('Erro ao carregar e-mails');
    } finally {
      setLoading(false);
    }
  }, [filters, permissions, userProfile]);

  useEffect(() => {
    fetchEmails();
  }, [fetchEmails]);

  // Estatísticas
  const stats: EmailStats = useMemo(() => {
    const byCategoria = {
      comercial: 0,
      financeiro: 0,
      marketing: 0,
      suporte: 0,
      geral: 0
    };

    emails.forEach(email => {
      if (email.categoria) {
        byCategoria[email.categoria]++;
      }
    });

    return {
      total: emails.length,
      unread: emails.filter(e => !e.is_read).length,
      starred: emails.filter(e => e.is_starred).length,
      inbound: emails.filter(e => e.direction === 'inbound').length,
      outbound: emails.filter(e => e.direction === 'outbound').length,
      byCategoria
    };
  }, [emails]);

  // Marcar como lido
  const markAsRead = useCallback(async (emailId: string, isRead: boolean = true) => {
    try {
      const { error: updateError } = await supabase
        .from('emails')
        .update({ is_read: isRead })
        .eq('id', emailId);

      if (updateError) throw updateError;

      setEmails(prev => prev.map(e => 
        e.id === emailId ? { ...e, is_read: isRead } : e
      ));
    } catch (err) {
      console.error('Erro ao atualizar e-mail:', err);
      toast.error('Erro ao atualizar e-mail');
    }
  }, []);

  // Toggle estrela
  const toggleStar = useCallback(async (emailId: string) => {
    const email = emails.find(e => e.id === emailId);
    if (!email) return;

    try {
      const { error: updateError } = await supabase
        .from('emails')
        .update({ is_starred: !email.is_starred })
        .eq('id', emailId);

      if (updateError) throw updateError;

      setEmails(prev => prev.map(e => 
        e.id === emailId ? { ...e, is_starred: !e.is_starred } : e
      ));
    } catch (err) {
      console.error('Erro ao atualizar e-mail:', err);
      toast.error('Erro ao atualizar e-mail');
    }
  }, [emails]);

  // Arquivar
  const archiveEmail = useCallback(async (emailId: string) => {
    if (!permissions.canArchive) {
      toast.error('Sem permissão para arquivar');
      return;
    }

    try {
      const { error: updateError } = await supabase
        .from('emails')
        .update({ is_archived: true })
        .eq('id', emailId);

      if (updateError) throw updateError;

      setEmails(prev => prev.filter(e => e.id !== emailId));
      toast.success('E-mail arquivado');
    } catch (err) {
      console.error('Erro ao arquivar e-mail:', err);
      toast.error('Erro ao arquivar e-mail');
    }
  }, [permissions]);

  // Enviar e-mail
  const sendEmail = useCallback(async (compose: ComposeEmail) => {
    if (!permissions.canSend) {
      toast.error('Sem permissão para enviar e-mails');
      return null;
    }

    try {
      const { data, error: insertError } = await supabase
        .from('emails')
        .insert({
          from_email: userProfile?.email || 'sistema@examidia.com.br',
          from_name: userProfile?.name || 'Sistema EXA',
          to_email: compose.to,
          cc: compose.cc || [],
          subject: compose.subject,
          body_html: compose.body,
          body_preview: compose.body.substring(0, 200),
          direction: 'outbound',
          client_id: compose.clientId || null,
          venda_id: compose.vendaId || null,
          campanha_id: compose.campanhaId || null,
          usuario_origem_id: userProfile?.id,
          categoria: compose.categoria || 'geral',
          is_read: true,
          sent_at: new Date().toISOString()
        })
        .select()
        .single();

      if (insertError) throw insertError;

      toast.success('E-mail enviado com sucesso');
      await fetchEmails();
      return data;
    } catch (err) {
      console.error('Erro ao enviar e-mail:', err);
      toast.error('Erro ao enviar e-mail');
      return null;
    }
  }, [permissions, userProfile, fetchEmails]);

  return {
    emails,
    loading,
    error,
    stats,
    permissions,
    fetchEmails,
    markAsRead,
    toggleStar,
    archiveEmail,
    sendEmail
  };
};

// Hook para buscar e-mails de um cliente específico
export const useClientEmails = (clientId: string | null) => {
  return useEmails(clientId ? { clientId } : undefined);
};

// Hook para threads
export const useEmailThreads = () => {
  const [threads, setThreads] = useState<EmailThread[]>([]);
  const [loading, setLoading] = useState(true);
  const permissions = useEmailPermissions();

  useEffect(() => {
    const fetchThreads = async () => {
      if (permissions.accessLevel === 'none') {
        setThreads([]);
        setLoading(false);
        return;
      }

      try {
        const { data, error } = await supabase
          .from('email_threads')
          .select(`
            *,
            client:contacts(id, nome, email)
          `)
          .eq('is_archived', false)
          .order('last_message_at', { ascending: false })
          .limit(50);

        if (error) throw error;
        setThreads((data as EmailThread[]) || []);
      } catch (err) {
        console.error('Erro ao buscar threads:', err);
      } finally {
        setLoading(false);
      }
    };

    fetchThreads();
  }, [permissions]);

  return { threads, loading };
};
