import React, { useMemo } from 'react';
import { useSindicoFormStore } from './formStore';
import { stepSindicoSchema } from './schema';
import { formatCPFMask } from '@/utils/cpfValidator';
import { formatBRPhoneMask, normalizeBRPhoneToE164 } from '@/utils/phoneE164';
import UploadFotos from './UploadFotos';
import ValidationErrors from './ValidationErrors';
import WhatsAppVerifyBlock from './WhatsAppVerifyBlock';
import { ArrowLeft, ArrowRight, User, Phone, Mail, Calendar, IdCard } from 'lucide-react';

const SINDICO_FIELD_LABELS: Record<string, string> = {
  nomeCompleto: 'Nome completo',
  cpf: 'CPF',
  whatsappRaw: 'WhatsApp',
  whatsappVerificado: 'Verificação do WhatsApp',
  email: 'E-mail',
  mandatoAte: 'Mandato de síndico até',
  fotos: 'Fotos do elevador',
};

interface Props {
  onNext: () => void;
  onPrev: () => void;
}

const minMandatoStr = () => {
  const d = new Date();
  d.setMonth(d.getMonth() + 1);
  return d.toISOString().split('T')[0];
};

export const StepSindico: React.FC<Props> = ({ onNext, onPrev }) => {
  const { sindico, setSindico } = useSindicoFormStore();

  const e164 = useMemo(() => normalizeBRPhoneToE164(sindico.whatsappRaw || ''), [sindico.whatsappRaw]);
  const validation = useMemo(() => stepSindicoSchema.safeParse(sindico), [sindico]);
  const isValid = validation.success;
  const errors = validation.success ? null : validation.error;

  return (
    <div className="space-y-5">
      <div>
        <h2 className="text-xl sm:text-2xl font-bold text-white">Dados do síndico</h2>
        <p className="text-sm text-white/55 mt-1">Para validarmos o cadastro e entrarmos em contato.</p>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-2 gap-x-6 gap-y-5">
        <div className="lg:col-span-2">
          <label className="sif-label" htmlFor="nomeCompleto"><User size={13} className="inline mr-1" />Nome completo</label>
          <input id="nomeCompleto" type="text" className="sif-input" maxLength={100}
            value={sindico.nomeCompleto || ''}
            onChange={(e) => setSindico({ nomeCompleto: e.target.value })} />
        </div>

        <div>
          <label className="sif-label" htmlFor="cpf"><IdCard size={13} className="inline mr-1" />CPF</label>
          <input id="cpf" type="text" inputMode="numeric" className="sif-input" placeholder="000.000.000-00"
            value={sindico.cpf || ''}
            onChange={(e) => setSindico({ cpf: formatCPFMask(e.target.value) })} />
        </div>

        <div className="lg:col-span-2">
          <label className="sif-label" htmlFor="whatsapp"><Phone size={13} className="inline mr-1" />WhatsApp</label>
          <input id="whatsapp" type="tel" inputMode="tel" className="sif-input" placeholder="(45) 99999-9999"
            value={sindico.whatsappRaw || ''}
            onChange={(e) => setSindico({ whatsappRaw: formatBRPhoneMask(e.target.value) })} />
          <p className="sif-help">
            Salvo como: <span className="text-white/85 font-mono">{e164 || '—'}</span>
          </p>
          <div className="mt-3">
            <WhatsAppVerifyBlock whatsappRaw={sindico.whatsappRaw || ''} />
          </div>
        </div>

        <div>
          <label className="sif-label" htmlFor="email"><Mail size={13} className="inline mr-1" />E-mail</label>
          <input id="email" type="email" className="sif-input" placeholder="seu@email.com" maxLength={255}
            value={sindico.email || ''}
            onChange={(e) => setSindico({ email: e.target.value })} />
        </div>

        <div>
          <label className="sif-label" htmlFor="mandatoAte"><Calendar size={13} className="inline mr-1" />Mandato de síndico até</label>
          <input id="mandatoAte" type="date" className="sif-input" min={minMandatoStr()}
            value={sindico.mandatoAte || ''}
            onChange={(e) => setSindico({ mandatoAte: e.target.value })} />
        </div>

        <div className="lg:col-span-2">
          <UploadFotos
            fotos={sindico.fotos || []}
            onChange={(files) => setSindico({ fotos: files })}
          />
        </div>
      </div>

      {!isValid && (
        <ValidationErrors error={errors} fieldLabels={SINDICO_FIELD_LABELS} />
      )}

      <div className="pt-4 flex flex-col sm:flex-row gap-2">
        <button type="button" onClick={onPrev} className="sif-btn-secondary flex items-center justify-center gap-2 sm:w-auto">
          <ArrowLeft size={18} /> Voltar
        </button>
        <button
          type="button"
          onClick={onNext}
          disabled={!isValid}
          aria-disabled={!isValid}
          className="sif-btn-primary flex-1 flex items-center justify-center gap-2"
        >
          Continuar <ArrowRight size={18} />
        </button>
      </div>
    </div>
  );
};

export default StepSindico;
