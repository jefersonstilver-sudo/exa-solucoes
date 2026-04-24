import { z } from 'zod';
import { isValidCPF } from '@/utils/cpfValidator';
import { normalizeBRPhoneToE164 } from '@/utils/phoneE164';

export const INTERNET_OPS = ['vivo', 'ligga', 'telecom_foz'] as const;
export const ELEVADOR_EMPRESAS = ['atlas', 'tke', 'otis', 'oriente'] as const;
export const CASA_MAQUINAS = ['sim', 'nao', 'nao_sei'] as const;
export const TIPO_PREDIO = ['residencial', 'comercial'] as const;
export const PERMITE_AIRBNB = ['sim', 'nao'] as const;

export const stepPredioSchema = z.object({
  nomePredio: z.string().trim().min(2, 'Informe o nome do prédio').max(120),
  googlePlaceId: z.string().optional(),
  latitude: z.number().nullable().optional(),
  longitude: z.number().nullable().optional(),
  logradouro: z.string().trim().min(3, 'Informe o logradouro').max(200),
  numero: z.string().trim().min(1, 'Informe o número').max(20),
  complemento: z.string().trim().max(100).optional().or(z.literal('')),
  bairro: z.string().trim().min(2, 'Informe o bairro').max(100),
  cidade: z.string().trim().min(2, 'Informe a cidade').max(100),
  uf: z.string().trim().length(2, 'UF deve ter 2 letras'),
  cep: z.string().trim().regex(/^\d{5}-?\d{3}$/, 'CEP inválido'),
  andares: z.coerce.number().int().min(2, 'Mínimo 2 andares'),
  blocos: z.coerce.number().int().min(1).default(1),
  unidades: z.coerce.number().int().min(1, 'Informe as unidades'),
  elevadoresSociais: z.coerce.number().int().min(1, 'Mínimo 1 elevador'),
  internetOps: z.array(z.enum(INTERNET_OPS)).min(1, 'Selecione ao menos 1 operadora'),
  elevadorEmpresa: z.enum(ELEVADOR_EMPRESAS, { errorMap: () => ({ message: 'Selecione a empresa' }) }),
  casaMaquinas: z.enum(CASA_MAQUINAS, { errorMap: () => ({ message: 'Selecione uma opção' }) }),
  tipoPredio: z.enum(TIPO_PREDIO, { errorMap: () => ({ message: 'Selecione o tipo do prédio' }) }),
  permiteAirbnb: z.enum(PERMITE_AIRBNB).optional(),
}).superRefine((data, ctx) => {
  if (data.tipoPredio === 'residencial' && !data.permiteAirbnb) {
    ctx.addIssue({
      code: z.ZodIssueCode.custom,
      path: ['permiteAirbnb'],
      message: 'Informe se o prédio permite Airbnb',
    });
  }
});

export type StepPredioData = z.infer<typeof stepPredioSchema>;

const minMandato = () => {
  const d = new Date();
  d.setMonth(d.getMonth() + 1);
  d.setHours(0, 0, 0, 0);
  return d;
};

export const stepSindicoSchema = z.object({
  nomeCompleto: z.string().trim().min(3, 'Mínimo 3 caracteres').max(100)
    .regex(/^[^\d]+$/, 'Nome não pode conter números'),
  cpf: z.string().refine((v) => isValidCPF(v), 'CPF inválido'),
  whatsappRaw: z.string().refine((v) => normalizeBRPhoneToE164(v) !== null, 'WhatsApp inválido'),
  email: z.string().trim().email('E-mail inválido').max(255),
  mandatoAte: z.string().refine((v) => {
    if (!v) return false;
    const d = new Date(v);
    return !isNaN(d.getTime()) && d >= minMandato();
  }, 'Data deve ser pelo menos 1 mês à frente'),
  fotos: z.array(z.instanceof(File))
    .max(5, 'Máximo 5 fotos')
    .optional()
    .default([]),
});

export type StepSindicoData = z.infer<typeof stepSindicoSchema>;

export const INTERNET_OPS_LABELS: Record<typeof INTERNET_OPS[number], string> = {
  vivo: 'Vivo',
  ligga: 'Ligga',
  telecom_foz: 'Telecom Foz',
};

export const ELEVADOR_LABELS: Record<typeof ELEVADOR_EMPRESAS[number], string> = {
  atlas: 'Atlas',
  tke: 'TKE',
  otis: 'Otis',
  oriente: 'Oriente',
};

export const CASA_MAQUINAS_LABELS: Record<typeof CASA_MAQUINAS[number], string> = {
  sim: 'Sim, tem casa de máquinas',
  nao: 'Não, equipamentos ficam no poço do elevador',
  nao_sei: 'Não sei informar com certeza',
};

export const TIPO_PREDIO_LABELS: Record<typeof TIPO_PREDIO[number], string> = {
  residencial: 'Residencial',
  comercial: 'Comercial',
};

export const PERMITE_AIRBNB_LABELS: Record<typeof PERMITE_AIRBNB[number], string> = {
  sim: 'Sim, o prédio tem liberação para Airbnb',
  nao: 'Não, o prédio não permite Airbnb',
};
