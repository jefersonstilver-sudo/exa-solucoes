import React, { useEffect, useMemo, useState } from 'react';
import { CheckCircle2, Loader2, Shield, MessageCircle } from 'lucide-react';
import { supabase } from '@/integrations/supabase/client';
import { toast } from 'sonner';
import { normalizeBRPhoneToE164 } from '@/utils/phoneE164';
import { useSindicoFormStore } from './formStore';
import {
  InputOTP,
  InputOTPGroup,
  InputOTPSlot,
} from '@/components/ui/input-otp';

interface Props {
  whatsappRaw: string;
}

type Phase = 'idle' | 'sending' | 'awaiting' | 'verifying' | 'verified';

const fmtTimeLeft = (sec: number) => {
  const m = Math.floor(sec / 60);
  const s = sec % 60;
  return `${m}:${s.toString().padStart(2, '0')}`;
};

const fmtVerifiedAt = (iso: string | null) => {
  if (!iso) return '';
  try {
    const d = new Date(iso);
    return d.toLocaleString('pt-BR', { dateStyle: 'short', timeStyle: 'short' });
  } catch {
    return '';
  }
};

export const WhatsAppVerifyBlock: React.FC<Props> = ({ whatsappRaw }) => {
  const { sindico, setSindico } = useSindicoFormStore();
  const e164 = useMemo(() => normalizeBRPhoneToE164(whatsappRaw || ''), [whatsappRaw]);
  const verified = !!sindico.whatsappVerificado;

  const [phase, setPhase] = useState<Phase>(verified ? 'verified' : 'idle');
  const [code, setCode] = useState('');
  const [secondsLeft, setSecondsLeft] = useState(0);
  const [resendInSec, setResendInSec] = useState(0);
  const [error, setError] = useState<string | null>(null);

  // Sincroniza fase com store (caso edição do número invalide a verificação)
  useEffect(() => {
    if (verified) {
      setPhase('verified');
    } else if (phase === 'verified') {
      setPhase('idle');
      setCode('');
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [verified]);

  // Countdown de expiração (5 min) e cooldown de reenvio (60s)
  useEffect(() => {
    if (phase !== 'awaiting') return;
    const t = setInterval(() => {
      setSecondsLeft((p) => (p > 0 ? p - 1 : 0));
      setResendInSec((p) => (p > 0 ? p - 1 : 0));
    }, 1000);
    return () => clearInterval(t);
  }, [phase]);

  const sendCode = async () => {
    setError(null);
    if (!e164) {
      setError('Digite um WhatsApp válido antes de verificar.');
      return;
    }
    setPhase('sending');
    try {
      const { data, error: err } = await supabase.functions.invoke('send-user-whatsapp-code', {
        body: {
          telefone: e164,
          tipo: 'signup',
          sessionId: sindico.verificationSessionId,
        },
      });
      if (err || (data as any)?.error) {
        throw new Error((data as any)?.error || err?.message || 'Falha ao enviar código');
      }
      setPhase('awaiting');
      setSecondsLeft(5 * 60);
      setResendInSec(60);
      setCode('');
      toast.success('Código enviado pelo WhatsApp');
    } catch (e: any) {
      console.error('[WhatsAppVerifyBlock] sendCode error:', e);
      setPhase('idle');
      setError(e?.message || 'Erro ao enviar código');
      toast.error(e?.message || 'Erro ao enviar código');
    }
  };

  const verifyCode = async () => {
    setError(null);
    if (code.length !== 6 || !e164) return;
    setPhase('verifying');
    try {
      const { data, error: err } = await supabase.functions.invoke('verify-user-whatsapp-code', {
        body: {
          telefone: e164,
          codigo: code,
          tipo: 'signup',
          sessionId: sindico.verificationSessionId,
        },
      });
      if (err || !(data as any)?.success) {
        throw new Error((data as any)?.error || err?.message || 'Código inválido');
      }
      const verifiedAt = new Date().toISOString();
      setSindico({
        whatsappVerificado: true,
        whatsappVerificadoEm: verifiedAt,
        whatsappVerificadoNumero: e164,
      });
      setPhase('verified');
      toast.success('WhatsApp verificado!');
    } catch (e: any) {
      console.error('[WhatsAppVerifyBlock] verifyCode error:', e);
      setPhase('awaiting');
      setCode('');
      setError(e?.message || 'Código inválido ou expirado');
      toast.error(e?.message || 'Código inválido ou expirado');
    }
  };

  // ===== UI =====

  if (phase === 'verified') {
    return (
      <div className="rounded-xl border border-emerald-400/30 bg-emerald-500/10 p-3 flex items-center gap-3">
        <CheckCircle2 className="text-emerald-400 shrink-0" size={20} />
        <div className="text-sm">
          <div className="font-semibold text-emerald-200">WhatsApp verificado</div>
          <div className="text-emerald-100/80 text-xs mt-0.5">
            {sindico.whatsappVerificadoNumero} · {fmtVerifiedAt(sindico.whatsappVerificadoEm)}
          </div>
        </div>
      </div>
    );
  }

  if (phase === 'idle' || phase === 'sending') {
    return (
      <div className="rounded-xl border border-white/10 bg-white/[0.03] p-3">
        <div className="flex items-start gap-2">
          <Shield className="text-white/60 mt-0.5 shrink-0" size={16} />
          <div className="flex-1">
            <p className="text-xs text-white/70 leading-relaxed">
              Para validade jurídica da assinatura eletrônica (Lei 14.063/2020), é necessário
              verificar este WhatsApp por código de 6 dígitos.
            </p>
            <button
              type="button"
              onClick={sendCode}
              disabled={!e164 || phase === 'sending'}
              className="mt-3 inline-flex items-center gap-2 px-4 py-2 rounded-lg bg-emerald-500 hover:bg-emerald-400 disabled:bg-white/10 disabled:text-white/40 text-white text-sm font-semibold transition-colors disabled:cursor-not-allowed"
            >
              {phase === 'sending' ? (
                <>
                  <Loader2 size={14} className="animate-spin" /> Enviando…
                </>
              ) : (
                <>
                  <MessageCircle size={14} /> Verificar WhatsApp
                </>
              )}
            </button>
            {!e164 && (
              <p className="text-xs text-white/40 mt-2">
                Digite um número válido para liberar a verificação.
              </p>
            )}
            {error && <p className="text-xs text-red-400 mt-2">{error}</p>}
          </div>
        </div>
      </div>
    );
  }

  // awaiting / verifying
  return (
    <div className="rounded-xl border border-emerald-400/20 bg-emerald-500/5 p-3 space-y-3">
      <div className="flex items-start gap-2">
        <MessageCircle className="text-emerald-300 mt-0.5 shrink-0" size={16} />
        <div className="text-xs text-emerald-100/90 leading-relaxed">
          Enviamos um código de 6 dígitos para <span className="font-mono">{e164}</span>.
          Expira em <span className="font-semibold">{fmtTimeLeft(secondsLeft)}</span>.
        </div>
      </div>

      <div className="flex justify-center">
        <InputOTP maxLength={6} value={code} onChange={setCode} disabled={phase === 'verifying'}>
          <InputOTPGroup className="gap-2">
            {[0, 1, 2, 3, 4, 5].map((i) => (
              <InputOTPSlot
                key={i}
                index={i}
                className="w-10 h-12 sm:w-11 sm:h-12 text-lg font-semibold rounded-lg border border-white/15 bg-white/5 text-white first:rounded-l-lg last:rounded-r-lg data-[active=true]:border-emerald-400 data-[active=true]:ring-2 data-[active=true]:ring-emerald-400/30"
              />
            ))}
          </InputOTPGroup>
        </InputOTP>
      </div>

      {error && <p className="text-xs text-red-400 text-center">{error}</p>}

      <div className="flex flex-col sm:flex-row gap-2">
        <button
          type="button"
          onClick={verifyCode}
          disabled={code.length !== 6 || phase === 'verifying' || secondsLeft === 0}
          className="flex-1 inline-flex items-center justify-center gap-2 px-4 py-2 rounded-lg bg-emerald-500 hover:bg-emerald-400 disabled:bg-white/10 disabled:text-white/40 text-white text-sm font-semibold transition-colors disabled:cursor-not-allowed"
        >
          {phase === 'verifying' ? (
            <>
              <Loader2 size={14} className="animate-spin" /> Validando…
            </>
          ) : (
            'Confirmar código'
          )}
        </button>
        <button
          type="button"
          onClick={sendCode}
          disabled={resendInSec > 0 || phase === 'verifying'}
          className="px-4 py-2 rounded-lg border border-white/15 text-white/80 hover:bg-white/5 disabled:opacity-40 text-sm transition-colors disabled:cursor-not-allowed"
        >
          {resendInSec > 0 ? `Reenviar (${resendInSec}s)` : 'Reenviar código'}
        </button>
      </div>
    </div>
  );
};

export default WhatsAppVerifyBlock;
