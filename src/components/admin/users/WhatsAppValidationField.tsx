/**
 * WhatsAppValidationField
 * 
 * Campo de WhatsApp com opção de validação imediata via Z-API
 * Usado em CreateUserDialog para criar contas administrativas.
 * 
 * Padrão Z-API: número sempre persistido com prefixo 55 (Brasil).
 * Memória: infrastructure/whatsapp-phone-formatting-standard-v2-0-final
 */

import React, { useState } from 'react';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Button } from '@/components/ui/button';
import {
  InputOTP,
  InputOTPGroup,
  InputOTPSlot,
} from '@/components/ui/input-otp';
import { supabase } from '@/integrations/supabase/client';
import { toast } from 'sonner';
import {
  AlertCircle,
  CheckCircle2,
  Loader2,
  MessageCircle,
  ShieldCheck,
} from 'lucide-react';
import { cn } from '@/lib/utils';

export type WhatsAppValidationMode = 'now' | 'first_login';

export interface WhatsAppFieldValue {
  /** Número apenas com dígitos, sem prefixo (10 ou 11 dígitos) */
  raw: string;
  /** Número formatado E.164 com prefixo 55 (ex.: 5545999990000) */
  e164: string;
  /** Validado via OTP Z-API durante a criação? */
  verified: boolean;
  /** Modo de validação escolhido pelo super admin */
  mode: WhatsAppValidationMode;
}

interface Props {
  value: WhatsAppFieldValue;
  onChange: (next: WhatsAppFieldValue) => void;
  isMobile?: boolean;
  error?: string;
}

const formatBrazilPhoneMask = (raw: string) => {
  const digits = raw.replace(/\D/g, '').slice(0, 11);
  if (digits.length <= 2) return digits;
  if (digits.length <= 6) return `(${digits.slice(0, 2)}) ${digits.slice(2)}`;
  if (digits.length <= 10) {
    return `(${digits.slice(0, 2)}) ${digits.slice(2, 6)}-${digits.slice(6)}`;
  }
  return `(${digits.slice(0, 2)}) ${digits.slice(2, 7)}-${digits.slice(7)}`;
};

const toE164BR = (raw: string) => {
  const digits = raw.replace(/\D/g, '');
  if (!digits) return '';
  // Garante prefixo 55 (memória whatsapp-phone-formatting-standard)
  return digits.startsWith('55') ? digits : `55${digits}`;
};

const generateSessionId = () =>
  `admin-create-${Date.now()}-${Math.random().toString(36).slice(2, 10)}`;

export const WhatsAppValidationField: React.FC<Props> = ({
  value,
  onChange,
  isMobile,
  error,
}) => {
  const [maskedDisplay, setMaskedDisplay] = useState(
    formatBrazilPhoneMask(value.raw),
  );
  const [otpCode, setOtpCode] = useState('');
  const [otpStage, setOtpStage] = useState<'idle' | 'sent' | 'verifying'>(
    'idle',
  );
  const [sending, setSending] = useState(false);
  const [verifying, setVerifying] = useState(false);
  const [sessionId] = useState(generateSessionId);

  const digitsLength = value.raw.length;
  const isValidNumber = digitsLength === 10 || digitsLength === 11;

  const handlePhoneChange = (input: string) => {
    const digits = input.replace(/\D/g, '').slice(0, 11);
    setMaskedDisplay(formatBrazilPhoneMask(digits));
    // Mudança no número invalida verificação anterior
    onChange({
      ...value,
      raw: digits,
      e164: toE164BR(digits),
      verified: false,
    });
    setOtpStage('idle');
    setOtpCode('');
  };

  const handleModeChange = (mode: WhatsAppValidationMode) => {
    onChange({ ...value, mode });
    if (mode === 'first_login') {
      setOtpStage('idle');
      setOtpCode('');
    }
  };

  const sendCode = async () => {
    if (!isValidNumber) {
      toast.error('Digite um WhatsApp válido (DDD + número)');
      return;
    }
    setSending(true);
    try {
      const { data, error: fnError } = await supabase.functions.invoke(
        'send-user-whatsapp-code',
        {
          body: {
            telefone: value.e164,
            tipo: 'signup',
            sessionId,
          },
        },
      );
      if (fnError) throw fnError;
      if (data?.error) throw new Error(data.error);
      toast.success('Código enviado por WhatsApp', {
        description: 'Confira a mensagem no celular do novo usuário',
      });
      setOtpStage('sent');
    } catch (err: any) {
      console.error('[WhatsAppValidationField] sendCode error', err);
      toast.error('Não foi possível enviar o código', {
        description: err?.message ?? 'Tente novamente em alguns instantes',
      });
    } finally {
      setSending(false);
    }
  };

  const verifyCode = async (code: string) => {
    if (code.length !== 6) return;
    setVerifying(true);
    setOtpStage('verifying');
    try {
      const { data, error: fnError } = await supabase.functions.invoke(
        'verify-user-whatsapp-code',
        {
          body: {
            telefone: value.e164,
            codigo: code,
            tipo: 'signup',
            sessionId,
          },
        },
      );
      if (fnError) throw fnError;
      if (!data?.success) {
        throw new Error(data?.error ?? 'Código inválido');
      }
      onChange({ ...value, verified: true });
      toast.success('WhatsApp validado com sucesso');
    } catch (err: any) {
      console.error('[WhatsAppValidationField] verifyCode error', err);
      toast.error('Código inválido ou expirado', {
        description: err?.message,
      });
      setOtpCode('');
      setOtpStage('sent');
    } finally {
      setVerifying(false);
    }
  };

  return (
    <div className="space-y-3">
      {/* Input WhatsApp */}
      <div>
        <Label htmlFor="whatsapp" className="text-foreground text-sm">
          WhatsApp <span className="text-destructive">*</span>
        </Label>
        <div className="relative">
          <Input
            id="whatsapp"
            type="tel"
            inputMode="numeric"
            value={maskedDisplay}
            onChange={(e) => handlePhoneChange(e.target.value)}
            placeholder="(45) 99999-0000"
            className={cn(
              'bg-background border-input text-foreground font-mono',
              isMobile && 'h-11',
              error && 'border-destructive',
              value.verified && 'border-primary/60',
            )}
            maxLength={16}
          />
          {value.verified && (
            <CheckCircle2 className="absolute right-3 top-1/2 -translate-y-1/2 h-4 w-4 text-primary" />
          )}
        </div>
        {error ? (
          <p className="text-xs text-destructive mt-1 flex items-center gap-1">
            <AlertCircle className="h-3 w-3" />
            {error}
          </p>
        ) : (
          <p className="text-xs text-muted-foreground mt-1">
            Será salvo como <span className="font-mono">{value.e164 || '55…'}</span>{' '}
            (padrão Z-API)
          </p>
        )}
      </div>

      {/* Toggle de modo de validação */}
      <div className="rounded-lg border border-border bg-muted/30 p-3 space-y-3">
        <div className="flex items-center gap-2">
          <ShieldCheck className="h-4 w-4 text-primary" />
          <span className="text-sm font-medium text-foreground">
            Validação do WhatsApp
          </span>
          {value.verified && (
            <span className="ml-auto inline-flex items-center gap-1 text-xs font-medium text-primary">
              <CheckCircle2 className="h-3 w-3" /> Validado
            </span>
          )}
        </div>

        <div className="grid grid-cols-1 sm:grid-cols-2 gap-2">
          <button
            type="button"
            onClick={() => handleModeChange('now')}
            className={cn(
              'text-left rounded-md border p-3 transition-colors',
              value.mode === 'now'
                ? 'border-primary bg-primary/5'
                : 'border-border hover:bg-muted',
            )}
          >
            <div className="flex items-center gap-2 text-sm font-medium text-foreground">
              <MessageCircle className="h-4 w-4" />
              Validar agora
            </div>
            <p className="text-xs text-muted-foreground mt-1">
              Enviar código via WhatsApp e confirmar antes de criar a conta.
            </p>
          </button>

          <button
            type="button"
            onClick={() => handleModeChange('first_login')}
            className={cn(
              'text-left rounded-md border p-3 transition-colors',
              value.mode === 'first_login'
                ? 'border-primary bg-primary/5'
                : 'border-border hover:bg-muted',
            )}
          >
            <div className="flex items-center gap-2 text-sm font-medium text-foreground">
              <ShieldCheck className="h-4 w-4" />
              Validar no 1º login
            </div>
            <p className="text-xs text-muted-foreground mt-1">
              O usuário receberá o código ao entrar pela primeira vez.
            </p>
          </button>
        </div>

        {value.mode === 'now' && !value.verified && (
          <div className="space-y-3 pt-2 border-t border-border">
            {otpStage === 'idle' && (
              <Button
                type="button"
                variant="outline"
                size="sm"
                onClick={sendCode}
                disabled={!isValidNumber || sending}
                className="w-full"
              >
                {sending ? (
                  <>
                    <Loader2 className="h-4 w-4 mr-2 animate-spin" />
                    Enviando código…
                  </>
                ) : (
                  <>
                    <MessageCircle className="h-4 w-4 mr-2" />
                    Enviar código por WhatsApp
                  </>
                )}
              </Button>
            )}

            {(otpStage === 'sent' || otpStage === 'verifying') && (
              <div className="space-y-2">
                <p className="text-xs text-muted-foreground text-center">
                  Digite o código de 6 dígitos recebido no WhatsApp
                </p>
                <div className="flex justify-center">
                  <InputOTP
                    maxLength={6}
                    value={otpCode}
                    onChange={(v) => {
                      setOtpCode(v);
                      if (v.length === 6) verifyCode(v);
                    }}
                    disabled={verifying}
                  >
                    <InputOTPGroup>
                      <InputOTPSlot index={0} />
                      <InputOTPSlot index={1} />
                      <InputOTPSlot index={2} />
                      <InputOTPSlot index={3} />
                      <InputOTPSlot index={4} />
                      <InputOTPSlot index={5} />
                    </InputOTPGroup>
                  </InputOTP>
                </div>
                <div className="flex items-center justify-between gap-2">
                  <Button
                    type="button"
                    variant="ghost"
                    size="sm"
                    onClick={sendCode}
                    disabled={sending || verifying}
                    className="text-xs"
                  >
                    Reenviar código
                  </Button>
                  {verifying && (
                    <span className="text-xs text-muted-foreground inline-flex items-center gap-1">
                      <Loader2 className="h-3 w-3 animate-spin" /> Verificando…
                    </span>
                  )}
                </div>
              </div>
            )}
          </div>
        )}

        {value.mode === 'now' && value.verified && (
          <div className="rounded-md bg-primary/10 border border-primary/30 p-2 text-xs text-foreground inline-flex items-center gap-2 w-full">
            <CheckCircle2 className="h-4 w-4 text-primary" />
            WhatsApp confirmado. Será marcado como validado na criação.
          </div>
        )}
      </div>
    </div>
  );
};

export default WhatsAppValidationField;
