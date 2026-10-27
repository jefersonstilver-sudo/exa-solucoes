import React, { useState } from 'react';
import { ShieldCheck, Loader2 } from 'lucide-react';
import { toast } from 'sonner';
import { supabase } from '@/integrations/supabase/client';
import { COMPANY_TERMS_TEXT } from './CompanyTermsCheckbox';

/**
 * Termo de responsabilidade aceito NO PEDIDO (antes do primeiro envio de vídeo), e não mais no perfil.
 * Quem fecha pela Sofia já aceita na compra; aqui fica só para quem ainda não aceitou.
 */
const TermoAceiteInline: React.FC<{ userId?: string; onAccepted: () => void; compact?: boolean }> = ({ userId, onAccepted, compact }) => {
  const [marcado, setMarcado] = useState(false);
  const [salvando, setSalvando] = useState(false);

  const aceitar = async () => {
    if (!userId || !marcado) return;
    setSalvando(true);
    try {
      const { error } = await supabase.from('users').update({ empresa_aceite_termo: true, empresa_aceite_termo_data: new Date().toISOString() } as any).eq('id', userId);
      if (error) throw error;
      toast.success('Termo aceito. Envio de vídeos liberado.');
      onAccepted();
    } catch (e: any) {
      toast.error('Não consegui registrar o aceite: ' + (e?.message || 'tente de novo'));
    } finally {
      setSalvando(false);
    }
  };

  return (
    <div className={`rounded-2xl border border-[#ecd9db] bg-white text-left shadow-sm ${compact ? 'p-4' : 'p-5 sm:p-6'}`}>
      <div className="flex items-start gap-3">
        <div className="flex h-10 w-10 flex-none items-center justify-center rounded-xl bg-[#fbe9eb]">
          <ShieldCheck className="h-5 w-5 text-[#8a1a1e]" />
        </div>
        <div className="min-w-0">
          <h3 className="text-base font-extrabold text-[#1b1719]">Antes do primeiro vídeo, confirme o termo</h3>
          <p className="mt-0.5 text-sm text-[#6f6669]">Você confirma que tem autorização para divulgar a empresa ou marca deste pedido. Leva 10 segundos e vale para os próximos envios.</p>
        </div>
      </div>
      <pre className="mt-4 max-h-40 overflow-y-auto whitespace-pre-wrap rounded-xl bg-[#f7f4f5] p-4 font-sans text-[12.5px] leading-relaxed text-[#554e50]">{COMPANY_TERMS_TEXT.trim()}</pre>
      <label className="mt-4 flex cursor-pointer items-start gap-3 text-sm text-[#1b1719]">
        <input type="checkbox" checked={marcado} onChange={(e) => setMarcado(e.target.checked)} className="mt-0.5 h-5 w-5 flex-none accent-[#8a1a1e]" />
        <span>Li e concordo com o Termo de Responsabilidade e Autorização.</span>
      </label>
      <button
        type="button"
        onClick={aceitar}
        disabled={!marcado || salvando || !userId}
        className="mt-4 inline-flex min-h-[44px] w-full items-center justify-center gap-2 rounded-xl bg-[#8a1a1e] px-5 text-sm font-bold text-white transition hover:bg-[#6f1417] disabled:cursor-not-allowed disabled:opacity-50 sm:w-auto"
      >
        {salvando && <Loader2 className="h-4 w-4 animate-spin" />}
        Aceitar e liberar envio
      </button>
    </div>
  );
};

export default TermoAceiteInline;
