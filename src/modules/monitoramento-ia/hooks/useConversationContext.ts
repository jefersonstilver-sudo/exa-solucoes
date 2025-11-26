import { useState, useEffect } from 'react';
import { supabase } from '@/integrations/supabase/client';

export interface ConversationContext {
  lastProblem: string | null;
  lastAction: { agent: string; action: string; timestamp: string } | null;
  currentStatus: 'pending' | 'resolved' | 'awaiting_client' | 'unknown';
  suggestedContactType: { type: string; reason: string } | null;
  contextSummary: string;
  hasExaAlert: boolean;
  hasFinancialActivity: boolean;
  lastManualSend: { type: string; timestamp: string } | null;
  lastMessageIntent: string | null;
  loading: boolean;
}

const PROBLEM_KEYWORDS = ['problema', 'erro', 'não funciona', 'offline', 'parado', 'defeito', 'quebrado', 'painel', 'travado', 'bug'];
const SOLUTION_KEYWORDS = ['resolvido', 'corrigido', 'funcionando', 'ok', 'pronto', 'feito', 'arrumado'];
const EXA_KEYWORDS = ['alerta', 'exa', 'alert', 'critical', 'urgente'];
const FINANCIAL_KEYWORDS = ['pagamento', 'recibo', 'comprovante', 'pago', 'valor', 'R$', 'real', 'reais'];
const MANUAL_SEND_KEYWORDS = ['enviei', 'mandei', 'segue', 'anexo', 'arquivo', 'vídeo', 'campanha', 'anúncio'];
const SINDICO_KEYWORDS = ['síndico', 'sindico', 'condomínio', 'condominio', 'prédio', 'predio', 'elevador', 'manutenção', 'manutencao'];
const CLIENT_KEYWORDS = ['anunciar', 'anúncio', 'anuncio', 'campanha', 'divulgar', 'publicidade'];

export const useConversationContext = (conversationId: string | null, contactType: string | null) => {
  const [context, setContext] = useState<ConversationContext>({
    lastProblem: null,
    lastAction: null,
    currentStatus: 'unknown',
    suggestedContactType: null,
    contextSummary: 'Nenhum contexto disponível ainda.',
    hasExaAlert: false,
    hasFinancialActivity: false,
    lastManualSend: null,
    lastMessageIntent: null,
    loading: true
  });

  useEffect(() => {
    if (!conversationId) {
      setContext(prev => ({ ...prev, loading: false }));
      return;
    }

    const fetchContext = async () => {
      setContext(prev => ({ ...prev, loading: true }));

      try {
        // Buscar últimas 20 mensagens
        const { data: messages, error } = await supabase
          .from('messages')
          .select('*')
          .eq('conversation_id', conversationId)
          .order('created_at', { ascending: false })
          .limit(20);

        if (error) throw error;

        if (!messages || messages.length === 0) {
          setContext({
            lastProblem: null,
            lastAction: null,
            currentStatus: 'unknown',
            suggestedContactType: null,
            contextSummary: 'Nenhuma mensagem encontrada nesta conversa.',
            hasExaAlert: false,
            hasFinancialActivity: false,
            lastManualSend: null,
            lastMessageIntent: null,
            loading: false
          });
          return;
        }

        // Analisar mensagens
        let lastProblem: string | null = null;
        let lastAction: { agent: string; action: string; timestamp: string } | null = null;
        let currentStatus: 'pending' | 'resolved' | 'awaiting_client' | 'unknown' = 'unknown';
        let hasExaAlert = false;
        let hasFinancialActivity = false;
        let lastManualSend: { type: string; timestamp: string } | null = null;
        let lastMessageIntent: string | null = null;
        let suggestedContactType: { type: string; reason: string } | null = null;

        // Contar menções de palavras-chave para sugestão de tipo
        let sindicoMentions = 0;
        let clientMentions = 0;

        // Analisar mensagens (mais recente primeiro)
        for (const msg of messages) {
          const text = (msg.body || '').toLowerCase();
          const agentKey = msg.agent_key || '';
          const direction = msg.direction;
          const timestamp = msg.created_at;

          // Detectar última intenção de mensagem (primeira mensagem = mais recente)
          if (!lastMessageIntent && text.length > 0) {
            if (text.includes('?')) {
              lastMessageIntent = 'Pergunta do contato';
            } else if (direction === 'outbound') {
              lastMessageIntent = 'Resposta do agente';
            } else {
              lastMessageIntent = 'Mensagem do contato';
            }
          }

          // Detectar último problema
          if (!lastProblem && PROBLEM_KEYWORDS.some(k => text.includes(k))) {
            lastProblem = `Problema mencionado: "${text.substring(0, 100)}..."`;
          }

          // Detectar última ação do agente
          if (!lastAction && direction === 'outbound') {
            const agentName = agentKey.toLowerCase().includes('eduardo') ? 'Eduardo' : 
                             agentKey.toLowerCase().includes('sofia') ? 'Sofia' : 
                             agentKey || 'Agente';
            
            if (SOLUTION_KEYWORDS.some(k => text.includes(k))) {
              lastAction = {
                agent: agentName,
                action: 'Reportou solução ou confirmação',
                timestamp
              };
              currentStatus = 'resolved';
            } else if (text.includes('aguard') || text.includes('vou verificar')) {
              lastAction = {
                agent: agentName,
                action: 'Solicitou aguardar verificação',
                timestamp
              };
              currentStatus = 'pending';
            } else {
              lastAction = {
                agent: agentName,
                action: 'Enviou resposta',
                timestamp
              };
            }
          }

          // Detectar EXA Alert
          if (EXA_KEYWORDS.some(k => text.includes(k))) {
            hasExaAlert = true;
          }

          // Detectar atividade financeira
          if (FINANCIAL_KEYWORDS.some(k => text.includes(k))) {
            hasFinancialActivity = true;
          }

          // Detectar envios manuais
          if (!lastManualSend && MANUAL_SEND_KEYWORDS.some(k => text.includes(k))) {
            let type = 'arquivo';
            if (text.includes('vídeo') || text.includes('video')) type = 'vídeo';
            if (text.includes('campanha') || text.includes('anúncio')) type = 'campanha';
            if (text.includes('recibo') || text.includes('comprovante')) type = 'comprovante';
            
            lastManualSend = { type, timestamp };
          }

          // Contar menções para sugestão de tipo
          if (SINDICO_KEYWORDS.some(k => text.includes(k))) {
            sindicoMentions++;
          }
          if (CLIENT_KEYWORDS.some(k => text.includes(k))) {
            clientMentions++;
          }
        }

        // Se status ainda é unknown mas tem problema sem solução
        if (currentStatus === 'unknown' && lastProblem && !lastAction) {
          currentStatus = 'pending';
        }

        // Se tem ação mas não é resolved, verificar se está aguardando cliente
        if (currentStatus === 'unknown' && lastAction) {
          const lastMsg = messages[0];
          if (lastMsg.direction === 'outbound') {
            currentStatus = 'awaiting_client';
          }
        }

        // Sugerir tipo de contato se não está definido
        if (!contactType || contactType === 'unknown') {
          if (sindicoMentions > clientMentions && sindicoMentions > 0) {
            suggestedContactType = {
              type: 'sindico',
              reason: `Foram detectadas ${sindicoMentions} menções relacionadas a síndico/condomínio nas últimas mensagens.`
            };
          } else if (clientMentions > sindicoMentions && clientMentions > 0) {
            suggestedContactType = {
              type: 'client',
              reason: `Foram detectadas ${clientMentions} menções sobre anúncios e campanhas nas últimas mensagens.`
            };
          }
        }

        // Gerar resumo contextual
        let contextSummary = '';
        const lastMsgDate = messages[0]?.created_at 
          ? new Date(messages[0].created_at).toLocaleString('pt-BR', { 
              day: '2-digit', 
              month: '2-digit', 
              hour: '2-digit', 
              minute: '2-digit' 
            })
          : '';

        if (lastProblem && lastAction) {
          contextSummary = `${lastMsgDate} — ${lastProblem.substring(0, 80)}. ${lastAction.agent} ${lastAction.action.toLowerCase()}.`;
        } else if (lastProblem) {
          contextSummary = `${lastMsgDate} — ${lastProblem} (Aguardando ação do agente)`;
        } else if (lastAction) {
          contextSummary = `${lastMsgDate} — ${lastAction.agent} ${lastAction.action.toLowerCase()}.`;
        } else {
          contextSummary = `Última atividade: ${lastMsgDate}. ${messages.length} mensagem(ns) recente(s).`;
        }

        if (hasExaAlert) {
          contextSummary += ' ⚠️ EXA Alert mencionado.';
        }
        if (hasFinancialActivity) {
          contextSummary += ' 💰 Atividade financeira detectada.';
        }
        if (lastManualSend) {
          const sendDate = new Date(lastManualSend.timestamp).toLocaleString('pt-BR', { 
            day: '2-digit', 
            month: '2-digit', 
            hour: '2-digit', 
            minute: '2-digit' 
          });
          contextSummary += ` 📎 Último envio: ${lastManualSend.type} em ${sendDate}.`;
        }

        setContext({
          lastProblem,
          lastAction,
          currentStatus,
          suggestedContactType,
          contextSummary,
          hasExaAlert,
          hasFinancialActivity,
          lastManualSend,
          lastMessageIntent,
          loading: false
        });

      } catch (error) {
        console.error('Error fetching conversation context:', error);
        setContext(prev => ({ 
          ...prev, 
          contextSummary: 'Erro ao carregar contexto.',
          loading: false 
        }));
      }
    };

    fetchContext();
  }, [conversationId, contactType]);

  return context;
};
