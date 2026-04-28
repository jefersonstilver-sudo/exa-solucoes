import React, { useState, useEffect, useRef } from 'react';
import { supabase } from '@/integrations/supabase/client';
import { useAuth } from '@/hooks/useAuth';
import { toast } from 'sonner';
import {
  Sparkles, Send, Loader2, History, Trash2, Copy,
  RotateCcw, Film, ChevronDown,
} from 'lucide-react';
import exaLogo from '@/assets/exa-logo.png';

// ── System Prompt ─────────────────────────────────────────────────────────────
const SOFIA_PROMPT = `Você é Sofia, especialista em copy e direção criativa de vídeo DOOH da EXA Mídia (Foz do Iguaçu, PR).
Sua missão: criar roteiros assertivos para painéis digitais em elevadores residenciais da Examidia.

PLATAFORMA EXA:
- Vertical: 1080×1920px, 15 segundos, 3 empresas por ciclo de exibição
- Horizontal: 1440×1080px, 10 segundos, 15 empresas por ciclo
- Taxa de atenção: 95% (passageiro cativo) | 40-60 exibições/semana por morador
- Blueprint vertical 15s: 0-2s CAPTURA | 2-5s PROBLEMA/DESEJO | 5-10s SOLUÇÃO+PROVA | 10-13s OFERTA+URGÊNCIA | 13-15s ANCORAGEM (logo+contato estático)
- Blueprint horizontal 10s: 0-2s CAPTURA | 2-6s MENSAGEM ÚNICA | 6-8s CREDENCIAL | 8-10s ANCORAGEM
- Regras: fonte 60pt mínimo | máx 3 cores, alto contraste | 5-7 palavras/linha | sem logo inicial | legível sem áudio

SEU PROCESSO DE ENTREVISTA:
Faça UMA pergunta por vez, de forma natural, próxima e profissional — como uma consultora que entende de negócios.
Colete estas informações essenciais:
1. Nome da empresa/marca anunciante
2. Segmento de negócio (seja específico — não chute)
3. Formato: vertical (15s) ou horizontal (10s)
4. Quantidade de vídeos: 1 a 10
5. Objetivo/intenção principal da campanha (ex: promoção, lançamento, awareness, captação)
6. Informações extras relevantes: promoção, datas, diferenciais, telefone, preço, anos de experiência, etc.

Adapte suas perguntas com base nas respostas. Se o usuário der respostas vagas, aprofunde.
Quando tiver todas as informações necessárias (normalmente após 5-7 trocas), gere os roteiros.

COMO GERAR OS ROTEIROS:
Quando tiver informações suficientes, escreva EXATAMENTE esta linha primeiro:
✅ Entendi tudo! Aqui estão seus roteiros personalizados:

Depois gere cada roteiro neste formato:
---
## ROTEIRO [N]: [TIPO EM MAIÚSCULO]
**Objetivo:** [objetivo do vídeo]
| Tempo | Tipo de Cena | VISUAL | TEXTO NA TELA | ÁUDIO |
|-------|-------------|--------|---------------|-------|
[preencha cada linha seguindo o blueprint do formato escolhido]
**Dica de produção:** [1 dica específica e prática]
---

Tipos possíveis: INSTITUCIONAL, OFERTA, AWARENESS, PROVA SOCIAL, CTA DIRETO, FILLER UTILIDADE
Use palavras de alto impacto quando pertinente: Grátis, Agora, Você, Novo, Garantido, Exclusivo, Resultado, Fácil, Rápido, Hoje.
Escreva em português brasileiro, seja direto e profissional.`;

const GREETING = `Olá! Sou a **Sofia**, sua especialista em copy e direção criativa da EXA Mídia. 🎬

Estou aqui para criar roteiros que realmente vendem nos painéis digitais dos elevadores — com PNL aplicada, blueprints de neuromarketing e linguagem do seu público.

Para começar, me diga: **para qual empresa vamos criar esses roteiros?**`;

// ── Types ─────────────────────────────────────────────────────────────────────
interface Msg { role: 'user' | 'assistant'; content: string; }
interface RoteiroRecord {
  id: string; company_name: string; segment: string; format: string;
  video_count: number; tone: string | null; roteiro_content: string; created_at: string;
}

// ── Markdown-like renderer (bold + line breaks) ───────────────────────────────
function renderText(text: string): React.ReactNode {
  return text.split('\n').map((line, i) => {
    const parts = line.split(/(\*\*[^*]+\*\*)/g).map((p, j) =>
      p.startsWith('**') && p.endsWith('**')
        ? <strong key={j}>{p.slice(2, -2)}</strong>
        : p
    );
    return <React.Fragment key={i}>{parts}{i < text.split('\n').length - 1 && <br />}</React.Fragment>;
  });
}

// ── Roteiro block detector ────────────────────────────────────────────────────
function isRoteiroReady(text: string): boolean {
  return text.includes('## ROTEIRO') || text.includes('✅ Entendi tudo');
}

// ── Component ─────────────────────────────────────────────────────────────────
const GeradorRoteiros: React.FC = () => {
  const { userProfile } = useAuth();
  const [view, setView] = useState<'chat' | 'history'>('chat');
  const [msgs, setMsgs] = useState<Msg[]>([{ role: 'assistant', content: GREETING }]);
  const [input, setInput] = useState('');
  const [loading, setLoading] = useState(false);
  const [roteiroSaved, setRoteiroSaved] = useState(false);
  const [history, setHistory] = useState<RoteiroRecord[]>([]);
  const [histLoad, setHistLoad] = useState(false);
  const bottomRef = useRef<HTMLDivElement>(null);
  const inputRef = useRef<HTMLTextAreaElement>(null);

  useEffect(() => {
    bottomRef.current?.scrollIntoView({ behavior: 'smooth' });
  }, [msgs, loading]);

  useEffect(() => {
    if (view === 'history') loadHistory();
  }, [view]);

  const loadHistory = async () => {
    setHistLoad(true);
    const { data } = await supabase.from('roteiros_gerados' as any).select('*').order('created_at', { ascending: false });
    if (data) setHistory(data as unknown as RoteiroRecord[]);
    setHistLoad(false);
  };

  const copy = (text: string) => { navigator.clipboard.writeText(text); toast.success('Copiado!'); };
  const del = async (id: string) => {
    await supabase.from('roteiros_gerados' as any).delete().eq('id', id);
    setHistory(h => h.filter(r => r.id !== id));
    toast.success('Excluído');
  };

  const resetChat = () => {
    setMsgs([{ role: 'assistant', content: GREETING }]);
    setInput('');
    setRoteiroSaved(false);
  };

  const send = async () => {
    const text = input.trim();
    if (!text || loading) return;

    const newMsgs: Msg[] = [...msgs, { role: 'user', content: text }];
    setMsgs(newMsgs);
    setInput('');
    setLoading(true);

    try {
      // Build messages without the initial greeting (which is our "system" context)
      const apiMessages = newMsgs.map(m => ({ role: m.role, content: m.content }));

      const { data, error } = await supabase.functions.invoke('generate-roteiro', {
        body: {
          model: 'claude-3-5-sonnet-20241022',
          max_tokens: 4096,
          system: SOFIA_PROMPT,
          messages: apiMessages,
        },
      });

      if (error) {
        throw new Error(`Edge Function: ${error.message}`);
      }

      if (!data) {
        throw new Error('Resposta vazia da Edge Function');
      }

      if (data.error) {
        throw new Error(data.error.message || JSON.stringify(data.error));
      }

      const aiText = data?.content?.[0]?.text;
      if (!aiText) {
        throw new Error('Claude não retornou conteúdo. Verifique a API key no Supabase Secrets.');
      }

      const finalMsgs: Msg[] = [...newMsgs, { role: 'assistant', content: aiText }];
      setMsgs(finalMsgs);

      // Auto-save when roteiro is generated
      if (isRoteiroReady(aiText) && !roteiroSaved) {
        setRoteiroSaved(true);
        const { data: { user } } = await supabase.auth.getUser();
        if (user) {
          await supabase.from('roteiros_gerados' as any).insert({
            user_id: user.id,
            company_name: extractCompany(finalMsgs),
            segment: 'Conversa com IA',
            format: aiText.toLowerCase().includes('horizontal') ? 'horizontal' : 'vertical',
            video_count: countRoteiros(aiText),
            tone: 'sofia-ia',
            has_qr_code: false,
            blueprint_types: [],
            roteiro_content: aiText,
          });
        }
      }
    } catch (err: any) {
      toast.error(err.message || 'Erro ao conectar com a IA');
      setMsgs(prev => [...prev, {
        role: 'assistant',
        content: `⚠️ Ocorreu um erro: ${err.message}\n\nVerifique se a Edge Function \`generate-roteiro\` está deployada no Supabase e se o secret \`ANTHROPIC_API_KEY\` está configurado.`,
      }]);
    } finally {
      setLoading(false);
      setTimeout(() => inputRef.current?.focus(), 100);
    }
  };

  const handleKey = (e: React.KeyboardEvent<HTMLTextAreaElement>) => {
    if (e.key === 'Enter' && !e.shiftKey) { e.preventDefault(); send(); }
  };

  return (
    <div style={{ display: 'flex', flexDirection: 'column', height: 'calc(100vh - 96px)', background: 'white', borderRadius: 16, overflow: 'hidden', boxShadow: '0 1px 3px rgba(0,0,0,0.08), 0 4px 20px rgba(0,0,0,0.06)', border: '1px solid rgba(0,0,0,0.07)' }}>

      {/* ── Header ── */}
      <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', padding: '16px 24px', borderBottom: '1px solid #F3F4F6', background: 'white', flexShrink: 0 }}>
        <div style={{ display: 'flex', alignItems: 'center', gap: 12 }}>
          <div style={{ width: 40, height: 40, borderRadius: 12, background: 'linear-gradient(135deg, #9C1E1E, #E8001D)', display: 'flex', alignItems: 'center', justifyContent: 'center', boxShadow: '0 2px 8px rgba(156,30,30,0.35)' }}>
            <Sparkles size={20} color="white" />
          </div>
          <div>
            <div style={{ fontWeight: 700, fontSize: 15, color: '#111827' }}>Sofia — Criadora de Roteiros</div>
            <div style={{ fontSize: 12, color: '#6B7280', display: 'flex', alignItems: 'center', gap: 6 }}>
              <span style={{ width: 6, height: 6, borderRadius: '50%', background: '#22C55E', display: 'inline-block' }} />
              Especialista em copy DOOH · EXA Mídia
            </div>
          </div>
        </div>
        <div style={{ display: 'flex', gap: 8 }}>
          <button
            onClick={() => setView(view === 'chat' ? 'history' : 'chat')}
            style={{ display: 'flex', alignItems: 'center', gap: 6, padding: '8px 14px', borderRadius: 10, fontSize: 13, fontWeight: 600, cursor: 'pointer', transition: 'all .15s', border: '1px solid',
              ...(view === 'history'
                ? { background: '#9C1E1E', color: 'white', borderColor: '#9C1E1E' }
                : { background: 'white', color: '#6B7280', borderColor: '#E5E7EB' })
            }}
          >
            <History size={14} />
            {view === 'history' ? 'Voltar ao chat' : 'Meus roteiros'}
          </button>
          {view === 'chat' && msgs.length > 1 && (
            <button
              onClick={resetChat}
              title="Nova conversa"
              style={{ display: 'flex', alignItems: 'center', gap: 6, padding: '8px 14px', borderRadius: 10, fontSize: 13, fontWeight: 600, cursor: 'pointer', background: 'white', color: '#6B7280', border: '1px solid #E5E7EB', transition: 'all .15s' }}
            >
              <RotateCcw size={14} />
              Nova
            </button>
          )}
        </div>
      </div>

      {/* ── HISTORY VIEW ── */}
      {view === 'history' && (
        <div style={{ flex: 1, overflowY: 'auto', padding: 24 }}>
          {histLoad ? (
            <div style={{ display: 'flex', justifyContent: 'center', padding: 60 }}>
              <Loader2 size={28} color="#9C1E1E" style={{ animation: 'spin 1s linear infinite' }} />
            </div>
          ) : history.length === 0 ? (
            <div style={{ textAlign: 'center', padding: '60px 0', color: '#9CA3AF' }}>
              <Film size={40} style={{ margin: '0 auto 12px', opacity: .4 }} />
              <p style={{ fontSize: 14 }}>Nenhum roteiro gerado ainda.</p>
            </div>
          ) : (
            <div style={{ display: 'flex', flexDirection: 'column', gap: 16, maxWidth: 680, margin: '0 auto' }}>
              {history.map(r => (
                <div key={r.id} style={{ background: 'white', border: '1px solid #F3F4F6', borderRadius: 16, padding: 20, boxShadow: '0 1px 4px rgba(0,0,0,0.05)' }}>
                  <div style={{ display: 'flex', alignItems: 'flex-start', justifyContent: 'space-between', gap: 12, marginBottom: 12 }}>
                    <div>
                      <div style={{ fontWeight: 700, color: '#111827', fontSize: 15 }}>{r.company_name}</div>
                      <div style={{ fontSize: 13, color: '#6B7280', marginTop: 2 }}>{r.segment}</div>
                    </div>
                    <div style={{ display: 'flex', gap: 8, flexShrink: 0 }}>
                      <span style={{ fontSize: 11, padding: '3px 10px', borderRadius: 8, background: '#FEF2F2', color: '#9C1E1E', border: '1px solid #FECACA', fontWeight: 600 }}>
                        {r.format === 'vertical' ? '9:16 · 15s' : '16:9 · 10s'}
                      </span>
                      <span style={{ fontSize: 11, padding: '3px 10px', borderRadius: 8, background: '#F9FAFB', color: '#6B7280', border: '1px solid #E5E7EB' }}>
                        {r.video_count} vídeo{r.video_count > 1 ? 's' : ''}
                      </span>
                    </div>
                  </div>
                  <div style={{ fontSize: 12, color: '#9CA3AF', background: '#F9FAFB', borderRadius: 10, padding: '10px 14px', maxHeight: 72, overflow: 'hidden', fontFamily: 'monospace', marginBottom: 12, lineHeight: 1.6 }}>
                    {r.roteiro_content.substring(0, 220)}...
                  </div>
                  <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between' }}>
                    <span style={{ fontSize: 12, color: '#D1D5DB' }}>
                      {new Date(r.created_at).toLocaleDateString('pt-BR', { day: '2-digit', month: 'short', year: 'numeric' })}
                    </span>
                    <div style={{ display: 'flex', gap: 4 }}>
                      <button onClick={() => copy(r.roteiro_content)}
                        style={{ display: 'flex', alignItems: 'center', gap: 6, fontSize: 12, padding: '6px 12px', borderRadius: 8, background: 'none', border: 'none', color: '#6B7280', cursor: 'pointer' }}>
                        <Copy size={12} /> Copiar
                      </button>
                      <button onClick={() => del(r.id)}
                        style={{ display: 'flex', alignItems: 'center', gap: 6, fontSize: 12, padding: '6px 12px', borderRadius: 8, background: 'none', border: 'none', color: '#EF4444', cursor: 'pointer' }}>
                        <Trash2 size={12} /> Excluir
                      </button>
                    </div>
                  </div>
                </div>
              ))}
            </div>
          )}
        </div>
      )}

      {/* ── CHAT VIEW ── */}
      {view === 'chat' && (
        <>
          {/* Messages */}
          <div style={{ flex: 1, overflowY: 'auto', padding: '24px 24px 16px' }}>
            <div style={{ maxWidth: 680, margin: '0 auto', display: 'flex', flexDirection: 'column', gap: 20 }}>
              {msgs.map((m, i) => (
                <div key={i} style={{ display: 'flex', gap: 12, flexDirection: m.role === 'user' ? 'row-reverse' : 'row', alignItems: 'flex-start' }}>
                  {/* Avatar */}
                  {m.role === 'assistant' && (
                    <div style={{ width: 36, height: 36, borderRadius: 12, background: 'linear-gradient(135deg, #9C1E1E, #E8001D)', display: 'flex', alignItems: 'center', justifyContent: 'center', flexShrink: 0, marginTop: 2, boxShadow: '0 2px 8px rgba(156,30,30,0.25)' }}>
                      <Sparkles size={16} color="white" />
                    </div>
                  )}
                  {m.role === 'user' && (
                    <div style={{ width: 36, height: 36, borderRadius: 12, background: '#F3F4F6', display: 'flex', alignItems: 'center', justifyContent: 'center', flexShrink: 0, marginTop: 2, fontWeight: 700, fontSize: 14, color: '#6B7280' }}>
                      {(userProfile as any)?.full_name?.charAt(0)?.toUpperCase() || (userProfile as any)?.email?.charAt(0)?.toUpperCase() || 'U'}
                    </div>
                  )}
                  {/* Bubble */}
                  <div style={{
                    maxWidth: '78%',
                    padding: isRoteiroReady(m.content) ? '20px 24px' : '14px 18px',
                    borderRadius: m.role === 'user' ? '18px 4px 18px 18px' : '4px 18px 18px 18px',
                    fontSize: 14,
                    lineHeight: 1.7,
                    ...(m.role === 'user'
                      ? { background: '#9C1E1E', color: 'white', boxShadow: '0 2px 8px rgba(156,30,30,0.2)' }
                      : isRoteiroReady(m.content)
                        ? { background: '#FFFBF0', border: '1px solid #FDE68A', color: '#111827', boxShadow: '0 2px 12px rgba(0,0,0,0.06)' }
                        : { background: '#F9FAFB', border: '1px solid #F3F4F6', color: '#111827', boxShadow: '0 1px 4px rgba(0,0,0,0.04)' }
                    ),
                  }}>
                    {isRoteiroReady(m.content) ? (
                      <div>
                        <div style={{ display: 'flex', alignItems: 'center', gap: 8, marginBottom: 16, paddingBottom: 12, borderBottom: '1px solid #FDE68A' }}>
                          <span style={{ fontSize: 16 }}>✅</span>
                          <span style={{ fontWeight: 700, color: '#92400E', fontSize: 14 }}>Roteiros criados com sucesso!</span>
                          <button onClick={() => copy(m.content)}
                            style={{ marginLeft: 'auto', display: 'flex', alignItems: 'center', gap: 5, padding: '4px 10px', borderRadius: 8, fontSize: 12, background: 'white', border: '1px solid #FDE68A', color: '#92400E', cursor: 'pointer', fontWeight: 600 }}>
                            <Copy size={11} /> Copiar tudo
                          </button>
                        </div>
                        <pre style={{ whiteSpace: 'pre-wrap', fontFamily: 'inherit', fontSize: 13, lineHeight: 1.8, color: '#1F2937' }}>
                          {m.content}
                        </pre>
                      </div>
                    ) : (
                      <div>{renderText(m.content)}</div>
                    )}
                  </div>
                </div>
              ))}

              {/* Loading */}
              {loading && (
                <div style={{ display: 'flex', gap: 12, alignItems: 'flex-start' }}>
                  <div style={{ width: 36, height: 36, borderRadius: 12, background: 'linear-gradient(135deg, #9C1E1E, #E8001D)', display: 'flex', alignItems: 'center', justifyContent: 'center', flexShrink: 0 }}>
                    <Sparkles size={16} color="white" />
                  </div>
                  <div style={{ padding: '14px 18px', borderRadius: '4px 18px 18px 18px', background: '#F9FAFB', border: '1px solid #F3F4F6', display: 'flex', gap: 5, alignItems: 'center' }}>
                    {[0, 1, 2].map(i => (
                      <div key={i} style={{ width: 7, height: 7, borderRadius: '50%', background: '#9C1E1E', animation: `bounce .9s ease-in-out ${i * .15}s infinite` }} />
                    ))}
                  </div>
                </div>
              )}
              <div ref={bottomRef} />
            </div>
          </div>

          {/* ── Input ── */}
          <div style={{ padding: '12px 24px 20px', borderTop: '1px solid #F3F4F6', background: 'white', flexShrink: 0 }}>
            <div style={{ maxWidth: 680, margin: '0 auto' }}>
              <div style={{ display: 'flex', gap: 10, alignItems: 'flex-end', background: '#F9FAFB', borderRadius: 16, border: '1.5px solid #E5E7EB', padding: '8px 8px 8px 16px', transition: 'border-color .15s' }}
                onFocus={() => {}} >
                <textarea
                  ref={inputRef}
                  value={input}
                  onChange={e => setInput(e.target.value)}
                  onKeyDown={handleKey}
                  placeholder="Escreva sua resposta... (Enter para enviar)"
                  rows={1}
                  style={{ flex: 1, resize: 'none', border: 'none', background: 'transparent', outline: 'none', fontSize: 14, lineHeight: 1.6, color: '#111827', fontFamily: 'inherit', maxHeight: 120, overflowY: 'auto' }}
                />
                <button
                  onClick={send}
                  disabled={!input.trim() || loading}
                  style={{ width: 40, height: 40, borderRadius: 10, display: 'flex', alignItems: 'center', justifyContent: 'center', border: 'none', cursor: input.trim() && !loading ? 'pointer' : 'not-allowed', transition: 'all .15s', flexShrink: 0,
                    ...(input.trim() && !loading
                      ? { background: '#9C1E1E', boxShadow: '0 2px 8px rgba(156,30,30,0.3)' }
                      : { background: '#E5E7EB' })
                  }}
                >
                  {loading
                    ? <Loader2 size={17} color="white" style={{ animation: 'spin 1s linear infinite' }} />
                    : <Send size={17} color={input.trim() && !loading ? 'white' : '#9CA3AF'} />
                  }
                </button>
              </div>
              <p style={{ fontSize: 11, color: '#D1D5DB', textAlign: 'center', marginTop: 8 }}>
                Sofia irá perguntar tudo que precisa para criar roteiros perfeitos para sua campanha
              </p>
            </div>
          </div>
        </>
      )}

      <style>{`
        @keyframes bounce { 0%,100%{transform:translateY(0)} 50%{transform:translateY(-5px)} }
        @keyframes spin { from{transform:rotate(0deg)} to{transform:rotate(360deg)} }
      `}</style>
    </div>
  );
};

export default GeradorRoteiros;

// ── Helpers ───────────────────────────────────────────────────────────────────
function extractCompany(msgs: Msg[]): string {
  const userMsgs = msgs.filter(m => m.role === 'user');
  return userMsgs[0]?.content?.substring(0, 60) || 'Empresa';
}
function countRoteiros(text: string): number {
  return (text.match(/## ROTEIRO/g) || []).length || 1;
}
