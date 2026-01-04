// Tipos do módulo Contatos & Inteligência Comercial

export type CategoriaContato = 
  | 'lead'
  | 'anunciante'
  | 'sindico_exa'
  | 'sindico_lead'
  | 'parceiro_exa'
  | 'parceiro_lead'
  | 'prestador_elevador'
  | 'eletricista'
  | 'provedor'
  | 'equipe_exa'
  | 'outros';

export type TemperaturaContato = 'quente' | 'morno' | 'frio';

export type StatusContato = 'ativo' | 'arquivado' | 'duplicado';

export type TipoInteracao = 
  | 'whatsapp_enviado'
  | 'whatsapp_recebido'
  | 'ligacao_realizada'
  | 'ligacao_recebida'
  | 'email_enviado'
  | 'email_recebido'
  | 'reuniao'
  | 'visita'
  | 'proposta_enviada'
  | 'anotacao'
  | 'status_alterado';

export interface Contact {
  id: string;
  nome: string;
  sobrenome?: string;
  empresa?: string;
  telefone: string;
  email?: string;
  website?: string;
  cnpj?: string;
  endereco?: string;
  bairro?: string;
  cidade?: string;
  estado?: string;
  cep?: string;
  categoria: CategoriaContato;
  temperatura?: TemperaturaContato;
  pontuacao_atual?: number;
  pontuacao_calculada_em?: string;
  onde_anuncia_hoje?: string[];
  publico_alvo?: string;
  dores_identificadas?: string;
  observacoes_estrategicas?: string;
  tomador_decisao?: string;
  cargo_tomador?: string;
  tipo_negocio?: string;
  bloqueado: boolean;
  motivo_bloqueio?: string;
  status: StatusContato;
  responsavel_id?: string;
  origem?: string;
  tags?: string[];
  metadata?: Record<string, any>;
  created_at: string;
  updated_at: string;
  created_by?: string;
  last_contact_at?: string;
  last_action?: string;
}

export interface ContactScoringRule {
  id: string;
  campo: string;
  label: string;
  pontos: number;
  categoria?: string;
  ordem: number;
  ativo: boolean;
  created_at: string;
  updated_at: string;
}

export interface ContactScoringConfig {
  id: string;
  categoria: CategoriaContato;
  pontuacao_minima: number;
  pontuacao_ativa: boolean;
  created_at: string;
  updated_at: string;
}

export interface ContactInteraction {
  id: string;
  contact_id: string;
  tipo: TipoInteracao;
  descricao?: string;
  metadata?: Record<string, any>;
  usuario_id?: string;
  created_at: string;
}

// Configuração das categorias
export const CATEGORIAS_CONFIG: Record<CategoriaContato, {
  label: string;
  color: string;
  bgColor: string;
  icon: string;
  hasPontuacao: boolean;
}> = {
  lead: { 
    label: 'Lead', 
    color: 'text-green-700', 
    bgColor: 'bg-green-500', 
    icon: 'Target',
    hasPontuacao: true 
  },
  anunciante: { 
    label: 'Anunciante', 
    color: 'text-blue-700', 
    bgColor: 'bg-blue-500', 
    icon: 'CheckCircle',
    hasPontuacao: true 
  },
  sindico_exa: { 
    label: 'Síndico EXA', 
    color: 'text-blue-700', 
    bgColor: 'bg-blue-600', 
    icon: 'Building',
    hasPontuacao: false 
  },
  sindico_lead: { 
    label: 'Síndico Lead', 
    color: 'text-yellow-700', 
    bgColor: 'bg-yellow-400', 
    icon: 'UserCheck',
    hasPontuacao: true 
  },
  parceiro_exa: { 
    label: 'Parceiro EXA', 
    color: 'text-amber-700', 
    bgColor: 'bg-amber-200', 
    icon: 'Handshake',
    hasPontuacao: false 
  },
  parceiro_lead: { 
    label: 'Parceiro Lead', 
    color: 'text-emerald-700', 
    bgColor: 'bg-emerald-400', 
    icon: 'Sprout',
    hasPontuacao: false 
  },
  prestador_elevador: { 
    label: 'Prestador Elevador', 
    color: 'text-orange-700', 
    bgColor: 'bg-orange-400', 
    icon: 'Building2',
    hasPontuacao: false 
  },
  eletricista: { 
    label: 'Eletricista', 
    color: 'text-gray-100', 
    bgColor: 'bg-gray-700', 
    icon: 'Zap',
    hasPontuacao: false 
  },
  provedor: { 
    label: 'Provedor', 
    color: 'text-purple-100', 
    bgColor: 'bg-purple-500', 
    icon: 'Wifi',
    hasPontuacao: false 
  },
  equipe_exa: { 
    label: 'Equipe EXA', 
    color: 'text-indigo-100', 
    bgColor: 'bg-indigo-500', 
    icon: 'Users',
    hasPontuacao: false 
  },
  outros: { 
    label: 'Outros', 
    color: 'text-gray-700', 
    bgColor: 'bg-gray-200', 
    icon: 'MoreHorizontal',
    hasPontuacao: false 
  }
};

export const CATEGORIAS_ORDER: CategoriaContato[] = [
  'lead',
  'anunciante',
  'sindico_exa',
  'sindico_lead',
  'parceiro_exa',
  'parceiro_lead',
  'prestador_elevador',
  'eletricista',
  'provedor',
  'equipe_exa',
  'outros'
];

export const TEMPERATURA_CONFIG: Record<TemperaturaContato, {
  label: string;
  color: string;
  bgColor: string;
}> = {
  quente: { label: 'Quente', color: 'text-green-700', bgColor: 'bg-green-100' },
  morno: { label: 'Morno', color: 'text-yellow-700', bgColor: 'bg-yellow-100' },
  frio: { label: 'Frio', color: 'text-red-700', bgColor: 'bg-red-100' }
};
