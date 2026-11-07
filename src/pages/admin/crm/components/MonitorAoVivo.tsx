import React, { useCallback, useEffect, useMemo, useRef, useState } from 'react';
import { Maximize2, Minimize2, Pin, PinOff, X, Radio } from 'lucide-react';
import { supabase } from '@/integrations/supabase/client';
import type { CollaboratorRow } from './CollaboratorCard';
import { CX_TEMA, CxFoto, MidiaMsg, chamarChat, lerMidia, rotuloDia, hhmm, useFotosWhatsApp, type CxConversa, type CxMsg } from './chat/ChatEXA';

/**
 * Monitor ao vivo (04/11/2026): acompanha as conversas da Sofia, do Nando e da Lívia lado a lado, em tela cheia.
 * 07/11/2026 (Jeferson): os três sempre lado a lado, nunca um embaixo do outro; cada agente na sua cor
 * (Sofia verde, Nando vermelho, Lívia azul); dentro da coluna a lista vira uma faixa de contatos em cima da conversa.
 * Só leitura: usa as mesmas ações de lista e mensagens dos painéis (sofia-panel e nando-crm), sem enviar nada.
 * Cada coluna segue sozinha a conversa que acabou de ter movimento; clicar numa conversa fixa ela (alfinete).
 * 05/11/2026: visual de vidro sobre fundo escuro da marca, bolhas iguais às do WhatsApp do CRM (mesmo CSS do ChatEXA),
 * fotos, vídeos, áudios com player + transcrição e PDFs abrindo pela exa2-crm-chat, foto de perfil e data + hora na lista.
 */
type Agente = 'sofia' | 'nando' | 'livia';
type Item = { id: string; nome: string; empresa: string | null; papel: string | null; preview: string; quando: string | null; humano: boolean; aguardando?: number };
type Linha = { id: string; lado: 'in' | 'bot' | 'humano' | 'sistema'; texto: string; quando: string; autor?: string | null; midia?: string | null };

const FN: Record<Agente, string> = { sofia: 'sofia-panel', nando: 'nando-crm', livia: 'exa2-crm-chat' };
const NOME: Record<Agente, string> = { sofia: 'Sofia', nando: 'Nando', livia: 'Lívia' };
const TODOS: Agente[] = ['sofia', 'nando', 'livia'];
const PAPEL: Record<string, string> = { cliente: 'Cliente', lead: 'Lead', sindico: 'Síndico', equipe: 'Equipe', ceo: 'CEO' };

async function chamar(ag: Agente, action: string, body: Record<string, unknown> = {}) {
  const { data, error } = await supabase.functions.invoke(FN[ag], { body: { action, ...body } });
  if (error) throw new Error(error.message);
  if ((data as any)?.error) throw new Error((data as any).error);
  return data as any;
}

async function listar(ag: Agente): Promise<Item[]> {
  if (ag === 'livia') {
    const d = await chamarChat('livia_list', { agente: 'livia' });
    return (d.conversas || []).map((c: any) => ({
      id: c.telefone, nome: c.nome, empresa: c.empresa || null, papel: c.tipo === 'ceo' ? 'CEO' : c.papel === 'financeiro' ? 'Financeiro' : c.papel === 'dono' ? 'Dono' : c.papel === 'autorizado' ? 'Autorizado' : 'Sem pedido',
      preview: `${c.ultima_papel === 'livia' ? 'Lívia: ' : c.ultima_papel === 'humano' ? 'Equipe: ' : ''}${c.preview || ''}`, quando: c.ultima_em, humano: c.modo === 'humano', aguardando: c.aguardando || 0,
    }));
  }
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
  if (ag === 'livia') {
    const d = await chamarChat('livia_messages', { agente: 'livia', alvo: id });
    return (d.mensagens || []).map((m: any) => ({ id: String(m.id), lado: m.papel === 'cliente' || m.papel === 'ceo' ? 'in' : m.papel === 'livia' ? 'bot' : m.papel === 'humano' ? 'humano' : 'sistema', texto: m.texto || '', quando: m.created_at, autor: m.autor || null, midia: m.midia || null }));
  }
  if (ag === 'sofia') {
    const d = await chamar(ag, 'messages', { conversation_id: id });
    return (d.messages || []).map((m: any) => ({ id: String(m.id), lado: m.direction === 'in' ? 'in' : m.direction === 'out_bot' ? 'bot' : 'humano', texto: m.body || '', quando: m.created_at, autor: m.author_name || m.autor || null, midia: m.midia || null }));
  }
  const d = await chamar(ag, 'messages', { telefone: id });
  return (d.mensagens || []).map((m: any) => ({ id: String(m.id), lado: m.papel === 'sindico' ? 'in' : m.papel === 'nando' ? 'bot' : m.papel === 'humano' ? 'humano' : 'sistema', texto: m.texto || '', quando: m.created_at, autor: m.autor || null, midia: m.midia || null }));
}

/** Lista: sempre dia + hora ("hoje 08:14", "ontem 21:30", "03/11 16:02"). */
const quandoLista = (iso: string | null) => {
  if (!iso) return '';
  const d = new Date(iso);
  const ontem = new Date(Date.now() - 86400e3).toDateString();
  const dia = d.toDateString() === new Date().toDateString() ? 'hoje' : d.toDateString() === ontem ? 'ontem' : d.toLocaleDateString('pt-BR', { day: '2-digit', month: '2-digit' });
  return `${dia} ${hhmm(iso)}`;
};
const iniciais = (n: string) => n.trim().split(/\s+/).slice(0, 2).map((p) => p[0] || '').join('').toUpperCase() || '?';
const vidro = 'bg-white/75 backdrop-blur-2xl border border-white/50 shadow-[0_24px_60px_-24px_rgba(0,0,0,.55)]';
const recente = (iso: string | null, min = 3) => !!iso && Date.now() - new Date(iso).getTime() < min * 60000;

const Coluna: React.FC<{ ag: Agente; foto?: string | null }> = ({ ag, foto }) => {
  const [lista, setLista] = useState<Item[]>([]);
  const [erro, setErro] = useState('');
  const [fixada, setFixada] = useState<string | null>(null);
  const [linhas, setLinhas] = useState<Linha[]>([]);
  const caixaRef = useRef<HTMLDivElement>(null);
  const colado = useRef(true); // só desce sozinho se o usuário estiver no fim da conversa
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
    setLinhas([]); colado.current = true; ler();
    const t = setInterval(ler, 3000);
    return () => { vivo = false; clearInterval(t); };
  }, [ag, seguida]);

  useEffect(() => {
    const el = caixaRef.current;
    if (el && colado.current) el.scrollTop = el.scrollHeight;
  }, [linhas, seguida]);

  // fotos de perfil do WhatsApp (mesmo cache do CRM)
  const paraFotos = useMemo(() => lista.slice(0, 40).map((c) => ({ id: c.id, foto: null }) as unknown as CxConversa), [lista]);
  const fotos = useFotosWhatsApp(ag, paraFotos);

  const atual = lista.find((x) => x.id === seguida) || null;
  const ativas = lista.filter((x) => recente(x.quando, 60)).length;

  // bolhas iguais às do WhatsApp do CRM, com separador de dia e mídia que abre
  const bolhas = useMemo(() => {
    const out: React.ReactNode[] = [];
    let diaAnt = '';
    linhas.slice(-120).forEach((l) => {
      const dia = new Date(l.quando).toDateString();
      if (dia !== diaAnt) { out.push(<span key={`d${l.id}`} className="cx-day">{rotuloDia(l.quando)}</span>); diaAnt = dia; }
      if (l.lado === 'sistema') { out.push(<span key={l.id} className="cx-sys">{l.texto.slice(0, 400)}</span>); return; }
      const m: CxMsg = { id: l.id, tipo: l.lado, texto: l.texto, autor: l.autor, criada: l.quando, midia: l.midia };
      const md = lerMidia(m);
      const sai = l.lado !== 'in';
      out.push(
        <div key={l.id} className={`cx-line ${sai ? 'out' : 'in'}${l.lado === 'humano' ? ' human' : ''}`}>
          <div className="cx-bub">
            {sai && <span className="cx-who">{l.lado === 'bot' ? NOME[ag] : (l.autor || 'Equipe EXA')}</span>}
            {md.tipo && <MidiaMsg agente={ag} id={l.id} tipo={md.tipo} />}
            {md.nota && md.texto && <span className="cx-nota-mid">{md.nota}: </span>}
            {md.texto}
            <span className="cx-t">{hhmm(l.quando)}</span>
          </div>
        </div>,
      );
    });
    return out;
  }, [linhas, ag]);

  const tema = CX_TEMA[ag];
  const vars = { '--cx-cor': tema.cor, '--cx-escura': tema.escura, '--cx-clara': tema.clara } as React.CSSProperties;

  return (
    <section className={`flex flex-col min-h-0 min-w-0 rounded-3xl overflow-hidden ${vidro}`} aria-label={`Conversas da ${NOME[ag]}`} style={vars}>
      <header className="flex items-center gap-3 px-4 py-3 border-b border-black/5" style={{ background: tema.clara }}>
        {foto ? <img src={foto} alt="" className="w-10 h-10 rounded-full object-cover ring-2 ring-white" /> : <div className="w-10 h-10 rounded-full text-white grid place-items-center font-bold" style={{ background: tema.cor }}>{NOME[ag][0]}</div>}
        <div className="min-w-0">
          <div className="font-extrabold tracking-tight" style={{ color: tema.escura }}>{NOME[ag]}</div>
          <div className="text-xs text-gray-600 truncate">{ativas} com movimento na última hora · {lista.length} no total</div>
        </div>
        {erro && <span className="ml-auto text-xs font-semibold text-red-700 truncate" role="alert">{erro}</span>}
      </header>

      {/* faixa de contatos (em cima, para as três colunas caberem lado a lado) */}
      <ul className="flex gap-1.5 px-3 py-2 overflow-x-auto border-b border-black/5 bg-white/55 [scrollbar-width:thin]" aria-label="Conversas recentes">
        {lista.slice(0, 30).map((c) => {
          const ativa = c.id === seguida;
          const ft = fotos[c.id];
          return (
            <li key={c.id} className="flex-shrink-0">
              <button
                onClick={() => setFixada(fixada === c.id ? null : c.id)}
                className={`flex items-center gap-2 h-10 pl-1 pr-3 rounded-full border transition-colors ${ativa ? 'text-white' : 'bg-white/80 border-black/5 hover:bg-white text-gray-900'}`}
                style={ativa ? { background: tema.cor, borderColor: tema.cor } : undefined}
                aria-pressed={fixada === c.id} title={`${c.nome}${c.empresa ? ' · ' + c.empresa : ''} · ${quandoLista(c.quando)}`}
              >
                <span className="relative flex-shrink-0">
                  {ft ? <CxFoto url={ft} tamanho={32} alt="" /> : <span className="w-8 h-8 rounded-full bg-gray-200 text-gray-600 grid place-items-center text-[11px] font-bold">{iniciais(c.nome)}</span>}
                  {recente(c.quando) && <span className="absolute -right-0.5 -bottom-0.5 w-3 h-3 rounded-full bg-emerald-500 ring-2 ring-white animate-pulse" aria-label="movimento agora" />}
                </span>
                <span className="text-xs font-bold max-w-[120px] truncate">{c.nome.split(' ').slice(0, 2).join(' ')}</span>
                {fixada === c.id && <Pin className="w-3 h-3 flex-shrink-0" aria-label="fixada" />}
                {!!c.aguardando && !ativa && <span className="min-w-[18px] h-[18px] px-1 rounded-full text-white text-[10px] font-extrabold grid place-items-center" style={{ background: tema.cor }}>{c.aguardando}</span>}
              </button>
            </li>
          );
        })}
        {!lista.length && !erro && <li className="py-2 text-sm text-gray-500">Carregando conversas…</li>}
      </ul>

      <div className="flex items-center gap-3 px-4 py-2 border-b border-black/5 bg-white/70">
        {atual && (fotos[atual.id] ? <CxFoto url={fotos[atual.id]} tamanho={32} alt="" /> : <span className="w-8 h-8 rounded-full bg-gray-200 text-gray-600 grid place-items-center text-[11px] font-bold flex-shrink-0">{iniciais(atual.nome)}</span>)}
        <div className="min-w-0 flex-1">
          <div className="text-sm font-bold text-gray-950 truncate">{atual ? atual.nome : '—'}{atual?.empresa ? <span className="font-medium text-gray-600"> · {atual.empresa}</span> : null}{atual?.papel ? <span className="font-semibold" style={{ color: tema.escura }}> · {atual.papel}</span> : null}</div>
          <div className="text-[11px] text-gray-600 truncate">{fixada ? 'Conversa fixada' : 'Seguindo a mais recente'}{atual?.quando ? ` · ${quandoLista(atual.quando)}` : ''}{atual?.humano ? ' · com a equipe' : ''}</div>
        </div>
        {fixada && (
          <button onClick={() => setFixada(null)} className="inline-flex items-center gap-1 text-xs font-bold hover:underline flex-shrink-0" style={{ color: tema.escura }} title="Voltar a seguir a mais recente">
            <PinOff className="w-3.5 h-3.5" /><span className="hidden 2xl:inline">Seguir a mais recente</span>
          </button>
        )}
      </div>
      <div
        ref={caixaRef}
        onScroll={(e) => { const el = e.currentTarget; colado.current = el.scrollHeight - el.scrollTop - el.clientHeight < 80; }}
        className="cx cx-monitor flex-1 min-h-0 overflow-y-auto"
        aria-live="polite"
        style={vars}
      >
        <div className="cx-chat" style={{ minHeight: '100%', overflow: 'visible' }}>
          <div className="flex flex-col gap-1.5 px-3 py-4">
            {bolhas}
            {seguida && !linhas.length && <p className="text-sm text-gray-500">Carregando mensagens…</p>}
          </div>
        </div>
      </div>
    </section>
  );
};

const CHAVE = 'exa-monitor-agentes-v2';

export const MonitorAoVivo: React.FC<{ aberto: boolean; onFechar: () => void; colaboradores: CollaboratorRow[] }> = ({ aberto, onFechar, colaboradores }) => {
  const [agentes, setAgentes] = useState<Agente[]>(() => {
    try { const v = JSON.parse(localStorage.getItem(CHAVE) || '[]'); if (Array.isArray(v) && v.length) { const f = v.filter((x) => TODOS.includes(x)); if (f.length) return f; } } catch { /* sem preferência salva */ }
    return [...TODOS];
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
  const foto = (ag: Agente) => colaboradores.find((c) => ag === 'livia' ? (c as any).is_notifications || /l[ií]via/i.test(`${c.collaborator_name} ${c.instance_name || ''}`) : new RegExp(ag, 'i').test(`${c.collaborator_name} ${c.instance_name || ''}`))?.profile_picture_url || null;
  const alternar = (ag: Agente) => setAgentes((cur) => (cur.includes(ag) ? (cur.length > 1 ? cur.filter((x) => x !== ag) : cur) : [...cur, ag]));
  const telaCheia = async () => {
    try { if (document.fullscreenElement) await document.exitFullscreen(); else await raiz.current?.requestFullscreen(); } catch { /* navegador sem suporte: segue no modo janela */ }
  };
  const fechar = async () => { try { if (document.fullscreenElement) await document.exitFullscreen(); } catch { /* ignora */ } onFechar(); };

  return (
    <div ref={raiz} className="fixed inset-0 z-[100] flex flex-col bg-[#120607] bg-[radial-gradient(900px_520px_at_8%_-10%,rgba(234,37,29,.45),transparent_60%),radial-gradient(800px_600px_at_105%_110%,rgba(156,30,30,.55),transparent_60%),linear-gradient(135deg,#1a0809,#0b0b0d)]" role="dialog" aria-modal="true" aria-label="Conversas ao vivo">
      <div className="flex flex-wrap items-center gap-3 px-4 md:px-6 py-3 bg-white/10 backdrop-blur-2xl border-b border-white/10 text-white">
        <div className="flex items-center gap-2">
          <Radio className="w-5 h-5 text-[#FF5A52]" />
          <h2 className="text-lg font-extrabold tracking-tight text-white">Ao vivo</h2>
        </div>
        <div className="flex items-center gap-2" role="group" aria-label="Agentes acompanhados">
          {TODOS.map((ag) => (
            <button key={ag} onClick={() => alternar(ag)} aria-pressed={agentes.includes(ag)}
              className={`px-3 h-8 rounded-full text-sm font-semibold border ${agentes.includes(ag) ? 'text-white' : 'bg-white/10 text-white/80 border-white/25 hover:bg-white/20'}`}
              style={agentes.includes(ag) ? { background: CX_TEMA[ag].cor, borderColor: CX_TEMA[ag].cor } : undefined}>
              {NOME[ag]}
            </button>
          ))}
        </div>
        <span className="text-xs text-white/70 hidden md:inline">Atualiza sozinho a cada 3 segundos · clique numa conversa para fixar</span>
        <div className="ml-auto flex items-center gap-2">
          <button onClick={telaCheia} className="inline-flex items-center gap-1.5 h-9 px-3 rounded-lg border border-white/25 bg-white/10 text-sm font-semibold text-white hover:bg-white/20">
            {cheia ? <Minimize2 className="w-4 h-4" /> : <Maximize2 className="w-4 h-4" />}<span className="hidden sm:inline">{cheia ? 'Sair da tela cheia' : 'Tela cheia'}</span>
          </button>
          <button onClick={fechar} className="inline-flex items-center justify-center h-9 w-9 rounded-lg bg-white text-gray-950 hover:bg-white/90" aria-label="Fechar">
            <X className="w-4 h-4" />
          </button>
        </div>
      </div>
      {/* sempre lado a lado: em tela estreita a faixa rola na horizontal, nunca empilha */}
      <div className="flex-1 min-h-0 p-3 md:p-4 overflow-x-auto overflow-y-hidden [scrollbar-width:thin]">
        <div className="h-full grid gap-3 md:gap-4" style={{ gridTemplateColumns: `repeat(${TODOS.filter((a) => agentes.includes(a)).length}, minmax(380px, 1fr))`, minWidth: 'max-content', width: '100%' }}>
          {TODOS.filter((a) => agentes.includes(a)).map((ag) => <Coluna key={ag} ag={ag} foto={foto(ag)} />)}
        </div>
      </div>
    </div>
  );
};

export default MonitorAoVivo;
