import { useState, useEffect } from 'react';
import { supabase } from '@/integrations/supabase/client';

export interface MessagePreview {
  id: string;
  sender: string;
  senderType: 'contact' | 'agent';
  text: string;
  timestamp: string;
  mediaType: 'text' | 'image' | 'audio' | 'video' | 'document';
  hasMedia: boolean;
}

export interface DetailedContextStats {
  totalMessages: number;
  messagesByContact: number;
  messagesByAgent: number;
  whoStarted: 'contact' | 'agent' | 'unknown';
  firstMessageDate: Date | null;
  lastMessageDate: Date | null;
  daysSinceFirstContact: number;
  dominantSpeaker: string;
  dominantPercentage: number;
}

export interface SuggestedContactType {
  type: string;
  confidence: number;
  reason: string;
}

export interface DetailedContext {
  loading: boolean;
  stats: DetailedContextStats;
  lastMessages: MessagePreview[];
  contextSummary: string;
  conversationStatus: 'active' | 'waiting_response' | 'resolved' | 'dormant';
  hasExaAlerts: boolean;
  hasFinancialMentions: boolean;
  hasMediaSent: boolean;
  hasPendingQuestion: boolean;
  lastIssue: string | null;
  lastResolution: string | null;
  pendingAction: string | null;
  suggestedContactType: SuggestedContactType | null;
}

export const useConversationContextDetailed = (
  conversationId: string | null,
  currentContactType: string | null
) => {
  const [context, setContext] = useState<DetailedContext>({
    loading: true,
    stats: {
      totalMessages: 0,
      messagesByContact: 0,
      messagesByAgent: 0,
      whoStarted: 'unknown',
      firstMessageDate: null,
      lastMessageDate: null,
      daysSinceFirstContact: 0,
      dominantSpeaker: 'Nenhum',
      dominantPercentage: 0,
    },
    lastMessages: [],
    contextSummary: '',
    conversationStatus: 'active',
    hasExaAlerts: false,
    hasFinancialMentions: false,
    hasMediaSent: false,
    hasPendingQuestion: false,
    lastIssue: null,
    lastResolution: null,
    pendingAction: null,
    suggestedContactType: null,
  });

  useEffect(() => {
    if (!conversationId) {
      setContext(prev => ({ ...prev, loading: false }));
      return;
    }

    const fetchDetailedContext = async () => {
      setContext(prev => ({ ...prev, loading: true }));

      try {
        // Buscar TODAS as mensagens da conversa
        const { data: messages, error } = await supabase
          .from('messages')
          .select('*')
          .eq('conversation_id', conversationId)
          .order('created_at', { ascending: true });

        if (error || !messages || messages.length === 0) {
          setContext(prev => ({
            ...prev,
            loading: false,
            contextSummary: 'Nenhuma mensagem encontrada nesta conversa.',
          }));
          return;
        }

        // === CALCULAR ESTATÍSTICAS ===
        const totalMessages = messages.length;
        const messagesByContact = messages.filter(m => m.direction === 'inbound').length;
        const messagesByAgent = messages.filter(m => m.direction === 'outbound').length;
        
        const firstMessage = messages[0];
        const lastMessage = messages[messages.length - 1];
        const firstMessageDate = new Date(firstMessage.created_at);
        const lastMessageDate = new Date(lastMessage.created_at);
        const daysSinceFirstContact = Math.floor(
          (Date.now() - firstMessageDate.getTime()) / (1000 * 60 * 60 * 24)
        );

        const whoStarted = firstMessage.direction === 'inbound' ? 'contact' : 'agent';

        let dominantSpeaker = 'Nenhum';
        let dominantPercentage = 0;
        if (messagesByContact > messagesByAgent) {
          dominantSpeaker = 'Contato';
          dominantPercentage = Math.round((messagesByContact / totalMessages) * 100);
        } else if (messagesByAgent > messagesByContact) {
          dominantSpeaker = 'Agente';
          dominantPercentage = Math.round((messagesByAgent / totalMessages) * 100);
        } else {
          dominantSpeaker = 'Equilibrado';
          dominantPercentage = 50;
        }

        // === PREPARAR ÚLTIMAS MENSAGENS ===
        const lastN = 10;
        const recentMessages = messages.slice(-lastN).reverse();
        const lastMessagesPreview: MessagePreview[] = recentMessages.map(msg => {
          const hasMedia = !!(msg.has_image || msg.has_audio);
          let mediaType: MessagePreview['mediaType'] = 'text';
          if (msg.has_image) mediaType = 'image';
          else if (msg.has_audio) mediaType = 'audio';

          return {
            id: msg.id,
            sender: msg.direction === 'inbound' ? 'Contato' : (msg.agent_key || 'Agente'),
            senderType: msg.direction === 'inbound' ? 'contact' : 'agent',
            text: msg.body || '[Mensagem vazia]',
            timestamp: new Date(msg.created_at).toLocaleString('pt-BR', {
              day: '2-digit',
              month: '2-digit',
              hour: '2-digit',
              minute: '2-digit'
            }),
            mediaType,
            hasMedia,
          };
        });

        // === ANÁLISE DE CONTEÚDO ===
        const allTexts = messages.map(m => (m.body || '').toLowerCase()).join(' ');
        
        const hasExaAlerts = /exa|alerta|emergência|problema grave|urgente/i.test(allTexts);
        const hasFinancialMentions = /pagamento|pix|boleto|recibo|financeiro|valor|preço|cobrança/i.test(allTexts);
        const hasMediaSent = messages.some(m => m.has_image || m.has_audio);
        
        // Verificar última mensagem tem pergunta não respondida
        const lastContactMessage = messages.filter(m => m.direction === 'inbound').pop();
        const lastAgentMessage = messages.filter(m => m.direction === 'outbound').pop();
        const hasPendingQuestion = 
          lastContactMessage && 
          lastAgentMessage &&
          new Date(lastContactMessage.created_at) > new Date(lastAgentMessage.created_at) &&
          /\?/.test(lastContactMessage.body || '');

        // === ANÁLISE DE PROBLEMAS E RESOLUÇÕES ===
        let lastIssue: string | null = null;
        let lastResolution: string | null = null;
        let pendingAction: string | null = null;

        // Procurar último problema mencionado
        const issueKeywords = ['problema', 'erro', 'não funciona', 'defeito', 'com defeito', 'quebrado', 'parado'];
        for (let i = messages.length - 1; i >= 0; i--) {
          const text = (messages[i].body || '').toLowerCase();
          if (issueKeywords.some(kw => text.includes(kw))) {
            lastIssue = messages[i].body?.substring(0, 100) || null;
            break;
          }
        }

        // Procurar última resolução
        const resolutionKeywords = ['resolvido', 'solucionado', 'ok', 'tudo certo', 'funcionando', 'consertado'];
        for (let i = messages.length - 1; i >= 0; i--) {
          const text = (messages[i].body || '').toLowerCase();
          if (resolutionKeywords.some(kw => text.includes(kw))) {
            lastResolution = messages[i].body?.substring(0, 100) || null;
            break;
          }
        }

        // Procurar ações pendentes mencionadas
        const actionKeywords = ['vou', 'vamos', 'preciso', 'vou enviar', 'irei'];
        for (let i = messages.length - 1; i >= 0; i--) {
          const text = (messages[i].body || '').toLowerCase();
          if (messages[i].direction === 'outbound' && actionKeywords.some(kw => text.includes(kw))) {
            pendingAction = messages[i].body?.substring(0, 100) || null;
            break;
          }
        }

        // === DETERMINAR STATUS DA CONVERSA ===
        const hoursSinceLastMessage = (Date.now() - lastMessageDate.getTime()) / (1000 * 60 * 60);
        let conversationStatus: DetailedContext['conversationStatus'] = 'active';
        
        if (lastResolution && hoursSinceLastMessage < 24) {
          conversationStatus = 'resolved';
        } else if (hasPendingQuestion) {
          conversationStatus = 'waiting_response';
        } else if (hoursSinceLastMessage > 48) {
          conversationStatus = 'dormant';
        }

        // === GERAR RESUMO CONTEXTUAL MELHORADO ===
        const shorten = (text: string, maxLen: number = 120) => 
          text.length > maxLen ? text.substring(0, maxLen) + '...' : text;

        let contextSummary = '';
        
        // 1. Verificar se alguma mensagem tem ai_analysis
        const aiSummaries = messages
          .filter(m => {
            const analysis = m.ai_analysis as any;
            return analysis?.summary || analysis?.key_points;
          })
          .slice(-3);

        if (aiSummaries.length > 0) {
          const latestAI = aiSummaries[aiSummaries.length - 1].ai_analysis as any;
          if (latestAI?.summary) {
            contextSummary = latestAI.summary as string;
          } else if (latestAI?.key_points && Array.isArray(latestAI.key_points) && latestAI.key_points.length > 0) {
            contextSummary = `Pontos-chave: ${latestAI.key_points.slice(0, 3).join(', ')}`;
          }
        }

        // 2. Se não tem AI summary, gerar baseado em regras
        if (!contextSummary) {
          if (lastIssue && lastResolution) {
            const issueAuthor = messages.find(m => m.body === lastIssue)?.direction === 'inbound' ? 'Contato' : 'Agente';
            const resolutionAuthor = messages.find(m => m.body === lastResolution)?.direction === 'inbound' ? 'Contato' : 'Agente';
            contextSummary = `${issueAuthor} reportou: "${shorten(lastIssue, 80)}". ${resolutionAuthor} respondeu: "${shorten(lastResolution, 80)}"`;
          } else if (lastIssue) {
            const issueAuthor = messages.find(m => m.body === lastIssue)?.direction === 'inbound' ? 'Contato' : 'Agente';
            contextSummary = `${issueAuthor} reportou: "${shorten(lastIssue)}"`;
          } else if (lastResolution) {
            const resolutionAuthor = messages.find(m => m.body === lastResolution)?.direction === 'inbound' ? 'Contato' : 'Agente';
            contextSummary = `${resolutionAuthor}: "${shorten(lastResolution)}"`;
          } else if (lastMessage) {
            const lastAuthor = lastMessage.direction === 'inbound' ? 'Contato' : lastMessage.agent_key || 'Agente';
            contextSummary = `Última mensagem de ${lastAuthor}: "${shorten(lastMessage.body || '', 100)}"`;
          } else {
            contextSummary = `Conversa iniciada em ${firstMessageDate.toLocaleDateString('pt-BR')} ${whoStarted === 'contact' ? 'pelo contato' : 'pelo agente'}. Total de ${totalMessages} mensagens.`;
          }
        }

        // === SUGESTÃO DE TIPO DE CONTATO ===
        let suggestedContactType: SuggestedContactType | null = null;
        
        if (!currentContactType || currentContactType === 'unknown') {
          // Análise de padrões para sugestão
          const sindicoKeywords = ['síndico', 'prédio', 'condomínio', 'administradora', 'painel', 'elevador', 'instalação'];
          const clienteKeywords = ['anúncio', 'campanha', 'vídeo', 'orçamento', 'contratar', 'propaganda'];
          const moradorKeywords = ['morador', 'apartamento', 'unidade', 'vizinho'];
          const suporteKeywords = ['defeito', 'problema', 'não funciona', 'erro', 'travado'];
          
          const sindicoScore = sindicoKeywords.reduce((acc, kw) => 
            acc + (allTexts.includes(kw) ? 1 : 0), 0
          );
          const clienteScore = clienteKeywords.reduce((acc, kw) => 
            acc + (allTexts.includes(kw) ? 1 : 0), 0
          );
          const moradorScore = moradorKeywords.reduce((acc, kw) => 
            acc + (allTexts.includes(kw) ? 1 : 0), 0
          );
          const suporteScore = suporteKeywords.reduce((acc, kw) => 
            acc + (allTexts.includes(kw) ? 1 : 0), 0
          );

          const scores = [
            { type: 'sindico', score: sindicoScore, label: 'Síndico' },
            { type: 'lead', score: clienteScore, label: 'Lead' },
            { type: 'lead', score: moradorScore, label: 'Lead' },
            { type: 'outros_prestadores', score: suporteScore, label: 'Outros Prestadores' },
          ];

          const maxScore = Math.max(...scores.map(s => s.score));
          
          if (maxScore > 0) {
            const suggested = scores.find(s => s.score === maxScore);
            if (suggested) {
              const confidence = Math.min(Math.round((maxScore / 5) * 100), 95);
              suggestedContactType = {
                type: suggested.type,
                confidence,
                reason: `Detectadas ${maxScore} menções relacionadas a ${suggested.label.toLowerCase()} na conversa.`,
              };
            }
          }
        }

        // === ATUALIZAR ESTADO ===
        setContext({
          loading: false,
          stats: {
            totalMessages,
            messagesByContact,
            messagesByAgent,
            whoStarted,
            firstMessageDate,
            lastMessageDate,
            daysSinceFirstContact,
            dominantSpeaker,
            dominantPercentage,
          },
          lastMessages: lastMessagesPreview,
          contextSummary,
          conversationStatus,
          hasExaAlerts,
          hasFinancialMentions,
          hasMediaSent,
          hasPendingQuestion,
          lastIssue,
          lastResolution,
          pendingAction,
          suggestedContactType,
        });

      } catch (error) {
        console.error('[useConversationContextDetailed] Error:', error);
        setContext(prev => ({
          ...prev,
          loading: false,
          contextSummary: 'Erro ao carregar contexto da conversa.',
        }));
      }
    };

    fetchDetailedContext();
  }, [conversationId, currentContactType]);

  return context;
};
