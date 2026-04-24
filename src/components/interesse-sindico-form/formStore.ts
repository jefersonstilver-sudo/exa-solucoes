import { create } from 'zustand';
import type { StepPredioData, StepSindicoData } from './schema';

export type PredioState = Partial<StepPredioData>;

export interface SindicoVerification {
  whatsappVerificado: boolean;
  whatsappVerificadoEm: string | null;       // ISO string
  whatsappVerificadoNumero: string | null;   // E.164
  verificationSessionId: string;             // gerado uma vez por fluxo
}

export type SindicoState = Partial<StepSindicoData> & SindicoVerification;

interface SindicoFormState {
  step: 0 | 1 | 2;
  predio: PredioState;
  sindico: SindicoState;
  setPredio: (patch: PredioState) => void;
  setSindico: (patch: Partial<SindicoState>) => void;
  setStep: (step: 0 | 1 | 2) => void;
  next: () => void;
  prev: () => void;
  reset: () => void;
}

const initialPredio: PredioState = {
  nomePredio: '',
  logradouro: '',
  numero: '',
  complemento: '',
  bairro: '',
  cidade: '',
  uf: '',
  cep: '',
  blocos: 1,
  internetOps: [],
  tipoPredio: undefined,
  permiteAirbnb: undefined,
};

function makeSessionId(): string {
  if (typeof crypto !== 'undefined' && 'randomUUID' in crypto) {
    return (crypto as any).randomUUID();
  }
  return `sess-${Date.now()}-${Math.random().toString(36).slice(2, 10)}`;
}

const initialSindico = (): SindicoState => ({
  nomeCompleto: '',
  cpf: '',
  whatsappRaw: '',
  email: '',
  mandatoAte: '',
  fotos: [],
  whatsappVerificado: false,
  whatsappVerificadoEm: null,
  whatsappVerificadoNumero: null,
  verificationSessionId: makeSessionId(),
});

export const useSindicoFormStore = create<SindicoFormState>((set) => ({
  step: 0,
  predio: { ...initialPredio },
  sindico: initialSindico(),
  setPredio: (patch) => set((s) => ({ predio: { ...s.predio, ...patch } })),
  setSindico: (patch) =>
    set((s) => {
      const next = { ...s.sindico, ...patch };
      // Se trocou o WhatsApp digitado e ele não bate mais com o número verificado,
      // invalida automaticamente a verificação 2FA.
      if (
        'whatsappRaw' in patch &&
        s.sindico.whatsappVerificado &&
        s.sindico.whatsappVerificadoNumero
      ) {
        // Comparação leve: só dígitos. A normalização final (E.164) é feita no componente.
        const onlyDigitsNew = (patch.whatsappRaw || '').replace(/\D/g, '');
        const onlyDigitsVer = (s.sindico.whatsappVerificadoNumero || '').replace(/\D/g, '');
        if (!onlyDigitsVer.endsWith(onlyDigitsNew) && !onlyDigitsNew.endsWith(onlyDigitsVer)) {
          next.whatsappVerificado = false;
          next.whatsappVerificadoEm = null;
          next.whatsappVerificadoNumero = null;
        }
      }
      return { sindico: next };
    }),
  setStep: (step) => set({ step }),
  next: () => set((s) => ({ step: Math.min(2, s.step + 1) as 0 | 1 | 2 })),
  prev: () => set((s) => ({ step: Math.max(0, s.step - 1) as 0 | 1 | 2 })),
  reset: () => set({ step: 0, predio: { ...initialPredio }, sindico: initialSindico() }),
}));
