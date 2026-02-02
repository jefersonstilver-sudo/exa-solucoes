// Tipos para propostas de permuta (não-monetárias)

export interface ItemPermuta {
  id: string;
  nome: string;
  descricao?: string;
  quantidade: number;
  preco_unitario: number;
  preco_total: number;
  ocultar_preco: boolean;
}

export type ModalidadeProposta = 'monetaria' | 'permuta';

export type MetodoPagamentoAlternativo = 
  | 'permuta' 
  | 'patrocinio' 
  | 'cortesia_estrategica' 
  | 'institucional' 
  | null;
