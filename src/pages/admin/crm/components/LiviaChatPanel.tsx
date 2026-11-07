import React, { useCallback, useEffect, useMemo, useRef, useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { toast } from 'sonner';
import { ChatEXA, CxGaveta, CxNotas, chamarChat, cxQuando, type CxConversa, type CxMsg } from './chat/ChatEXA';

/**
 * Chat da Lívia (financeiro · número Notificações EXA) no mesmo layout do Nando e da Sofia (Jeferson, 07/11/2026).
 * Lista, mensagens e modo humano vêm da exa2-crm-chat (livia_list / livia_messages / livia_set_mode);
 * texto, arquivo, áudio, programadas e notas vão pela mesma função, como os outros agentes.
 * A Lívia continua sendo a função livia-webhook/livia-cron — aqui só se lê e se fala pelo número dela.
 */
type Conversa = {
  telefone: string; nome: string; nome_whatsapp: string | null; empresa: string | null; papel: string | null; client_id: string | null; pedidos: number;
  tipo: 'ceo' | 'cliente' | 'sem_cadastro'; modo: 'auto' | 'humano'; humano_ate: string | null;
  ultima_em: string; ultima_papel: string; preview: string; aguardando: number; total: number;
};
type Mensagem = { id: number; papel: 'cliente' | 'ceo' | 'livia' | 'humano' | 'sistema'; texto: string; autor: string | null; created_at: string; midia?: string | null };

const call = (action: string, body: Record<string, unknown> = {}) => chamarChat(action, { agente: 'livia', ...body });

const FILTROS = [
  { v: 'todos', l: 'Todas' },
  { v: 'aguardando', l: 'Não lidas' },
  { v: 'humano', l: 'Comigo' },
  { v: 'cliente', l: 'Clientes' },
] as const;

const fone = (t: string) => {
  if (t.startsWith('lid:')) return 'WhatsApp sem número (lid)';
  const d = t.replace(/\D/g, '');
  if (d.length === 13) return `(${d.slice(2, 4)}) ${d.slice(4, 9)}-${d.slice(9)}`;
  if (d.length === 12) return `(${d.slice(2, 4)}) ${d.slice(4, 8)}-${d.slice(8)}`;
  return `+${d}`;
};
const PAPEL: Record<string, string> = { financeiro: 'financeiro do cliente', dono: 'dono do pedido', autorizado: 'autorizado no pedido', ceo: 'CEO' };

export const LiviaChatPanel: React.FC<{ onVoltar?: () => void; telefoneAgente?: string | null; fotoAgente?: string | null; onPerfilAgente?: () => void }> = ({ onVoltar, telefoneAgente, fotoAgente, onPerfilAgente }) => {
  const navigate = useNavigate();
  const [conversas, setConversas] = useState<Conversa[]>([]);
  const [loading, setLoading] = useState(true);
  const [sel, setSel] = useState<string | null>(null);
  const [msgs, setMsgs] = useState<Mensagem[]>([]);
  const [filtro, setFiltro] = useState<(typeof FILTROS)[number]['v']>('todos');
  const [busca, setBusca] = useState('');
  const [fichaAberta, setFichaAberta] = useState(false);
  const [novas, setNovas] = useState<Conversa[]>([]);
  const selRef = useRef<string | null>(null);
  selRef.current = sel;

  const carregar = useCallback(async () => {
    try {
      const d = await call('livia_list');
      const lista: Conversa[] = d.conversas || [];
      setConversas(lista);
      setNovas((n) => n.filter((x) => !lista.some((c) => c.telefone === x.telefone)));
      setSel((cur) => cur ?? lista[0]?.telefone ?? null);
    } catch (e: any) {
      console.error('[LIVIA-CRM] lista', e);
      toast.error('Não foi possível carregar as conversas da Lívia: ' + e.message);
    } finally {
      setLoading(false);
    }
  }, []);

  const carregarMsgs = useCallback(async (tel: string) => {
    try {
      const d = await call('livia_messages', { alvo: tel });
      if (selRef.current !== tel) return;
      setMsgs((prev) => {
        const next: Mensagem[] = d.mensagens || [];
        if (prev.length === next.length && prev[prev.length - 1]?.id === next[next.length - 1]?.id) return prev;
        return next;
      });
    } catch (e) {
      console.error('[LIVIA-CRM] mensagens', e);
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
    carregarMsgs(sel);
    const t = setInterval(() => carregarMsgs(sel), 4000);
    return () => clearInterval(t);
  }, [sel, carregarMsgs]);

  const todas = useMemo(() => [...novas, ...conversas], [novas, conversas]);
  const filtradas = useMemo(() => {
    const q = busca.trim().toLowerCase();
    return todas.filter((c) => {
      if (filtro === 'aguardando' && !(c.aguardando > 0)) return false;
      if (filtro === 'humano' && c.modo !== 'humano') return false;
      if (filtro === 'cliente' && c.tipo !== 'cliente') return false;
      if (!q) return true;
      return [c.nome, c.nome_whatsapp, c.telefone, c.empresa].some((x) => (x || '').toLowerCase().includes(q));
    });
  }, [todas, filtro, busca]);

  const contagem = (v: string) =>
    v === 'todos' ? 0
      : v === 'aguardando' ? todas.filter((c) => c.aguardando > 0).length
      : v === 'humano' ? todas.filter((c) => c.modo === 'humano').length
      : todas.filter((c) => c.tipo === 'cliente').length;

  const subConversa = (c: Conversa) =>
    c.tipo === 'ceo' ? fone(c.telefone)
      : c.empresa ? `${c.empresa}${c.papel ? ` · ${PAPEL[c.papel] || c.papel}` : ''}`
      : c.tipo === 'sem_cadastro' ? `Sem pedido ativo · ${fone(c.telefone)}` : fone(c.telefone);

  const tituloDe = (c: Conversa) => c.nome && c.nome !== c.telefone ? c.nome : c.telefone.startsWith('lid:') ? 'Contato sem número' : fone(c.telefone);
  const cxConversas: CxConversa[] = filtradas.map((c) => ({
    id: c.telefone,
    titulo: tituloDe(c),
    sub: subConversa(c),
    subMarca: !!c.empresa,
    hora: cxQuando(c.ultima_em),
    preview: `${c.ultima_papel === 'humano' ? 'Você: ' : c.ultima_papel === 'livia' ? 'Lívia: ' : ''}${c.preview}`,
    naoLidas: c.modo === 'humano' ? 0 : c.aguardando,
    humano: c.modo === 'humano',
  }));
  const atual = todas.find((c) => c.telefone === sel) || null;
  if (atual && !cxConversas.some((c) => c.id === atual.telefone)) {
    cxConversas.push({ id: atual.telefone, titulo: tituloDe(atual), sub: subConversa(atual), subMarca: !!atual.empresa, hora: '', preview: '', naoLidas: 0, humano: atual.modo === 'humano' });
  }

  const cxMsgs: CxMsg[] = msgs.map((m) => ({
    id: String(m.id),
    tipo: m.papel === 'cliente' || m.papel === 'ceo' ? 'in' : m.papel === 'livia' ? 'bot' : m.papel === 'humano' ? 'humano' : 'sistema',
    texto: m.texto || '',
    autor: m.autor,
    criada: m.created_at,
    midia: m.midia || null,
  }));

  const setModo = async (modo: 'auto' | 'humano') => {
    if (!sel) return;
    try {
      await call('livia_set_mode', { alvo: sel, modo });
      toast.success(modo === 'humano' ? 'Você assumiu. A Lívia não responde esta conversa por 12h (ou até devolver).' : 'A Lívia voltou a atender.');
      carregar();
      carregarMsgs(sel);
    } catch (e: any) {
      toast.error('Erro: ' + e.message);
    }
  };

  const enviarTexto = async (t: string) => {
    if (!sel) return;
    await call('enviar', { alvo: sel, texto: t });
  };

  const canon = (t: string) => { let d = t.replace(/\D/g, ''); if (d.length === 10 || d.length === 11) d = '55' + d; if (!d.startsWith('55')) return d; const ddd = d.slice(2, 4); let num = d.slice(4); if (num.length === 8) num = '9' + num; return num.length === 9 ? `55${ddd}${num}` : d; };
  const novaConversa = async (telBruto: string) => {
    const tel = canon(telBruto);
    const achada = todas.find((c) => c.telefone.replace(/\D/g, '').slice(-8) === tel.slice(-8));
    if (achada) { setSel(achada.telefone); return; }
    const nova: Conversa = {
      telefone: tel, nome: fone(tel), nome_whatsapp: null, empresa: null, papel: null, client_id: null, pedidos: 0, tipo: 'sem_cadastro',
      modo: 'auto', humano_ate: null, ultima_em: new Date().toISOString(), ultima_papel: 'sistema', preview: 'Nova conversa', aguardando: 0, total: 0,
    };
    setNovas((n) => [nova, ...n]);
    setSel(tel);
  };

  const atualizar = () => { carregar(); if (sel) carregarMsgs(sel); };

  const gaveta = fichaAberta && atual ? (
    <CxGaveta
      titulo="Ficha financeira"
      nome={tituloDe(atual)}
      sub={`${fone(atual.telefone)}${atual.papel ? ` · ${PAPEL[atual.papel] || atual.papel}` : ''}`}
      kpis={[
        { v: atual.pedidos, l: atual.pedidos === 1 ? 'pedido vivo' : 'pedidos vivos' },
        { v: atual.total, l: 'mensagens' },
        { v: atual.modo === 'humano' ? 'você' : 'Lívia', l: 'atendendo' },
      ]}
      onFechar={() => setFichaAberta(false)}
      abas={[
        {
          v: 'resumo', l: 'Resumo',
          conteudo: (
            <div>
              <div className="cx-k">Contato</div>
              <div className="cx-pc">
                <div className="cx-kv"><span>Telefone</span><b>{fone(atual.telefone)}</b></div>
                {atual.nome_whatsapp && <div className="cx-kv"><span>Nome no WhatsApp</span><b>{atual.nome_whatsapp}</b></div>}
                <div className="cx-kv"><span>Empresa</span><b>{atual.empresa || '—'}</b></div>
                <div className="cx-kv"><span>Papel</span><b>{atual.papel ? PAPEL[atual.papel] || atual.papel : 'sem pedido ativo'}</b></div>
              </div>
              {(atual.empresa || atual.tipo === 'cliente') && (
                <button className="cx-btn cx-red" onClick={() => navigate(`/admin/pedidos?busca=${encodeURIComponent(atual.empresa || atual.nome)}`)}>Ver pedidos e cobranças do cliente</button>
              )}
              {atual.tipo === 'sem_cadastro' && (
                <p style={{ color: '#77756F', fontSize: 13, marginTop: 12 }}>Este número não é o financeiro, o dono nem um autorizado de nenhum pedido ativo. A Lívia só cobra quem está num pedido.</p>
              )}
            </div>
          ),
        },
        { v: 'notas', l: 'Notas', conteudo: <CxNotas agente="livia" alvo={atual.telefone} /> },
      ]}
    />
  ) : null;

  return (
    <ChatEXA
      agente="livia"
      nomeAgente="Lívia"
      subAgente={`Financeiro${telefoneAgente ? ` · ${telefoneAgente}` : ''}`}
      fotoAgente={fotoAgente}
      abas={FILTROS.map((f) => ({ v: f.v, l: f.l, n: contagem(f.v) }))}
      aba={filtro}
      onAba={(v) => setFiltro(v as any)}
      busca={busca}
      onBusca={setBusca}
      placeholderBusca="Buscar cliente, empresa ou telefone"
      conversas={cxConversas}
      sel={sel}
      onSel={setSel}
      msgs={cxMsgs}
      carregando={loading}
      fichaRotulo="Ficha financeira"
      onFicha={() => setFichaAberta(true)}
      onAssumir={() => setModo('humano')}
      onDevolver={() => setModo('auto')}
      onEnviarTexto={enviarTexto}
      onAtualizar={atualizar}
      onNovaConversa={novaConversa}
      onPerfilAgente={onPerfilAgente}
      aviso={atual?.modo === 'humano' && atual.humano_ate
        ? <>Atendimento humano até {new Date(atual.humano_ate).toLocaleString('pt-BR', { day: '2-digit', month: '2-digit', hour: '2-digit', minute: '2-digit' })}. A Lívia volta sozinha depois disso.</>
        : atual?.tipo === 'ceo' ? <>Este é o seu número: aqui a Lívia te manda alertas e pergunta decisões (códigos L…).</> : undefined}
      onVoltar={onVoltar}
      gaveta={gaveta}
    />
  );
};

export default LiviaChatPanel;
