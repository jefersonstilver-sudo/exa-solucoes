import React, { useEffect, useRef, useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { ArrowLeft, AlertTriangle, Loader2, Lock, Check, FileText } from 'lucide-react';
import { useSindicoFormStore } from './formStore';
import { stepPredioSchema, stepSindicoSchema } from './schema';
import { submitFormulario } from '@/utils/submitFormulario';
import TermosIntegrais from './TermosIntegrais';
import { toast } from 'sonner';

interface Props {
  onPrev: () => void;
}

export const StepTermos: React.FC<Props> = ({ onPrev }) => {
  const navigate = useNavigate();
  const { predio, sindico } = useSindicoFormStore();
  const boxRef = useRef<HTMLDivElement>(null);
  const [scrollCompleto, setScrollCompleto] = useState(false);
  const [aceito, setAceito] = useState(false);
  const [enviando, setEnviando] = useState(false);
  const [overlayMsg, setOverlayMsg] = useState('');
  const [justUnlocked, setJustUnlocked] = useState(false);

  // Validação das etapas anteriores
  const etapasValidas =
    stepPredioSchema.safeParse(predio).success && stepSindicoSchema.safeParse(sindico).success;

  useEffect(() => {
    const el = boxRef.current;
    if (!el) return;

    const handler = () => {
      if (scrollCompleto) return;
      const atBottom = el.scrollTop + el.clientHeight >= el.scrollHeight - 24;
      if (atBottom) {
        setScrollCompleto(true);
        setJustUnlocked(true);
        setTimeout(() => setJustUnlocked(false), 800);
      }
    };
    el.addEventListener('scroll', handler, { passive: true });
    // verifica no mount (caso conteúdo seja menor que viewport)
    handler();
    return () => el.removeEventListener('scroll', handler);
  }, [scrollCompleto]);

  const handleEnviar = async () => {
    if (!aceito || !etapasValidas || enviando) return;
    setEnviando(true);
    setOverlayMsg('Registrando interesse...');

    // Watchdog de UX: se passar de 20s, libera o botão e avisa
    const watchdog = setTimeout(() => {
      setEnviando(false);
      setOverlayMsg('');
      toast.error(
        'O envio está demorando mais que o esperado. Verifique sua conexão e tente novamente.',
      );
    }, 20000);

    try {
      const result = await submitFormulario(predio, sindico);
      if (!result.success) {
        clearTimeout(watchdog);
        toast.error(
          result.error ||
            'Erro ao registrar. Tente novamente. Contato: suporte@examidia.com.br',
        );
        setEnviando(false);
        setOverlayMsg('');
        return;
      }
      if (result.pdf_error) {
        console.warn('[StepTermos] PDF não gerado no submit:', result.pdf_error);
      }
      clearTimeout(watchdog);
      // navega imediatamente — não depende de PDF, sem toast intermediário
      // O reset() acontece somente quando a tela de sucesso montar (evita flash de form vazio)
      navigate(`/interessesindico/sucesso?protocolo=${encodeURIComponent(result.protocolo!)}`);
    } catch (e: any) {
      clearTimeout(watchdog);
      toast.error('Erro ao registrar. Tente novamente. Contato: suporte@examidia.com.br');
      setEnviando(false);
      setOverlayMsg('');
    }
  };

  const podeEnviar = aceito && etapasValidas && !enviando;

  return (
    <div className="space-y-5 relative">
      <div>
        <h2 className="text-xl sm:text-2xl font-bold text-white">Termos de aceite</h2>
        <p className="text-sm text-white/55 mt-1">
          Leia até o final para liberar o aceite e enviar seu cadastro.
        </p>
      </div>

      {/* Aviso destacado */}
      <div className="sif-warning-box">
        <AlertTriangle size={20} className="shrink-0" />
        <div>
          <p className="font-semibold text-white">
            Registro de interesse — sujeito à aprovação da EXA
          </p>
          <p className="text-sm text-white/75 mt-1">
            Ao aceitar, você autoriza o início do processo de avaliação técnica. A EXA analisa cada
            prédio individualmente e pode aprovar ou recusar a continuidade. Caso recusado, nenhuma
            obrigação é gerada para qualquer parte.
          </p>
        </div>
      </div>

      {/* Caixa de termos */}
      <div className="relative">
        <div ref={boxRef} className={`sif-termos-box ${justUnlocked ? 'just-unlocked' : ''}`}>
          <div className="flex items-center gap-2 mb-3 text-[var(--exa-red,#EA251D)]">
            <FileText size={18} />
            <span className="text-xs font-bold uppercase tracking-wider">
              Termo oficial — versão 2.0
            </span>
          </div>
          <h2 className="text-base font-bold text-[#0A0000] mb-2">
            TERMO DE REGISTRO DE INTERESSE — INSTALAÇÃO DE PAINEL EXA MÍDIA
          </h2>
          <p className="text-xs text-[#555] italic mb-4">
            Documento eletrônico para manifestação formal de interesse em receber instalação de
            painel digital publicitário em elevadores de condomínio residencial.
          </p>
          <TermosIntegrais />
        </div>

        {!scrollCompleto && (
          <div className="sif-termos-overlay">
            <Lock size={18} />
            <span>Role até o final dos termos para liberar o aceite</span>
          </div>
        )}
      </div>

      {/* Checkbox de aceite */}
      <label
        className={`sif-checkbox-aceite ${aceito ? 'checked' : ''} ${
          !scrollCompleto ? 'locked' : ''
        }`}
      >
        <input
          type="checkbox"
          disabled={!scrollCompleto || enviando}
          checked={aceito}
          onChange={(e) => setAceito(e.target.checked)}
        />
        <span className="sif-checkbox-marker">{aceito && <Check size={14} strokeWidth={3} />}</span>
        <span className="sif-checkbox-text">
          <strong>Li e concordo com os termos acima.</strong>
        </span>
      </label>

      {!etapasValidas && (
        <p className="sif-error">
          Etapas anteriores incompletas. Volte e revise os campos obrigatórios.
        </p>
      )}

      <div className="pt-2 flex flex-col sm:flex-row gap-2">
        <button
          type="button"
          onClick={onPrev}
          disabled={enviando}
          className="sif-btn-secondary flex items-center justify-center gap-2 sm:w-auto"
        >
          <ArrowLeft size={18} /> Voltar
        </button>
        <button
          type="button"
          onClick={handleEnviar}
          disabled={!podeEnviar}
          className="sif-btn-primary flex-1 flex items-center justify-center gap-2"
        >
          {enviando ? (
            <>
              <Loader2 size={18} className="animate-spin" />
              Enviando...
            </>
          ) : (
            <>Enviar cadastro</>
          )}
        </button>
      </div>

      {/* Overlay de envio */}
      {enviando && overlayMsg && (
        <div className="sif-submit-overlay">
          <div className="sif-submit-overlay-inner">
            <Loader2 size={32} className="animate-spin text-[var(--exa-red,#EA251D)]" />
            <p className="text-white font-semibold mt-3">{overlayMsg}</p>
            <p className="text-white/60 text-xs mt-1">Não feche esta janela.</p>
          </div>
        </div>
      )}
    </div>
  );
};

export default StepTermos;
