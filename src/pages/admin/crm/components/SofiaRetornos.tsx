import React, { useCallback, useEffect, useState } from 'react';
import { toast } from 'sonner';
import { supabase } from '@/integrations/supabase/client';

/**
 * Retornos agendados de uma conversa da Sofia (tabela sofia_retornos, via RPCs só de admin).
 * A Sofia chama sozinha no horário; aqui a equipe vê o que está combinado, o que já foi feito,
 * o que falhou, e pode criar ou cancelar um retorno.
 */
export type RetornoResumo = { conversation_id: string; contact_id: string; proximo: string | null; pendentes: number; falhas: number };
type Retorno = {
  id: string; quando: string; motivo: string | null; origem: string; status: string; tentativas: number;
  mensagem: string | null; erro: string | null; executado_em: string | null; criado_por: string | null; created_at: string;
};

const rpc = (fn: string, args?: Record<string, unknown>) => (supabase.rpc as any)(fn, args);

export async function carregarResumoRetornos(): Promise<Record<string, RetornoResumo>> {
  const { data, error } = await rpc('sofia_retornos_resumo');
  if (error) throw error;
  const m: Record<string, RetornoResumo> = {};
  for (const r of (data || []) as RetornoResumo[]) if (r.conversation_id) m[r.conversation_id] = r;
  return m;
}

export const quandoRetorno = (iso: string) =>
  new Date(iso).toLocaleString('pt-BR', { weekday: 'short', day: '2-digit', month: '2-digit', hour: '2-digit', minute: '2-digit' }).replace('.', '');

const STATUS: Record<string, { l: string; cor: string; fundo: string }> = {
  pendente: { l: 'Agendado', cor: '#9A3412', fundo: '#FFEDD5' },
  executando: { l: 'Enviando agora', cor: '#1D4ED8', fundo: '#DBEAFE' },
  feito: { l: 'Feito', cor: '#166534', fundo: '#DCFCE7' },
  falhou: { l: 'Falhou', cor: '#9E1014', fundo: '#FEE2E2' },
  cancelado: { l: 'Cancelado', cor: '#57534E', fundo: '#F3F2EF' },
  cliente_voltou: { l: 'Cliente voltou antes', cor: '#57534E', fundo: '#F3F2EF' },
};
const ORIGEM: Record<string, string> = {
  sofia: 'combinado pela Sofia', promessa_detectada: 'Sofia prometeu (agendado automático)', equipe: 'criado pela equipe',
  missao: 'missão', migrado: 'combinado pela Sofia',
};

const paraInput = (d: Date) => {
  const p = (n: number) => String(n).padStart(2, '0');
  return `${d.getFullYear()}-${p(d.getMonth() + 1)}-${p(d.getDate())}T${p(d.getHours())}:${p(d.getMinutes())}`;
};

export const SofiaRetornos: React.FC<{ conversationId: string; onMudou?: () => void }> = ({ conversationId, onMudou }) => {
  const [lista, setLista] = useState<Retorno[]>([]);
  const [carregando, setCarregando] = useState(true);
  const [erro, setErro] = useState('');
  const amanha10 = new Date(); amanha10.setDate(amanha10.getDate() + 1); amanha10.setHours(10, 0, 0, 0);
  const [quando, setQuando] = useState(paraInput(amanha10));
  const [motivo, setMotivo] = useState('');
  const [salvando, setSalvando] = useState(false);

  const carregar = useCallback(async () => {
    setErro('');
    const { data, error } = await rpc('sofia_retornos_conversa', { p_conversation: conversationId });
    if (error) setErro(error.message); else setLista((data || []) as Retorno[]);
    setCarregando(false);
  }, [conversationId]);
  useEffect(() => { setCarregando(true); carregar(); }, [carregar]);

  const criar = async () => {
    const d = new Date(quando);
    if (isNaN(d.getTime())) { toast.error('Data inválida'); return; }
    setSalvando(true);
    const { error } = await rpc('sofia_retorno_criar', { p_conversation: conversationId, p_quando: d.toISOString(), p_motivo: motivo.trim() });
    setSalvando(false);
    if (error) { toast.error(error.message); return; }
    toast.success(`Retorno agendado para ${quandoRetorno(d.toISOString())}. A Sofia chama sozinha.`);
    setMotivo(''); carregar(); onMudou?.();
  };
  const cancelar = async (r: Retorno) => {
    const { error } = await rpc('sofia_retorno_cancelar', { p_id: r.id });
    if (error) { toast.error(error.message); return; }
    toast.success('Retorno cancelado'); carregar(); onMudou?.();
  };

  return (
    <div style={{ display: 'flex', flexDirection: 'column', gap: 14 }}>
      <div className="cx-pc" style={{ background: '#FFF7ED' }}>
        <div className="cx-k">Agendar um retorno</div>
        <p style={{ fontSize: 13, color: '#57534E', margin: '2px 0 10px' }}>
          No horário, a Sofia lê a conversa e chama a pessoa retomando o assunto. Você recebe o aviso no WhatsApp quando ela fizer ou se falhar.
        </p>
        <div style={{ display: 'flex', gap: 10, flexWrap: 'wrap' }}>
          <input className="cx-campo" type="datetime-local" value={quando} onChange={(e) => setQuando(e.target.value)} style={{ maxWidth: 230 }} aria-label="Quando" />
          <input className="cx-campo" value={motivo} onChange={(e) => setMotivo(e.target.value)} placeholder="O que retomar (ex: ver se analisou os prédios)" style={{ flex: 1, minWidth: 200 }} aria-label="Motivo" />
        </div>
        <button className="cx-btn cx-red" style={{ marginTop: 10 }} onClick={criar} disabled={salvando}>{salvando ? 'Agendando…' : 'Agendar retorno'}</button>
      </div>

      {carregando && <p style={{ color: '#9C9A96', fontSize: 13 }}>Carregando retornos…</p>}
      {erro && <p role="alert" style={{ color: '#9E1014', fontSize: 13 }}>{erro}</p>}
      {!carregando && !erro && !lista.length && <p style={{ color: '#9C9A96', fontSize: 13 }}>Nenhum retorno agendado para esta pessoa.</p>}

      {lista.map((r) => {
        const s = STATUS[r.status] || STATUS.cancelado;
        return (
          <div key={r.id} className="cx-pc" style={{ borderLeft: `4px solid ${s.cor}` }}>
            <div style={{ display: 'flex', justifyContent: 'space-between', gap: 8, alignItems: 'center', flexWrap: 'wrap' }}>
              <b style={{ fontSize: 15 }}>{quandoRetorno(r.quando)}</b>
              <span style={{ fontSize: 12, fontWeight: 800, color: s.cor, background: s.fundo, borderRadius: 999, padding: '3px 10px' }}>{s.l}</span>
            </div>
            <div style={{ fontSize: 12, color: '#8A8882', marginTop: 2 }}>
              {ORIGEM[r.origem] || r.origem}{r.criado_por ? ` · ${r.criado_por}` : ''}{r.tentativas > 1 ? ` · ${r.tentativas} tentativas` : ''}
            </div>
            {r.motivo && <div style={{ fontSize: 13, marginTop: 6, whiteSpace: 'pre-wrap' }}>{r.motivo}</div>}
            {r.mensagem && <div style={{ fontSize: 13, marginTop: 6, background: '#F3F2EF', borderRadius: 10, padding: '8px 10px', whiteSpace: 'pre-wrap' }}><b>Mensagem enviada:</b> {r.mensagem}</div>}
            {r.erro && r.status !== 'feito' && <div style={{ fontSize: 12, marginTop: 6, color: r.status === 'falhou' ? '#9E1014' : '#77756F' }}>{r.erro}</div>}
            {(r.status === 'pendente' || r.status === 'falhou') && (
              <button className="cx-btn cx-fb" style={{ marginTop: 8, color: '#9E1014' }} onClick={() => cancelar(r)}>Cancelar retorno</button>
            )}
          </div>
        );
      })}
    </div>
  );
};

export default SofiaRetornos;
