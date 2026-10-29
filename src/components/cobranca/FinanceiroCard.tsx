import React, { useEffect, useState } from 'react';
import { Check, Loader2, Wallet } from 'lucide-react';
import { toast } from 'sonner';
import { supabase } from '@/integrations/supabase/client';

/**
 * Contato do setor financeiro da conta: recebe boletos, lembretes, confirmação de pagamento
 * e avisos de suspensão/ativação, junto com o contato principal. Cliente edita aqui; admin e Sofia também.
 */
const so = (s: string) => s.replace(/\D/g, '');
const fmtFone = (s: string) => {
  const d = so(s).replace(/^55(?=\d{10,11}$)/, '');
  if (d.length === 11) return `(${d.slice(0, 2)}) ${d.slice(2, 7)}-${d.slice(7)}`;
  if (d.length === 10) return `(${d.slice(0, 2)}) ${d.slice(2, 6)}-${d.slice(6)}`;
  return s;
};

export const FinanceiroCard: React.FC<{ userId?: string | null; className?: string; titulo?: string }> = ({ userId, className = '', titulo = 'Financeiro' }) => {
  const [nome, setNome] = useState('');
  const [email, setEmail] = useState('');
  const [whats, setWhats] = useState('');
  const [inicial, setInicial] = useState('');
  const [salvando, setSalvando] = useState(false);

  useEffect(() => {
    if (!userId) return;
    (async () => {
      const { data } = await (supabase as any).from('users').select('financeiro_nome,financeiro_email,financeiro_whatsapp').eq('id', userId).maybeSingle();
      setNome(data?.financeiro_nome || ''); setEmail(data?.financeiro_email || ''); setWhats(data?.financeiro_whatsapp ? fmtFone(data.financeiro_whatsapp) : '');
      setInicial(JSON.stringify([data?.financeiro_nome || '', data?.financeiro_email || '', so(data?.financeiro_whatsapp || '')]));
    })();
  }, [userId]);

  const mudou = inicial !== JSON.stringify([nome.trim(), email.trim().toLowerCase(), so(whats)]);
  const salvar = async () => {
    if (!userId) return;
    const em = email.trim().toLowerCase();
    if (em && !/.+@.+\..+/.test(em)) { toast.error('Confira o e-mail do financeiro'); return; }
    const w = so(whats);
    if (w && (w.length < 10 || w.length > 13)) { toast.error('Confira o WhatsApp (com DDD)'); return; }
    setSalvando(true);
    const { error } = await (supabase as any).from('users').update({ financeiro_nome: nome.trim() || null, financeiro_email: em || null, financeiro_whatsapp: w ? (w.length <= 11 ? '55' + w : w) : null }).eq('id', userId);
    setSalvando(false);
    if (error) { toast.error('Não foi possível salvar agora'); return; }
    setInicial(JSON.stringify([nome.trim(), em, so(whats)]));
    toast.success('Contato do financeiro salvo');
  };

  const campo = 'min-h-[44px] w-full rounded-xl border border-[#e6dfe1] bg-white px-3 text-[15px] outline-none focus:border-[#8a1a1e]';
  return (
    <section className={`rounded-[22px] bg-white p-5 shadow-[0_1px_2px_rgba(30,15,18,.06),0_12px_32px_-22px_rgba(30,15,18,.35)] sm:p-6 ${className}`}>
      <div className="mb-4 flex items-start gap-3">
        <span className="flex h-10 w-10 flex-none items-center justify-center rounded-xl bg-[#f6f2f3]"><Wallet className="h-[18px] w-[18px] text-[#554e50]" /></span>
        <div>
          <h2 className="text-base font-extrabold text-[#1b1719]">{titulo}</h2>
          <p className="text-sm text-[#6f6669]">Quem cuida dos pagamentos recebe boletos, lembretes e confirmações junto com você. Opcional.</p>
        </div>
      </div>
      <div className="grid gap-3 sm:grid-cols-2">
        <label className="sm:col-span-2"><span className="mb-1 block text-xs font-semibold text-[#8b8285]">Nome</span><input value={nome} onChange={(e) => setNome(e.target.value)} placeholder="Ex.: Ana · financeiro" className={campo} /></label>
        <label><span className="mb-1 block text-xs font-semibold text-[#8b8285]">E-mail do financeiro</span><input type="email" inputMode="email" autoCapitalize="none" value={email} onChange={(e) => setEmail(e.target.value)} placeholder="financeiro@empresa.com.br" className={campo} /></label>
        <label><span className="mb-1 block text-xs font-semibold text-[#8b8285]">WhatsApp do financeiro</span><input type="tel" inputMode="tel" value={whats} onChange={(e) => setWhats(e.target.value)} onBlur={() => setWhats(fmtFone(whats))} placeholder="(45) 99999-9999" className={campo} /></label>
      </div>
      <div className="mt-4 flex justify-end">
        <button type="button" onClick={salvar} disabled={!mudou || salvando || !userId} className="inline-flex min-h-[44px] items-center gap-2 rounded-xl bg-[#8a1a1e] px-5 text-sm font-bold text-white disabled:opacity-40">
          {salvando ? <Loader2 className="h-4 w-4 animate-spin" /> : <Check className="h-4 w-4" />} Salvar
        </button>
      </div>
    </section>
  );
};

export default FinanceiroCard;
