import React, { useCallback, useEffect, useMemo, useRef, useState } from 'react';
import { Loader2 } from 'lucide-react';
import { supabase } from '@/integrations/supabase/client';
import { toast } from 'sonner';
import {
  AlertDialog, AlertDialogAction, AlertDialogCancel, AlertDialogContent, AlertDialogDescription, AlertDialogFooter, AlertDialogHeader, AlertDialogTitle,
} from '@/components/ui/alert-dialog';
import { useAuth } from '@/hooks/useAuth';
import { canDeleteSofiaContact } from '@/lib/deleteContactRules';
import { ChatEXA, CxGaveta, CxNotas, cxQuando, type CxConversa, type CxMsg } from './chat/ChatEXA';

/**
 * CRM do Nando (síndicos). Lê tudo pela função nando-crm (só admin):
 * conversas agrupadas por telefone, vínculo com prédios pelos contatos cadastrados no prédio,
 * assumir/devolver atendimento, enviar como EXA e apagar a conversa (avisos do prédio nunca são apagados).
 * Arquivos, áudio, mensagens programadas e notas vão pela exa2-crm-chat (dentro do ChatEXA).
 */
type Conversa = {
  telefone: string;
  nome: string;
  nome_whatsapp: string | null;
  predios: { id: string; nome: string; papel: string }[];
  predio_atual: string | null;
  tipo: 'sindico' | 'contato' | 'sem_cadastro';
  modo: 'auto' | 'humano';
  humano_ate: string | null;
  assumido_por: string | null;
  ultima_em: string;
  preview: string;
  ultima_papel: string;
  aguardando: number;
  total: number;
};
type Mensagem = { id: number; papel: 'sindico' | 'nando' | 'humano' | 'sistema'; texto: string; autor: string | null; created_at: string; midia?: string | null };
type Ficha = {
  telefone: string;
  nome: string | null;
  predio_atual: string | null;
  primeira_conversa: string | null;
  sofia: { id: string; name: string | null; role: string | null } | null;
  interessado: { nome_predio: string | null; status: string | null; protocolo: string | null } | null;
  predios: {
    id: string; nome: string; codigo: string; tela_id: string; papel: string; endereco: string | null; status: string | null;
    telas: number; telas_online: number; avisos_ativos: number; pausado: boolean;
    avisos_recentes: { titulo: string | null; status: string; inicio: string | null; fim: string | null }[];
  }[];
};

async function call(action: string, body: Record<string, unknown> = {}) {
  const { data, error } = await supabase.functions.invoke('nando-crm', { body: { action, ...body } });
  if (error) throw new Error(error.message);
  if ((data as any)?.error) throw new Error((data as any).error);
  return data as any;
}

const FILTROS = [
  { v: 'todos', l: 'Todas' },
  { v: 'aguardando', l: 'Não lidas' },
  { v: 'humano', l: 'Comigo' },
  { v: 'sem_cadastro', l: 'Sem cadastro' },
] as const;

const fone = (t: string) => {
  const d = t.replace(/\D/g, '');
  if (d.length === 13) return `(${d.slice(2, 4)}) ${d.slice(4, 9)}-${d.slice(9)}`;
  if (d.length === 12) return `(${d.slice(2, 4)}) ${d.slice(4, 8)}-${d.slice(8)}`;
  return `+${d}`;
};
const AVATAR_NANDO = '/site/nando-avatar.png';

export interface NandoAbrirConversa { telefone: string; nome?: string; predio?: string; papel?: string }

export const NandoChatPanel: React.FC<{ abrir?: NandoAbrirConversa | null; onVoltar?: () => void; telefoneAgente?: string | null }> = ({ abrir = null, onVoltar, telefoneAgente }) => {
  const [conversas, setConversas] = useState<Conversa[]>([]);
  const [loading, setLoading] = useState(true);
  const [sel, setSel] = useState<string | null>(null);
  const [msgs, setMsgs] = useState<Mensagem[]>([]);
  const [filtro, setFiltro] = useState<(typeof FILTROS)[number]['v']>('todos');
  const [busca, setBusca] = useState('');
  const [fichaAberta, setFichaAberta] = useState(false);
  const [ficha, setFicha] = useState<Ficha | null>(null);
  const [apagar, setApagar] = useState<Conversa | null>(null);
  const [apagando, setApagando] = useState(false);
  const selRef = useRef<string | null>(null);
  selRef.current = sel;
  const { userProfile } = useAuth();
  const podeApagar = canDeleteSofiaContact(userProfile?.role);

  const carregar = useCallback(async () => {
    try {
      const d = await call('list');
      let lista: Conversa[] = d.conversas || [];
      // Aberto pelo painel do prédio: seleciona o contato; se ainda não conversou, cria a conversa em branco
      if (abrir?.telefone) {
        const alvo = abrir.telefone.replace(/\D/g, '');
        const achada = lista.find((c) => c.telefone.replace(/\D/g, '').endsWith(alvo.slice(-10)));
        if (!achada) {
          lista = [{
            telefone: alvo, nome: abrir.nome || alvo, nome_whatsapp: null,
            predios: abrir.predio ? [{ id: '', nome: abrir.predio, papel: abrir.papel || 'contato do prédio' }] : [],
            predio_atual: abrir.predio || null, tipo: 'contato', modo: 'auto', humano_ate: null, assumido_por: null,
            ultima_em: new Date().toISOString(), preview: 'Nova conversa', ultima_papel: 'sistema', aguardando: 0, total: 0,
          }, ...lista];
        }
        setConversas(lista);
        setSel((cur) => cur ?? (achada ? achada.telefone : alvo));
        return;
      }
      setConversas(lista);
      setSel((cur) => cur ?? lista[0]?.telefone ?? null);
    } catch (e: any) {
      console.error('[NANDO-CRM] lista', e);
      toast.error('Não foi possível carregar as conversas do Nando: ' + e.message);
    } finally {
      setLoading(false);
    }
  }, [abrir?.telefone, abrir?.nome, abrir?.predio, abrir?.papel]);

  const carregarMsgs = useCallback(async (tel: string) => {
    try {
      const d = await call('messages', { telefone: tel });
      if (selRef.current !== tel) return;
      setMsgs((prev) => {
        const next: Mensagem[] = d.mensagens || [];
        if (prev.length === next.length && prev[prev.length - 1]?.id === next[next.length - 1]?.id) return prev;
        return next;
      });
    } catch (e) {
      console.error('[NANDO-CRM] mensagens', e);
    }
  }, []);

  useEffect(() => {
    carregar();
    const t = setInterval(carregar, 8000);
    return () => clearInterval(t);
  }, [carregar]);

  useEffect(() => {
    if (!sel) return;
    setMsgs([]);
    setFicha(null);
    carregarMsgs(sel);
    call('ficha', { telefone: sel }).then((d) => selRef.current === sel && setFicha(d.ficha)).catch(() => {});
    const t = setInterval(() => carregarMsgs(sel), 4000);
    return () => clearInterval(t);
  }, [sel, carregarMsgs]);

  const filtradas = useMemo(() => {
    const q = busca.trim().toLowerCase();
    return conversas.filter((c) => {
      if (filtro === 'aguardando' && !(c.aguardando > 0)) return false;
      if (filtro === 'humano' && c.modo !== 'humano') return false;
      if (filtro === 'sem_cadastro' && c.tipo !== 'sem_cadastro') return false;
      if (!q) return true;
      return [c.nome, c.nome_whatsapp, c.telefone, ...c.predios.map((p) => p.nome)].some((x) => (x || '').toLowerCase().includes(q));
    });
  }, [conversas, filtro, busca]);

  const contagem = (v: string) =>
    v === 'todos' ? 0
      : v === 'aguardando' ? conversas.filter((c) => c.aguardando > 0).length
      : v === 'humano' ? conversas.filter((c) => c.modo === 'humano').length
      : conversas.filter((c) => c.tipo === 'sem_cadastro').length;

  const subConversa = (c: Conversa) =>
    c.predios.length ? c.predios.map((p) => p.nome).join(' · ') : c.tipo === 'sem_cadastro' ? `Sem cadastro · ${fone(c.telefone)}` : fone(c.telefone);

  const cxConversas: CxConversa[] = filtradas.map((c) => ({
    id: c.telefone,
    titulo: c.nome,
    sub: subConversa(c),
    subMarca: c.predios.length > 0,
    hora: cxQuando(c.ultima_em),
    preview: `${c.ultima_papel === 'humano' ? 'Você: ' : c.ultima_papel === 'nando' ? 'Nando: ' : ''}${c.preview}`,
    naoLidas: c.modo === 'humano' ? 0 : c.aguardando,
    humano: c.modo === 'humano',
  }));
  // a conversa aberta continua no cabeçalho mesmo se o filtro a esconder
  const atual = conversas.find((c) => c.telefone === sel) || null;
  if (atual && !cxConversas.some((c) => c.id === atual.telefone)) {
    cxConversas.push({ id: atual.telefone, titulo: atual.nome, sub: subConversa(atual), subMarca: atual.predios.length > 0, hora: '', preview: '', naoLidas: 0, humano: atual.modo === 'humano' });
  }

  const cxMsgs: CxMsg[] = msgs.map((m) => ({
    id: String(m.id),
    tipo: m.papel === 'sindico' ? 'in' : m.papel === 'nando' ? 'bot' : m.papel === 'humano' ? 'humano' : 'sistema',
    texto: m.texto || '',
    autor: m.autor,
    criada: m.created_at,
    midia: m.midia || null,
  }));

  const setModo = async (modo: 'auto' | 'humano') => {
    if (!sel) return;
    try {
      await call('set_mode', { telefone: sel, modo });
      toast.success(modo === 'humano' ? 'Você assumiu. O Nando não responde esta conversa por 12h (ou até devolver).' : 'O Nando voltou a atender.');
      carregar();
      carregarMsgs(sel);
    } catch (e: any) {
      toast.error('Erro: ' + e.message);
    }
  };

  const enviarTexto = async (t: string) => {
    if (!sel) return;
    await call('send', { telefone: sel, texto: t });
  };

  const confirmarApagar = async () => {
    if (!apagar) return;
    setApagando(true);
    try {
      const r = await call('apagar', { telefone: apagar.telefone, confirmar: 'apagar' });
      toast.success(`Conversa apagada (${r.apagadas} mensagens). Os avisos do prédio foram mantidos.`);
      setConversas((prev) => prev.filter((c) => c.telefone !== apagar.telefone));
      if (sel === apagar.telefone) { setSel(null); setMsgs([]); setFicha(null); }
      setApagar(null);
      carregar();
    } catch (e: any) {
      toast.error('Não foi possível apagar: ' + e.message);
    } finally {
      setApagando(false);
    }
  };

  const atualizar = () => { carregar(); if (sel) carregarMsgs(sel); };

  const btnApagar = (onClick: () => void) => (
    <button className="cx-ib" style={{ width: 32, height: 32, background: '#fff', boxShadow: '0 1px 4px rgba(0,0,0,.12)' }} onClick={onClick} aria-label="Apagar conversa" title="Apagar conversa">
      <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="#9E1014" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" aria-hidden="true"><path d="M4 7h16M10 11v6M14 11v6M6 7l1 13h10l1-13M9 7V4h6v3" /></svg>
    </button>
  );

  const gaveta = fichaAberta && atual ? (
    <CxGaveta
      titulo="Ficha do síndico"
      nome={ficha?.nome || atual.nome}
      sub={`${fone(atual.telefone)}${atual.predios[0] ? ` · ${atual.predios[0].papel}` : ''}`}
      kpis={ficha ? [
        { v: ficha.predios.length, l: ficha.predios.length === 1 ? 'prédio' : 'prédios' },
        { v: `${ficha.predios.reduce((n, p) => n + p.telas_online, 0)}/${ficha.predios.reduce((n, p) => n + p.telas, 0)}`, l: 'telas online' },
        { v: ficha.predios.reduce((n, p) => n + p.avisos_ativos, 0), l: 'avisos no ar' },
      ] : []}
      onFechar={() => setFichaAberta(false)}
      abas={[
        { v: 'resumo', l: 'Resumo', conteudo: !ficha ? <Carregando /> : <FichaResumo f={ficha} /> },
        { v: 'historico', l: 'Histórico', conteudo: <Historico msgs={msgs} /> },
        { v: 'avisos', l: 'Avisos', conteudo: !ficha ? <Carregando /> : <Avisos f={ficha} /> },
        { v: 'notas', l: 'Notas', conteudo: <CxNotas agente="nando" alvo={atual.telefone} /> },
      ]}
    />
  ) : null;

  return (
    <>
      <AlertDialog open={!!apagar} onOpenChange={(o) => !o && setApagar(null)}>
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogTitle>Apagar a conversa com {apagar?.nome}?</AlertDialogTitle>
            <AlertDialogDescription>
              Apaga as {apagar?.total} mensagens e o prédio escolhido nesta conversa. <b>Os avisos do prédio não são apagados</b> e o cadastro do síndico no prédio continua igual.
              Se a pessoa escrever de novo, o Nando começa uma conversa nova. Não dá para desfazer.
            </AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter>
            <AlertDialogCancel disabled={apagando}>Cancelar</AlertDialogCancel>
            <AlertDialogAction onClick={(e) => { e.preventDefault(); confirmarApagar(); }} disabled={apagando} className="bg-primary hover:bg-primary">
              {apagando ? <Loader2 className="h-4 w-4 animate-spin" /> : 'Apagar conversa'}
            </AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>

      <ChatEXA
        agente="nando"
        nomeAgente="Nando"
        subAgente={`Síndicos${telefoneAgente ? ` · ${telefoneAgente}` : ''}`}
        fotoAgente={AVATAR_NANDO}
        abas={FILTROS.map((f) => ({ v: f.v, l: f.l, n: contagem(f.v) }))}
        aba={filtro}
        onAba={(v) => setFiltro(v as any)}
        busca={busca}
        onBusca={setBusca}
        placeholderBusca="Buscar síndico ou condomínio"
        conversas={cxConversas}
        sel={sel}
        onSel={setSel}
        msgs={cxMsgs}
        carregando={loading}
        fichaRotulo="Ficha do síndico"
        onFicha={() => setFichaAberta(true)}
        onAssumir={() => setModo('humano')}
        onDevolver={() => setModo('auto')}
        onEnviarTexto={enviarTexto}
        onAtualizar={atualizar}
        acaoLinha={podeApagar ? (c) => btnApagar(() => { const x = conversas.find((k) => k.telefone === c.id); if (x) setApagar(x); }) : undefined}
        aviso={atual?.modo === 'humano' && atual.humano_ate
          ? <>Atendimento humano{atual.assumido_por ? ` (${atual.assumido_por})` : ''} até {new Date(atual.humano_ate).toLocaleString('pt-BR', { day: '2-digit', month: '2-digit', hour: '2-digit', minute: '2-digit' })}. O Nando volta sozinho depois disso.</>
          : atual?.predio_atual ? <>Conversando sobre <b>{atual.predios.find((p) => p.id === atual.predio_atual)?.nome || 'um prédio'}</b></> : undefined}
        onVoltar={onVoltar}
        gaveta={gaveta}
      />
    </>
  );
};

const Carregando = () => <div style={{ display: 'flex', alignItems: 'center', gap: 8, padding: '30px 0', color: '#77756F' }}><Loader2 className="h-4 w-4 animate-spin" />Carregando ficha…</div>;

const FichaResumo: React.FC<{ f: Ficha }> = ({ f }) => (
  <div>
    <div className="cx-k">Contato</div>
    <div className="cx-pc">
      <div className="cx-kv"><span>Telefone</span><b>{fone(f.telefone)}</b></div>
      {f.primeira_conversa && <div className="cx-kv"><span>Fala com o Nando desde</span><b>{new Date(f.primeira_conversa).toLocaleDateString('pt-BR')}</b></div>}
      {f.sofia && <div className="cx-kv"><span>Também fala com a Sofia</span><b>{f.sofia.role || 'sem papel'}</b></div>}
      {f.interessado && <div className="cx-kv"><span>Cadastro de interesse</span><b>{f.interessado.nome_predio || '—'} · {f.interessado.status || '—'}</b></div>}
    </div>
    <div className="cx-k">Condomínios</div>
    {f.predios.length === 0 ? (
      <div className="cx-pc" style={{ color: '#77756F' }}>
        Este número não está cadastrado como síndico, vice ou contato de nenhum prédio ativo. Para vincular, cadastre o telefone no prédio (Prédios → contato do síndico).
      </div>
    ) : f.predios.map((p) => (
      <div key={p.id} className="cx-pc">
        <div style={{ display: 'flex', justifyContent: 'space-between', gap: 8, alignItems: 'flex-start' }}>
          <div style={{ minWidth: 0 }}>
            <div style={{ fontWeight: 800 }}>{p.nome}</div>
            <div style={{ fontSize: 12, color: '#8A8882' }}>{p.endereco || 'Endereço não cadastrado'} · tela {p.tela_id}{p.codigo ? ` · cód. ${p.codigo}` : ''}</div>
          </div>
          <span className="cx-st" style={{ background: '#FDECEB', color: '#9E1014' }}>{p.papel}</span>
        </div>
        <div style={{ display: 'flex', flexWrap: 'wrap', gap: 6, marginTop: 10 }}>
          <span className="cx-st" style={{ background: p.telas_online === p.telas ? '#E9F6EE' : '#FFF4E0', color: p.telas_online === p.telas ? '#1E7A45' : '#8A5A00' }}>{p.telas_online}/{p.telas} telas online</span>
          <span className="cx-st">{p.avisos_ativos} aviso(s) no ar</span>
          {f.predio_atual === p.id && <span className="cx-st" style={{ background: '#0B0B0D', color: '#fff' }}>conversa atual</span>}
          {p.pausado && <span className="cx-st" style={{ background: '#FFF4E0', color: '#8A5A00' }}>Nando pausado neste prédio</span>}
        </div>
      </div>
    ))}
  </div>
);

const Avisos: React.FC<{ f: Ficha }> = ({ f }) => {
  const todos = f.predios.flatMap((p) => p.avisos_recentes.map((a) => ({ ...a, predio: p.nome })));
  if (!todos.length) return <p style={{ color: '#77756F' }}>Nenhum aviso recente nos prédios deste síndico.</p>;
  return (
    <div>
      {todos.map((a, i) => (
        <div key={i} className="cx-pc" style={{ display: 'flex', justifyContent: 'space-between', gap: 10, alignItems: 'center' }}>
          <div style={{ minWidth: 0 }}>
            <div style={{ fontWeight: 800, overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }}>{a.titulo || 'Aviso'}</div>
            <div style={{ fontSize: 12, color: '#8A8882' }}>{a.predio}{a.inicio ? ` · desde ${new Date(a.inicio).toLocaleDateString('pt-BR')}` : ''}{a.fim ? ` até ${new Date(a.fim).toLocaleDateString('pt-BR')}` : ''}</div>
          </div>
          <span className="cx-st" style={a.status === 'no_ar' ? { background: '#EA251D', color: '#fff' } : undefined}>{a.status === 'no_ar' ? 'no ar' : a.status}</span>
        </div>
      ))}
    </div>
  );
};

const Historico: React.FC<{ msgs: Mensagem[] }> = ({ msgs }) => {
  const eventos = msgs.filter((m) => m.papel === 'sistema' || m.papel === 'humano').slice(-30).reverse();
  if (!eventos.length) return <p style={{ color: '#77756F' }}>Sem eventos ainda. Aqui aparecem as mensagens da equipe e os registros do sistema desta conversa.</p>;
  return (
    <div className="cx-tl">
      {eventos.map((m) => (
        <div key={m.id} className="cx-ev">
          <span className="cx-evd" style={{ background: m.papel === 'humano' ? '#0B0B0D' : '#EA251D' }} />
          <div style={{ minWidth: 0 }}>
            <div style={{ fontSize: 12, color: '#8A8882' }}>{new Date(m.created_at).toLocaleString('pt-BR', { day: '2-digit', month: '2-digit', hour: '2-digit', minute: '2-digit' })} · {m.papel === 'humano' ? (m.autor || 'Equipe EXA') : 'Sistema'}</div>
            <div style={{ whiteSpace: 'pre-wrap', overflowWrap: 'anywhere' }}>{(m.texto || (m.midia ? `[${m.midia}]` : '')).slice(0, 300)}</div>
          </div>
        </div>
      ))}
    </div>
  );
};

export default NandoChatPanel;
