import React, { useCallback, useEffect, useMemo, useRef, useState } from 'react';
import { supabase } from '@/integrations/supabase/client';
import { toast } from 'sonner';
import './chat-exa.css';

/**
 * Chat do CRM no layout novo (design "Conversas do Nando · variação minimalista"), usado pelo Nando e pela Sofia.
 * Lista + conversa + compositor com anexo (foto, vídeo, documento), áudio gravado na hora e mensagem programada.
 * Envio de texto continua pelas funções de cada agente; arquivo, áudio, programadas e notas vão pela exa2-crm-chat.
 */

export type CxAgente = 'nando' | 'sofia';
export type CxConversa = {
  id: string; titulo: string; sub: string; subMarca?: boolean; hora: string; preview: string;
  naoLidas: number; humano: boolean; foto?: string | null;
};
export type CxMsg = {
  id: string; tipo: 'in' | 'bot' | 'humano' | 'sistema'; texto: string; autor?: string | null; criada: string;
  midia?: string | null;
};
type Agendada = { id: string; texto: string | null; arquivo: any; enviar_em: string; status: string; erro: string | null };
type ArquivoLocal = { file: File; tipo: 'imagem' | 'video' | 'documento' | 'audio'; preview?: string };

export async function chamarChat(action: string, body: Record<string, unknown>) {
  const { data, error } = await supabase.functions.invoke('exa2-crm-chat', { body: { action, ...body } });
  if (error) {
    let msg = error.message;
    try { const j = await (error as any).context?.json?.(); if (j?.error) msg = j.error; } catch { /* sem corpo */ }
    throw new Error(msg);
  }
  if ((data as any)?.error) throw new Error((data as any).error);
  return data as any;
}

async function subirArquivo(agente: CxAgente, file: Blob, mime: string) {
  const u = await chamarChat('upload_url', { agente, mime });
  const { error } = await supabase.storage.from('crm-midia').uploadToSignedUrl(u.caminho, u.token, file, { contentType: mime });
  if (error) throw new Error('Falha ao subir o arquivo: ' + error.message);
  return u.caminho as string;
}

// ---------------------------------------------------------------- ícones (traço, 24px)
const I = {
  busca: <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" aria-hidden="true"><circle cx="11" cy="11" r="7" /><path d="m20 20-3.5-3.5" /></svg>,
  voltar: <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.2" strokeLinecap="round" strokeLinejoin="round" aria-hidden="true"><path d="M15 5l-7 7 7 7" /></svg>,
  clip: <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" aria-hidden="true"><path d="m21 11-8.5 8.5a5 5 0 0 1-7-7L14 4a3.3 3.3 0 0 1 4.7 4.7l-8.6 8.6a1.7 1.7 0 0 1-2.3-2.3L15.5 7.3" /></svg>,
  relogio: <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" aria-hidden="true"><circle cx="12" cy="13" r="8" /><path d="M12 9v4l2.5 2M9 2h6" /></svg>,
  mic: <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" aria-hidden="true"><rect x="9" y="3" width="6" height="11" rx="3" /><path d="M5 11a7 7 0 0 0 14 0M12 18v3" /></svg>,
  enviar: <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.2" strokeLinecap="round" strokeLinejoin="round" aria-hidden="true"><path d="M5 12h13M13 6l6 6-6 6" /></svg>,
  lixo: <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" aria-hidden="true"><path d="M4 7h16M10 11v6M14 11v6M6 7l1 13h10l1-13M9 7V4h6v3" /></svg>,
  foto: <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" aria-hidden="true"><rect x="3" y="5" width="18" height="14" rx="2" /><circle cx="9" cy="10" r="2" /><path d="m21 16-5-5-8 8" /></svg>,
  doc: <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" aria-hidden="true"><path d="M14 3H6v18h12V7z" /><path d="M14 3v4h4M9 13h6M9 17h6" /></svg>,
  ficha: <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" aria-hidden="true"><rect x="4" y="3" width="16" height="18" rx="2" /><circle cx="12" cy="10" r="3" /><path d="M7.5 18c1-2 2.6-3 4.5-3s3.5 1 4.5 3" /></svg>,
  x: <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.2" strokeLinecap="round" aria-hidden="true"><path d="M6 6l12 12M18 6 6 18" /></svg>,
  check: <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.4" strokeLinecap="round" strokeLinejoin="round" aria-hidden="true"><path d="M3 13l4 4L17 7M10 16l1.5 1.5L21 8" /></svg>,
  pessoa: <svg viewBox="0 0 40 40" aria-hidden="true"><circle cx="20" cy="15" r="8" fill="currentColor" /><path d="M4 40c1-9 7.5-14 16-14s15 5 16 14z" fill="currentColor" /></svg>,
};

export const CxFoto: React.FC<{ url?: string | null; tamanho: number; alt?: string }> = ({ url, tamanho, alt = '' }) => {
  const [ruim, setRuim] = useState(false);
  return (
    <span className="cx-ph" style={{ width: tamanho, height: tamanho }}>
      {url && !ruim ? <img src={url} alt={alt} onError={() => setRuim(true)} /> : I.pessoa}
    </span>
  );
};

// ---------------------------------------------------------------- datas
const DIAS = ['domingo', 'segunda', 'terça', 'quarta', 'quinta', 'sexta', 'sábado'];
const hhmm = (iso: string) => new Date(iso).toLocaleTimeString('pt-BR', { hour: '2-digit', minute: '2-digit' });
const rotuloDia = (iso: string) => {
  const d = new Date(iso); const hoje = new Date(); const ontem = new Date(Date.now() - 86400e3);
  if (d.toDateString() === hoje.toDateString()) return 'Hoje';
  if (d.toDateString() === ontem.toDateString()) return 'Ontem';
  return d.toLocaleDateString('pt-BR', { weekday: 'long', day: '2-digit', month: '2-digit' });
};
const quandoCurto = (iso: string) => {
  const d = new Date(iso); const hoje = new Date(); const amanha = new Date(Date.now() + 86400e3);
  const h = d.toLocaleTimeString('pt-BR', { hour: '2-digit', minute: '2-digit' });
  if (d.toDateString() === hoje.toDateString()) return `hoje às ${h}`;
  if (d.toDateString() === amanha.toDateString()) return `amanhã às ${h}`;
  return `${d.toLocaleDateString('pt-BR', { day: '2-digit', month: '2-digit' })} às ${h}`;
};
function sugestoes(): { rotulo: string; sub: string; quando: Date }[] {
  const agora = new Date();
  const em = (diasMais: number, h: number) => { const d = new Date(agora); d.setDate(d.getDate() + diasMais); d.setHours(h, 0, 0, 0); return d; };
  const out: { rotulo: string; sub: string; quando: Date }[] = [];
  if (agora.getHours() < 17) out.push({ rotulo: 'Hoje às 18:00', sub: 'hoje', quando: em(0, 18) });
  out.push({ rotulo: 'Amanhã às 08:00', sub: DIAS[em(1, 8).getDay()].slice(0, 3), quando: em(1, 8) });
  out.push({ rotulo: 'Amanhã às 14:00', sub: 'à tarde', quando: em(1, 14) });
  const seg = new Date(agora); seg.setDate(seg.getDate() + ((8 - seg.getDay()) % 7 || 7)); seg.setHours(8, 0, 0, 0);
  out.push({ rotulo: 'Segunda às 08:00', sub: seg.toLocaleDateString('pt-BR', { day: '2-digit', month: '2-digit' }), quando: seg });
  return out;
}
const paraInputLocal = (d: Date) => {
  const p = (n: number) => String(n).padStart(2, '0');
  return `${d.getFullYear()}-${p(d.getMonth() + 1)}-${p(d.getDate())}T${p(d.getHours())}:${p(d.getMinutes())}`;
};

// ---------------------------------------------------------------- mídia de uma mensagem
const TIPO_MIDIA: Record<string, 'imagem' | 'video' | 'audio' | 'documento'> = {
  imagem: 'imagem', foto: 'imagem', logo: 'imagem', figurinha: 'imagem', sticker: 'imagem',
  video: 'video', 'vídeo': 'video', audio: 'audio', 'áudio': 'audio', documento: 'documento', pdf: 'documento',
};
const cacheMidia = new Map<string, { url: string; mime: string; nome: string | null; tipo: string }>();

const MidiaMsg: React.FC<{ agente: CxAgente; id: string; tipo: string }> = ({ agente, id, tipo }) => {
  const chave = `${agente}:${id}`;
  const [m, setM] = useState(() => cacheMidia.get(chave) || null);
  const [erro, setErro] = useState('');
  useEffect(() => {
    if (m) return;
    let vivo = true;
    chamarChat('midia', { agente, id }).then((r) => { cacheMidia.set(chave, r); if (vivo) setM(r); }).catch((e) => vivo && setErro(e.message));
    return () => { vivo = false; };
  }, [chave]); // eslint-disable-line react-hooks/exhaustive-deps
  if (erro) return <span className="cx-nota-mid">Arquivo indisponível ({erro})</span>;
  if (!m) return <span className="cx-mid-carregando">{tipo === 'audio' ? 'Carregando áudio…' : 'Carregando arquivo…'}</span>;
  const t = m.tipo || tipo;
  if (t === 'imagem') return <a className="cx-mid" href={m.url} target="_blank" rel="noopener noreferrer"><img src={m.url} alt="Foto da conversa" loading="lazy" /></a>;
  if (t === 'video') return <span className="cx-mid"><video src={m.url} controls preload="metadata" /></span>;
  if (t === 'audio') return <span className="cx-mid"><audio src={m.url} controls preload="metadata" /></span>;
  return <a className="cx-doc" href={m.url} target="_blank" rel="noopener noreferrer">{I.doc}<span style={{ overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }}>{m.nome || 'Abrir documento'}</span></a>;
};

/** Separa a marca de mídia do texto: "[imagem] legenda" → tipo imagem + "legenda". */
function lerMidia(m: CxMsg): { tipo: string | null; texto: string; nota: string | null } {
  const texto = m.texto || '';
  const mt = /^\s*\[([^\]]{1,200})\]:?\s*/.exec(texto);
  const palavra = mt ? mt[1].toLowerCase().split(/[\s:]/)[0] : '';
  let tipo: string | null = m.midia ? (TIPO_MIDIA[m.midia] || 'documento') : null;
  if (!tipo && mt) tipo = TIPO_MIDIA[palavra] || null;
  if (!tipo) return { tipo: null, texto, nota: null };
  let resto = mt ? texto.slice(mt[0].length) : texto;
  let nota: string | null = null;
  if (mt && /transcrit/i.test(mt[1])) { nota = 'Transcrição'; }
  if (mt && mt[1].length > 40 && !/transcrit/i.test(mt[1])) resto = resto.trim(); // marcas longas do sistema da Sofia somem
  return { tipo, texto: resto.trim(), nota };
}

// ---------------------------------------------------------------- fotos de perfil do WhatsApp (cache 12 h no aparelho)
const FOTO_TTL = 12 * 3600e3;
function useFotosWhatsApp(agente: CxAgente, conversas: CxConversa[]) {
  const chave = `cx-fotos-${agente}`;
  const [fotos, setFotos] = useState<Record<string, string | null>>(() => {
    try {
      const bruto = JSON.parse(localStorage.getItem(chave) || '{}') as Record<string, { u: string | null; t: number }>;
      const out: Record<string, string | null> = {};
      Object.entries(bruto).forEach(([k, v]) => { if (Date.now() - v.t < FOTO_TTL) out[k] = v.u; });
      return out;
    } catch { return {}; }
  });
  const pedidos = useRef(new Set<string>());
  useEffect(() => {
    const faltam = conversas.filter((c) => !c.foto && !(c.id in fotos) && !pedidos.current.has(c.id)).map((c) => c.id).slice(0, 40);
    if (!faltam.length) return;
    faltam.forEach((id) => pedidos.current.add(id));
    chamarChat('fotos', { agente, alvos: faltam }).then((r) => {
      const novas = (r?.fotos || {}) as Record<string, string | null>;
      setFotos((f) => {
        const m = { ...f, ...novas };
        try {
          const bruto = JSON.parse(localStorage.getItem(chave) || '{}');
          Object.entries(novas).forEach(([k, u]) => { bruto[k] = { u, t: Date.now() }; });
          localStorage.setItem(chave, JSON.stringify(bruto));
        } catch { /* sem armazenamento */ }
        return m;
      });
    }).catch(() => { /* função ainda não publicada: segue sem foto */ });
  }, [agente, conversas, fotos, chave]);
  return fotos;
}

// ---------------------------------------------------------------- componente
export type ChatEXAProps = {
  agente: CxAgente;
  nomeAgente: string;
  subAgente: string;
  fotoAgente?: string | null;
  abas: { v: string; l: string; n?: number }[];
  aba: string;
  onAba: (v: string) => void;
  busca: string;
  onBusca: (v: string) => void;
  placeholderBusca: string;
  conversas: CxConversa[];
  sel: string | null;
  onSel: (id: string) => void;
  msgs: CxMsg[];
  carregando: boolean;
  fichaRotulo: string;
  onFicha: () => void;
  onAssumir: () => void;
  onDevolver: () => void;
  onEnviarTexto: (texto: string) => Promise<void>;
  onAtualizar: () => void;
  acaoLinha?: (c: CxConversa) => React.ReactNode;
  extraCabecalho?: React.ReactNode;
  aviso?: React.ReactNode;
  onVoltar?: () => void;
  gaveta?: React.ReactNode;
};

export const ChatEXA: React.FC<ChatEXAProps> = (p) => {
  const { agente } = p;
  const [celChat, setCelChat] = useState(false);
  const [texto, setTexto] = useState('');
  const [menu, setMenu] = useState<null | 'anexo' | 'agenda'>(null);
  const [escolhendoHora, setEscolhendoHora] = useState(false);
  const [horaLivre, setHoraLivre] = useState('');
  const [anexo, setAnexo] = useState<ArquivoLocal | null>(null);
  const [ocupado, setOcupado] = useState(false);
  const [gravando, setGravando] = useState(false);
  const [segGrav, setSegGrav] = useState(0);
  const [agendadas, setAgendadas] = useState<Agendada[]>([]);
  const gravador = useRef<MediaRecorder | null>(null);
  const pedacos = useRef<Blob[]>([]);
  const descartar = useRef(false);
  const fimRef = useRef<HTMLDivElement>(null);
  const inputFoto = useRef<HTMLInputElement>(null);
  const inputDoc = useRef<HTMLInputElement>(null);
  const areaTexto = useRef<HTMLTextAreaElement>(null);

  const fotosWa = useFotosWhatsApp(agente, p.conversas);
  const fotoDe = (c: CxConversa) => c.foto || fotosWa[c.id] || null;
  const atual = p.conversas.find((c) => c.id === p.sel) || null;
  const [agendarPara, setAgendarPara] = useState<Date | null>(null);

  // Conversa aberta no celular ocupa a tela toda: o layout esconde a barra inferior (body.cx-chat-aberto)
  useEffect(() => {
    const cel = window.matchMedia('(max-width: 767px)');
    const aplicar = () => document.body.classList.toggle('cx-chat-aberto', celChat && cel.matches);
    aplicar();
    cel.addEventListener?.('change', aplicar);
    return () => { cel.removeEventListener?.('change', aplicar); document.body.classList.remove('cx-chat-aberto'); };
  }, [celChat]);

  // programadas da conversa aberta
  const carregarAgendadas = useCallback(async () => {
    if (!p.sel) { setAgendadas([]); return; }
    try { const r = await chamarChat('agendadas', { agente, alvo: p.sel }); setAgendadas(r.agendadas || []); } catch { /* tabela pode não existir ainda */ }
  }, [agente, p.sel]);
  useEffect(() => { setAgendadas([]); carregarAgendadas(); setAnexo(null); setMenu(null); setAgendarPara(null); }, [p.sel]); // eslint-disable-line react-hooks/exhaustive-deps
  useEffect(() => { const t = setInterval(carregarAgendadas, 30000); return () => clearInterval(t); }, [carregarAgendadas]);

  // Rola só a caixa de mensagens (scrollIntoView no Safari do iPhone também arrastava a página e a conversa para o lado)
  useEffect(() => {
    const caixa = fimRef.current?.parentElement;
    if (!caixa) return;
    requestAnimationFrame(() => { caixa.scrollTop = caixa.scrollHeight; caixa.scrollLeft = 0; });
  }, [p.msgs.length, p.sel, agendadas.length, celChat]);

  // auto-altura do campo
  useEffect(() => {
    const el = areaTexto.current; if (!el) return;
    el.style.height = 'auto'; el.style.height = Math.min(el.scrollHeight, 140) + 'px';
  }, [texto]);

  // fecha menus com Esc
  useEffect(() => {
    const f = (e: KeyboardEvent) => { if (e.key === 'Escape') { setMenu(null); setEscolhendoHora(false); } };
    window.addEventListener('keydown', f); return () => window.removeEventListener('keydown', f);
  }, []);

  const escolherArquivo = (file: File | undefined, modo: 'foto' | 'doc') => {
    setMenu(null);
    if (!file) return;
    if (file.size > 50 * 1024 * 1024) { toast.error('Arquivo maior que 50 MB.'); return; }
    const mime = file.type || 'application/octet-stream';
    const tipo = modo === 'doc' ? 'documento' : mime.startsWith('video/') ? 'video' : mime.startsWith('image/') ? 'imagem' : 'documento';
    setAnexo({ file, tipo, preview: tipo === 'imagem' ? URL.createObjectURL(file) : undefined });
    areaTexto.current?.focus();
  };

  const prepararArquivo = async (a: ArquivoLocal | null) => {
    if (!a) return null;
    const mime = a.file.type || 'application/octet-stream';
    const caminho = await subirArquivo(agente, a.file, mime);
    return { caminho, mime, nome: a.file.name, tipo: a.tipo };
  };

  const enviar = async () => {
    const t = texto.trim();
    if (!p.sel || ocupado || (!t && !anexo)) return;
    if (agendarPara) { await programar(agendarPara); return; }
    setOcupado(true);
    try {
      if (anexo) {
        const arquivo = await prepararArquivo(anexo);
        await chamarChat('enviar', { agente, alvo: p.sel, texto: t, arquivo });
      } else {
        await p.onEnviarTexto(t);
      }
      setTexto(''); setAnexo(null);
      p.onAtualizar();
    } catch (e: any) {
      toast.error('Não foi possível enviar: ' + e.message);
    } finally { setOcupado(false); }
  };

  const escolherHorario = (quando: Date) => {
    if (quando.getTime() < Date.now() + 30e3) { toast.error('Escolha um horário no futuro.'); return; }
    if (texto.trim() || anexo) { programar(quando); return; }
    // sem texto ainda: guarda o horário e deixa escrever; o botão de enviar passa a programar
    setAgendarPara(quando); setMenu(null); setEscolhendoHora(false);
    setTimeout(() => areaTexto.current?.focus(), 50);
  };

  const programar = async (quando: Date) => {
    const t = texto.trim();
    if (!p.sel || (!t && !anexo)) { setAgendarPara(quando); return; }
    if (quando.getTime() < Date.now() + 30e3) { toast.error('Escolha um horário no futuro.'); return; }
    setOcupado(true);
    try {
      const arquivo = await prepararArquivo(anexo);
      await chamarChat('agendar', { agente, alvo: p.sel, texto: t, arquivo, enviar_em: quando.toISOString() });
      toast.success(`Mensagem programada para ${quandoCurto(quando.toISOString())}.`);
      setTexto(''); setAnexo(null); setMenu(null); setEscolhendoHora(false); setAgendarPara(null);
      carregarAgendadas();
    } catch (e: any) {
      toast.error('Não foi possível programar: ' + e.message);
    } finally { setOcupado(false); }
  };

  const cancelarAgendada = async (id: string) => {
    try { await chamarChat('cancelar_agendada', { agente, alvo: p.sel, id }); setAgendadas((l) => l.filter((x) => x.id !== id)); toast.success('Mensagem programada cancelada.'); }
    catch (e: any) { toast.error(e.message); }
  };

  // ---- áudio
  const iniciarGravacao = async () => {
    setMenu(null);
    if (!navigator.mediaDevices?.getUserMedia || typeof MediaRecorder === 'undefined') { toast.error('Este navegador não grava áudio.'); return; }
    try {
      const stream = await navigator.mediaDevices.getUserMedia({ audio: true });
      const tipos = ['audio/ogg;codecs=opus', 'audio/webm;codecs=opus', 'audio/mp4', 'audio/webm'];
      const mime = tipos.find((t) => MediaRecorder.isTypeSupported?.(t)) || '';
      const rec = new MediaRecorder(stream, mime ? { mimeType: mime } : undefined);
      pedacos.current = []; descartar.current = false;
      rec.ondataavailable = (e) => { if (e.data.size) pedacos.current.push(e.data); };
      rec.onstop = async () => {
        stream.getTracks().forEach((t) => t.stop());
        setGravando(false);
        if (descartar.current || !p.sel) return;
        const tipo = (rec.mimeType || mime || 'audio/webm').split(';')[0];
        const blob = new Blob(pedacos.current, { type: tipo });
        if (blob.size < 1500) { toast.error('Áudio muito curto.'); return; }
        setOcupado(true);
        try {
          const caminho = await subirArquivo(agente, blob, tipo);
          await chamarChat('enviar', { agente, alvo: p.sel, texto: '', arquivo: { caminho, mime: tipo, nome: 'audio', tipo: 'audio' } });
          p.onAtualizar();
        } catch (e: any) { toast.error('Não foi possível enviar o áudio: ' + e.message); }
        finally { setOcupado(false); }
      };
      gravador.current = rec;
      rec.start();
      setSegGrav(0); setGravando(true);
    } catch {
      toast.error('Permita o microfone para gravar áudio.');
    }
  };
  useEffect(() => {
    if (!gravando) return;
    const t = setInterval(() => setSegGrav((s) => { if (s >= 299) { gravador.current?.stop(); } return s + 1; }), 1000);
    return () => clearInterval(t);
  }, [gravando]);
  const pararGravacao = (enviarAudio: boolean) => { descartar.current = !enviarAudio; gravador.current?.stop(); };

  // ---- mensagens com separador de dia
  const linhas = useMemo(() => {
    const out: React.ReactNode[] = [];
    let diaAnt = '';
    p.msgs.forEach((m) => {
      const dia = new Date(m.criada).toDateString();
      if (dia !== diaAnt) { out.push(<span key={`d${m.id}`} className="cx-day">{rotuloDia(m.criada)}</span>); diaAnt = dia; }
      if (m.tipo === 'sistema') { out.push(<span key={m.id} className="cx-sys">{m.texto.slice(0, 400)}</span>); return; }
      const sai = m.tipo !== 'in';
      const md = lerMidia(m);
      out.push(
        <div key={m.id} className={`cx-line ${sai ? 'out' : 'in'}${m.tipo === 'humano' ? ' human' : ''}`}>
          <div className="cx-bub">
            {sai && <span className="cx-who">{m.tipo === 'bot' ? p.nomeAgente : (m.autor || 'Equipe EXA')}</span>}
            {md.tipo && <MidiaMsg agente={agente} id={m.id} tipo={md.tipo} />}
            {md.nota && md.texto && <span className="cx-nota-mid">{md.nota}: </span>}
            {md.texto}
            <span className="cx-t">{hhmm(m.criada)}{sai && I.check}</span>
          </div>
          {m.tipo === 'bot' && <CxFoto url={p.fotoAgente} tamanho={28} alt={p.nomeAgente} />}
        </div>,
      );
    });
    return out;
  }, [p.msgs, agente, p.nomeAgente, p.fotoAgente]);

  const temTexto = !!texto.trim() || !!anexo;
  const estado = atual?.humano ? `Você está atendendo · ${p.nomeAgente} pausad${p.nomeAgente === 'Sofia' ? 'a' : 'o'}` : `${p.nomeAgente} atendendo`;
  const min = String(Math.floor(segGrav / 60)), seg = String(segGrav % 60).padStart(2, '0');

  return (
    <div className="cx" data-chat={celChat}>
      {/* ---------- lista ---------- */}
      <section className="cx-list" aria-label="Conversas">
        <div className="cx-topo">
          {p.onVoltar && <button className="cx-voltar" onClick={p.onVoltar} aria-label="Voltar ao CRM Evolution" title="CRM Evolution">{I.voltar}</button>}
          <CxFoto url={p.fotoAgente} tamanho={44} alt={p.nomeAgente} />
          <div style={{ flex: 1, minWidth: 0 }}>
            <div style={{ fontSize: 18, fontWeight: 800, letterSpacing: '-.02em' }}>{p.nomeAgente}</div>
            <div style={{ fontSize: 12, color: '#8A8882', whiteSpace: 'nowrap', overflow: 'hidden', textOverflow: 'ellipsis' }}>{p.subAgente}</div>
          </div>
        </div>
        <div style={{ padding: '0 16px 12px' }}>
          <label className="cx-busca">{I.busca}<input value={p.busca} onChange={(e) => p.onBusca(e.target.value)} placeholder={p.placeholderBusca} aria-label={p.placeholderBusca} /></label>
          <div className="cx-abas" role="tablist">
            {p.abas.map((a) => (
              <button key={a.v} role="tab" aria-selected={p.aba === a.v} className={`cx-tab${p.aba === a.v ? ' on' : ''}`} onClick={() => p.onAba(a.v)}>
                {a.l}{typeof a.n === 'number' && a.n > 0 && <small>{a.n}</small>}
              </button>
            ))}
          </div>
        </div>
        <div className="cx-rows">
          {p.carregando && <p className="cx-vazio">Carregando conversas…</p>}
          {!p.carregando && !p.conversas.length && <p className="cx-vazio">Nenhuma conversa neste filtro.</p>}
          {p.conversas.map((c) => {
            const on = c.id === p.sel;
            return (
              <div key={c.id} className="cx-rowwrap">
                <button className={`cx-row${on ? ' on' : ''}`} onClick={() => { p.onSel(c.id); setCelChat(true); }} aria-current={on}>
                  <CxFoto url={fotoDe(c)} tamanho={50} />
                  <span className="txt">
                    <span style={{ display: 'flex', justifyContent: 'space-between', gap: 8, alignItems: 'baseline' }}>
                      <b style={{ fontWeight: 800, fontSize: 15, whiteSpace: 'nowrap', overflow: 'hidden', textOverflow: 'ellipsis' }}>{c.titulo}</b>
                      <span style={{ fontSize: 12, color: c.naoLidas && !on ? '#EA251D' : '#9C9A96', fontWeight: 700, flex: 'none' }}>{c.hora}</span>
                    </span>
                    <span style={{ display: 'block', marginTop: 1, fontSize: 12, fontWeight: 700, color: c.subMarca ? '#9E1014' : '#9C9A96', whiteSpace: 'nowrap', overflow: 'hidden', textOverflow: 'ellipsis' }}>{c.sub}</span>
                    <span style={{ display: 'flex', justifyContent: 'space-between', gap: 8, alignItems: 'center', marginTop: 2 }}>
                      <span style={{ color: '#77756F', fontSize: 13, whiteSpace: 'nowrap', overflow: 'hidden', textOverflow: 'ellipsis' }}>{c.preview}</span>
                      {c.naoLidas > 0 && !on ? <span className="cx-badge">{c.naoLidas}</span> : c.humano ? <span className="cx-dot" style={{ background: '#0B0B0D' }} title="Você está atendendo" /> : null}
                    </span>
                  </span>
                </button>
                {p.acaoLinha && <span className="cx-rowacao">{p.acaoLinha(c)}</span>}
              </div>
            );
          })}
        </div>
      </section>

      {/* ---------- conversa ---------- */}
      <main className="cx-chat">
        {!atual ? (
          <div className="cx-centro">{p.carregando ? 'Carregando…' : 'Escolha uma conversa'}</div>
        ) : (
          <>
            <header className="cx-head">
              <button className="cx-voltar" onClick={() => setCelChat(false)} aria-label="Voltar às conversas" data-so-cel>{I.voltar}</button>
              <CxFoto url={fotoDe(atual)} tamanho={42} />
              <div className="cx-head-txt">
                <div className="cx-head-nome">{atual.titulo}</div>
                <div className="cx-head-sub"><span style={{ color: '#5A5852' }}>{atual.sub}</span> <span className="cx-estado"><span style={{ color: '#C9C6C0' }}>·</span> <span style={{ color: atual.humano ? '#EA251D' : '#77756F' }}>{estado}</span></span></div>
              </div>
              <button className="cx-btn cx-fb" onClick={p.onFicha}>{I.ficha}<span>{p.fichaRotulo}</span></button>
              {atual.humano
                ? <button className="cx-btn cx-red" onClick={p.onDevolver}>Devolver<span className="cx-cel-some"> {p.nomeAgente === 'Sofia' ? 'à' : 'ao'} {p.nomeAgente}</span></button>
                : <button className="cx-btn cx-black" onClick={p.onAssumir}>Assumir<span className="cx-cel-some"> conversa</span></button>}
              {p.extraCabecalho}
            </header>
            {p.aviso && <div className="cx-aviso">{p.aviso}</div>}

            <div className="cx-msgs">
              {linhas}
              {agendadas.map((a) => (
                <div key={a.id} className="cx-line out sched">
                  <div className="cx-bub">
                    <span className="cx-who">Programada</span>
                    {a.arquivo && <span className="cx-doc">{a.arquivo.tipo === 'audio' ? I.mic : a.arquivo.tipo === 'imagem' ? I.foto : I.doc}{a.arquivo.nome || 'arquivo'}</span>}
                    {a.texto}
                    <span className="cx-t" style={{ opacity: 1, color: a.status === 'erro' ? '#9E1014' : '#77756F' }}>
                      {a.status === 'erro' ? `Falhou: ${a.erro || 'erro'}` : `🕒 ${quandoCurto(a.enviar_em)}`}
                      {(a.status === 'pendente' || a.status === 'erro') && <button className="cx-cancel" onClick={() => cancelarAgendada(a.id)}>Cancelar</button>}
                    </span>
                  </div>
                </div>
              ))}
              <div ref={fimRef} />
            </div>

            <div className="cx-compwrap">
              {menu === 'anexo' && (
                <div className="cx-pop" style={{ left: 20 }} role="menu">
                  <button className="cx-opt" role="menuitem" onClick={() => inputFoto.current?.click()}><span className="cx-oi" style={{ background: '#EA251D' }}>{I.foto}</span>Foto ou vídeo</button>
                  <button className="cx-opt" role="menuitem" onClick={() => inputDoc.current?.click()}><span className="cx-oi" style={{ background: '#0B0B0D' }}>{I.doc}</span>Documento</button>
                </div>
              )}
              {menu === 'agenda' && (
                <div className="cx-pop" style={{ right: 20, width: 290 }} role="menu">
                  <div style={{ fontWeight: 800, padding: '6px 10px 8px' }}>Programar envio</div>
                  {!escolhendoHora ? (
                    <>
                      {sugestoes().map((o) => (
                        <button key={o.rotulo} className="cx-opt" role="menuitem" disabled={ocupado} onClick={() => escolherHorario(o.quando)}>
                          {I.relogio}<span style={{ flex: 1 }}>{o.rotulo}</span><span style={{ color: '#9C9A96', fontSize: 12 }}>{o.sub}</span>
                        </button>
                      ))}
                      <button className="cx-opt" style={{ color: '#9E1014', fontWeight: 800 }} onClick={() => { setEscolhendoHora(true); setHoraLivre(paraInputLocal(new Date(Date.now() + 3600e3))); }}>Escolher data e hora…</button>
                      <p style={{ margin: '6px 10px 2px', fontSize: 12, color: '#9C9A96' }}>{temTexto ? 'A mensagem escrita sai no horário escolhido.' : 'Escolha o horário e depois escreva a mensagem.'}</p>
                    </>
                  ) : (
                    <div style={{ display: 'flex', flexDirection: 'column', gap: 10, padding: '2px 10px 8px' }}>
                      <input type="datetime-local" value={horaLivre} min={paraInputLocal(new Date())} onChange={(e) => setHoraLivre(e.target.value)} aria-label="Data e hora do envio" />
                      <div style={{ display: 'flex', gap: 8 }}>
                        <button className="cx-btn cx-fb" onClick={() => setEscolhendoHora(false)}>Voltar</button>
                        <button className="cx-btn cx-red" style={{ flex: 1, justifyContent: 'center' }} disabled={!horaLivre || ocupado} onClick={() => escolherHorario(new Date(horaLivre))}>{temTexto ? 'Programar' : 'Escolher'}</button>
                      </div>
                    </div>
                  )}
                </div>
              )}
              {agendarPara && (
                <div className="cx-anexo cx-agendar">
                  <span className="cx-oi" style={{ background: '#EA251D' }}>{I.relogio}</span>
                  <span style={{ flex: 1, minWidth: 0 }}><b>Envio programado</b><br /><span style={{ color: '#77756F', fontSize: 12 }}>{quandoCurto(agendarPara.toISOString())} · escreva e toque em enviar</span></span>
                  <button className="cx-ib" style={{ width: 32, height: 32 }} onClick={() => setAgendarPara(null)} aria-label="Tirar programação">{I.x}</button>
                </div>
              )}
              {anexo && (
                <div className="cx-anexo">
                  {anexo.preview ? <img src={anexo.preview} alt="" /> : <span className="cx-oi" style={{ background: '#0B0B0D' }}>{anexo.tipo === 'video' ? I.foto : I.doc}</span>}
                  <span style={{ flex: 1, minWidth: 0, overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap', fontWeight: 700 }}>{anexo.file.name}</span>
                  <span style={{ color: '#9C9A96', fontSize: 12 }}>{(anexo.file.size / 1024 / 1024).toFixed(1).replace('.', ',')} MB</span>
                  <button className="cx-ib" style={{ width: 32, height: 32 }} onClick={() => setAnexo(null)} aria-label="Tirar anexo">{I.x}</button>
                </div>
              )}
              <input ref={inputFoto} type="file" accept="image/*,video/*" hidden onChange={(e) => { escolherArquivo(e.target.files?.[0], 'foto'); e.target.value = ''; }} />
              <input ref={inputDoc} type="file" hidden onChange={(e) => { escolherArquivo(e.target.files?.[0], 'doc'); e.target.value = ''; }} />

              {gravando ? (
                <div className="cx-comp" style={{ alignItems: 'center' }}>
                  <button className="cx-ib" onClick={() => pararGravacao(false)} aria-label="Descartar áudio">{I.lixo}</button>
                  <div style={{ flex: 1, minWidth: 0, overflow: 'hidden', display: 'flex', alignItems: 'center', gap: 10, height: 44, padding: '0 14px', borderRadius: 999, background: '#FDECEB' }}>
                    <span className="cx-dot cx-rec" style={{ background: '#EA251D' }} /><b style={{ fontVariantNumeric: 'tabular-nums', color: '#9E1014' }}>{min}:{seg}</b>
                    <span className="cx-wave" aria-hidden="true">{Array.from({ length: 40 }, (_, i) => <i key={i} style={{ height: 6 + ((i * 7) % 19), animationDelay: `${(i % 8) * 0.09}s` }} />)}</span>
                  </div>
                  <button className="cx-redondo" onClick={() => pararGravacao(true)} aria-label="Enviar áudio">{I.enviar}</button>
                </div>
              ) : (
                <form className="cx-comp" onSubmit={(e) => { e.preventDefault(); enviar(); }}>
                  <button type="button" className={`cx-ib${menu === 'anexo' ? ' on' : ''}`} onClick={() => { setMenu(menu === 'anexo' ? null : 'anexo'); setEscolhendoHora(false); }} aria-label="Enviar arquivo" title="Enviar arquivo">{I.clip}</button>
                  <textarea ref={areaTexto} rows={1} value={texto} onChange={(e) => setTexto(e.target.value)} placeholder={agendarPara ? 'Mensagem programada' : anexo ? 'Legenda (opcional)' : 'Responder como EXA'} aria-label="Mensagem"
                    onKeyDown={(e) => { if (e.key === 'Enter' && !e.shiftKey) { e.preventDefault(); enviar(); } }} />
                  <button type="button" className={`cx-ib${menu === 'agenda' ? ' on' : ''}`} onClick={() => { setMenu(menu === 'agenda' ? null : 'agenda'); setEscolhendoHora(false); }} aria-label="Programar mensagem" title="Programar mensagem">{I.relogio}</button>
                  {temTexto || agendarPara
                    ? <button type="submit" className="cx-redondo" disabled={ocupado || !temTexto} aria-label={agendarPara ? 'Programar mensagem' : 'Enviar'}>{ocupado ? <span className="cx-rec">•••</span> : agendarPara ? I.relogio : I.enviar}</button>
                    : <button type="button" className="cx-redondo" disabled={ocupado} onClick={iniciarGravacao} aria-label="Gravar áudio" title="Gravar áudio">{I.mic}</button>}
                </form>
              )}
            </div>
          </>
        )}
      </main>

      {p.gaveta}
    </div>
  );
};

// ---------------------------------------------------------------- gaveta (ficha) no visual do design
export const CxGaveta: React.FC<{
  titulo: string; nome: string; sub: string; foto?: string | null; kpis?: { v: React.ReactNode; l: string }[];
  abas: { v: string; l: string; conteudo: React.ReactNode }[]; largo?: boolean; onFechar: () => void;
}> = ({ titulo, nome, sub, foto, kpis, abas, largo, onFechar }) => {
  const [aba, setAba] = useState(abas[0]?.v || '');
  const atual = abas.find((a) => a.v === aba) || abas[0];
  return (
    <div className="cx-fundo" onClick={onFechar}>
      <aside className={`cx-fx${largo ? ' largo' : ''}`} role="dialog" aria-label={titulo} onClick={(e) => e.stopPropagation()}>
        <div className="cx-fx-topo">
          <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
            <button onClick={onFechar} className="cx-fx-voltar" aria-label="Voltar à conversa">{I.voltar}<span>Voltar</span></button>
            <span style={{ fontSize: 12, fontWeight: 800, letterSpacing: '.06em', opacity: .8, textTransform: 'uppercase' }}>{titulo}</span>
            <button onClick={onFechar} aria-label="Fechar" style={{ width: 32, height: 32, borderRadius: '50%', background: 'rgba(255,255,255,.16)', display: 'flex', alignItems: 'center', justifyContent: 'center', color: '#fff' }}>{I.x}</button>
          </div>
          <div style={{ display: 'flex', alignItems: 'center', gap: 14, marginTop: 14 }}>
            <span style={{ borderRadius: '50%', boxShadow: '0 0 0 3px rgba(255,255,255,.3)' }}><CxFoto url={foto} tamanho={64} /></span>
            <div style={{ minWidth: 0 }}>
              <div style={{ fontSize: 22, fontWeight: 800, letterSpacing: '-.02em', overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }}>{nome}</div>
              <div style={{ fontSize: 13, opacity: .85 }}>{sub}</div>
            </div>
          </div>
          {!!kpis?.length && (
            <div style={{ display: 'grid', gridTemplateColumns: `repeat(${kpis.length},1fr)`, gap: 8, marginTop: 18 }}>
              {kpis.map((k) => <div key={k.l} style={{ background: 'rgba(255,255,255,.12)', borderRadius: 12, padding: '10px 12px' }}><div style={{ fontSize: 20, fontWeight: 800 }}>{k.v}</div><div style={{ fontSize: 11, opacity: .8 }}>{k.l}</div></div>)}
            </div>
          )}
        </div>
        {abas.length > 1 && (
          <div style={{ display: 'flex', gap: 6, padding: '12px 20px', borderBottom: '1px solid #ECEAE5', overflowX: 'auto' }}>
            {abas.map((a) => <button key={a.v} className={`cx-tab${a.v === atual?.v ? ' on' : ''}`} onClick={() => setAba(a.v)}>{a.l}</button>)}
          </div>
        )}
        <div className="cx-fx-corpo">{atual?.conteudo}</div>
      </aside>
    </div>
  );
};

// ---------------------------------------------------------------- notas internas
export const CxNotas: React.FC<{ agente: CxAgente; alvo: string }> = ({ agente, alvo }) => {
  const [notas, setNotas] = useState<{ id: string; texto: string; autor: string | null; created_at: string }[]>([]);
  const [txt, setTxt] = useState('');
  const [salvando, setSalvando] = useState(false);
  const [erro, setErro] = useState('');
  useEffect(() => {
    let vivo = true;
    chamarChat('notas', { agente, alvo }).then((r) => vivo && setNotas(r.notas || [])).catch((e) => vivo && setErro(e.message));
    return () => { vivo = false; };
  }, [agente, alvo]);
  const salvar = async () => {
    if (!txt.trim()) return;
    setSalvando(true);
    try { const r = await chamarChat('nota', { agente, alvo, texto: txt }); setNotas((l) => [r.nota, ...l]); setTxt(''); }
    catch (e: any) { toast.error(e.message); } finally { setSalvando(false); }
  };
  return (
    <div>
      <textarea className="cx-campo" value={txt} onChange={(e) => setTxt(e.target.value)} placeholder="Nota interna sobre esta conversa (só a equipe vê)" style={{ minHeight: 110, resize: 'vertical' }} />
      <button className="cx-btn cx-red" style={{ margin: '10px 0 18px' }} disabled={!txt.trim() || salvando} onClick={salvar}>{salvando ? 'Salvando…' : 'Salvar nota'}</button>
      {erro && <p style={{ color: '#9E1014', fontSize: 13 }}>{erro}</p>}
      {notas.map((n) => (
        <div key={n.id} className="cx-pc"><div style={{ whiteSpace: 'pre-wrap' }}>{n.texto}</div><div style={{ fontSize: 12, color: '#8A8882', marginTop: 4 }}>{n.autor || 'Equipe'} · {new Date(n.created_at).toLocaleString('pt-BR', { day: '2-digit', month: '2-digit', hour: '2-digit', minute: '2-digit' })}</div></div>
      ))}
      {!notas.length && !erro && <p style={{ color: '#9C9A96', fontSize: 13 }}>Nenhuma nota ainda.</p>}
    </div>
  );
};

export const cxQuando = (iso: string | null) => {
  if (!iso) return '';
  const d = new Date(iso); const hoje = new Date(); const ontem = new Date(Date.now() - 86400e3);
  if (d.toDateString() === hoje.toDateString()) return hhmm(iso);
  if (d.toDateString() === ontem.toDateString()) return 'ontem';
  return d.toLocaleDateString('pt-BR', { day: '2-digit', month: '2-digit' });
};
