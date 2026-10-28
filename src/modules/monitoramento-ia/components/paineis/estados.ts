import type { EstadoPainel } from '../../hooks/useFrotaSaude';

export const ESTADO_INFO: Record<EstadoPainel, { rotulo: string; fundo: string; cor: string; ponto: string }> = {
  sem_sinal: { rotulo: 'Sem sinal', fundo: '#FCE9E7', cor: '#B0261D', ponto: '#D93A2B' },
  sem_imagem: { rotulo: 'Sem imagem', fundo: '#FCE9E7', cor: '#B0261D', ponto: '#D93A2B' },
  internet_ruim: { rotulo: 'Internet ruim', fundo: '#FCF1DF', cor: '#9A5300', ponto: '#E08A1E' },
  quente: { rotulo: 'Quente', fundo: '#FCF1DF', cor: '#9A5300', ponto: '#E08A1E' },
  instavel: { rotulo: 'Instável', fundo: '#FCF1DF', cor: '#9A5300', ponto: '#E08A1E' },
  sem_diagnostico: { rotulo: 'Sem diagnóstico', fundo: '#EEECE8', cor: '#5E5F63', ponto: '#9A9893' },
  tocando: { rotulo: 'Tocando', fundo: '#EAF5EF', cor: '#1E6B47', ponto: '#2E9B62' },
};

export const glass =
  'bg-white/70 backdrop-blur-xl backdrop-saturate-150 border border-black/[0.06] shadow-[inset_0_1px_0_rgba(255,255,255,0.9),0_14px_30px_-22px_rgba(70,20,20,0.3)]';

export const ehProblema = (e: EstadoPainel) => e !== 'tocando' && e !== 'sem_diagnostico';
