import { create } from 'zustand';
import type { StepPredioData, StepSindicoData } from './schema';

export type PredioState = Partial<StepPredioData>;
export type SindicoState = Partial<StepSindicoData>;

interface SindicoFormState {
  step: 0 | 1 | 2;
  predio: PredioState;
  sindico: SindicoState;
  setPredio: (patch: PredioState) => void;
  setSindico: (patch: SindicoState) => void;
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
};

const initialSindico: SindicoState = {
  nomeCompleto: '',
  cpf: '',
  whatsappRaw: '',
  email: '',
  mandatoAte: '',
  fotos: [],
};

export const useSindicoFormStore = create<SindicoFormState>((set) => ({
  step: 0,
  predio: { ...initialPredio },
  sindico: { ...initialSindico },
  setPredio: (patch) => set((s) => ({ predio: { ...s.predio, ...patch } })),
  setSindico: (patch) => set((s) => ({ sindico: { ...s.sindico, ...patch } })),
  setStep: (step) => set({ step }),
  next: () => set((s) => ({ step: Math.min(2, s.step + 1) as 0 | 1 | 2 })),
  prev: () => set((s) => ({ step: Math.max(0, s.step - 1) as 0 | 1 | 2 })),
  reset: () => set({ step: 0, predio: { ...initialPredio }, sindico: { ...initialSindico } }),
}));
