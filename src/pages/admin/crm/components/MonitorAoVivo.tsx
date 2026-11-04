import React, { useCallback, useEffect, useRef, useState } from 'react';
import { Maximize2, Minimize2, Pin, PinOff, X, Radio } from 'lucide-react';
import { supabase } from '@/integrations/supabase/client';
import type { CollaboratorRow } from './CollaboratorCard';

/**
 * Monitor ao vivo (04/11/2026): acompanha as conversas da Sofia e do Nando lado a lado, em tela cheia.
 * Só leitura: usa as mesmas ações de lista e mensagens dos painéis (sofia-panel e nando-crm), sem enviar nada.
 * Cada coluna segue sozinha a conversa que acabou de ter movimento; clicar numa conversa fixa ela (alfinete).
 */
type Agente = 'sofia' | 'nando';
type Item = { id: string; nome: string; empresa: string | null; papel: string | null; preview: string; quando: string | null; humano: boolean; aguardando?: number };
type Linha = { id: string; lado: 'in' | 'bot' | 'humano' | 'sistema'; texto: string; quando: string };

const FN: Record<Agente, string> = { sofia: 'sofia-panel', nando: 'nando-crm' };
const NOME: Record<Agente, string> = { sofia: 'Sofia', nando: 'Nando' };
const PAPEL: Record<string, string> = { cliente: 'Cliente', lead: 'Lead', sindico: 'Síndico', equipe: 'Equipe', ceo: 'CEO' };

async function chamar(ag: Agente, action: string, body: Record<string, unknown> = {}) {
  const { data, error } = await supabase.functions.invoke(FN[ag], { body: { action, ...body } });
  if (error) throw new Error(error.message);
  if ((data as any)?.error) throw new Error((data as any).error);
  return data as any;
}

async function listar(ag: Agente): Promise<Item[]> {
  const d = await chamar(ag, 'list');
  if (ag === 'sofia') {
    return (d.conversations || []).map((c: any) => ({
      id: c.id, nome: c.name, empresa: c.company || null, papel: PAPEL[c.role] || c.role || null,
      preview: c.preview || '', quando: c.last_message_at, humano: c.mode === 'humano',
    }));
  }
  return (d.conversas || []).map((c: any) => ({
    id: c.telefone, nome: c.nome, empresa: c.predio_atual || (c.predios?.[0]?.nome ?? null), papel: c.tipo === 'sindico' ? 'Síndico' : c.tipo === 'contato' ? 'Contato do prédio' : 'Sem cadastro',
    preview: `${c.ultima_papel === 'nando' ? 'Nando: ' : c.ultima_papel === 'humano' ? 'Equipe: ' : ''}${c.preview || ''}`, quando: c.ultima_em, humano: c.modo === 'humano', aguardando: c.aguardando || 0,
  }));
}

async function mensagens(ag: Agente, id: string): Promise<Linha[]> {
  if (ag === 'sofia') {
    const d = await chamar(ag, 'messages', { conversation_id: id });
    return (d.messages || []).map((m: any) => ({ id: String(m.id), lado: m.direction === 'in' ? 'in' : m.direction === 'out_bot' ? 'bot' : 'humano', texto: m.body || '', quando: m.created_at }));
  }
  const d = await chamar(ag, 'messages', { telefone: id });
  return (d.mensagens || []).map((m: any) => ({ id: String(m.id), lado: m.papel === 'sindico' ? 'in' : m.papel === 'nando' ? 'bot' : m.papel === 'humano' ? 'humano' : 'sistema', texto: m.texto || '', quando: m.created_at }));
}

const hora = (iso: string | null) => {
  if (!iso) return '';
  const d = new Date(iso);
  const hoje = new Date().toDateString() === d.toDateString();
  return hoje ? d.toLocaleTimeString('pt-BR', { hour: '2-digit', minute: '2-digit' }) : d.toLocaleDateString('pt-BR', { day: '2-digit', month: '2-digit' });
};
const recente = (iso: string | null, min = 3) => !!iso && Date.now() - new Date(iso).getTime() < min * 60000;

const Coluna: React.FC<{ ag: Agente; foto?: string | null }> = ({ ag, foto }) => {
  const [lista, setLista] = useState<Item[]>([]);
  const [erro, setErro] = useState('');
  const [fixada, setFixada] = useState<string | null>(null);
  const [linhas, setLinhas] = useState<Linha[]>([]);
  const fimRef = useRef<HTMLDivElement>(null);
  const seguida = fixada || lista[0]?.id || null;
  const seguidaRef = useRef<string | null>(null);
  seguidaRef.current = seguida;

  const carregarLista = useCallback(async () => {
    try {
      const l = await listar(ag);
      l.sort((a, b) => new Date(b.quando || 0).getTime() - new Date(a.quando || 0).getTime());
      setLista(l); setErro('');
    } catch (e: any) { setErro(e?.message || 'não foi possível carregar'); }
  }, [ag]);

  useEffect(() => { carregarLista(); const t = setInterval(carregarLista, 4000); return () => clearInterval(t); }, [carregarLista]);

  useEffect(() => {
    if (!seguida) return;
    let vivo = true;
    const ler = async () => {
      try {
        const m = await mensagens(ag, seguida);
        if (!vivo || seguidaRef.current !== seguida) return;
        setLinhas((prev) => (prev.length === m.length && prev[prev.length - 1]?.id === m[m.length - 1]?.id ? prev : m));
      } catch { /* a próxima leitura tenta de novo */ }
    };
    setLinhas([]); ler();
    const t = setInterval(ler, 3000);
    return () => { vivo = false; clearInterval(t); };
  }, [ag, seguida]);

  useEffect(() => { fimRef.current?.scrollIntoView({ block: 'end' }); }, [linhas.length, seguida]);

  const atual = lista.find((x) => x.id === seguida) || null;
  const ativas = lista.filter((x) => recente(x.quando, 60)).length;

  return (
    <section className="flex flex-col min-h-0 min-w-0 rounded-2xl bg-white border border-gray-200 overflow-hidden" aria-label={`Conversas da ${NOME[ag]}`}>
      <header className="flex items-center gap-3 px-4 py-3 border-b border-gray-100">
        {foto ? <img src={foto} alt="" className="w-9 h-9 rounded-full object-cover" /> : <div className="w-9 h-9 rounded-full bg-[#9C1E1E] text-white grid place-items-center font-bold">{NOME[ag][0]}</div>}
        <div className="min-w-0">
          <div className="font-bold text-gray-900">{NOME[ag]}</div>
          <div className="text-xs text-gray-500">{ativas} conversa{ativas === 1 ? '' : 's'} com movimento na última hora</div>
        </div>
        {erro && <span className="ml-auto text-xs text-red-700" role="alert">{erro}</span>}
      </header>

      <div className="flex-1 min-h-0 grid grid-cols-1 md:grid-cols-[minmax(220px,34%)_1fr]">
        <ul className="min-h-0 max-h-48 md:max-h-none overflow-y-auto border-b md:border-b-0 md:border-r border-gray-100">
          {lista.slice(0, 40).map((c) => {
            const ativa = c.id === seguida;
            return (
              <li key={c.id}>
                <button
                  onClick={() => setFixada(fixada === c.id ? null : c.id)}
                  className={`w-full text-left px-3 py-2.5 border-b border-gray-50 hover:bg-gray-50 ${ativa ? 'bg-red-50/70' : ''}`}
                  aria-pressed={fixada === c.id}
                >
                  <div className="flex items-center gap-2">
                    {recente(c.quando) && <span className="w-2 h-2 rounded-full bg-emerald-500 animate-pulse flex-shrink-0" aria-label="movimento agora" />}
                    <span className="font-semibold text-sm text-gray-900 truncate">{c.nome}</span>
                    {fixada === c.id && <Pin className="w-3.5 h-3.5 text-[#9C1E1E] flex-shrink-0" aria-label="fixada" />}
                    <span className="ml-auto text-[11px] text-gray-400 flex-shrink-0">{hora(c.quando)}</span>
                  </div>
                  <div className="text-xs text-[#9C1E1E] truncate">{[c.empresa, c.papel].filter(Boolean).join(' · ')}{c.humano ? ' · com a equipe' : ''}</div>
                  <div className="text-xs text-gray-500 truncate">{c.preview}</div>
                </button>
              </li>
            );
          })}
          {!lista.length && !erro && <li className="p-4 text-sm text-gray-400">Carregando conversas…</li>}
        </ul>

        <div className="flex flex-col min-h-0 min-w-0">
          <div className="flex items-center gap-2 px-4 py-2 border-b border-gray-100 bg-gray-50/60">
            <div className="min-w-0">
              <div className="text-sm font-semibold text-gray-900 truncate">{atual ? atual.nome : '—'}{atual?.empresa ? <span className="font-normal text-gray-500"> · {atual.empresa}</span> : null}</div>
              <div className="text-[11px] text-gray-500">{fixada ? 'Conversa fixada' : 'Seguindo a conversa mais recente'}</div>
            </div>
            {fixada && (
              <button onClick={() => setFixada(null)} className="ml-auto inline-flex items-center gap-1.5 text-xs font-semibold text-[#9C1E1E] hover:underline">
                <PinOff className="w-3.5 h-3.5" />Voltar a seguir a mais recente
              </button>
            )}
          </div>
          <div className="flex-1 min-h-[260px] overflow-y-auto px-4 py-3 space-y-2 bg-[#F7F5F2]" aria-live="polite">
            {linhas.slice(-80).map((m) => (
              <div key={m.id} className={`flex ${m.lado === 'in' ? 'justify-start' : m.lado === 'sistema' ? 'justify-center' : 'justify-end'}`}>
                <div className={`max-w-[85%] rounded-2xl px-3 py-2 text-sm whitespace-pre-wrap break-words shadow-sm ${m.lado === 'in' ? 'bg-white text-gray-900' : m.lado === 'bot' ? 'bg-[#9C1E1E] text-white' : m.lado === 'humano' ? 'bg-gray-900 text-white' : 'bg-amber-50 text-amber-900 text-xs'}`}>
                  {m.lado === 'humano' && <div className="text-[10px] font-bold opacity-70 mb-0.5">Equipe</div>}
                  {m.texto}
                  <div className={`text-[10px] mt-1 text-right ${m.lado === 'in' ? 'text-gray-400' : 'opacity-70'}`}>{hora(m.quando)}</div>
                </div>
              </div>
            ))}
            {seguida && !linhas.length && <p className="text-sm text-gray-400">Carregando mensagens…</p>}
            <div ref={fimRef} />
          </div>
        </div>
      </div>
    </section>
  );
};

const CHAVE = 'exa-monitor-agentes';

export const MonitorAoVivo: React.FC<{ aberto: boolean; onFechar: () => void; colaboradores: CollaboratorRow[] }> = ({ aberto, onFechar, colaboradores }) => {
  const [agentes, setAgentes] = useState<Agente[]>(() => {
    try { const v = JSON.parse(localStorage.getItem(CHAVE) || '[]'); if (Array.isArray(v) && v.length) return v.filter((x) => x === 'sofia' || x === 'nando'); } catch { /* sem preferência salva */ }
    return ['sofia', 'nando'];
  });
  const [cheia, setCheia] = useState(false);
  const raiz = useRef<HTMLDivElement>(null);

  useEffect(() => { try { localStorage.setItem(CHAVE, JSON.stringify(agentes)); } catch { /* só conveniência */ } }, [agentes]);
  useEffect(() => {
    if (!aberto) return;
    const k = (e: KeyboardEvent) => { if (e.key === 'Escape' && !document.fullscreenElement) onFechar(); };
    const f = () => setCheia(!!document.fullscreenElement);
    window.addEventListener('keydown', k); document.addEventListener('fullscreenchange', f);
    return () => { window.removeEventListener('keydown', k); document.removeEventListener('fullscreenchange', f); };
  }, [aberto, onFechar]);

  if (!aberto) return null;
  const foto = (ag: Agente) => colaboradores.find((c) => new RegExp(ag, 'i').test(`${c.collaborator_name} ${c.instance_name || ''}`))?.profile_picture_url || null;
  const alternar = (ag: Agente) => setAgentes((cur) => (cur.includes(ag) ? (cur.length > 1 ? cur.filter((x) => x !== ag) : cur) : [...cur, ag]));
  const telaCheia = async () => {
    try { if (document.fullscreenElement) await document.exitFullscreen(); else await raiz.current?.requestFullscreen(); } catch { /* navegador sem suporte: segue no modo janela */ }
  };
  const fechar = async () => { try { if (document.fullscreenElement) await document.exitFullscreen(); } catch { /* ignora */ } onFechar(); };

  return (
    <div ref={raiz} className="fixed inset-0 z-[100] flex flex-col bg-[#EFEDEA]" role="dialog" aria-modal="true" aria-label="Conversas ao vivo">
      <div className="flex flex-wrap items-center gap-3 px-4 md:px-6 py-3 bg-white border-b border-gray-200">
        <div className="flex items-center gap-2">
          <Radio className="w-5 h-5 text-[#9C1E1E]" />
          <h2 className="text-lg font-bold text-gray-900">Ao vivo</h2>
        </div>
        <div className="flex items-center gap-2" role="group" aria-label="Agentes acompanhados">
          {(['sofia', 'nando'] as Agente[]).map((ag) => (
            <button key={ag} onClick={() => alternar(ag)} aria-pressed={agentes.includes(ag)}
              className={`px-3 h-8 rounded-full text-sm font-semibold border ${agentes.includes(ag) ? 'bg-[#9C1E1E] text-white border-[#9C1E1E]' : 'bg-white text-gray-700 border-gray-300'}`}>
              {NOME[ag]}
            </button>
          ))}
        </div>
        <span className="text-xs text-gray-500 hidden md:inline">Atualiza sozinho a cada 3 segundos · clique numa conversa para fixar</span>
        <div className="ml-auto flex items-center gap-2">
          <button onClick={telaCheia} className="inline-flex items-center gap-1.5 h-9 px-3 rounded-lg border border-gray-300 bg-white text-sm font-semibold text-gray-800 hover:bg-gray-50">
            {cheia ? <Minimize2 className="w-4 h-4" /> : <Maximize2 className="w-4 h-4" />}<span className="hidden sm:inline">{cheia ? 'Sair da tela cheia' : 'Tela cheia'}</span>
          </button>
          <button onClick={fechar} className="inline-flex items-center justify-center h-9 w-9 rounded-lg bg-gray-900 text-white" aria-label="Fechar">
            <X className="w-4 h-4" />
          </button>
        </div>
      </div>
      <div className={`flex-1 min-h-0 p-3 md:p-4 grid gap-3 md:gap-4 overflow-y-auto ${agentes.length > 1 ? 'grid-cols-1 xl:grid-cols-2' : 'grid-cols-1'}`}>
        {agentes.map((ag) => <Coluna key={ag} ag={ag} foto={foto(ag)} />)}
      </div>
    </div>
  );
};

export default MonitorAoVivo;
