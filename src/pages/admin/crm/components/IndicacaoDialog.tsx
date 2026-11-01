/**
 * Indicação: a equipe cadastra uma pessoa cujo contato foi passado para a EXA e a Sofia chama primeiro,
 * citando quem indicou e de onde veio, como uma vendedora faria. O envio, o horário (8h–20h; fora disso fica
 * agendado), o limite diário e a conversa ficam na sofia-agent (?action=indicacao).
 */
import { useState } from 'react';
import { toast } from 'sonner';
import { Send, UserPlus } from 'lucide-react';
import { supabase } from '@/integrations/supabase/client';
import { Dialog, DialogContent, DialogDescription, DialogHeader, DialogTitle } from '@/components/ui/dialog';

const FN_URL = 'https://aakenoljsycyrcrchgxj.supabase.co/functions/v1/sofia-agent?action=indicacao';
export const PAPEIS_INDICACAO = ['super_admin', 'admin', 'gestor_comercial'];
const ORIGENS = ['Cliente EXA', 'Síndico', 'Amigo ou conhecido', 'Parceiro', 'Evento', 'Instagram'];

type Resp = { ok: boolean; erro?: string; agendada?: boolean; enviar_em?: string; texto?: string; conversa_id?: string; ja_conversa?: boolean };

async function enviar(body: Record<string, unknown>): Promise<Resp> {
  const { data } = await supabase.auth.getSession();
  const token = data.session?.access_token;
  if (!token) return { ok: false, erro: 'Sessão expirada. Faça login de novo.' };
  try {
    const r = await fetch(FN_URL, { method: 'POST', headers: { 'Content-Type': 'application/json', Authorization: `Bearer ${token}` }, body: JSON.stringify(body) });
    const j = await r.json().catch(() => ({}));
    if (!r.ok || !j?.ok) return { ok: false, ...j, erro: j?.erro || `Falha (HTTP ${r.status})` };
    return j as Resp;
  } catch (e) {
    return { ok: false, erro: (e as Error).message || 'Falha de conexão' };
  }
}

const mascara = (v: string) => {
  const d = v.replace(/\D/g, '').slice(0, 11);
  if (d.length <= 2) return d;
  if (d.length <= 6) return `(${d.slice(0, 2)}) ${d.slice(2)}`;
  if (d.length <= 10) return `(${d.slice(0, 2)}) ${d.slice(2, 6)}-${d.slice(6)}`;
  return `(${d.slice(0, 2)}) ${d.slice(2, 7)}-${d.slice(7)}`;
};

const campo = 'w-full rounded-xl border border-black/15 bg-white px-3 py-2.5 text-[14px] outline-none focus:border-[#9C1E1E] focus:ring-2 focus:ring-[#9C1E1E]/15';
const rotulo = 'mb-1.5 block text-[12px] font-extrabold uppercase tracking-[0.08em] text-[#6A6B70]';

export function IndicacaoDialog({ conversaAtual, onFechar, onAbrirConversa }: {
  conversaAtual: string | null; onFechar: () => void; onAbrirConversa: (id: string) => void;
}) {
  const [f, setF] = useState({ nome: '', telefone: '', quem: '', origem: '', contexto: '' });
  const [enviando, setEnviando] = useState(false);
  const [jaConversa, setJaConversa] = useState<{ erro: string; id?: string } | null>(null);
  const set = (k: keyof typeof f) => (e: React.ChangeEvent<HTMLInputElement | HTMLTextAreaElement>) => setF({ ...f, [k]: e.target.value });
  const digitos = f.telefone.replace(/\D/g, '');
  const pronto = f.nome.trim().length >= 2 && f.quem.trim().length >= 2 && digitos.length >= 10;

  const mandar = async (forcar = false) => {
    if (!pronto) { toast.error('Preencha nome, WhatsApp (com DDD) e quem indicou.'); return; }
    setEnviando(true);
    const r = await enviar({ nome: f.nome, telefone: digitos, quem_indicou: f.quem, origem: f.origem, contexto: f.contexto, conversa_id: conversaAtual, forcar });
    setEnviando(false);
    if (!r.ok) {
      if (r.ja_conversa) { setJaConversa({ erro: r.erro || 'Essa pessoa já conversa com a Sofia.', id: r.conversa_id }); return; }
      toast.error(r.erro || 'Não consegui mandar a indicação.');
      return;
    }
    if (r.agendada) {
      const quando = r.enviar_em ? new Date(r.enviar_em).toLocaleString('pt-BR', { day: '2-digit', month: '2-digit', hour: '2-digit', minute: '2-digit' }) : 'no próximo horário comercial';
      toast.success('Indicação salva', { description: `Fora do horário agora. A Sofia chama ${f.nome.split(' ')[0]} em ${quando}.` });
    } else {
      toast.success(`A Sofia chamou ${f.nome.split(' ')[0]}`, { description: r.texto ? r.texto.slice(0, 160) : undefined });
    }
    if (r.conversa_id) onAbrirConversa(r.conversa_id);
    onFechar();
  };

  return (
    <Dialog open onOpenChange={(o) => { if (!o) onFechar(); }}>
      <DialogContent className="max-h-[92vh] overflow-y-auto sm:max-w-[520px]">
        <DialogHeader>
          <DialogTitle className="flex items-center gap-2"><UserPlus className="h-5 w-5 text-[#9C1E1E]" />Nova indicação</DialogTitle>
          <DialogDescription>Alguém te passou um contato? A Sofia chama a pessoa pelo WhatsApp, contando quem indicou, como uma conversa normal.</DialogDescription>
        </DialogHeader>

        <div className="space-y-4 text-[14px]">
          <label className="block"><span className={rotulo}>Nome da pessoa</span>
            <input className={campo} value={f.nome} onChange={set('nome')} placeholder="Ex: Marcos Ribeiro" autoComplete="off" />
          </label>
          <label className="block"><span className={rotulo}>WhatsApp</span>
            <input className={campo} inputMode="tel" value={f.telefone} onChange={(e) => setF({ ...f, telefone: mascara(e.target.value) })} placeholder="(45) 99999-9999" autoComplete="off" />
          </label>
          <label className="block"><span className={rotulo}>Quem indicou</span>
            <input className={campo} value={f.quem} onChange={set('quem')} placeholder="Ex: Ana, da Pizzaria Bella" autoComplete="off" />
          </label>
          <div>
            <span className={rotulo}>De onde veio</span>
            <div className="mb-2 flex flex-wrap gap-1.5">
              {ORIGENS.map((o) => (
                <button key={o} type="button" aria-pressed={f.origem === o} onClick={() => setF({ ...f, origem: f.origem === o ? '' : o })}
                  className={`h-8 rounded-full px-3 text-[12.5px] font-bold ${f.origem === o ? 'bg-[#17181A] text-white' : 'border border-black/12 bg-white text-[#3A3B3F]'}`}>{o}</button>
              ))}
            </div>
            <input className={campo} value={f.origem} onChange={set('origem')} placeholder="Ou escreva: ex. conversa no evento da ACIFI" autoComplete="off" />
          </div>
          <label className="block"><span className={rotulo}>O que você sabe (opcional)</span>
            <textarea className={campo} rows={3} style={{ resize: 'vertical' }} value={f.contexto} onChange={set('contexto')}
              placeholder="Ex: tem uma clínica de estética no centro e quer atrair clientes dos prédios perto. A Ana disse que ele gostou da ideia." />
            <span className="mt-1 block text-[12px] text-[#6A6B70]">Quanto mais contexto, mais natural a primeira mensagem. A Sofia não inventa o que não estiver aqui.</span>
          </label>

          {jaConversa && (
            <div role="alert" className="rounded-xl border border-[#E8B4B0] bg-[#FDF2F1] p-3 text-[13px] text-[#7A1B16]">
              <p>{jaConversa.erro}</p>
              <div className="mt-2 flex flex-wrap gap-2">
                {jaConversa.id && <button type="button" className="h-9 rounded-lg bg-white px-3 font-bold text-[#17181A] shadow-sm" onClick={() => { onAbrirConversa(jaConversa.id!); onFechar(); }}>Abrir conversa</button>}
                <button type="button" disabled={enviando} className="h-9 rounded-lg bg-[#9C1E1E] px-3 font-bold text-white disabled:opacity-50" onClick={() => mandar(true)}>Mandar mesmo assim</button>
              </div>
            </div>
          )}

          <p className="text-[12px] text-[#6A6B70]">A Sofia chama entre 8h e 20h. Fora disso, ela chama no próximo horário. Se a pessoa não responder em 2 dias, ela retoma uma única vez.</p>

          <div className="sticky bottom-0 z-10 -mx-6 -mb-2 flex justify-end gap-2 border-t border-black/[0.06] bg-white/95 px-6 py-3 backdrop-blur">
            <button type="button" onClick={onFechar} className="h-11 rounded-xl border border-black/12 px-4 text-sm font-bold">Cancelar</button>
            <button type="button" disabled={enviando || !pronto} onClick={() => mandar(false)} className="inline-flex h-11 items-center gap-1.5 rounded-xl bg-[#9C1E1E] px-5 text-sm font-bold text-white disabled:opacity-50">
              <Send className="h-4 w-4" />{enviando ? 'Enviando…' : 'Mandar para a Sofia'}
            </button>
          </div>
        </div>
      </DialogContent>
    </Dialog>
  );
}
